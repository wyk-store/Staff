/* WYK STAFF — noyau commun : Supabase, sécurité, thème, menu, profil/CV, badge animé, QR, éditeur */
(function(){
var SUPA_URL='https://byrklytqoucdskzvcoau.supabase.co',
SUPA_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmtseXRxb3VjZHNrenZjb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTQ0ODcsImV4cCI6MjA5NDI3MDQ4N30.nH7LKYevuBd9jGmFmv7KMNoJu3X_rDaY1BHXZR1v3wM',
LOGO='/logo-wyk.png',LOGO_WB='/logo-wyk-blanc.png',
WA='50940300966',PENDING='wyk-staff-pending',THEME='wyk-staff-theme',FAIL='wyk-staff-fails',IDLE_MIN=30;
/* LOGIN : chemin de la page de connexion (non liée nulle part sur le site). Pour la cacher davantage :
   renomme connexion.html (ex. acces-7k2m.html) ET change cette valeur. */
var S=window.S={LOGO:LOGO,LOGO_WB:LOGO_WB,WA:WA,user:null,LOGIN:'/connexion',
  /* Badge « xlogs Verified » : colle ici l'adresse de vérification fournie par xlogs pour l'afficher sur les profils */
  XLOGS:{url:'',label:'xlogs Verified'}};
var db=S.db=window.supabase?window.supabase.createClient(SUPA_URL,SUPA_KEY):null;

/* ---------- utilitaires ---------- */
S.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var esc=S.esc;
S.safeUrl=function(u){try{var x=new URL(String(u||'').match(/^[a-z]+:/i)?u:'https://'+u);return /^https?:$/.test(x.protocol)?x.href:''}catch(e){return ''}};
S.date=function(d,m){if(!d)return'';var x=new Date(d);return isNaN(x)?'':x.toLocaleDateString('fr-FR',m==='full'?{day:'numeric',month:'long',year:'numeric'}:{month:'long',year:'numeric'})};
S.dateShort=function(d){if(!d)return'';var x=new Date(d);return isNaN(x)?'':x.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})};
/* âge calculé à partir de la date de naissance : toujours à jour (recalculé à chaque affichage) */
S.age=function(d){if(!d)return null;var b=new Date(String(d).slice(0,10)+'T00:00:00');if(isNaN(b))return null;var n=new Date(),a=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a>=0&&a<130?a:null};
S.today=function(){var n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')};
S.q=function(k){return new URLSearchParams(location.search).get(k)||''};
S.url=function(n,qs){return(n==='index'?'/':'/'+n)+(qs?'?'+qs:'')};
S.pubUrl=function(code){return location.origin+'/profil?id='+encodeURIComponent(code)};
S.badgeUrl=function(code){return location.origin+'/badge?id='+encodeURIComponent(code)};
S.idOf=function(row){return row.public_id||row.employee_code};
S.isSyn=function(e){return /@staff\.wykht\.com$/i.test(e||'')};
S.MAIL='contact@wykht.com';
S.validEmail=function(e){return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(e||''))};
var tt;S.toast=function(m,err){var t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=m;t.className='toast show'+(err?' err':'');clearTimeout(tt);tt=setTimeout(function(){t.className='toast'},3400)};
S.copy=function(txt,msg){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){S.toast(msg||'Copié')},function(){var a=document.createElement('textarea');a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand('copy');S.toast(msg||'Copié')}catch(e){S.toast('Copie impossible',1)}a.remove()})};
S.share=function(url,title){if(navigator.share){navigator.share({title:title||'WYK STAFF',url:url}).catch(function(){})}else S.copy(url,'Lien copié')};
S.STATUS={active:'Actif',inactive:'Inactif',suspended:'Suspendu',review:'En examen'};
S.SVC={active:['En service','Profil actif'],inactive:['Hors service','Profil inactif'],suspended:['Suspendu','Profil suspendu'],review:['En examen','Profil en examen']};

