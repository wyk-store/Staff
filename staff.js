/* WYK STAFF — noyau commun : Supabase, thème, menu burger, rendu du profil, éditeur, QR */
(function(){
var SUPA_URL='https://byrklytqoucdskzvcoau.supabase.co',
SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmtseXRxb3VjZHNrenZjb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQ0ODcsImV4cCI6MjA5NDI3MDQ4N30.nH7LKYevuBd9jGmFmv7KMNoJu3X_rDaY1BHXZR1v3wM',
LOGO='https://i.postimg.cc/J43jh72q/No-background.png',LOGO_WB='https://i.postimg.cc/150DzRjK/Logo-wyk-avec-fond-blanc.png',
WA='50940300966',PENDING='wyk-staff-pending',THEME='wyk-staff-theme';
var S=window.S={LOGO:LOGO,LOGO_WB:LOGO_WB,WA:WA,user:null};
var db=S.db=window.supabase?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;

/* ---------- utilitaires ---------- */
S.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var esc=S.esc;
S.safeUrl=function(u){try{var x=new URL(String(u||'').match(/^[a-z]+:/i)?u:'https://'+u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}};
S.date=function(d,m){if(!d)return'';var x=new Date(d);return isNaN(x)?'':x.toLocaleDateString('fr-FR',m==='full'?{day:'numeric',month:'long',year:'numeric'}:{month:'long',year:'numeric'})};
S.q=function(k){return new URLSearchParams(location.search).get(k)||''};
S.url=function(n,qs){return(n==='index'?'/':'/'+n)+(qs?'?'+qs:'')};
S.pubUrl=function(code){return location.origin+'/profil?id='+encodeURIComponent(code)};
var tt;S.toast=function(m,err){var t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.className='toast show'+(err?' err':'');clearTimeout(tt);tt=setTimeout(function(){t.className='toast'},3400)};
S.copy=function(txt,msg){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){S.toast(msg||'Copié')},function(){var a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand('copy');S.toast(msg||'Copié')}catch(e){S.toast('Copie impossible',1)}a.remove()})};
S.STATUS={active:'Actif',inactive:'Inactif',suspended:'Suspendu',review:'En examen'};

/* ---------- icônes ---------- */
var P={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
doc:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
chev:'<path d="M9 5l7 7-7 7"/>',x:'<path d="M5 5l14 14M19 5L5 19"/>',menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',pin:'<path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',print:'<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
logout:'<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',badge:'<rect x="5" y="2" width="14" height="20" rx="2.5"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16h8"/>'};
var ic=S.ic=function(n,cls){return'<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[n]||'')+'</svg>'};

/* ---------- thème (clair par défaut) ---------- */
function getTheme(){try{return localStorage.getItem(THEME)||'light'}catch(e){return'light'}}
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(THEME,t)}catch(e){}var b=document.getElementById('themeBtn');if(b)b.innerHTML=ic(t==='dark'?'sun':'moon')}
document.documentElement.setAttribute('data-theme',getTheme());

/* ---------- authentification ---------- */
S.getUser=async function(){if(!db)return null;try{var r=await db.auth.getSession();S.user=r.data.session?r.data.session.user:null}catch(e){S.user=null}return S.user};
S.isAdmin=async function(){if(!S.user)return false;try{var r=await db.rpc('staff_is_admin');return r.data===true}catch(e){return false}};
S.myProfile=async function(){if(!S.user)return null;var r=await db.from('staff_profiles').select('*').eq('user_id',S.user.id).maybeSingle();return r.data};
S.login=async function(email,pw){var r=await db.auth.signInWithPassword({email:email,password:pw});if(r.error)throw r.error;S.user=r.data.user;await S.tryPending();return r.data.user};
S.logout=async function(){await db.auth.signOut();S.user=null;location.href='/'};
S.setPending=function(o){try{localStorage.setItem(PENDING,JSON.stringify(o))}catch(e){}};
S.tryPending=async function(){var o=null;try{o=JSON.parse(localStorage.getItem(PENDING)||'null')}catch(e){}if(!o||!S.user)return false;
 var r=await db.rpc('staff_redeem_invite',{p_code:o.code,p_full_name:o.name});if(!r.error||/déjà un profil/.test(r.error.message)){try{localStorage.removeItem(PENDING)}catch(e){}return !r.error}return false};

