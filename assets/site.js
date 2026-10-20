/* Menu mobile */
(function(){
  var b=document.querySelector('.menu-btn'), n=document.querySelector('nav.main');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'Fermer':'Menu';document.body.style.overflow=o?'hidden':''});}
})();

/* Ouvert / fermé, heure de Paris */
(function(){
  var H={grandvillars:[[450,720],[810,1080]],valdoie:[[480,720],[810,1050]],saulnot:[[450,720],[810,1050]]};
  function now(){
    var f=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
    var p={};f.formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
    var d=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'].indexOf(p.weekday);
    return {day:d,min:(+p.hour%24)*60+(+p.minute)};
  }
  function fmt(m){var h=Math.floor(m/60),mm=m%60;return h+' h'+(mm?' '+String(mm).padStart(2,'0'):'')}
  function st(h){
    var t=now(),wk=t.day>=1&&t.day<=5,i;
    if(wk){for(i=0;i<h.length;i++){if(t.min>=h[i][0]&&t.min<h[i][1])return{o:1,t:'Ouvert, ferme à '+fmt(h[i][1])}}
      for(i=0;i<h.length;i++){if(t.min<h[i][0])return{o:0,t:'Fermé, ouvre à '+fmt(h[i][0])}}}
    return{o:0,t:'Fermé, ouvre '+((t.day>=1&&t.day<=4)?'demain':'lundi')+' à '+fmt(h[0][0])};
  }
  function run(){document.querySelectorAll('[data-status]').forEach(function(e){var s=st(H[e.dataset.status]);e.textContent=s.t;e.className='status '+(s.o?'open':'closed')})}
  run();setInterval(run,60000);
})();

/* Formulaire de devis (démo) */
(function(){
  var form=document.getElementById('devisForm'); if(!form)return;
  var q=new URLSearchParams(location.search), r=q.get('rayon'), d=q.get('depot');
  if(r){form.querySelectorAll('input[name=besoin]').forEach(function(i){if(i.dataset.id===r)i.checked=true})}
  if(d){var o=[].find.call(form.depot.options,function(x){return x.value.toLowerCase()===d});if(o)form.depot.value=o.value}
  if(q.get('service')==='pliage'){form.desc.value='Pliage sur mesure : ';}
  form.addEventListener('submit',function(e){
    e.preventDefault(); var ok=true;
    var nom=form.nom.value.trim(), tel=form.tel.value.replace(/[\s.\-]/g,'');
    document.getElementById('f-nom').classList.toggle('invalid',!nom); if(!nom)ok=false;
    var telOk=/^(\+33|0)\d{9}$/.test(tel)||/^\+41\d{9}$/.test(tel);
    document.getElementById('f-tel').classList.toggle('invalid',!telOk); if(!telOk)ok=false;
    if(!ok){form.querySelector('.invalid input').focus();return}
    var dep=form.depot.value, s=document.getElementById('sent');
    s.innerHTML='<h3>Demande prête à partir.</h3><p>Sur le site final, elle sera transmise au dépôt de '+(dep==='Le plus proche de mon chantier'?'votre secteur':dep)+', qui vous rappellera au '+form.tel.value.replace(/</g,'')+'. Cette maquette n’envoie rien.</p>';
    form.style.display='none'; s.style.display='block'; s.focus();
  });
})();

/* Transitions entre les pages (repli si le navigateur n'a pas de transition native) */
(function(){
  var native=window.CSS&&CSS.supports&&CSS.supports('view-transition-name','a')&&('onpagereveal' in window);
  if(native||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var h=document.documentElement; h.classList.add('pt','pt-in');
  requestAnimationFrame(function(){requestAnimationFrame(function(){h.classList.remove('pt-in')})});
  addEventListener('pageshow',function(e){if(e.persisted)h.classList.remove('pt-out','pt-in')});
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]'); if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin||!/\.html$|\/$/.test(u.pathname)||(u.pathname===location.pathname&&u.hash))return;
    e.preventDefault(); h.classList.add('pt-out'); setTimeout(function(){location.href=a.href},180);
  });
})();