/* ---------- icônes ---------- */
var P={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
doc:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
chev:'<path d="M9 5l7 7-7 7"/>',x:'<path d="M5 5l14 14M19 5L5 19"/>',menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',pin:'<path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',print:'<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.5 7.7A16.5 16.5 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 3.5-.6"/>',
link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
logout:'<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
badge:'<rect x="5" y="2" width="14" height="20" rx="2.5"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16h8"/>',lock:'<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
checkc:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M17 20h4"/>',
code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.1"/>',
wa:'<path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19z"/>',zoom:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/>'};
var ic=S.ic=function(n,cls){return'<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[n]||'')+'</svg>'};

/* ---------- thème (clair par défaut) ---------- */
function getTheme(){try{var t=localStorage.getItem(THEME);if(t==='dark'||t==='light')return t;return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){return'light'}}
function setTheme(t){t=t==='dark'?'dark':'light';var root=document.documentElement;root.setAttribute('data-theme',t);root.style.colorScheme=t;try{localStorage.setItem(THEME,t)}catch(e){}var b=document.getElementById('themeBtn');if(b){b.innerHTML=ic(t==='dark'?'sun':'moon');b.setAttribute('aria-label',t==='dark'?'Activer le thème clair':'Activer le thème sombre');b.setAttribute('aria-pressed',String(t==='dark'))}var m=document.getElementById('wykThemeColor');if(m)m.setAttribute('content',t==='dark'?'#08080a':'#f3f4f7')}
document.documentElement.setAttribute('data-theme',getTheme());document.documentElement.style.colorScheme=getTheme();
window.addEventListener('storage',function(e){if(e.key===THEME)setTheme(e.newValue==='dark'?'dark':'light')});
try{var systemTheme=window.matchMedia('(prefers-color-scheme: dark)');var syncSystemTheme=function(e){var saved=null;try{saved=localStorage.getItem(THEME)}catch(_){}if(saved!=='dark'&&saved!=='light')setTheme(e.matches?'dark':'light')};if(systemTheme.addEventListener)systemTheme.addEventListener('change',syncSystemTheme);else if(systemTheme.addListener)systemTheme.addListener(syncSystemTheme)}catch(e){}


/* ---------- authentification ---------- */
S.getUser=async function(){if(!db)return null;try{var r=await db.auth.getSession();S.user=r.data.session?r.data.session.user:null}catch(e){S.user=null}return S.user};
S.isAdmin=async function(){if(!S.user)return false;try{var r=await db.rpc('staff_is_admin');return r.data===true}catch(e){return false}};
S.myProfile=async function(){if(!S.user)return null;var r=await db.from('staff_profiles').select('*').eq('user_id',S.user.id).maybeSingle();return r.data};
/* anti-force-brute côté navigateur : 5 échecs => blocage temporaire (le serveur Supabase limite aussi les tentatives) */
function fails(){try{return JSON.parse(localStorage.getItem(FAIL)||'{}')}catch(e){return{}}}
function saveFails(f){try{localStorage.setItem(FAIL,JSON.stringify(f))}catch(e){}}
S.lockLeft=function(){var f=fails();return f.until&&f.until>Date.now()?Math.ceil((f.until-Date.now())/1000):0};
S.login=async function(email,pw){var l=S.lockLeft();if(l>0){var e=new Error('LOCK');e.secs=l;throw e}
 var r=await db.auth.signInWithPassword({email:email,password:pw});
 if(r.error){var f=fails();f.n=(f.n||0)+1;if(f.n>=5){f.until=Date.now()+Math.min(30,5*(f.n-4))*60000}saveFails(f);await new Promise(function(ok){setTimeout(ok,700)});throw r.error}
 saveFails({});S.user=r.data.user;await S.tryPending();return r.data.user};
S.logout=async function(){try{await db.auth.signOut()}catch(e){}S.user=null;location.href='/'};
S.setPending=function(o){try{localStorage.setItem(PENDING,JSON.stringify(o))}catch(e){}};
S.saveExtras=async function(x){if(!x||!S.user)return;var u={};['birth_date','birth_place','nationality','phone','email'].forEach(function(k){if(x[k])u[k]=x[k]});if(Object.keys(u).length)await db.from('staff_profiles').update(u).eq('user_id',S.user.id)};
S.tryPending=async function(){var o=null;try{o=JSON.parse(localStorage.getItem(PENDING)||'null')}catch(e){}if(!o||!S.user)return false;
 var r=await db.rpc('staff_redeem_invite',{p_code:o.code,p_full_name:o.name});if(!r.error||/déjà un profil/.test(r.error.message)){try{localStorage.removeItem(PENDING)}catch(e){}if(!r.error)try{await S.saveExtras(o.extra)}catch(e){}return !r.error}return false};
/* déconnexion automatique après 30 min d'inactivité */
S.idle=function(){var t,go=function(){S.logout()},rs=function(){clearTimeout(t);t=setTimeout(go,IDLE_MIN*60000)};['pointerdown','keydown','scroll','touchstart'].forEach(function(e){addEventListener(e,rs,{passive:true})});rs()};

S.errMsg=function(e){var m=(e&&e.message)||String(e);if(m==='LOCK')return'Trop de tentatives. Réessayez dans '+Math.max(1,Math.ceil((e.secs||60)/60))+' min.';if(/Invalid login/i.test(m))return'Identifiants incorrects.';if(/already registered|already been registered/i.test(m))return'Cet email a déjà un compte : utilisez « J\'ai déjà un compte ».';if(/Password should be/i.test(m))return'Mot de passe trop faible.';if(/rate limit/i.test(m))return'Trop de tentatives, réessayez dans quelques minutes.';if(/Email not confirmed/i.test(m))return'Confirmez d\'abord votre email (lien reçu par courriel).';return m};
/* champ mot de passe avec œil */
S.pwField=function(id,label,ac,extra){return'<div class="field"><label for="'+id+'">'+label+'</label><div class="pwf"><input type="password" id="'+id+'" autocomplete="'+ac+'" '+(extra||'')+' required><button type="button" class="eye" data-eye="'+id+'" aria-label="Afficher le mot de passe">'+ic('eye')+'</button></div></div>'};
S.bindEyes=function(root){root.querySelectorAll('[data-eye]').forEach(function(b){b.onclick=function(){var i=root.querySelector('#'+b.dataset.eye),s=i.type==='password';i.type=s?'text':'password';b.innerHTML=ic(s?'eyeoff':'eye')}})};
/* formulaire de connexion (sans « mot de passe oublié » : un mot de passe perdu se réinitialise via l'administration WYK) */
S.loginForm=function(host,opts){opts=opts||{};
 host.innerHTML='<div class="msg" id="lm" style="display:none" role="alert"></div><form id="lf" novalidate><div class="field"><label for="le">ID employé</label><input type="text" id="le" autocomplete="username" autocapitalize="characters" spellcheck="false" placeholder="WYK-XXX-000" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600" required></div>'+S.pwField('lp','Mot de passe','current-password')+'<button class="btn pri" style="width:100%" id="lb">'+ic('lock')+'Se connecter</button></form>';
 S.bindEyes(host);
 var msg=function(t,ok){var m=host.querySelector('#lm');m.style.display=t?'block':'none';m.className='msg'+(ok?' ok':'');m.textContent=t||''};
 var l0=S.lockLeft();if(l0>0)msg('Trop de tentatives. Réessayez dans '+Math.ceil(l0/60)+' min.');
 host.querySelector('#lf').onsubmit=async function(e){e.preventDefault();var b=host.querySelector('#lb');msg('');
  var id=host.querySelector('#le').value.trim(),pw=host.querySelector('#lp').value;if(!id||!pw){msg('Entrez votre ID et votre mot de passe.');return}
  var l=S.lockLeft();if(l>0){msg('Trop de tentatives. Réessayez dans '+Math.ceil(l/60)+' min.');return}
  b.disabled=true;
  try{
   var em=id;
   /* ID employé -> compte (l'administrateur peut aussi saisir son adresse email) */
   if(id.indexOf('@')<0){var r=await db.rpc('staff_login_email',{p_code:id});em=(r&&r.data)||'inconnu@staff.wykht.com'}
   await S.login(em,pw);if(opts.onDone)return opts.onDone();location.href=(await S.isAdmin())?'/admin':'/moi'}catch(x){msg(S.errMsg(x));b.disabled=false}}};

/* ---------- coque : en-tête, menu, pied ---------- */
S.MENU=[['Découvrir',[['index','home','Accueil'],['info?p=apropos','users','À propos de nous'],['info?p=carrieres','brief','Carrières chez WYK']]],
 ['Informations légales',[['info?p=confidentialite','shield','Politique de confidentialité','Vos données et leur protection'],['info?p=conditions','doc',"Conditions d'utilisation",'Règles d\'usage du portail']]],
 ['Aide',[['info?p=contact','mail','Nous contacter','Une question ? Écrivez-nous']]]];
S.shell=async function(active){
 var top=document.getElementById('top'),foot=document.getElementById('foot');
 top.className='top';top.innerHTML='<div class="wrap"><a class="brand" href="/"><img src="'+LOGO_WB+'" alt="WYK"><span><b>WYK STAFF</b><small>Portail des profils professionnels</small></span></a><a class="ib" id="meBtn" href="'+S.LOGIN+'" aria-label="Mon espace" style="display:none">'+ic('user')+'</a><button class="ib" id="themeBtn" aria-label="Changer de thème"></button><button class="ib" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">'+ic('menu')+'</button></div>';
 var sc=document.createElement('div');sc.className='scrim';sc.id='scrim';
 var dr=document.createElement('aside');dr.className='drawer';dr.id='drawer';dr.setAttribute('aria-label','Menu');
 var items=S.MENU.map(function(g){return'<div class="dg">'+g[0]+'</div>'+g[1].map(function(m){var on=(active||'')===m[0];return'<a href="'+S.url(m[0].split('?')[0],m[0].split('?')[1])+'" class="'+(on?'act':'')+'"><span class="ico">'+ic(m[1])+'</span><span>'+m[2]+(m[3]?'<span class="sub">'+m[3]+'</span>':'')+'</span>'+ic('chev','chev')+'</a>'}).join('')}).join('');
 dr.innerHTML='<div class="dh"><img src="'+LOGO+'" alt=""><div><b>WYK STAFF</b><span>Portail des profils professionnels</span></div><button class="x" id="dx" aria-label="Fermer">'+ic('x')+'</button></div><nav class="dscroll dl"><div id="dyn"></div>'+items+'<div class="dg">Préférences</div><button id="thm"><span class="ico">'+ic('moon')+'</span><span>Thème sombre</span><span class="tgl"></span></button><button id="lang"><span class="ico">'+ic('globe')+'</span><span>Français<span class="sub">Autres langues bientôt</span></span></button></nav><div class="dfoot"><i>●</i> Connexion sécurisée · © '+new Date().getFullYear()+' WYK</div>';
 document.body.appendChild(sc);document.body.appendChild(dr);
 var bg=document.getElementById('burger');
 var open=function(v){dr.classList.toggle('open',v);sc.classList.toggle('open',v);bg.setAttribute('aria-expanded',v);document.body.style.overflow=v?'hidden':''};
 bg.onclick=function(){open(true)};document.getElementById('dx').onclick=function(){open(false)};sc.onclick=function(){open(false)};
 document.addEventListener('keydown',function(e){if(e.key==='Escape')open(false)});
 document.getElementById('lang').onclick=function(){S.toast("D'autres langues arrivent bientôt.")};
 var tg=function(){setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')};
 document.getElementById('themeBtn').onclick=tg;document.getElementById('thm').onclick=tg;setTheme(getTheme());
 var SSL='<span class="ssl-card"><span class="sc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/></svg></span><span class="sc-tx"><b>Connexion sécurisée</b><small>Certificat SSL surveillé</small></span><a class="ssl-badge" href="https://sslcanary.com/en/tools/ssl-checker?host=staff.wykht.com" target="_blank" rel="noopener"><img src="https://sslcanary.com/badge/staff.wykht.com.svg" alt="SSL monitored by SSLCanary" height="28" loading="lazy" decoding="async"></a></span>';
 foot.className='foot';foot.innerHTML='<div class="wrap"><div class="fl"><a href="/info?p=confidentialite">Confidentialité</a><a href="/info?p=conditions">Conditions</a><a href="/info?p=contact">Contact</a><a href="mailto:contact@wykht.com">contact@wykht.com</a></div>© '+new Date().getFullYear()+' WYK — Portail des profils professionnels · <a href="https://wykht.com" target="_blank" rel="noopener">wykht.com</a><div class="ssl-row">'+SSL+'</div></div>';
 await S.getUser();
 var dyn='';if(S.user){var adm=await S.isAdmin();S.admin=adm;S.idle();
  try{S.me=await S.myProfile()}catch(e){S.me=null}
  var em=S.me?S.me.full_name:(S.isSyn(S.user.email)?'Collaborateur WYK':(S.user.email||'')),sb=adm?'Administrateur WYK':(S.me?S.me.employee_code:'Collaborateur WYK');
  dyn='<div class="dme"><div class="av">'+esc((em[0]||'?').toUpperCase())+'</div><div style="min-width:0"><b>'+esc(em)+'</b><small>'+esc(sb)+'</small></div></div>'+
   (adm?'<a href="/admin"><span class="ico">'+ic('grid')+'</span><span>Espace administrateur</span>'+ic('chev','chev')+'</a>':'')+'<a href="/moi"><span class="ico">'+ic('user')+'</span><span>Mon profil</span>'+ic('chev','chev')+'</a><button id="lo" class="dng"><span class="ico">'+ic('logout')+'</span><span>Se déconnecter</span></button>';
  var me=document.getElementById('meBtn');me.style.display='grid';me.href=adm?'/admin':'/moi'}
 document.getElementById('dyn').innerHTML=dyn;var lo=document.getElementById('lo');if(lo)lo.onclick=S.logout;
 return S.user};

/* ---------- QR ---------- */
var qrp;S.loadQR=function(){if(window.qrcode)return Promise.resolve();if(qrp)return qrp;qrp=new Promise(function(res){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';s.onload=res;s.onerror=res;document.head.appendChild(s)});return qrp};
S.hydrateQR=async function(root){var els=(root||document).querySelectorAll('[data-qr]');if(!els.length)return;await S.loadQR();if(!window.qrcode)return;
 els.forEach(function(el){try{var q=window.qrcode(0,'M');q.addData(el.getAttribute('data-qr'));q.make();el.innerHTML=q.createSvgTag({cellSize:4,margin:0,scalable:true})}catch(e){}})};
/* fenêtre QR agrandie, arrière-plan flou */
S.qrModal=function(o){var old=document.getElementById('qrm');if(old)old.remove();var m=document.createElement('div');m.id='qrm';m.className='qrm';
 m.innerHTML='<div class="qb" role="dialog" aria-modal="true" aria-label="QR code"><button class="ib qx" aria-label="Fermer">'+ic('x')+'</button><div class="qimg" data-qr="'+esc(o.url)+'"></div><h3>'+esc(o.title||'WYK STAFF')+'</h3><p>'+esc(o.sub||'Scannez ce code pour ouvrir la page.')+'</p><div class="qa"><button class="btn sm" data-q="copy">'+ic('link')+'Copier le lien</button><button class="btn sm" data-q="share">'+ic('share')+'Partager</button>'+(o.extra||'')+'</div></div>';
 document.body.appendChild(m);S.hydrateQR(m);requestAnimationFrame(function(){m.classList.add('open')});
 var close=function(){m.classList.remove('open');document.removeEventListener('keydown',esk);setTimeout(function(){m.remove()},320)};
 var esk=function(e){if(e.key==='Escape')close()};document.addEventListener('keydown',esk);
 m.onclick=function(e){if(e.target===m||e.target.closest('.qx'))return close();var b=e.target.closest('[data-q]');if(!b)return;if(b.dataset.q==='copy')S.copy(o.url,'Lien copié');else S.share(o.url,o.title)}};

/* ---------- vue d'un profil (même forme que staff_public_profile) ---------- */
S.view=function(row,posTitle,fields,posDesc,posIcon){var v={full_name:row.full_name,position:posTitle,position_desc:posDesc||null,position_icon:posIcon||null,badge_code:row.employee_code,status:row.status,verified:row.verified===true,updated_at:row.updated_at,fields:fields};
 var map={photo:['photo_url'],employee_id:['employee_code'],since:['activated_at'],quote:['quote'],about:['about'],location:['location'],email:['email'],phone:['phone'],languages:['languages'],skills:['skills'],experiences:['experiences'],education:['education'],links:['links'],cv:['cv_url'],birthdate:['birth_date'],birthplace:['birth_place'],nationality:['nationality']};
 Object.keys(map).forEach(function(k){if(fields.indexOf(k)>-1)map[k].forEach(function(c){v[c]=row[c]})});
 if(fields.indexOf('age')>-1){var a=S.age(row.birth_date);if(a!=null)v.age=a}return v};

/* Badge « Employé vérifié par WYK » : affiché UNIQUEMENT si l'administration a validé le profil (colonne verified, admin seulement) */
S.verifiedBadge=function(p,cls){return p&&p.verified===true?'<span class="vf-badge'+(cls?' '+cls:'')+'" title="Profil validé par l\'administration WYK">'+S.ic('checkc')+'Employé vérifié par WYK</span>':''};

function nameParts(full){var parts=String(full||'').trim().split(/\s+/),last=parts.length>1?parts.pop():'',first=parts.join(' ');return{first:first,last:last}}

/* ================= PROFIL / CV ================= */
S.renderProfile=function(p,o){o=o||{};var f=p.fields||[];
 var has=function(k){var x=p[k];return x!=null&&x!==''&&!(Array.isArray(x)&&!x.length)};
 var np=nameParts(p.full_name),first=np.first,last=np.last;
 var h=function(k){return esc(p[k])};
 var tag=has('employee_code')?esc((String(p.employee_code).split('-')[1]||'')):'';
 var pu=has('photo_url')?S.safeUrl(p.photo_url):'';
 var photo=pu?'<img src="'+esc(pu)+'" alt="'+esc(p.full_name)+'">':ic('user');
 var svc=S.SVC[p.status]||[S.STATUS[p.status]||p.status,''];
 var age=p.birth_date?S.age(p.birth_date):(p.age!=null?p.age:null);
 var telH=has('phone')?String(p.phone).replace(/[^\d+]/g,''):'';
 var hasContact=has('email')||has('phone')||has('location');
 var xl=S.XLOGS.url&&S.safeUrl(S.XLOGS.url)?'<a class="tech" href="'+esc(S.safeUrl(S.XLOGS.url))+'" target="_blank" rel="noopener">'+ic('check')+esc(S.XLOGS.label)+'</a>':'';
 /* --- colonne gauche --- */
 var idc='<section class="cv-id"><div class="cv-photo">'+photo+(tag?'<span class="tag">'+tag+'</span>':'')+'</div><div class="cv-who">'+S.verifiedBadge(p)+(p.verified?'<div class="vsub">Identité et profil validés par l\'administration</div>':'')+'<h1>'+esc(first)+(last?' <em>'+esc(last)+'</em>':'')+'</h1><div class="cv-role">'+esc(p.position||'')+'</div>'+(has('location')?'<div class="cv-loc">'+ic('pin')+h('location')+'</div>':'')+'<div class="cv-st"><span class="svc'+(p.status==='active'?'':' off')+'">'+esc(svc[0])+'</span><small'+(p.status==='active'?'':' style="color:var(--mut)"')+'>'+esc(svc[1])+'</small></div>'+(has('updated_at')?'<div class="cv-upd">'+ic('clock')+'Mis à jour le '+esc(S.dateShort(p.updated_at))+'</div>':'')+'</div></section>';
 var sec='<section class="cv-sec"><h4><span class="red">'+ic('shield')+'</span>Sécurité du site<span class="tch-t">Badges techniques</span></h4><div class="tch"><a class="tech" href="https://sslcanary.com/en/tools/ssl-checker?host=staff.wykht.com" target="_blank" rel="noopener">'+ic('check')+'SSLCanary</a>'+xl+'</div><p class="n">Ces badges concernent la sécurité du site et non l\'identité de l\'employé.</p></section>';
 var showQr=f.indexOf('qr')>-1&&o.code;
 var qr=showQr?'<button type="button" class="cv-qr" data-act="qr" aria-label="Agrandir le QR code"><span class="zoom">'+ic('zoom')+'</span><div class="q" data-qr="'+esc(S.pubUrl(o.code))+'"></div><span>Scanner pour consulter le profil public</span></button>':'';
 var cvOk=has('cv_url')&&S.safeUrl(p.cv_url);
 var acts=o.noActs?'':'<div class="cv-acts">'+(cvOk?'<a class="btn pri" href="'+esc(S.safeUrl(p.cv_url))+'" target="_blank" rel="noopener" download>'+ic('dl')+'Télécharger le CV PDF</a>':'<button class="btn pri" data-act="pdf">'+ic('dl')+'Télécharger le CV PDF</button>')+'<button class="btn" data-act="print">'+ic('print')+'Imprimer le CV</button>'+((o.code&&!o.noShare)?'<div class="sec"><button class="btn sm" data-act="share">'+ic('link')+'Copier le lien</button><a class="btn sm" href="/badge?id='+encodeURIComponent(o.code)+'">'+ic('badge')+'Voir le badge</a></div>':'')+'</div>';
 var side='<aside class="cv-side">'+idc+'<div class="cv-two"'+(qr?'':' style="grid-template-columns:1fr"')+'>'+sec+qr+'</div>'+acts+'</aside>';
 /* --- panneaux --- */
 var ct=function(icn,title){return'<h3><span class="ct">'+ic(icn)+'</span>'+title+'</h3>'};
 var kv='';
 if(age!=null)kv+='<div><small>Âge</small><span><b class="age">'+age+'</b> ans</span></div>';
 if(p.birth_date)kv+='<div><small>Date de naissance</small><span>'+esc(S.date(p.birth_date,'full'))+'</span></div>';
 if(has('birth_place'))kv+='<div><small>Lieu de naissance</small><span>'+h('birth_place')+'</span></div>';
 if(has('nationality'))kv+='<div><small>Nationalité</small><span>'+h('nationality')+'</span></div>';
 if(has('employee_code'))kv+='<div><small>ID employé</small><span>'+h('employee_code')+'</span></div>';
 if(has('activated_at'))kv+='<div><small>Actif depuis</small><span>'+esc(S.date(p.activated_at,'full'))+'</span></div>';
 kv+='<div><small>Poste</small><span>'+esc(p.position||'—')+'</span></div>';
 var coord=hasContact?'<section class="cv-c">'+ct('mail','Coordonnées')+'<div class="cts">'+(has('phone')?'<a class="ct-i" href="'+(telH?'tel:'+esc(telH):'#')+'"><span class="ci">'+ic('phone')+'</span><div><small>Téléphone</small><span>'+h('phone')+'</span></div></a>':'')+(has('email')?(S.validEmail(p.email)?'<a class="ct-i" href="mailto:'+esc(p.email)+'">':'<div class="ct-i">')+'<span class="ci">'+ic('mail')+'</span><div><small>Email</small><span>'+h('email')+'</span></div>'+(S.validEmail(p.email)?'</a>':'</div>'):'')+(has('location')?'<div class="ct-i"><span class="ci">'+ic('pin')+'</span><div><small>Localisation</small><span>'+h('location')+'</span></div></div>':'')+'</div></section>':'';
 var links=has('links')&&p.links.filter(function(l){return S.safeUrl(l.url)}).length?'<section class="cv-c">'+ct('link','Liens professionnels')+'<div class="chips">'+p.links.filter(function(l){return S.safeUrl(l.url)}).map(function(l){return'<a class="chip" href="'+esc(S.safeUrl(l.url))+'" target="_blank" rel="noopener noreferrer">'+esc(l.label||l.url)+'</a>'}).join('')+'</div></section>':'';
 var pAbout='<section class="cv-c">'+ct('user','À propos de moi')+(has('about')?'<p class="ab">'+h('about')+'</p>':'<p class="mut">Aucune présentation publique pour ce profil.</p>')+(has('quote')?'<div class="cv-quote">« '+h('quote')+' »</div>':'')+'</section><section class="cv-c">'+ct('badge','Informations')+'<div class="kvg">'+kv+'</div></section>'+coord;
 var pExp=(has('experiences')?'<section class="cv-c">'+ct('brief','Expérience professionnelle')+'<div class="tl">'+p.experiences.map(function(e){return'<div class="t"><b>'+esc(e.role)+(e.company?' · '+esc(e.company):'')+'</b><span class="d">'+esc([e.from,e.to].filter(Boolean).join(' – '))+'</span>'+(e.desc?'<p>'+esc(e.desc)+'</p>':'')+'</div>'}).join('')+'</div></section>':'')+(has('education')?'<section class="cv-c">'+ct('cap','Formation')+'<div class="tl">'+p.education.map(function(e){return'<div class="t"><b>'+esc(e.title)+'</b>'+(e.school?'<span class="d" style="display:block">'+esc(e.school)+'</span>':'')+'<span class="d">'+esc([e.from,e.to].filter(Boolean).join(' – '))+'</span></div>'}).join('')+'</div></section>':'');
 var pSk=(has('skills')?'<section class="cv-c">'+ct('gear','Compétences')+p.skills.map(function(s){var l=Math.max(0,Math.min(100,+s.level||0));return'<div class="bar"><div><span>'+esc(s.name)+'</span><span class="mut">'+l+'%</span></div><i><b style="width:'+l+'%"></b></i></div>'}).join('')+'</section>':'')+(has('languages')?'<section class="cv-c">'+ct('globe','Langues')+'<div class="chips">'+p.languages.map(function(l){return'<span class="chip">'+esc(l)+'</span>'}).join('')+'</div></section>':'');
 var pCt=(hasContact?coord:'')+links;
 var T=[['about','user','À propos',pAbout],['exp','brief','Expérience',pExp],['skills','gear','Compétences',pSk],['contact','mail','Contact',pCt]].filter(function(t){return t[3]});
 var tabs='<div class="cv-tabs" role="tablist">'+T.map(function(t,i){return'<button type="button" role="tab" data-tab="'+t[0]+'" class="'+(i?'':'on')+'">'+ic(t[1])+t[2]+'</button>'}).join('')+'</div>';
 var panes=T.map(function(t,i){return'<div class="cv-pane'+(i?'':' on')+'" data-pane="'+t[0]+'" role="tabpanel">'+t[3]+'</div>'}).join('');
 var foot='<div class="cv-foot"><img src="'+LOGO_WB+'" alt="WYK STAFF"><i></i><span>Des talents au service de vos projets.</span></div>';
 var main='<div class="cv-main">'+tabs+panes+foot+'</div>';
 /* --- version imprimable (PDF) : mise en page A4 professionnelle --- */
 var sk=function(t,b){return b?'<section><h2>'+t+'</h2>'+b+'</section>':''};
 var pci='';if(has('email'))pci+='<div><small>Email</small><span>'+h('email')+'</span></div>';if(has('phone'))pci+='<div><small>Téléphone</small><span>'+h('phone')+'</span></div>';if(has('location'))pci+='<div><small>Localisation</small><span>'+h('location')+'</span></div>';
 var pin='';if(age!=null)pin+='<div><small>Âge</small><span>'+age+' ans</span></div>';if(p.birth_date)pin+='<div><small>Né(e) le</small><span>'+esc(S.date(p.birth_date,'full'))+'</span></div>';if(has('birth_place'))pin+='<div><small>Lieu de naissance</small><span>'+h('birth_place')+'</span></div>';if(has('nationality'))pin+='<div><small>Nationalité</small><span>'+h('nationality')+'</span></div>';if(has('employee_code'))pin+='<div><small>ID employé</small><span>'+h('employee_code')+'</span></div>';if(has('activated_at'))pin+='<div><small>Actif depuis</small><span>'+esc(S.date(p.activated_at,'full'))+'</span></div>';
 var L=function(t,c){return Math.max(1,Math.ceil(String(t||'').length/c))},er=0,el=0;
 if(has('about'))er+=12+L(p.about,78)*4.8;
 if(has('experiences')){er+=12;p.experiences.forEach(function(e){er+=12.6+(e.desc?L(e.desc,78)*4.8:0)})}
 if(has('education'))er+=12+p.education.length*13;
 if(has('quote'))er+=12+L(p.quote,70)*4.8;
 var nc=(has('email')?1:0)+(has('phone')?1:0)+(has('location')?1:0);if(nc)el+=10+nc*8.5;
 var ni=(age!=null?1:0)+(p.birth_date?1:0)+(has('birth_place')?1:0)+(has('nationality')?1:0)+(has('employee_code')?1:0)+(has('activated_at')?1:0);if(ni)el+=10+ni*8.5;
 if(has('languages'))el+=10+Math.ceil(p.languages.length/3)*6.5;
 if(has('skills'))el+=10+p.skills.length*7.2;
 var cz=Math.max(.6,Math.min(1,204/(Math.max(er,el)||1)));
 var cvp='<div class="cvp"><div class="cvp-h"><div class="cvp-ph">'+(pu?'<img src="'+esc(pu)+'" alt="">':'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>')+'</div><div class="cvp-t"><h1>'+esc(first)+(last?' <em>'+esc(last)+'</em>':'')+'</h1><div class="r">'+esc(p.position||'')+'</div>'+'</div><img class="cvp-lg" src="'+LOGO_WB+'" alt="WYK"></div>'+
  '<div class="cvp-b" style="--z:'+cz.toFixed(3)+'"><div class="cvp-l">'+sk('Contact',pci?'<div class="ci">'+pci+'</div>':'')+sk('Informations',pin?'<div class="ci">'+pin+'</div>':'')+sk('Langues',has('languages')?'<div class="ch">'+p.languages.map(function(l){return'<span>'+esc(l)+'</span>'}).join('')+'</div>':'')+sk('Compétences',has('skills')?p.skills.map(function(s){var l=Math.max(0,Math.min(100,+s.level||0));return'<div class="sk"><div><span>'+esc(s.name)+'</span><span>'+l+'%</span></div><i><b style="width:'+l+'%"></b></i></div>'}).join(''):'')+'</div>'+
  '<div class="cvp-r">'+sk('Profil',has('about')?'<p class="ab">'+h('about')+'</p>':'')+sk('Expérience professionnelle',has('experiences')?p.experiences.map(function(e){return'<div class="tt"><b>'+esc(e.role)+(e.company?' · '+esc(e.company):'')+'</b><span class="d">'+esc([e.from,e.to].filter(Boolean).join(' – '))+'</span>'+(e.desc?'<p>'+esc(e.desc)+'</p>':'')+'</div>'}).join(''):'')+sk('Formation',has('education')?p.education.map(function(e){return'<div class="tt"><b>'+esc(e.title)+'</b><span class="d">'+esc([e.school,[e.from,e.to].filter(Boolean).join(' – ')].filter(Boolean).join(' · '))+'</span></div>'}).join(''):'')+(has('quote')?'<section><h2>Devise</h2><p class="ab"><i>« '+h('quote')+' »</i></p></section>':'')+'</div></div>'+
  '<div class="cvp-f">'+(showQr?'<div class="q" data-qr="'+esc(S.pubUrl(o.code))+'"></div>':'')+'<div><b>'+(showQr?'Profil en ligne':'WYK STAFF')+'</b>'+(showQr?esc(S.pubUrl(o.code).replace(/^https?:\/\//,'')):'Portail des profils professionnels')+'</div><div class="rt"><b>WYK STAFF</b>Document généré le '+esc(S.dateShort(new Date()))+'</div></div></div>';
 return'<div class="cv" data-cv>'+side+main+'</div>'+cvp+'<p class="pf-foot">Ce profil est un espace public. Les informations sont mises à jour par l\'équipe WYK.</p>'};

S.printCV=function(name){S.toast('Dans la fenêtre qui s\'ouvre, choisissez « Enregistrer au format PDF ».');var t=document.title;document.title='CV — '+(name||'WYK');document.body.classList.remove('print-badge');var back=function(){document.title=t;removeEventListener('afterprint',back)};addEventListener('afterprint',back);window.print();setTimeout(function(){document.title=t},1500)};
S.bindProfile=function(root,code,name){
 root.querySelectorAll('[data-act=print],[data-act=pdf]').forEach(function(b){b.onclick=function(){S.printCV(name)}});
 root.querySelectorAll('[data-act=share]').forEach(function(b){b.onclick=function(){S.copy(S.pubUrl(code),'Lien du profil copié')}});
 root.querySelectorAll('[data-act=qr]').forEach(function(b){b.onclick=function(){S.qrModal({url:S.pubUrl(code),title:name||'Profil WYK',sub:'Scannez ce code pour consulter le profil public.',extra:'<a class="btn sm" href="/badge?id='+encodeURIComponent(code)+'">'+ic('badge')+'Voir le badge</a>'})}});
 var tabs=root.querySelector('.cv-tabs');if(tabs)tabs.onclick=function(e){var t=e.target.closest('[data-tab]');if(!t)return;tabs.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===t)});root.querySelectorAll('.cv-pane').forEach(function(p){p.classList.toggle('on',p.dataset.pane===t.dataset.tab)})};
 S.hydrateQR(root)};

/* ---------- icônes de poste (badge) : chemins SVG sur une grille 48×40 ---------- */
var _c=function(x,y,r){return'M'+(x-r)+' '+y+'a'+r+' '+r+' 0 1 0 '+(2*r)+' 0a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0z'};
var _r=function(x,y,w,h,r){return'M'+(x+r)+' '+y+'h'+(w-2*r)+'a'+r+' '+r+' 0 0 1 '+r+' '+r+'v'+(h-2*r)+'a'+r+' '+r+' 0 0 1 '+(-r)+' '+r+'h'+(-(w-2*r))+'a'+r+' '+r+' 0 0 1 '+(-r)+' '+(-r)+'v'+(-(h-2*r))+'a'+r+' '+r+' 0 0 1 '+r+' '+(-r)+'z'};
var PI=S.POS_ICONS={
 ceo:['PDG / CEO',_r(5,3,38,34,5)+_c(24,15,5)+'M13 33c0-6 5-10 11-10s11 4 11 10M24 23l-2 4 2 4 2-4z'],
 cto:['Technique / CTO',_r(14,10,20,20,3)+_r(20,16,8,8,1)+'M19 10V5M24 10V5M29 10V5M19 30v5M24 30v5M29 30v5M14 15H9M14 20H9M14 25H9M34 15h5M34 20h5M34 25h5'],
 dev:['Développeur',_r(2,2,44,27,3)+'M19 11l-5 5 5 5M29 11l5 5-5 5M15 37h18M24 29v8'],
 livreur:['Livreur',_r(3,8,15,13,2)+_c(10,31,4.5)+_c(38,31,4.5)+'M10 31h6l4-9h9l5 9M32 22l-2-9h-5M29 13h6'],
 car:['Chauffeur',"M6 28v-8l4-9h28l4 9v8zM6 20h36"+_c(14,30,4)+_c(34,30,4)],
 marketing:['Marketing','M6 16v8h6l16 8V8L12 16zM12 24l3 10h5l-2-8M34 14c3 2 3 10 0 12M38 10c5 4 5 16 0 20'],
 finance:['Finance','M4 36h40M6 18l10-8 8 5 14-11M32 4h6v6M10 36V26M20 36V20M30 36V24M40 36V18'],
 ops:['Opérations',_c(24,20,11)+_c(24,20,5)+'M24 3v6M24 31v6M7 20h6M35 20h6M12 8l4 4M32 28l4 4M12 32l4-4M32 12l4-4'],
 support:['Support client','M8 24v-4a16 16 0 0 1 32 0v4'+_r(5,22,7,11,3)+_r(36,22,7,11,3)+'M40 33c0 4-5 5-12 5'],
 design:['Design','M24 3l11 15-11 19L13 18z'+_c(24,17,2.5)+'M24 20v17'],
 sales:['Commercial',_c(22,21,14)+_c(22,21,8)+_c(22,21,2)+'M23 20l14-14M31 6h6v6'],
 rh:['Ressources humaines',_c(24,13,5)+_c(10,17,4)+_c(38,17,4)+'M14 34c0-6 4-10 10-10s10 4 10 10M3 32c0-5 3-8 7-8M45 32c0-5-3-8-7-8'],
 logistics:['Logistique','M24 4l17 8v16l-17 8-17-8V12zM7 12l17 8 17-8M24 20v16M15.5 8l17 8'],
 security:['Sécurité','M24 3l16 6v10c0 10-7 16-16 18C15 35 8 29 8 19V9zM17 20l5 5 9-10'],
 data:['Données','M10 9c0 3 6 5 14 5s14-2 14-5-6-5-14-5-14 2-14 5zM10 9v22c0 3 6 5 14 5s14-2 14-5V9M10 20c0 3 6 5 14 5s14-2 14-5'],
 comm:['Communication','M6 5h36a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H22l-9 8v-8H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM13 13h22M13 20h14'],
 social:['Réseaux sociaux','M24 35S6 24 6 13a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 11-18 22-18 22z'],
 quality:['Qualité',_c(24,16,11)+'M18 26l-4 11 10-5 10 5-4-11M19 16l4 4 7-8'],
 legal:['Juridique','M24 4v32M12 36h24M8 11h32M8 11l-5 13a5 5 0 0 0 10 0zM40 11l-5 13a5 5 0 0 0 10 0z'],
 formation:['Formation','M2 15l22-10 22 10-22 10zM12 20v10c0 3 6 6 12 6s12-3 12-6V20M46 15v12'],
 admin:['Administration',_r(10,6,28,31,3)+'M18 6V4h12v2M16 16h16M16 23h16M16 30h10'],
 manager:['Direction / Manager','M5 30l-2-18 12 9 9-14 9 14 12-9-2 18zM7 35h34'],
 shop:['Vente / Caisse','M8 12h32l-2 24H10zM16 12V9a8 8 0 0 1 16 0v3'],
 star:['Général','M24 3l6 12 13 2-9.5 9 2.3 13L24 33l-11.8 6 2.3-13L5 17l13-2z']
};
var AUTO=[['ceo',/\b(ceo|pdg|directeur general|directrice generale|fondateur|fondatrice|president|presidente)\b/],['cto',/\b(cto|dsi|architecte)\b|directeur technique|directrice technique|technique/],['dev',/(develop|\bdev\b|programm|ingenieur|software|\bweb|codeur|informatique|\bit\b|application)/],['livreur',/(livr|coursier|delivery|moto|expedi|courrier)/],['car',/(chauffeur|driver|conduct|transport)/],['marketing',/(market|publicit|brand|promotion)/],['finance',/(\bcfo\b|financ|compta|tresor|caisse|paie)/],['ops',/(\bcoo\b|operation|exploitation|production)/],['support',/(support|service client|relation client|assistan|hotline|accueil)/],['design',/(design|graphi|\bui\b|\bux\b|creatif|createur|photograph|video|montage)/],['sales',/(commerc|vente|vendeur|sales|business|prospect)/],['rh',/(\brh\b|ressources humaines|recrut|personnel|talent)/],['logistics',/(logisti|stock|entrepot|magasin|inventaire|preparat)/],['security',/(securit|gardien|agent de|surveill)/],['data',/(\bdata|donnee|analys|statisti)/],['comm',/(communic|presse|relations publiques|redact|contenu)/],['social',/(community|social|reseau|influen)/],['quality',/(qualit|controle|audit)/],['legal',/(jurid|legal|droit|avocat|conformite)/],['formation',/(formateur|formatrice|formation|training|enseign)/],['admin',/(admin|secretar|bureau|office|gestion)/],['manager',/(manager|directeur|directrice|responsable|chef|\blead\b|coordinat|superviseur)/]];
/* icône d'un poste : choix de l'admin, sinon détectée automatiquement d'après l'intitulé */
S.posIcon=function(title,explicit){if(explicit&&PI[explicit])return explicit;var t=String(title||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');for(var i=0;i<AUTO.length;i++)if(AUTO[i][1].test(t))return AUTO[i][0];return'star'};
S.posIconSvg=function(key,cls){var d=(PI[key]||PI.star)[1];return'<svg class="pic'+(cls?' '+cls:'')+'" viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"/></svg>'};
/* sélecteur d'icône (administration) : grille de boutons + champ caché */
S.iconPicker=function(val,cls){return'<div class="ipick '+(cls||'')+'" data-ipick><input type="hidden" data-f="icon" value="'+esc(val||'')+'"><button type="button" class="ipk'+(val?'':' on')+'" data-k="" title="Automatique (selon l\'intitulé)"><span>Auto</span></button>'+Object.keys(PI).map(function(k){return'<button type="button" class="ipk'+(val===k?' on':'')+'" data-k="'+k+'" title="'+esc(PI[k][0])+'">'+S.posIconSvg(k)+'</button>'}).join('')+'</div>'};
S.bindIconPickers=function(root){root.addEventListener('click',function(e){var b=e.target.closest('.ipk');if(!b)return;var h=b.closest('[data-ipick]');h.querySelector('[data-f=icon]').value=b.dataset.k;h.querySelectorAll('.ipk').forEach(function(x){x.classList.toggle('on',x===b)})})};

/* ================= BADGE (reproduction fidèle de la maquette « carte CEO ») : repère de conception 1536×865 ================= */
var BADGE_ART='<svg class="bdg-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 865" width="1536" height="865" aria-hidden="true"><defs><linearGradient id="bgs" x1="600" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fafafa"/></linearGradient></defs><rect width="1536" height="865" fill="url(#bgs)"/><rect y="735" width="1536" height="130" fill="#000"/><path d="M89.2 762.5 78.8 766.5 73.5 770.0 68.2 776.0 64.5 782.0 62.2 788.5 61.5 793.5 61.8 802.2 63.8 809.2 66.8 815.2 72.2 822.0 76.2 825.2 86.0 830.2 98.0 831.2 103.2 830.8 112.2 827.5 116.2 825.0 123.2 818.2 127.0 813.0 129.2 806.2 130.8 798.0 130.0 789.8 127.2 781.0 122.8 774.5 119.0 770.8 113.0 766.5 102.5 762.5ZM77.2 817.8 81.2 815.8 83.5 816.2 85.5 819.0 86.5 822.8 85.2 823.8 82.8 823.2 78.8 820.5ZM114.2 817.8 112.2 821.5 108.0 823.5 106.0 822.8 106.0 820.2 109.0 816.0 111.5 815.8ZM90.5 813.5 100.0 813.0 102.5 814.2 102.0 818.2 99.2 823.0 97.0 825.2 94.8 825.0 90.5 819.2 89.5 816.2 89.5 814.5ZM85.5 800.5 87.5 799.0 105.2 799.0 107.0 800.8 106.5 805.8 105.5 807.8 104.0 808.5 100.8 807.8 88.2 808.2 86.0 806.0ZM113.5 799.2 117.0 798.5 124.0 799.2 125.2 800.5 125.2 802.8 122.5 809.5 119.5 812.5 115.5 812.5 111.2 809.5 112.0 800.8ZM78.5 799.2 80.5 801.5 81.0 809.0 78.0 811.2 72.8 813.2 70.2 811.2 67.2 803.8 67.2 800.8 69.0 799.2 74.2 798.5ZM85.8 789.8 86.8 785.8 88.5 784.2 104.0 784.0 106.2 786.8 107.2 791.8 105.0 794.0 88.0 794.0 86.0 792.8ZM112.5 781.2 115.5 779.8 118.2 779.5 121.5 781.8 124.5 789.5 124.5 792.2 123.2 793.8 116.2 794.2 112.2 792.8 110.8 783.2ZM80.8 782.2 81.5 783.2 80.5 791.2 78.8 793.2 76.8 794.0 69.5 794.0 67.8 792.8 67.5 789.8 68.5 786.0 72.0 780.2 74.5 779.5ZM86.2 770.8 86.2 772.8 83.8 776.5 80.8 776.8 78.2 775.0 80.8 771.2 84.0 770.0 85.5 770.0ZM105.5 770.8 106.5 769.8 109.2 770.2 112.5 772.2 113.5 774.8 111.8 776.2 108.5 776.5 105.8 773.2ZM94.5 769.2 95.8 768.8 97.8 769.2 101.5 774.5 102.2 778.0 100.8 779.5 91.8 779.5 90.2 778.5 90.2 776.0 92.5 771.5Z" fill="#e60e11" fill-rule="evenodd"/><rect x="387" y="102" width="4" height="138" fill="#f30707"/><rect x="62" y="597" width="81" height="5" fill="#f30707"/><rect x="374" y="764" width="2" height="56" fill="#fff" opacity=".9"/></svg>',CORNER='/badge-corner.jpg';
S.badgeCard=function(p,o){o=o||{};var np=nameParts(p.full_name),first=np.first||p.full_name||'',last=np.last;
 var pu=p.photo_url?S.safeUrl(p.photo_url):'';
 var photo=pu?'<img src="'+esc(pu)+'" alt="'+esc(p.full_name)+'">':'<svg class="sil" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="120" fill="#e9eaee"/><circle cx="50" cy="44" r="19" fill="#0b0b0c"/><path d="M10 120c0-27 17-40 40-40s40 13 40 40z" fill="#0b0b0c"/></svg>';
 var ik=S.posIcon(p.position,p.position_icon);
 var desc='<div class="bdg-desc"><span class="ci">'+S.posIconSvg(ik)+'</span>'+(p.position_desc?'<i></i><p>'+esc(p.position_desc)+'</p>':'')+'</div>';
 var code=p.badge_code||p.employee_code;
 var id=code?'<div class="bdg-id"><small>ID</small><b>'+esc(code)+'</b></div>':'';
 var qr=o.code&&!o.noQr?'<div class="bdg-qr" data-qr="'+esc(S.badgeUrl(o.code))+'" role="button" tabindex="0" aria-label="Agrandir le QR code"></div>':'';
 setTimeout(function(){S.fitBadge();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){S.fitBadge()})},0);
 return'<div class="bdg-wrap"><div class="bdg" data-bdg><div class="bdg-in">'+BADGE_ART+
 '<img class="bdg-corner" src="'+CORNER+'" alt="">'+
  '<img class="bdg-logo" src="'+LOGO_WB+'" alt="WYK">'+
  '<div class="bdg-tag">Faites vos<br>achats<br>autrement</div>'+
  '<div class="bdg-main"><div class="bdg-name"><span>'+esc(first)+'</span>'+(last?'<em>'+esc(last)+'</em>':'')+'</div><div class="bdg-pos">'+esc(p.position||'Équipe WYK')+'</div><div class="bdg-lr"><div class="bdg-line"></div>'+id+'</div>'+desc+'</div>'+
  '<div class="bdg-photo">'+photo+'</div>'+qr+
  '<div class="bdg-foot"><b>wykht.com</b><span>Connecter les gens,<br>soutenir l\'économie locale.</span></div>'+
  '</div><div class="bdg-glare"></div></div></div>'};
/* taille du nom : ajustée pour que la ligne la plus longue remplisse la largeur de la maquette (592 sur 1536) */
S.fitBadge=function(root){(root||document).querySelectorAll('[data-bdg]').forEach(function(b){var nm=b.querySelector('.bdg-name'),inn=b.querySelector('.bdg-in');if(!nm||!inn)return;var u=inn.offsetWidth/1536;if(!u)return;nm.style.setProperty('--nz','100');var w=0;nm.querySelectorAll('span,em').forEach(function(e){w=Math.max(w,e.offsetWidth)});if(!w)return;nm.style.setProperty('--nz',Math.max(40,Math.min(112,100*592*u/w)).toFixed(2))})};
S.bindBadge=function(root,o){o=o||{};var b=root.querySelector('[data-bdg]');if(!b)return;
 b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;b.style.setProperty('--ry',((x-.5)*9).toFixed(2)+'deg');b.style.setProperty('--rx',((.5-y)*7).toFixed(2)+'deg');b.style.setProperty('--gx',(x*100).toFixed(0)+'%');b.style.setProperty('--gy',(y*100).toFixed(0)+'%')});
 b.addEventListener('pointerleave',function(){b.style.setProperty('--rx','0deg');b.style.setProperty('--ry','0deg')});
 var q=b.querySelector('.bdg-qr');if(q){var open=function(){S.qrModal({url:S.badgeUrl(o.code),title:o.name||'Badge WYK',sub:'Scannez ce code pour ouvrir le badge en ligne.',extra:'<a class="btn sm" href="/profil?id='+encodeURIComponent(o.code)+'">'+ic('user')+'Voir le profil</a>'})};q.onclick=open;q.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}}
 S.hydrateQR(b);S.fitBadge(b)};

/* ---------- export du badge : image PNG et PDF (dessiné à 1920×1081, mêmes mesures que l'affichage, sans aucune mention « vérifié ») ---------- */
S.loadImg=function(u){var one=function(src){return new Promise(function(ok){var i=new Image();i.crossOrigin='anonymous';i.onload=function(){ok(i)};i.onerror=function(){ok(null)};i.src=src})};
 if(!u)return Promise.resolve(null);var bust=u+(u.indexOf('?')>-1?'&':'?')+'wykcors=1';return one(bust).then(function(i){return i||one(u)})};
S.badgeCanvas=async function(p,o){o=o||{};var W=1920,H=1081,K=W/1536,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
 try{await Promise.all([800,700,600,500,400].map(function(w){return document.fonts.load(w+' 40px Montserrat')}))}catch(e){}
 var pu=p.photo_url?S.safeUrl(p.photo_url):'';
 var art=await new Promise(function(ok){var i=new Image();i.onload=function(){ok(i)};i.onerror=function(){ok(null)};i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(BADGE_ART)});
 var im=await Promise.all([S.loadImg(pu),o.code?S.loadQR():0,S.loadImg(LOGO_WB),S.loadImg(CORNER)]),ph=im[0],logo=im[2],corner=im[3];
 var FM='Montserrat,Inter,system-ui,sans-serif',RED='#f30707';
 var np=nameParts(p.full_name),first=np.first||p.full_name||'',last=np.last;
 var rr=function(a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
 var fnt=function(w,sz){x.font=w+' '+sz+'px '+FM};
 var mw=function(t,ls){return x.measureText(t).width+ls*Math.max(0,t.length)};
 var T=function(t,a,b,ls){x.textBaseline='alphabetic';x.textAlign='left';if(!ls){x.fillText(t,a,b);return}var c=a;for(var i=0;i<t.length;i++){x.fillText(t[i],c,b);c+=x.measureText(t[i]).width+ls}};
 var wrap=function(t,maxW,ls){var ws=String(t).split(/\s+/),ln=[],cur='';ws.forEach(function(w){var tr=cur?cur+' '+w:w;if(mw(tr,ls)>maxW&&cur){ln.push(cur);cur=w}else cur=tr});if(cur)ln.push(cur);return ln};
 x.scale(K,K);x.save();rr(0,0,1536,865,30);x.clip();x.fillStyle='#fff';x.fillRect(0,0,1536,865);
 if(art)x.drawImage(art,0,0,1536,865);
 if(corner){var cc=document.createElement('canvas');cc.width=666;cc.height=865;var c2=cc.getContext('2d');c2.drawImage(corner,0,0,666,865);c2.globalCompositeOperation='destination-in';var gr=c2.createLinearGradient(0,0,60,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'#000');c2.fillStyle=gr;c2.fillRect(0,0,666,865);x.drawImage(cc,870,0)}
 if(logo)x.drawImage(logo,62,63,220*logo.naturalWidth/logo.naturalHeight,220);
 /* accroche */
 fnt(500,44);x.fillStyle='#111';['Faites vos','achats','autrement'].forEach(function(t,i){T(t,421,101+48*i+39.8,0)});
 /* nom : taille ajustée comme à l'écran */
 var nls=-.02;fnt(800,100);var w100=Math.max(mw(first,nls*100),last?mw(last,nls*100):0),nz=Math.max(40,Math.min(112,100*592/(w100||1)));
 var y=305;fnt(800,nz);x.fillStyle='#000';T(first,62,y+.808*nz,nls*nz);y+=nz*.9;
 if(last){x.fillStyle=RED;T(last,62,y+.808*nz,nls*nz);y+=nz*.9}
 /* poste */
 y+=5;var pls=.13*34;fnt(600,34);x.fillStyle='#000';var pl=wrap(String(p.position||'Équipe WYK').toUpperCase(),610,pls).slice(0,2);pl.forEach(function(t,i){T(t,62,y+42*i+33.2,pls)});y+=42*pl.length;
 /* trait rouge + ID */
 var code=p.badge_code||p.employee_code;x.fillStyle=RED;x.fillRect(62,y+19.5,81,5);
 if(code){fnt(700,22);var ls2=.08*22,w1=mw('ID',ls2),w2=mw(code,ls2),bx=143+28,cw=20+w1+12+w2+20;x.strokeStyle=RED;x.lineWidth=2.5;rr(bx,y+2,cw,40,12);x.stroke();x.fillStyle=RED;T('ID',bx+20,y+22+8,ls2);x.fillStyle='#111';T(code,bx+20+w1+12,y+22+8,ls2)}
 y+=44;
 /* icône du poste + description */
 var ik=S.posIcon(p.position,p.position_icon);x.save();x.translate(50.4,y-1.4);x.scale(102.2/48,102.2/48);x.lineWidth=2;x.lineCap='round';x.lineJoin='round';x.strokeStyle=RED;x.stroke(new Path2D((PI[ik]||PI.star)[1]));x.restore();
 if(p.position_desc){x.fillStyle=RED;x.fillRect(170,y+7,4,66);fnt(400,22);x.fillStyle='#111';wrap(p.position_desc,570,0).slice(0,2).forEach(function(t,i){T(t,201,y+5+30*i+22.9,0)})}
 /* photo */
 x.fillStyle='#d10c0c';rr(825,140,452,491,3);x.fill();x.fillStyle='#fff';rr(830,145,442,481,1.5);x.fill();
 x.save();rr(834,149,434,473,1);x.clip();
 if(ph){var sc=Math.max(434/ph.naturalWidth,473/ph.naturalHeight),w=ph.naturalWidth*sc,h=ph.naturalHeight*sc;x.drawImage(ph,834+(434-w)/2,149+(473-h)/2,w,h)}
 else{x.fillStyle='#e9eaee';x.fillRect(834,149,434,473);x.fillStyle='#0b0b0c';x.translate(834,149-14);x.scale(4.34,4.34);x.beginPath();x.arc(50,44,19,0,7);x.fill();x.fill(new Path2D('M10 120c0-27 17-40 40-40s40 13 40 40z'))}
 x.restore();
 /* QR */
 if(o.code&&window.qrcode){var qx=1300,qy=352,qs=210;x.save();x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=26;x.shadowOffsetY=8;x.fillStyle='#fff';rr(qx,qy,qs,qs,15);x.fill();x.restore();x.strokeStyle=RED;x.lineWidth=3;rr(qx+1.5,qy+1.5,qs-3,qs-3,12);x.stroke();
  var q=window.qrcode(0,'M');q.addData(S.badgeUrl(o.code));q.make();var n=q.getModuleCount(),pad=16,m=(qs-2*pad)/n;x.fillStyle='#0b0b0c';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))x.fillRect(qx+pad+c*m,qy+pad+r*m,m+.3,m+.3)}
 /* pied */
 fnt(600,32);x.fillStyle='#fff';T('wykht.com',155,809,-.3);
 fnt(500,20);x.fillStyle='#e4e4e8';['CONNECTER LES GENS,',"SOUTENIR L'ÉCONOMIE LOCALE."].forEach(function(t,i){T(t,435,765.6+25.5*i+19.9,.09*20)});
 x.restore();return cv};
S.save=function(blob,name){var a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(url)},4000)};
S.pdfFromJpeg=function(jpg,w,h){var pw=841.89,ph=+(pw*h/w).toFixed(2),enc=new TextEncoder(),parts=[],len=0,off=[];
 var add=function(d){var b=typeof d==='string'?enc.encode(d):d;parts.push(b);len+=b.length},pad=function(n){return String(n).padStart(10,'0')};
 add('%PDF-1.4\n');
 off[1]=len;add('1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n');
 off[2]=len;add('2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n');
 off[3]=len;add('3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+pw+' '+ph+']/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>\nendobj\n');
 off[4]=len;add('4 0 obj\n<</Type/XObject/Subtype/Image/Width '+w+'/Height '+h+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+jpg.length+'>>\nstream\n');add(jpg);add('\nendstream\nendobj\n');
 var cs='q '+pw+' 0 0 '+ph+' 0 0 cm /Im0 Do Q';off[5]=len;add('5 0 obj\n<</Length '+cs.length+'>>\nstream\n'+cs+'\nendstream\nendobj\n');
 var xr=len,t='xref\n0 6\n0000000000 65535 f \n';for(var i=1;i<=5;i++)t+=pad(off[i])+' 00000 n \n';
 add(t+'trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n'+xr+'\n%%EOF');return new Blob(parts,{type:'application/pdf'})};
