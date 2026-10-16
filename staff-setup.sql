-- ============================================================
-- WYK STAFF — mise en place Supabase (à exécuter UNE fois)
-- Supabase > SQL Editor > New query > coller > Run
-- Même projet Supabase que wykht.com : toutes les tables sont préfixées staff_
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Admins ----------
create table if not exists staff_admins(user_id uuid primary key);
insert into staff_admins(user_id) values ('dcdb1af5-6305-4138-b991-cf3a931740ed') on conflict do nothing;

create or replace function staff_is_admin() returns boolean
language sql stable security definer set search_path=public as
$$ select exists(select 1 from staff_admins where user_id = auth.uid()) $$;

-- ---------- Postes (liste modifiable par l'admin) ----------
create table if not exists staff_positions(
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  code text not null,                    -- ex: CTO, LIV  -> sert à l'ID employé WYK-CTO-001
  sort int default 0,
  created_at timestamptz default now()
);

-- ---------- Catégories d'emploi + champs visibles publiquement ----------
create table if not exists staff_categories(
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_default boolean default false,      -- la catégorie « Par défaut » sert quand un profil n'a pas de catégorie
  public_fields text[] not null default '{photo,position,status,since,about,skills,experiences,education,languages,cv,qr}',
  sort int default 0,
  created_at timestamptz default now()
);
create unique index if not exists staff_one_default on staff_categories(is_default) where is_default;
insert into staff_categories(name,is_default) values ('Par défaut',true) on conflict do nothing;

-- ---------- Invitations ----------
create table if not exists staff_invites(
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  position_id uuid references staff_positions(id) on delete set null,
  category_id uuid references staff_categories(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending','used','revoked')),
  expires_at timestamptz,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- Profils ----------
create table if not exists staff_profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  employee_code text not null unique,            -- WYK-CTO-001 (aussi utilisé dans le lien public)
  position_id uuid references staff_positions(id) on delete set null,
  category_id uuid references staff_categories(id) on delete set null,
  status text not null default 'active' check (status in ('active','inactive','suspended','review')),
  status_reason text,
  verified boolean not null default false,           -- badge « Employé vérifié par WYK » (admin uniquement)
  verified_at timestamptz,
  activated_at timestamptz not null default now(),   -- « actif depuis » : automatique
  full_name text not null,
  photo_url text,
  quote text,
  about text,
  email text,
  phone text,
  location text,
  languages text[] default '{}',
  skills jsonb default '[]',        -- [{name, level 0-100}]
  experiences jsonb default '[]',   -- [{role, company, from, to, desc}]
  education jsonb default '[]',     -- [{title, school, from, to}]
  links jsonb default '[]',         -- [{label, url}]
  cv_url text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists staff_counters(prefix text primary key, n int not null default 0);

-- ---------- Protection des colonnes sensibles ----------
-- Un employé ne peut jamais changer son statut, son poste, sa catégorie, son ID ou sa date d'activation.
create or replace function staff_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at := now();
  if not staff_is_admin() then
    new.user_id := old.user_id; new.employee_code := old.employee_code; new.position_id := old.position_id;
    new.category_id := old.category_id; new.status := old.status; new.status_reason := old.status_reason;
    new.activated_at := old.activated_at; new.created_at := old.created_at;
    new.verified := old.verified; new.verified_at := old.verified_at;
    if old.status in ('suspended','review') then raise exception 'Profil verrouillé : contactez WYK.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists staff_guard_t on staff_profiles;
create trigger staff_guard_t before update on staff_profiles for each row execute function staff_guard();

-- ---------- RLS ----------
alter table staff_admins enable row level security;
alter table staff_positions enable row level security;
alter table staff_categories enable row level security;
alter table staff_invites enable row level security;
alter table staff_profiles enable row level security;
alter table staff_counters enable row level security;

drop policy if exists "pos lecture" on staff_positions;      create policy "pos lecture" on staff_positions for select using (true);
drop policy if exists "pos admin" on staff_positions;        create policy "pos admin" on staff_positions for all using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists "cat lecture" on staff_categories;     create policy "cat lecture" on staff_categories for select using (true);
drop policy if exists "cat admin" on staff_categories;       create policy "cat admin" on staff_categories for all using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists "inv admin" on staff_invites;          create policy "inv admin" on staff_invites for all using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists "adm lecture soi" on staff_admins;     create policy "adm lecture soi" on staff_admins for select using (user_id = auth.uid());
drop policy if exists "prof admin" on staff_profiles;        create policy "prof admin" on staff_profiles for all using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists "prof lecture soi" on staff_profiles;  create policy "prof lecture soi" on staff_profiles for select using (user_id = auth.uid());
drop policy if exists "prof maj soi" on staff_profiles;      create policy "prof maj soi" on staff_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- (aucune policy d'insertion/suppression pour les employés : la création passe par staff_redeem_invite)

-- ---------- RPC : vérifier un code (public, ne révèle que le poste) ----------
create or replace function staff_check_invite(p_code text) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare r record;
begin
  select i.*, p.title as ptitle, c.name as cname into r
  from staff_invites i left join staff_positions p on p.id=i.position_id left join staff_categories c on c.id=i.category_id
  where upper(i.code)=upper(trim(p_code));
  if not found then return jsonb_build_object('valid',false,'reason','Code introuvable.'); end if;
  if r.status='used' then return jsonb_build_object('valid',false,'reason','Ce code a déjà été utilisé.'); end if;
  if r.status='revoked' then return jsonb_build_object('valid',false,'reason','Ce code a été annulé.'); end if;
  if r.expires_at is not null and r.expires_at < now() then return jsonb_build_object('valid',false,'reason','Ce code a expiré.'); end if;
  return jsonb_build_object('valid',true,'position',r.ptitle,'category',r.cname);
end $$;
grant execute on function staff_check_invite(text) to anon, authenticated;

-- ---------- RPC : confirmer le code et créer le profil (utilisateur connecté) ----------
create or replace function staff_redeem_invite(p_code text, p_full_name text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare inv staff_invites; pcode text; seq int; ecode text; uid uuid := auth.uid(); uemail text;
begin
  if uid is null then raise exception 'Connexion requise.'; end if;
  if exists(select 1 from staff_profiles where user_id=uid) then raise exception 'Vous avez déjà un profil.'; end if;
  select * into inv from staff_invites where upper(code)=upper(trim(p_code)) for update;
  if not found or inv.status<>'pending' or (inv.expires_at is not null and inv.expires_at<now()) then
    raise exception 'Code invalide ou expiré.';
  end if;
  select coalesce(upper(code),'STF') into pcode from staff_positions where id=inv.position_id;
  pcode := coalesce(pcode,'STF');
  insert into staff_counters(prefix,n) values (pcode,1) on conflict (prefix) do update set n=staff_counters.n+1 returning n into seq;
  ecode := 'WYK-'||pcode||'-'||lpad(seq::text,3,'0');
  select email into uemail from auth.users where id=uid;
  insert into staff_profiles(user_id,employee_code,position_id,category_id,full_name,email)
  values (uid,ecode,inv.position_id,inv.category_id,left(trim(p_full_name),120),uemail);
  update staff_invites set status='used', used_by=uid, used_at=now() where id=inv.id;
  return jsonb_build_object('employee_code',ecode);
end $$;
grant execute on function staff_redeem_invite(text,text) to authenticated;

-- ---------- RPC : profil public (SEULS les champs autorisés sortent de la base) ----------
create or replace function staff_public_profile(p_code text) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare p staff_profiles; f text[]; pos text; res jsonb;
begin
  select * into p from staff_profiles where upper(employee_code)=upper(trim(p_code));
  if not found then return null; end if;
  if p.status<>'active' then return jsonb_build_object('unavailable',true,'status',p.status); end if;
  select public_fields into f from staff_categories where id=p.category_id;
  if f is null then select public_fields into f from staff_categories where is_default limit 1; end if;
  f := coalesce(f,'{}');
  select title into pos from staff_positions where id=p.position_id;
  res := jsonb_build_object('full_name',p.full_name,'position',pos,'status',p.status,'verified',coalesce(p.verified,false),'fields',to_jsonb(f));
  if 'photo' = any(f) then res := res || jsonb_build_object('photo_url',p.photo_url); end if;
  if 'employee_id' = any(f) then res := res || jsonb_build_object('employee_code',p.employee_code); end if;
  if 'since' = any(f) then res := res || jsonb_build_object('activated_at',p.activated_at); end if;
  if 'quote' = any(f) then res := res || jsonb_build_object('quote',p.quote); end if;
  if 'about' = any(f) then res := res || jsonb_build_object('about',p.about); end if;
  if 'location' = any(f) then res := res || jsonb_build_object('location',p.location); end if;
  if 'email' = any(f) then res := res || jsonb_build_object('email',p.email); end if;
  if 'phone' = any(f) then res := res || jsonb_build_object('phone',p.phone); end if;
  if 'languages' = any(f) then res := res || jsonb_build_object('languages',p.languages); end if;
  if 'skills' = any(f) then res := res || jsonb_build_object('skills',p.skills); end if;
  if 'experiences' = any(f) then res := res || jsonb_build_object('experiences',p.experiences); end if;
  if 'education' = any(f) then res := res || jsonb_build_object('education',p.education); end if;
  if 'links' = any(f) then res := res || jsonb_build_object('links',p.links); end if;
  if 'cv' = any(f) then res := res || jsonb_build_object('cv_url',p.cv_url); end if;
  return res;
end $$;
grant execute on function staff_public_profile(text) to anon, authenticated;

-- ---------- Données de départ (modifiables ensuite dans l'admin) ----------
insert into staff_positions(title,code,sort) values
 ('Chief Technology Officer (CTO)','CTO',1),('Livreur','LIV',2),('Responsable boutique','RSB',3),('Service client','SVC',4)
on conflict do nothing;
insert into staff_categories(name,public_fields,sort) values
 ('Direction','{photo,position,status,employee_id,since,quote,about,skills,experiences,education,languages,location,email,links,cv,qr}',1),
 ('Livraison','{photo,position,status,employee_id,since,languages,qr}',2),
 ('Boutique & support','{photo,position,status,since,about,skills,languages,email,qr}',3)
on conflict do nothing;

-- ---------- Stockage : photos et CV ----------
insert into storage.buckets(id,name,public) values ('staff-media','staff-media',true) on conflict (id) do nothing;
drop policy if exists "staff media lecture" on storage.objects;
create policy "staff media lecture" on storage.objects for select using (bucket_id='staff-media');
drop policy if exists "staff media ecriture" on storage.objects;
create policy "staff media ecriture" on storage.objects for insert to authenticated
  with check (bucket_id='staff-media' and ((storage.foldername(name))[1]=auth.uid()::text or staff_is_admin()));
drop policy if exists "staff media maj" on storage.objects;
create policy "staff media maj" on storage.objects for update to authenticated
  using (bucket_id='staff-media' and ((storage.foldername(name))[1]=auth.uid()::text or staff_is_admin()));
drop policy if exists "staff media suppression" on storage.objects;
create policy "staff media suppression" on storage.objects for delete to authenticated
  using (bucket_id='staff-media' and ((storage.foldername(name))[1]=auth.uid()::text or staff_is_admin()));


-- ============================================================
-- MISE À JOUR v2 (âge, identifiant public, description du poste) — voir aussi staff-v2.sql
-- ============================================================
-- 1) Colonnes ---------------------------------------------------------------
alter table staff_profiles add column if not exists verified boolean not null default false;
alter table staff_profiles add column if not exists verified_at timestamptz;
alter table staff_profiles add column if not exists birth_date date;
alter table staff_profiles add column if not exists birth_place text;
alter table staff_profiles add column if not exists nationality text;
alter table staff_profiles add column if not exists public_id text;
alter table staff_positions add column if not exists description text;

-- 2) Identifiant public aléatoire (12 caractères) pour les liens /profil et /badge
update staff_profiles set public_id = substr(replace(gen_random_uuid()::text,'-',''),1,12) where public_id is null;
alter table staff_profiles alter column public_id set default substr(replace(gen_random_uuid()::text,'-',''),1,12);
alter table staff_profiles alter column public_id set not null;
create unique index if not exists staff_profiles_public_id_u on staff_profiles(public_id);

-- 3) Protection des colonnes sensibles + validation de la date de naissance
create or replace function staff_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at := now();
  if new.birth_date is not null and (new.birth_date > current_date or new.birth_date < date '1900-01-01') then
    raise exception 'Date de naissance invalide.';
  end if;
  if not staff_is_admin() then
    new.user_id := old.user_id; new.employee_code := old.employee_code; new.position_id := old.position_id;
    new.category_id := old.category_id; new.status := old.status; new.status_reason := old.status_reason;
    new.activated_at := old.activated_at; new.created_at := old.created_at;
    new.verified := old.verified; new.verified_at := old.verified_at;
    new.public_id := old.public_id;
    if old.status in ('suspended','review') then raise exception 'Profil verrouillé : contactez WYK.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists staff_guard_t on staff_profiles;
create trigger staff_guard_t before update on staff_profiles for each row execute function staff_guard();

-- 4) Profil public : SEULS les champs autorisés sortent de la base
--    Accepte l'identifiant public aléatoire (recommandé) ou l'ancien ID employé (anciens QR déjà imprimés).
create or replace function staff_public_profile(p_code text) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare p staff_profiles; f text[]; pos text; pdesc text; res jsonb;
begin
  select * into p from staff_profiles
   where upper(public_id)=upper(trim(p_code)) or upper(employee_code)=upper(trim(p_code)) limit 1;
  if not found then return null; end if;
  if p.status<>'active' then return jsonb_build_object('unavailable',true,'status',p.status); end if;
  select public_fields into f from staff_categories where id=p.category_id;
  if f is null then select public_fields into f from staff_categories where is_default limit 1; end if;
  f := coalesce(f,'{}');
  select title, description into pos, pdesc from staff_positions where id=p.position_id;
  res := jsonb_build_object('full_name',p.full_name,'position',pos,'position_desc',pdesc,'status',p.status,
                            'verified',coalesce(p.verified,false),'updated_at',p.updated_at,'fields',to_jsonb(f));
  if 'photo' = any(f) then res := res || jsonb_build_object('photo_url',p.photo_url); end if;
  if 'employee_id' = any(f) then res := res || jsonb_build_object('employee_code',p.employee_code); end if;
  if 'since' = any(f) then res := res || jsonb_build_object('activated_at',p.activated_at); end if;
  if 'quote' = any(f) then res := res || jsonb_build_object('quote',p.quote); end if;
  if 'about' = any(f) then res := res || jsonb_build_object('about',p.about); end if;
  if 'location' = any(f) then res := res || jsonb_build_object('location',p.location); end if;
  if 'email' = any(f) then res := res || jsonb_build_object('email',p.email); end if;
  if 'phone' = any(f) then res := res || jsonb_build_object('phone',p.phone); end if;
  if 'languages' = any(f) then res := res || jsonb_build_object('languages',p.languages); end if;
  if 'skills' = any(f) then res := res || jsonb_build_object('skills',p.skills); end if;
  if 'experiences' = any(f) then res := res || jsonb_build_object('experiences',p.experiences); end if;
  if 'education' = any(f) then res := res || jsonb_build_object('education',p.education); end if;
  if 'links' = any(f) then res := res || jsonb_build_object('links',p.links); end if;
  if 'cv' = any(f) then res := res || jsonb_build_object('cv_url',p.cv_url); end if;
  -- âge : calculé par la base à chaque affichage (toujours à jour), la date exacte ne sort que si elle est cochée
  if 'age' = any(f) and p.birth_date is not null then res := res || jsonb_build_object('age', date_part('year',age(current_date,p.birth_date))::int); end if;
  if 'birthdate' = any(f) and p.birth_date is not null then res := res || jsonb_build_object('birth_date',p.birth_date); end if;
  if 'birthplace' = any(f) then res := res || jsonb_build_object('birth_place',p.birth_place); end if;
  if 'nationality' = any(f) then res := res || jsonb_build_object('nationality',p.nationality); end if;
  return res;
end $$;
grant execute on function staff_public_profile(text) to anon, authenticated;

-- 5) Description affichée sur le badge pour le poste existant (modifiable ensuite dans Admin > Postes)
update staff_positions set description='Architecture technique, développement de la plateforme, sécurité des données, intégration des API et infrastructure.'
 where code='CTO' and description is null;