S.errMsg=function(e){var m=(e&&e.message)||String(e);if(/Invalid login/i.test(m))return'Email ou mot de passe incorrect.';if(/already registered|already been registered/i.test(m))return'Cet email a déjà un compte : utilisez « J\'ai déjà un compte ».';if(/Password should be/i.test(m))return'Mot de passe trop court (6 caractères minimum).';if(/rate limit/i.test(m))return'Trop de tentatives, réessayez dans quelques minutes.';if(/Email not confirmed/i.test(m))return'Confirmez d\'abord votre email (lien reçu par courriel).';return m};
/* formulaire de connexion réutilisable ; après succès : admin -> /admin, sinon /moi */
S.loginForm=function(host,opts){opts=opts||{};
 host.innerHTML='<div class="msg" id="lm" style="display:none"></div><form id="lf" novalidate><div class="field"><label>Email</label><input type="email" id="le" autocomplete="username" placeholder="vous@exemple.com" required></div><div class="field"><label>Mot de passe</label><input type="password" id="lp" autocomplete="current-password" required></div><button class="btn pri" style="width:100%" id="lb">'+ic('key')+'Se connecter</button><p class="small" style="margin-top:14px;text-align:center"><a href="#" id="lfg" class="red">Mot de passe oublié ?</a></p></form>';
 var msg=function(t,ok){var m=host.querySelector('#lm');m.style.display=t?'block':'none';m.className='msg'+(ok?' ok':'');m.textContent=t||''};
 host.querySelector('#lf').onsubmit=async function(e){e.preventDefault();var b=host.querySelector('#lb');msg('');b.disabled=true;
  try{await S.login(host.querySelector('#le').value.trim(),host.querySelector('#lp').value);if(opts.onDone)return opts.onDone();location.href=(await S.isAdmin())?'/admin':'/moi'}catch(x){msg(S.errMsg(x));b.disabled=false}};
 host.querySelector('#lfg').onclick=async function(e){e.preventDefault();var em=host.querySelector('#le').value.trim();if(!em){msg('Entrez votre email, puis cliquez sur « Mot de passe oublié ».');return}
  var r=await db.auth.resetPasswordForEmail(em,{redirectTo:location.origin+'/connexion'});msg(r.error?S.errMsg(r.error):'Un lien de réinitialisation vient d\'être envoyé à '+em+'.',!r.error)}};