S.downloadBadge=async function(p,o,kind){S.toast('Préparation du badge…');
 try{var cv=await S.badgeCanvas(p,o),nm='Badge-WYK-'+String(p.full_name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(kind==='pdf'){var wc=document.createElement('canvas');wc.width=cv.width;wc.height=cv.height;var c2=wc.getContext('2d');c2.fillStyle='#fff';c2.fillRect(0,0,wc.width,wc.height);c2.drawImage(cv,0,0);
   var jb=await new Promise(function(r){wc.toBlob(r,'image/jpeg',.95)}),jpg=new Uint8Array(await jb.arrayBuffer());S.save(S.pdfFromJpeg(jpg,wc.width,wc.height),nm+'.pdf')}
  else{var pb=await new Promise(function(r){cv.toBlob(r,'image/png')});S.save(pb,nm+'.png')}
  S.toast(kind==='pdf'?'Badge PDF téléchargé':'Image du badge téléchargée')}catch(e){S.toast('Téléchargement impossible, réessayez.',1)}};
/* boutons de téléchargement du badge */
S.badgeDlHtml=function(){return'<button class="btn pri" data-dl="png">'+ic('dl')+'Enregistrer l\'image</button><button class="btn" data-dl="pdf">'+ic('doc')+'Télécharger en PDF</button>'};
S.bindBadgeDl=function(root,p,o){root.querySelectorAll('[data-dl]').forEach(function(b){b.onclick=function(){S.downloadBadge(p,o,b.dataset.dl)}})};

/* ---------- complétion du profil ---------- */
S.completeness=function(r){var c=[r.photo_url,r.about,r.phone,r.email,r.location,r.birth_date,(r.languages||[]).length,(r.skills||[]).length,(r.experiences||[]).length,(r.education||[]).length],n=c.filter(Boolean).length;return Math.round(n/c.length*100)};

/* ---------- téléversement ---------- */
S.upload=async function(uid,file,kind){
 var blob=file,ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(kind==='photo'){if(!/^image\//.test(file.type))throw new Error('Choisissez une image.');blob=await new Promise(function(res,rej){var im=new Image();im.onload=function(){var m=900,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(function(b){b?res(b):rej(new Error('Image illisible'))},'image/jpeg',.86)};im.onerror=function(){rej(new Error('Image illisible'))};im.src=URL.createObjectURL(file)});ext='jpg'}
 else{if(file.type!=='application/pdf')throw new Error('Le CV doit être un fichier PDF.');if(file.size>6*1024*1024)throw new Error('Fichier trop lourd (6 Mo max).')}
 var path=uid+'/'+kind+'-'+Date.now()+'.'+ext;
 var r=await db.storage.from('staff-media').upload(path,blob,{contentType:kind==='photo'?'image/jpeg':'application/pdf',upsert:true});
 if(r.error)throw r.error;return db.storage.from('staff-media').getPublicUrl(path).data.publicUrl};

/* ---------- éditeur de profil (employé ET admin) ---------- */
var FIELDS=S.FIELDS=[['photo','Photo'],['employee_id','ID employé'],['since','Date « actif depuis »'],['quote','Citation'],['about','À propos'],['location','Localisation'],['email','Email'],['phone','Téléphone'],['age','Âge (calculé automatiquement)'],['birthdate','Date de naissance exacte'],['birthplace','Lieu de naissance'],['nationality','Nationalité'],['skills','Compétences'],['experiences','Expérience professionnelle'],['education','Formation'],['languages','Langues'],['links','Liens professionnels'],['cv','CV (fichier)'],['qr','QR code & badge']];
var SCHEMA={skills:[['name','Compétence','Développement web'],['level','Niveau','','range']],experiences:[['role','Poste','Chef de projet'],['company','Entreprise','WYK'],['from','Début','Janv. 2025'],['to','Fin','Présent'],['desc','Description','','area']],education:[['title','Diplôme / certification','Licence en informatique'],['school','Établissement',''],['from','Début','2021'],['to','Fin','2024']],links:[['label','Nom du lien','LinkedIn'],['url','Adresse (URL)','https://']]};
var BLANK={skills:{name:'',level:70},experiences:{role:'',company:'',from:'',to:'',desc:''},education:{title:'',school:'',from:'',to:''},links:{label:'',url:''}};

S.editor=function(host,row,ctx){ctx=ctx||{};
 var st=JSON.parse(JSON.stringify(row));['skills','experiences','education','links'].forEach(function(k){if(!Array.isArray(st[k]))st[k]=[]});if(!Array.isArray(st.languages))st.languages=[];
 var fields=ctx.fields||[];var pubBadge=function(k){return ctx.noBadges?'':'<span class="vis '+(fields.indexOf(k)>-1||k==='_'?'pub">Public':'priv">Privé')+'</span>'};
 var inp=function(k,label,type,ph,vk,extra){return'<div class="field"><label>'+label+' '+pubBadge(vk||k)+'</label><input data-k="'+k+'" type="'+(type||'text')+'" value="'+esc(st[k]||'')+'" placeholder="'+esc(ph||'')+'" '+(extra||'')+'></div>'};
 var ageLine=function(){var a=S.age(st.birth_date);return a==null?'Renseignez votre date de naissance : votre âge se calcule tout seul.':'Âge : <b>'+a+' ans</b> <span class="mut">— calculé automatiquement, mis à jour chaque jour</span> '+pubBadge('age')};
 var h='';
 if(ctx.admin){var po=(ctx.positions||[]).map(function(p){return'<option value="'+p.id+'"'+(p.id===st.position_id?' selected':'')+'>'+esc(p.title)+'</option>'}).join(''),co='<option value="">Par défaut</option>'+(ctx.categories||[]).filter(function(c){return!c.is_default}).map(function(c){return'<option value="'+c.id+'"'+(c.id===st.category_id?' selected':'')+'>'+esc(c.name)+'</option>'}).join('');
  h+='<section class="nm card"><h3>'+ic('gear')+'Administration</h3><div class="row"><div class="field"><label>ID employé</label><input value="'+esc(st.employee_code)+'" disabled></div><div class="field"><label>Actif depuis</label><input value="'+esc(S.date(st.activated_at,'full'))+'" disabled></div><div class="field"><label>Poste</label><select data-k="position_id">'+po+'</select></div><div class="field"><label>Catégorie</label><select data-k="category_id">'+co+'</select></div><div class="field"><label>Statut</label><select data-k="status">'+Object.keys(S.STATUS).map(function(s){return'<option value="'+s+'"'+(s===st.status?' selected':'')+'>'+S.STATUS[s]+'</option>'}).join('')+'</select></div></div><div class="field"><label>Motif (visible par l\'admin seulement)</label><input data-k="status_reason" value="'+esc(st.status_reason||'')+'" placeholder="Ex : vérification en cours"></div></section>'}
 h+='<section class="nm card"><h3>'+ic('user')+'Identité</h3><div class="photo-up"><div class="avatar" id="av">'+(st.photo_url?'<img src="'+esc(st.photo_url)+'" alt="">':ic('user'))+'</div><div><div class="lbl" style="margin-bottom:8px">Photo '+pubBadge('photo')+'</div><label class="btn sm" style="cursor:pointer">'+ic('plus')+'Choisir une photo<input id="ph" type="file" accept="image/*" hidden></label><p class="small mut" style="margin-top:8px">Portrait net, fond simple. Recadrée automatiquement.</p></div></div><div style="height:18px"></div><div class="row">'+inp('full_name','Nom complet',0,'Prénom Nom','_')+inp('location','Localisation','text','Carrefour, Haïti')+inp('phone','Téléphone professionnel','tel','+509 …')+inp('email','Email professionnel','email','prenom@wykht.com')+'</div>'+inp('quote','Citation / devise',0,'« La technologie, c\'est… »')+'</section>';
 h+='<section class="nm card"><h3>'+ic('cal')+'Informations personnelles</h3><div class="row">'+inp('birth_date','Date de naissance','date','','birthdate','max="'+S.today()+'" min="1900-01-01"')+inp('birth_place','Lieu de naissance','text','Ville, pays','birthplace')+inp('nationality','Nationalité','text','Haïtienne','nationality')+'</div><div class="ageline" id="ageln">'+ageLine()+'</div><p class="small mut">Seules les informations cochées « Public » par l\'administration apparaissent sur votre page. Vous pouvez par exemple afficher votre âge sans montrer votre date de naissance.</p></section>';
 h+='<section class="nm card"><h3>'+ic('doc')+'À propos '+pubBadge('about')+'</h3><div class="field"><textarea data-k="about" placeholder="Parlez de votre parcours, de vos motivations et de vos objectifs professionnels.">'+esc(st.about||'')+'</textarea></div><div class="field"><label>Langues (séparées par une virgule) '+pubBadge('languages')+'</label><input data-k="languages" data-list="1" value="'+esc((st.languages||[]).join(', '))+'" placeholder="Français, Créole, Anglais"></div></section>';
 var rep=function(k,title,icn,addLbl){return'<section class="nm card"><h3>'+ic(icn)+title+' '+pubBadge(k)+'</h3><div class="rep" data-rep="'+k+'"></div><div style="margin-top:14px"><button type="button" class="btn sm" data-add="'+k+'">'+ic('plus')+addLbl+'</button></div></section>'};
 h+=rep('experiences','Expérience professionnelle','brief','Ajouter une expérience')+rep('skills','Compétences','gear','Ajouter une compétence')+rep('education','Formation','cap','Ajouter une formation')+rep('links','Liens professionnels','link','Ajouter un lien');
 h+='<section class="nm card"><h3>'+ic('doc')+'CV (PDF) '+pubBadge('cv')+'</h3><p class="small mut" id="cvn" style="margin-bottom:12px">'+(st.cv_url?'Un CV est enregistré.':'Facultatif : sans fichier, un CV professionnel est généré automatiquement depuis votre profil.')+'</p><label class="btn sm" style="cursor:pointer">'+ic('plus')+'Téléverser un CV<input id="cv" type="file" accept="application/pdf" hidden></label>'+(st.cv_url?' <button type="button" class="btn sm dng" id="cvx">Retirer</button>':'')+'</section>';
 h+='<div style="display:flex;gap:12px;flex-wrap:wrap;position:sticky;bottom:14px;z-index:5"><button class="btn pri" id="save">'+ic('check')+'Enregistrer</button></div>';
 host.innerHTML=h;
 function drawRep(k){var box=host.querySelector('[data-rep="'+k+'"]');if(!st[k].length){box.innerHTML='<div class="empty">Rien pour l\'instant.</div>';return}
  box.innerHTML=st[k].map(function(it,i){return'<div class="nm-in it"><button type="button" class="del" data-del="'+k+':'+i+'" aria-label="Supprimer">'+ic('trash')+'</button><div class="row">'+SCHEMA[k].map(function(s){var v=it[s[0]]==null?'':it[s[0]];
   if(s[3]==='range')return'<div class="field"><label>'+s[1]+' <b class="red">'+(+v||0)+'%</b></label><input type="range" min="0" max="100" step="5" value="'+(+v||0)+'" data-r="'+k+':'+i+':'+s[0]+'"></div>';
   if(s[3]==='area')return'<div class="field" style="grid-column:1/-1"><label>'+s[1]+'</label><textarea style="min-height:70px" data-r="'+k+':'+i+':'+s[0]+'">'+esc(v)+'</textarea></div>';
   return'<div class="field"><label>'+s[1]+'</label><input data-r="'+k+':'+i+':'+s[0]+'" value="'+esc(v)+'" placeholder="'+esc(s[2])+'"></div>'}).join('')+'</div></div>'}).join('')}
 ['experiences','skills','education','links'].forEach(drawRep);
 host.oninput=function(e){var t=e.target;if(t.dataset.k){var k=t.dataset.k;st[k]=t.dataset.list?t.value.split(',').map(function(x){return x.trim()}).filter(Boolean):t.value;if(k==='birth_date'){var al=host.querySelector('#ageln');if(al)al.innerHTML=ageLine()}}
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
  if(st.birth_date&&(st.birth_date>S.today()||st.birth_date<'1900-01-01')){S.toast('Date de naissance invalide.',1);return}
  var clean=function(k,f){return st[k].filter(function(x){return String(x[f]||'').trim()})};
  var pl={full_name:st.full_name.trim(),photo_url:st.photo_url||null,quote:st.quote||null,about:st.about||null,email:st.email||null,phone:st.phone||null,location:st.location||null,birth_date:st.birth_date||null,birth_place:st.birth_place||null,nationality:st.nationality||null,languages:st.languages,skills:clean('skills','name'),experiences:clean('experiences','role'),education:clean('education','title'),links:clean('links','url'),cv_url:st.cv_url||null};
  if(ctx.admin){pl.position_id=st.position_id||null;pl.category_id=st.category_id||null;pl.status=st.status;pl.status_reason=st.status_reason||null}
  b.disabled=true;var r=await db.from('staff_profiles').update(pl).eq('user_id',st.user_id).select().single();b.disabled=false;
  if(r.error){S.toast(r.error.message,1);return}S.toast('Profil enregistré');Object.assign(st,r.data);if(ctx.onSaved)ctx.onSaved(r.data)};
 return{state:st}};
})();