/* ---------- coque : en-tête, menu burger, pied ---------- */
S.MENU=[['index','home','Accueil'],['info?p=apropos','users','À propos de nous'],['info?p=carrieres','brief','Carrières chez WYK'],['info?p=confidentialite','shield','Politique de confidentialité'],['info?p=conditions','doc',"Conditions d'utilisation"],['info?p=contact','mail','Nous contacter']];
S.shell=async function(active){
 var top=document.getElementById('top'),foot=document.getElementById('foot');
 top.className='top';top.innerHTML='<div class="wrap"><a class="brand" href="/"><img src="'+LOGO_WB+'" alt="WYK"><span><b>WYK STAFF</b><small>Portail des profils professionnels</small></span></a><a class="ib" id="meBtn" href="/connexion" aria-label="Mon espace" style="display:none">'+ic('user')+'</a><button class="ib" id="themeBtn" aria-label="Changer de thème"></button><button class="ib" id="burger" aria-label="Menu">'+ic('menu')+'</button></div>';
 var sc=document.createElement('div');sc.className='scrim';sc.id='scrim';
 var dr=document.createElement('aside');dr.className='drawer';dr.id='drawer';dr.setAttribute('aria-label','Menu');
 var items=S.MENU.map(function(m){var on=(active||'')===m[0];return'<a href="'+S.url(m[0].split('?')[0],m[0].split('?')[1])+'" class="'+(on?'act':'')+'">'+ic(m[1])+'<span>'+m[2]+'</span>'+ic('chev','chev')+'</a>'}).join('');
 dr.innerHTML='<div class="dh"><img src="'+LOGO+'" alt=""><div><b>WYK STAFF</b><span>Portail des profils professionnels</span></div><button class="x" id="dx" aria-label="Fermer">'+ic('x')+'</button></div><nav class="dl"><div id="dyn"></div>'+items+'<hr><button id="lang" class="glob">'+ic('globe')+'<span>Français</span><span style="margin-left:auto" class="ic-wrap">'+ic('ext')+'</span></button></nav><div class="dfoot">© WYK — Tous droits réservés.</div>';
 document.body.appendChild(sc);document.body.appendChild(dr);
 var open=function(v){dr.classList.toggle('open',v);sc.classList.toggle('open',v)};
 document.getElementById('burger').onclick=function(){open(true)};document.getElementById('dx').onclick=function(){open(false)};sc.onclick=function(){open(false)};
 document.addEventListener('keydown',function(e){if(e.key==='Escape')open(false)});
 document.getElementById('lang').onclick=function(){S.toast("D'autres langues arrivent bientôt.")};
 document.getElementById('themeBtn').onclick=function(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')};setTheme(getTheme());
 foot.className='foot';foot.innerHTML='<div class="wrap">© '+new Date().getFullYear()+' WYK — Portail des profils professionnels · <a href="https://wykht.com" target="_blank" rel="noopener">wykht.com</a></div>';
 await S.getUser();
 var dyn='';if(S.user){var adm=await S.isAdmin();S.admin=adm;
  dyn=(adm?'<a href="/admin">'+ic('grid')+'<span>Espace administrateur</span>'+ic('chev','chev')+'</a>':'')+'<a href="/moi">'+ic('user')+'<span>Mon profil</span>'+ic('chev','chev')+'</a><button id="lo">'+ic('logout')+'<span>Se déconnecter</span></button><hr>';
  var me=document.getElementById('meBtn');me.style.display='grid';me.href=adm?'/admin':'/moi'}
 else dyn='<a href="/connexion">'+ic('key')+'<span>Se connecter</span>'+ic('chev','chev')+'</a><hr>';
 document.getElementById('dyn').innerHTML=dyn;var lo=document.getElementById('lo');if(lo)lo.onclick=S.logout;
 return S.user};

/* ---------- QR ---------- */
var qrp;S.loadQR=function(){if(window.qrcode)return Promise.resolve();if(qrp)return qrp;qrp=new Promise(function(res){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';s.onload=res;s.onerror=res;document.head.appendChild(s)});return qrp};
S.hydrateQR=async function(root){var els=(root||document).querySelectorAll('[data-qr]');if(!els.length)return;await S.loadQR();if(!window.qrcode)return;
 els.forEach(function(el){try{var q=window.qrcode(0,'M');q.addData(el.getAttribute('data-qr'));q.make();el.innerHTML=q.createSvgTag({cellSize:4,margin:0,scalable:true})}catch(e){}})};

/* ---------- vue publique d'un profil (même forme que staff_public_profile) ---------- */
S.view=function(row,posTitle,fields){var v={full_name:row.full_name,position:posTitle,status:row.status,fields:fields};
 var map={photo:['photo_url'],employee_id:['employee_code'],since:['activated_at'],quote:['quote'],about:['about'],location:['location'],email:['email'],phone:['phone'],languages:['languages'],skills:['skills'],experiences:['experiences'],education:['education'],links:['links'],cv:['cv_url']};
 Object.keys(map).forEach(function(k){if(fields.indexOf(k)>-1)map[k].forEach(function(c){v[c]=row[c]})});return v};

S.renderProfile=function(p,o){o=o||{};var f=p.fields||[];
 var has=function(k){var x=p[k];return x!=null&&x!==''&&!(Array.isArray(x)&&!x.length)};
 var parts=String(p.full_name||'').trim().split(/\s+/),last=parts.length>1?parts.pop():'',first=parts.join(' ');
 var h=function(k){return esc(p[k])};
 var tag=has('employee_code')?esc((p.employee_code.split('-')[1]||'')):'';
 var photo=has('photo_url')&&S.safeUrl(p.photo_url)?'<img src="'+esc(S.safeUrl(p.photo_url))+'" alt="'+esc(p.full_name)+'">':ic('user');
 var meta='';if(has('location'))meta+='<span>'+ic('pin')+h('location')+'</span>';if(has('email'))meta+='<span>'+ic('mail')+h('email')+'</span>';if(has('phone'))meta+='<span>'+ic('phone')+h('phone')+'</span>';
 var hero='<section class="pf-hero"><img class="pf-logo" src="'+LOGO+'" alt="WYK"><div class="pf-top"><div class="pf-photo">'+photo+(tag?'<span class="tag">'+tag+'</span>':'')+'</div><div class="pf-main"><span class="pill '+esc(p.status)+'">'+esc(S.STATUS[p.status]||p.status)+'</span><h1>'+esc(first)+(last?' <em>'+esc(last)+'</em>':'')+'</h1><div class="pf-role">'+esc(p.position||'')+'</div>'+(meta?'<div class="pf-meta">'+meta+'</div>':'')+(has('quote')?'<p class="pf-quote">« '+h('quote')+' »</p>':'')+'</div></div></section>';
 var acts='<div class="pf-acts">'+(has('cv_url')&&S.safeUrl(p.cv_url)?'<a class="btn pri" href="'+esc(S.safeUrl(p.cv_url))+'" target="_blank" rel="noopener">'+ic('dl')+'Télécharger le CV</a>':'<button class="btn pri" data-act="print">'+ic('dl')+'Télécharger le CV (PDF)</button>')+'<button class="btn" data-act="print">'+ic('print')+'Imprimer</button>'+(o.noShare?'':'<button class="btn" data-act="share">'+ic('link')+'Copier le lien</button>')+'</div>';
 var main='',side='';
 if(has('about'))main+='<section class="nm card about"><h3>'+ic('user')+'À propos de moi</h3><p>'+h('about')+'</p></section>';
 if(has('experiences'))main+='<section class="nm card"><h3>'+ic('brief')+'Expérience professionnelle</h3><div class="tl">'+p.experiences.map(function(e){return'<div class="t"><b>'+esc(e.role)+(e.company?' · '+esc(e.company):'')+'</b><span class="d">'+esc([e.from,e.to].filter(Boolean).join(' – '))+'</span>'+(e.desc?'<p>'+esc(e.desc)+'</p>':'')+'</div>'}).join('')+'</div></section>';
 if(has('skills'))main+='<section class="nm card"><h3>'+ic('gear')+'Compétences</h3>'+p.skills.map(function(s){var l=Math.max(0,Math.min(100,+s.level||0));return'<div class="bar"><div><span>'+esc(s.name)+'</span><span class="mut">'+l+'%</span></div><i><b style="width:'+l+'%"></b></i></div>'}).join('')+'</section>';
 if(has('links'))main+='<section class="nm card"><h3>'+ic('link')+'Liens professionnels</h3><div class="chips">'+p.links.filter(function(l){return S.safeUrl(l.url)}).map(function(l){return'<a class="chip" href="'+esc(S.safeUrl(l.url))+'" target="_blank" rel="noopener noreferrer">'+esc(l.label||l.url)+'</a>'}).join('')+'</div></section>';
 var kv='<div><small>Nom complet</small><span>'+esc(p.full_name)+'</span></div><div><small>Poste</small><span>'+esc(p.position||'')+'</span></div><div><small>Statut du profil</small><span>'+esc(S.STATUS[p.status]||p.status)+'</span></div>';
 if(has('employee_code'))kv+='<div><small>ID employé</small><span>'+h('employee_code')+'</span></div>';
 if(has('activated_at'))kv+='<div><small>Actif depuis</small><span>'+esc(S.date(p.activated_at,'full'))+'</span></div>';
 if(has('location'))kv+='<div><small>Localisation</small><span>'+h('location')+'</span></div>';
 if(has('phone'))kv+='<div><small>Téléphone</small><span>'+h('phone')+'</span></div>';
 if(has('email'))kv+='<div><small>Email</small><span>'+h('email')+'</span></div>';
 var qr=f.indexOf('qr')>-1&&o.code?'<div class="qr"><div data-qr="'+esc(S.pubUrl(o.code))+'"></div><p>Scannez ce QR code pour voir son profil en ligne.</p></div>':'';
 side+='<section class="dark-card"><h3>Informations principales</h3><div class="kv">'+kv+'</div>'+qr+'</section>';
 if(has('education'))side+='<section class="nm card"><h3>'+ic('cap')+'Formation</h3><div class="tl">'+p.education.map(function(e){return'<div class="t"><b>'+esc(e.title)+'</b>'+(e.school?'<span class="d" style="display:block">'+esc(e.school)+'</span>':'')+'<span class="d">'+esc([e.from,e.to].filter(Boolean).join(' – '))+'</span></div>'}).join('')+'</div></section>';
 if(has('languages'))side+='<section class="nm card"><h3>'+ic('globe')+'Langues</h3><div class="chips">'+p.languages.map(function(l){return'<span class="chip">'+esc(l)+'</span>'}).join('')+'</div></section>';
 return hero+acts+'<div class="pf-cols"><div class="pf-col">'+(main||'<div class="nm card empty">Aucune autre information publique pour ce profil.</div>')+'</div><div class="pf-col">'+side+'</div></div><p class="pf-foot">Ce profil est un espace public. Les informations sont mises à jour par l\'équipe WYK.</p>'};

S.bindProfile=function(root,code){root.querySelectorAll('[data-act=print]').forEach(function(b){b.onclick=function(){document.body.classList.remove('print-badge');window.print()}});
 root.querySelectorAll('[data-act=share]').forEach(function(b){b.onclick=function(){S.copy(S.pubUrl(code),'Lien du profil copié')}});S.hydrateQR(root)};

/* ---------- téléversement ---------- */
S.upload=async function(uid,file,kind){
 var blob=file,ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(kind==='photo'){blob=await new Promise(function(res,rej){var im=new Image();im.onload=function(){var m=900,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){b?res(b):rej(new Error('Image illisible'))},'image/jpeg',.86)};im.onerror=function(){rej(new Error('Image illisible'))};im.src=URL.createObjectURL(file)});ext='jpg'}
 else if(file.size>6*1024*1024)throw new Error('Fichier trop lourd (6 Mo max).');
 var path=uid+'/'+kind+'-'+Date.now()+'.'+ext;
 var r=await db.storage.from('staff-media').upload(path,blob,{contentType:kind==='photo'?'image/jpeg':file.type||'application/octet-stream',upsert:true});
 if(r.error)throw r.error;return db.storage.from('staff-media').getPublicUrl(path).data.publicUrl};

/* ---------- éditeur de profil (employé ET admin) ---------- */
var FIELDS=S.FIELDS=[['photo','Photo'],['employee_id','ID employé'],['since','Date « actif depuis »'],['quote','Citation'],['about','À propos'],['location','Localisation'],['email','Email'],['phone','Téléphone'],['skills','Compétences'],['experiences','Expérience professionnelle'],['education','Formation'],['languages','Langues'],['links','Liens professionnels'],['cv','CV (fichier)'],['qr','QR code & badge']];
var SCHEMA={skills:[['name','Compétence','Développement web'],['level','Niveau','','range']],experiences:[['role','Poste','Chef de projet'],['company','Entreprise','WYK'],['from','Début','Janv. 2025'],['to','Fin','Présent'],['desc','Description','','area']],education:[['title','Diplôme / certification','Licence en informatique'],['school','Établissement',''],['from','Début','2021'],['to','Fin','2024']],links:[['label','Nom du lien','LinkedIn'],['url','Adresse (URL)','https://']]};
var BLANK={skills:{name:'',level:70},experiences:{role:'',company:'',from:'',to:'',desc:''},education:{title:'',school:'',from:'',to:''},links:{label:'',url:''}};

S.editor=function(host,row,ctx){ctx=ctx||{};
 var st=JSON.parse(JSON.stringify(row));['skills','experiences','education','links'].forEach(function(k){if(!Array.isArray(st[k]))st[k]=[]});if(!Array.isArray(st.languages))st.languages=[];
 var fields=ctx.fields||[];var pubBadge=function(k){return ctx.noBadges?'':'<span class="vis '+(fields.indexOf(k)>-1||k==='_'?'pub">Public':'priv">Privé')+'</span>'};
 var inp=function(k,label,type,ph,vk){return'<div class="field"><label>'+label+' '+pubBadge(vk||k)+'</label><input data-k="'+k+'" type="'+(type||'text')+'" value="'+esc(st[k]||'')+'" placeholder="'+esc(ph||'')+'"></div>'};
 var h='';
 if(ctx.admin){var po=(ctx.positions||[]).map(function(p){return'<option value="'+p.id+'"'+(p.id===st.position_id?' selected':'')+'>'+esc(p.title)+'</option>'}).join(''),co='<option value="">Par défaut</option>'+(ctx.categories||[]).filter(function(c){return!c.is_default}).map(function(c){return'<option value="'+c.id+'"'+(c.id===st.category_id?' selected':'')+'>'+esc(c.name)+'</option>'}).join('');
  h+='<section class="nm card"><h3>'+ic('gear')+'Administration</h3><div class="row"><div class="field"><label>ID employé</label><input value="'+esc(st.employee_code)+'" disabled></div><div class="field"><label>Actif depuis</label><input value="'+esc(S.date(st.activated_at,'full'))+'" disabled></div><div class="field"><label>Poste</label><select data-k="position_id">'+po+'</select></div><div class="field"><label>Catégorie</label><select data-k="category_id">'+co+'</select></div><div class="field"><label>Statut</label><select data-k="status">'+Object.keys(S.STATUS).map(function(s){return'<option value="'+s+'"'+(s===st.status?' selected':'')+'>'+S.STATUS[s]+'</option>'}).join('')+'</select></div></div><div class="field"><label>Motif (visible par l\'admin seulement)</label><input data-k="status_reason" value="'+esc(st.status_reason||'')+'" placeholder="Ex : vérification en cours"></div></section>'}
 h+='<section class="nm card"><h3>'+ic('user')+'Identité</h3><div class="photo-up"><div class="avatar" id="av">'+(st.photo_url?'<img src="'+esc(st.photo_url)+'" alt="">':ic('user'))+'</div><div><div class="lbl" style="margin-bottom:8px">Photo '+pubBadge('photo')+'</div><label class="btn sm" style="cursor:pointer">'+ic('plus')+'Choisir une photo<input id="ph" type="file" accept="image/*" hidden></label><p class="small mut" style="margin-top:8px">Portrait net, fond simple. Recadrée automatiquement.</p></div></div><div style="height:18px"></div><div class="row">'+inp('full_name','Nom complet',0,'Prénom Nom','_')+inp('location','Localisation','text','Carrefour, Haïti')+inp('phone','Téléphone professionnel','tel','+509 …')+inp('email','Email professionnel','email','prenom@wykht.com')+'</div>'+inp('quote','Citation / devise',0,'« La technologie, c\'est… »')+'</section>';
 h+='<section class="nm card"><h3>'+ic('doc')+'À propos '+pubBadge('about')+'</h3><div class="field"><textarea data-k="about" placeholder="Parlez de votre parcours, de vos motivations et de vos objectifs professionnels.">'+esc(st.about||'')+'</textarea></div><div class="field"><label>Langues (séparées par une virgule) '+pubBadge('languages')+'</label><input data-k="languages" data-list="1" value="'+esc((st.languages||[]).join(', '))+'" placeholder="Français, Créole, Anglais"></div></section>';
 var rep=function(k,title,icn,addLbl){return'<section class="nm card"><h3>'+ic(icn)+title+' '+pubBadge(k)+'</h3><div class="rep" data-rep="'+k+'"></div><div style="margin-top:14px"><button type="button" class="btn sm" data-add="'+k+'">'+ic('plus')+addLbl+'</button></div></section>'};
 h+=rep('experiences','Expérience professionnelle','brief','Ajouter une expérience')+rep('skills','Compétences','gear','Ajouter une compétence')+rep('education','Formation','cap','Ajouter une formation')+rep('links','Liens professionnels','link','Ajouter un lien');
 h+='<section class="nm card"><h3>'+ic('doc')+'CV (PDF) '+pubBadge('cv')+'</h3><p class="small mut" id="cvn" style="margin-bottom:12px">'+(st.cv_url?'Un CV est enregistré.':'Facultatif : sans fichier, un CV est généré automatiquement depuis votre profil.')+'</p><label class="btn sm" style="cursor:pointer">'+ic('plus')+'Téléverser un CV<input id="cv" type="file" accept="application/pdf" hidden></label>'+(st.cv_url?' <button type="button" class="btn sm dng" id="cvx">Retirer</button>':'')+'</section>';
 h+='<div style="display:flex;gap:12px;flex-wrap:wrap;position:sticky;bottom:14px;z-index:5"><button class="btn pri" id="save">'+ic('check')+'Enregistrer</button></div>';
 host.innerHTML=h;
 function drawRep(k){var box=host.querySelector('[data-rep="'+k+'"]');if(!st[k].length){box.innerHTML='<div class="empty">Rien pour l\'instant.</div>';return}
  box.innerHTML=st[k].map(function(it,i){return'<div class="nm-in it"><button type="button" class="del" data-del="'+k+':'+i+'" aria-label="Supprimer">'+ic('trash')+'</button><div class="row">'+SCHEMA[k].map(function(s){var v=it[s[0]]==null?'':it[s[0]];
   if(s[3]==='range')return'<div class="field"><label>'+s[1]+' <b class="red">'+(+v||0)+'%</b></label><input type="range" min="0" max="100" step="5" value="'+(+v||0)+'" data-r="'+k+':'+i+':'+s[0]+'"></div>';
   if(s[3]==='area')return'<div class="field" style="grid-column:1/-1"><label>'+s[1]+'</label><textarea style="min-height:70px" data-r="'+k+':'+i+':'+s[0]+'">'+esc(v)+'</textarea></div>';
   return'<div class="field"><label>'+s[1]+'</label><input data-r="'+k+':'+i+':'+s[0]+'" value="'+esc(v)+'" placeholder="'+esc(s[2])+'"></div>'}).join('')+'</div></div>'}).join('')}
 ['experiences','skills','education','links'].forEach(drawRep);
 host.oninput=function(e){var t=e.target;if(t.dataset.k){var k=t.dataset.k;st[k]=t.dataset.list?t.value.split(',').map(function(x){return x.trim()}).filter(Boolean):t.value}
  else if(t.dataset.r){var a=t.dataset.r.split(':');st[a[0]][+a[1]][a[2]]=t.type==='range'?+t.value:t.value;if(t.type==='range')t.parentNode.querySelector('b').textContent=t.value+'%'}};
 host.onchange=function(e){var t=e.target;if(t.tagName==='SELECT'&&t.dataset.k)st[t.dataset.k]=t.value||null};
 host.onclick=function(e){var b=e.target.closest('[data-add],[data-del]');if(!b)return;
  if(b.dataset.add){var k=b.dataset.add;st[k].push(Object.assign({},BLANK[k]));drawRep(k)}
  else{var a=b.dataset.del.split(':');st[a[0]].splice(+a[1],1);drawRep(a[0])}};
 host.querySelector('#ph').onchange=async function(e){var f=e.target.files[0];if(!f)return;try{S.toast('Envoi de la photo…');st.photo_url=await S.upload(st.user_id,f,'photo');host.querySelector('#av').innerHTML='<img src="'+esc(st.photo_url)+'" alt="">';S.toast('Photo prête — pensez à enregistrer.')}catch(x){S.toast(x.message||'Échec',1)}};
 host.querySelector('#cv').onchange=async function(e){var f=e.target.files[0];if(!f)return;try{S.toast('Envoi du CV…');st.cv_url=await S.upload(st.user_id,f,'cv');host.querySelector('#cvn').textContent='CV prêt — pensez à enregistrer.'}catch(x){S.toast(x.message||'Échec',1)}};
 var cvx=host.querySelector('#cvx');if(cvx)cvx.onclick=function(){st.cv_url=null;host.querySelector('#cvn').textContent='CV retiré — pensez à enregistrer.'};
 host.querySelector('#save').onclick=async function(){var b=this;
  if(!String(st.full_name||'').trim()){S.toast('Le nom est obligatoire.',1);return}
  var clean=function(k,f){return st[k].filter(function(x){return String(x[f]||'').trim()})};
  var pl={full_name:st.full_name.trim(),photo_url:st.photo_url||null,quote:st.quote||null,about:st.about||null,email:st.email||null,phone:st.phone||null,location:st.location||null,languages:st.languages,skills:clean('skills','name'),experiences:clean('experiences','role'),education:clean('education','title'),links:clean('links','url'),cv_url:st.cv_url||null};
  if(ctx.admin){pl.position_id=st.position_id||null;pl.category_id=st.category_id||null;pl.status=st.status;pl.status_reason=st.status_reason||null}
  b.disabled=true;var r=await db.from('staff_profiles').update(pl).eq('user_id',st.user_id).select().single();b.disabled=false;
  if(r.error){S.toast(r.error.message,1);return}S.toast('Profil enregistré');Object.assign(st,r.data);if(ctx.onSaved)ctx.onSaved(r.data)};
 return{state:st}};
})();
