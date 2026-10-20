
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=document.getElementById('roof'), stage=document.getElementById('stage');
const listEl=document.getElementById('layerList'), detailEl=document.getElementById('detail'), tagsEl=document.getElementById('tags');

listEl.innerHTML=LAYERS.map(l=>`<li>${l.name}</li>`).join('');
const tagEls=LAYERS.map(l=>{const d=document.createElement('div');d.className='tag';d.textContent=l.name;tagsEl.appendChild(d);return d});

let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false}); }
catch(e){ fallback(); throw e; }
function fallback(){
  stage.style.display='none'; const n=document.getElementById('no3d'); n.style.display='block';
  n.innerHTML=LAYERS.map(l=>`<h3 style="margin:28px 0 8px">${l.name}</h3><p style="color:#c7cfd3">${l.txt}</p><p style="color:#8d989e;font-size:14px">${l.brands}</p>`).join('');
}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#23282C');
const pm=new THREE.PMREMGenerator(renderer);
scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;

const camera=new THREE.PerspectiveCamera(30,1,0.1,200);

scene.add(new THREE.HemisphereLight('#dfe8ee','#2b2420',0.55));
const sun=new THREE.DirectionalLight('#fff4e6',2.4);
sun.position.set(9,16,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:50}); sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.02;
scene.add(sun);
const rim=new THREE.DirectionalLight('#9fb6c8',0.7); rim.position.set(-10,6,-8); scene.add(rim);

/* ground */
const ground=new THREE.Mesh(new THREE.CircleGeometry(16,64),new THREE.MeshStandardMaterial({color:'#2c3237',roughness:1}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const grid=new THREE.GridHelper(32,32,'#3a4247','#30373c'); grid.position.y=0.002; scene.add(grid);

/* dimensions */
const W=3, H=3, PITCH=THREE.MathUtils.degToRad(35), RIDGE=H+W*Math.tan(PITCH), S=4.2, L=7;
const house=new THREE.Group(); scene.add(house);

/* materials */
const M={
  wall:new THREE.MeshStandardMaterial({color:'#ece8e1',roughness:.9}),
  wallDark:new THREE.MeshStandardMaterial({color:'#3a4045',roughness:.6}),
  wood:new THREE.MeshStandardMaterial({color:'#c4935c',roughness:.75}),
  batten:new THREE.MeshStandardMaterial({color:'#b98a52',roughness:.8}),
  wool:new THREE.MeshStandardMaterial({color:'#d8c27a',roughness:1}),
  screen:new THREE.MeshStandardMaterial({color:'#3d6680',roughness:.55,side:THREE.DoubleSide}),
  tile:new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.62}),
  zinc:new THREE.MeshStandardMaterial({color:'#aab3b8',metalness:.95,roughness:.32,side:THREE.DoubleSide}),
  alu:new THREE.MeshStandardMaterial({color:'#3a4146',metalness:.6,roughness:.4}),
  glass:new THREE.MeshStandardMaterial({color:'#7d9bb0',metalness:.9,roughness:.06}),
  pv:new THREE.MeshStandardMaterial({color:'#ffffff',metalness:.4,roughness:.25}),
  rail:new THREE.MeshStandardMaterial({color:'#c9cfd2',metalness:.9,roughness:.35}),
};
// screen texture : bandes de recouvrement
{const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle='#3d6680';g.fillRect(0,0,512,512);g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=3;for(let i=0;i<4;i++){g.beginPath();g.moveTo(0,i*128+20);g.lineTo(512,i*128+20);g.stroke()}g.fillStyle='rgba(255,255,255,.22)';g.font='bold 30px Arial';for(let i=0;i<4;i++)for(let j=0;j<3;j++)g.fillText('HPV',j*180+30,i*128+80);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);M.screen.map=t;M.screen.color.set('#ffffff');}
// PV cell texture
{const c=document.createElement('canvas');c.width=256;c.height=384;const g=c.getContext('2d');g.fillStyle='#16233a';g.fillRect(0,0,256,384);g.strokeStyle='#5d6f86';g.lineWidth=2;for(let x=0;x<=256;x+=42.6){g.beginPath();g.moveTo(x,0);g.lineTo(x,384);g.stroke()}for(let y=0;y<=384;y+=42.6){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke()}g.strokeStyle='#c9cfd2';g.lineWidth=8;g.strokeRect(0,0,256,384);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;M.pv.map=t;}

function mesh(geo,mat,cast=true){const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=true;return m}

/* house body */
{const s=new THREE.Shape();s.moveTo(-W,0);s.lineTo(W,0);s.lineTo(W,H);s.lineTo(0,RIDGE-0.02);s.lineTo(-W,H);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:L-0.8,bevelEnabled:false});g.translate(0,0,-(L-0.8)/2);
 house.add(mesh(g,M.wall));
 const z=(L-0.8)/2+0.01;
 const door=mesh(new THREE.PlaneGeometry(1,2.1),M.wallDark,false);door.position.set(-1.4,1.05,z);house.add(door);
 [[0.9,1.7],[2.1,1.7]].forEach(([x,y])=>{const w=mesh(new THREE.PlaneGeometry(.8,1),M.glass,false);w.position.set(x,y,z);house.add(w)});
 const gw=mesh(new THREE.PlaneGeometry(.7,.7),M.glass,false);gw.position.set(0,3.8,z);house.add(gw);
}

/* tile geometry : tuile mécanique à deux côtes */
const tileGeo=(()=>{const base=new THREE.BoxGeometry(0.31,0.022,0.235);const parts=[base];
 [-0.06,0.06].forEach(z=>{const r=new THREE.CylinderGeometry(0.03,0.03,0.31,10,1,false,0,Math.PI);r.rotateZ(Math.PI/2);r.rotateX(Math.PI/2*0);r.translate(0,0.011,z);parts.push(r)});
 return mergeGeometries(parts.map(p=>p.toNonIndexed()));})();

function buildTiles(skipFn){
  const rows=Math.floor((S-0.05)/0.30), cols=Math.floor(L/0.235);
  const pos=[];for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const x=0.18+i*0.30, z=-L/2+0.12+j*0.235; if(skipFn&&skipFn(x,z))continue; pos.push([x,z,i,j]);}
  const im=new THREE.InstancedMesh(tileGeo,M.tile,pos.length); im.castShadow=true; im.receiveShadow=true;
  const o=new THREE.Object3D(), col=new THREE.Color(); const base=['#a8482d','#b5532f','#9c3f28','#b0502f','#8f3a26'];
  pos.forEach(([x,z,i,j],k)=>{o.position.set(x,0.02,z);o.rotation.set(0,0,THREE.MathUtils.degToRad(6));o.updateMatrix();im.setMatrixAt(k,o.matrix);
    col.set(base[(i*7+j*13)%base.length]).offsetHSL(0,0,((i*31+j*17)%9-4)*0.006);im.setColorAt(k,col)});
  return im;
}

/* one pitch = set of layers */
function makePitch(explodable){
  const g=new THREE.Group(); const layers={};
  const mk=(key)=>{const l=new THREE.Group();l.userData.base=new THREE.Vector3();g.add(l);layers[key]=l;return l};
  // charpente
  const ch=mk('charpente');
  for(let z=-L/2+0.2;z<=L/2-0.15;z+=0.6){const r=mesh(new THREE.BoxGeometry(S,0.18,0.075),M.wood);r.position.set(S/2,0.09,z);ch.add(r)}
  const ridge=mesh(new THREE.BoxGeometry(0.14,0.26,L+0.1),M.wood);ridge.position.set(0.02,-0.08,0);ch.add(ridge);
  // isolant (panneaux)
  const is=mk('isolant');
  for(let z=-L/2+0.05;z<L/2-0.05;z+=1.2){const p=mesh(new THREE.BoxGeometry(S-0.5,0.15,Math.min(1.17,L/2-z-0.05)),M.wool);p.position.set((S-0.5)/2+0.12,0.255,z+Math.min(1.17,L/2-z-0.05)/2);is.add(p)}
  // écran
  const ec=mk('ecran'); const sc=mesh(new THREE.BoxGeometry(S,0.01,L),M.screen);sc.position.set(S/2,0.345,0);ec.add(sc);
  // liteaux
  const li=mk('liteaux');
  for(let z=-L/2+0.2;z<=L/2-0.15;z+=0.6){const r=mesh(new THREE.BoxGeometry(S,0.025,0.035),M.batten);r.position.set(S/2,0.365,z);li.add(r)}
  for(let x=0.12;x<S;x+=0.30){const b=mesh(new THREE.BoxGeometry(0.038,0.03,L),M.batten);b.position.set(x,0.393,0);li.add(b)}
  // tuiles
  const tu=mk('tuiles');
  const win={x0:1.35,x1:2.55,z0:1.55,z1:2.75};
  const tiles=buildTiles(explodable?(x,z)=>x>win.x0&&x<win.x1&&z>win.z0&&z<win.z1:null); tiles.position.y=0.41; tu.add(tiles);
  // faîtière
  const cap=mesh(new THREE.CylinderGeometry(0.17,0.17,L+0.05,20,1,true,0,Math.PI),M.tile);
  cap.material=new THREE.MeshStandardMaterial({color:'#9a4128',roughness:.6,side:THREE.DoubleSide});
  cap.rotation.x=Math.PI/2; cap.rotation.z=-PITCH*0; cap.position.set(-0.02,0.47,0); cap.rotation.y=0; tu.add(cap);
  if(explodable){
    // fenêtre de toit
    const fw=mk('fenetre');
    const fr=mesh(new THREE.BoxGeometry(win.x1-win.x0,0.12,win.z1-win.z0),M.alu);fr.position.set((win.x0+win.x1)/2,0.47,(win.z0+win.z1)/2);fw.add(fr);
    const gl=mesh(new THREE.BoxGeometry(win.x1-win.x0-0.16,0.03,win.z1-win.z0-0.16),M.glass);gl.position.set((win.x0+win.x1)/2,0.54,(win.z0+win.z1)/2);fw.add(gl);
    const fl=mesh(new THREE.BoxGeometry(win.x1-win.x0+0.24,0.02,win.z1-win.z0+0.24),M.zinc);fl.position.set((win.x0+win.x1)/2,0.42,(win.z0+win.z1)/2);fw.add(fl);
    // solaire
    const so=mk('solaire');
    [0.95,2.75].forEach(x=>{const r=mesh(new THREE.BoxGeometry(0.05,0.05,3.9),M.rail);r.position.set(x,0.58,-1.35);so.add(r)});
    for(let a=0;a<2;a++)for(let b=0;b<3;b++){const p=mesh(new THREE.BoxGeometry(1.62,0.04,1.08),M.pv);p.position.set(1.0+a*1.72,0.63,-3.0+b*1.12);so.add(p)}
  }
  return {g,layers};
}

const right=makePitch(true); right.g.position.set(0,RIDGE,0); right.g.rotation.z=-PITCH; house.add(right.g);
const left=makePitch(false); left.g.position.set(0,RIDGE,0); left.g.rotation.z=PITCH; left.g.scale.x=-1; house.add(left.g);
// pignons du toit côté gauche un peu plus sombres pour lire le volume
left.g.traverse(o=>{if(o.isInstancedMesh)o.material=M.tile});

/* zinguerie (repère monde) */
const zing=new THREE.Group(); house.add(zing);
{const eave=new THREE.Vector3(S+0.02,0.3,0).applyAxisAngle(new THREE.Vector3(0,0,1),-PITCH).add(new THREE.Vector3(0,RIDGE,0));
 const gut=mesh(new THREE.CylinderGeometry(0.13,0.13,L+0.1,24,1,true,Math.PI/2,Math.PI),M.zinc);gut.rotation.x=Math.PI/2;gut.position.set(eave.x+0.08,eave.y-0.1,0);zing.add(gut);
 const lip=mesh(new THREE.TorusGeometry(0.015,0.015,6,12),M.zinc);
 const pipe=mesh(new THREE.CylinderGeometry(0.06,0.06,eave.y-0.25,16),M.zinc);pipe.position.set(eave.x+0.08,(eave.y-0.25)/2,L/2-0.35);zing.add(pipe);
 const elbow=mesh(new THREE.CylinderGeometry(0.06,0.07,0.3,16),M.zinc);elbow.position.set(eave.x+0.08,eave.y-0.22,L/2-0.35);zing.add(elbow);
 for(let z=-L/2+0.4;z<L/2;z+=0.9){const h=mesh(new THREE.TorusGeometry(0.14,0.012,6,16,Math.PI),M.zinc);h.rotation.set(0,0,Math.PI);h.position.set(eave.x+0.08,eave.y-0.1,z);zing.add(h)}
 for(let y=0.8;y<eave.y-0.4;y+=1.3){const c=mesh(new THREE.TorusGeometry(0.07,0.012,6,16),M.zinc);c.rotation.x=Math.PI/2;c.position.set(eave.x+0.08,y,L/2-0.35);zing.add(c)}
}

/* explosion targets */
const LAY={...right.layers, zinguerie:zing};
const OFF={ // déplacement local (le long de la normale du pan = +y)
  solaire:new THREE.Vector3(-0.2,3.7,0), fenetre:new THREE.Vector3(0.2,3.0,0.0), tuiles:new THREE.Vector3(0,2.35,0),
  liteaux:new THREE.Vector3(0,1.6,0), ecran:new THREE.Vector3(0,1.05,0), isolant:new THREE.Vector3(0,0.55,0), charpente:new THREE.Vector3(0,0,0),
  zinguerie:new THREE.Vector3(1.6,-0.15,0) // repère monde
};
const ANCH={ // point d'accroche de l'étiquette (repère local de la couche)
  solaire:[2.6,0.66,-3.6], fenetre:[2.0,0.56,2.15], tuiles:[3.2,0.47,1.0], liteaux:[3.6,0.4,0.6], ecran:[3.9,0.35,-0.4], isolant:[3.6,0.33,-1.6], charpente:[3.9,0.18,-2.7],
  zinguerie:[0,0,0]
};
{const e=new THREE.Vector3(S+0.02,0.3,0).applyAxisAngle(new THREE.Vector3(0,0,1),-PITCH).add(new THREE.Vector3(0,RIDGE,0)); ANCH.zinguerie=[e.x+0.1,e.y-0.1,-1.5];}

const mats=new Map(); // matériaux par couche (clonés pour régler l'opacité)
for(const [k,grp] of Object.entries(LAY)){const set=new Set();grp.traverse(o=>{if(o.isMesh){const m=o.material.clone();o.material=m;set.add(m)}});mats.set(k,[...set])}

/* ---------- state & animation ---------- */
const N=LAYERS.length;
const st={p:0};
const camA={pos:new THREE.Vector3(10.5,8.5,15),tgt:new THREE.Vector3(0.4,3.2,0)};
const camB={pos:new THREE.Vector3(6,8.4,21.5),tgt:new THREE.Vector3(2.4,5.2,0)};
const tmpV=new THREE.Vector3(), tmpT=new THREE.Vector3();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

function layerT(i,s){return ease(clamp(s-(i+0.15)/1))}  // couche i s'ouvre pendant l'étape i
let lastActive=-2;
function setDetail(i){
  if(i===lastActive)return; lastActive=i;
  const L0= i<0 ? {name:'Une toiture complète',txt:"Tout ce que vous voyez ici est disponible dans nos dépôts, de la charpente aux panneaux solaires.",brands:'',cat:null}
          : i>=N ? {name:'Tout en un seul endroit',txt:"Huit couches, plus de 80 fournisseurs, trois dépôts. Envoyez la liste de votre chantier et nous préparons la commande.",brands:'',cat:'devis'} : LAYERS[i];
  detailEl.classList.add('out');
  setTimeout(()=>{detailEl.innerHTML=`<h3>${L0.name}</h3><p>${L0.txt}</p>${L0.brands?`<p class="brands-t">${L0.brands}</p>`:''}${L0.cat==='devis'?'<a href="contact.html#devis">Demander un devis</a>':L0.cat?`<a href="rayon-${L0.cat}.html">Voir le rayon</a>`:''}`;detailEl.classList.remove('out')},reduce?0:180);
  [...listEl.children].forEach((li,k)=>{li.classList.toggle('on',k===i);li.classList.toggle('done',i>=N||k<i)});
  document.getElementById('progress').textContent= i<0?'':i>=N?'Vue d’ensemble':`Couche ${i+1} sur ${N}`;
}

function apply(p){
  const s=p*(N+1.4)-0.4;              // -0.4 → N+1
  LAYERS.forEach((l,i)=>{
    const t=layerT(i,s); const grp=LAY[l.key];
    grp.position.copy(OFF[l.key]).multiplyScalar(t);
    const active = Math.floor(s)===i && s>=0;
    const focus = (s>=0 && s<N);
    const op = !focus ? 1 : (active ? 1 : (t>0.01 ? 0.32 : 0.9));
    mats.get(l.key).forEach(m=>{m.opacity+= (op-m.opacity)*0.25; m.transparent=m.opacity<0.995; m.depthWrite=m.opacity>0.6});
  });
  const k=ease(clamp(p*1.35)); tmpV.lerpVectors(camA.pos,camB.pos,k); tmpT.lerpVectors(camA.tgt,camB.tgt,k);
  const aspect=stage.clientWidth/stage.clientHeight; const back= aspect<0.9? 1.75 : aspect<1.3?1.25:1;
  camera.position.copy(tmpT).add(tmpV.sub(tmpT).multiplyScalar(back)); camera.lookAt(tmpT);
  {const w=stage.clientWidth,h=stage.clientHeight; if(w>=860) camera.setViewOffset(w,h,-w*0.16,0,w,h); else camera.setViewOffset(w,h,0,h*0.16,w,h);}
  if(aspect<0.9) camera.position.y+=1.2;
  house.rotation.y = -0.18 + 0.18*k;
  const idx = s<0 ? -1 : Math.min(N, Math.floor(s));
  setDetail(idx);
  document.getElementById('hint').style.opacity = p>0.02?0:1;
  return s;
}

const proj=new THREE.Vector3();
function updateTags(s){
  const w=stage.clientWidth,h=stage.clientHeight; const mobile=w<860;
  LAYERS.forEach((l,i)=>{
    const a=ANCH[l.key]; proj.set(a[0],a[1],a[2]); LAY[l.key].localToWorld(proj); proj.project(camera);
    const el=tagEls[i]; const t=layerT(i,s);
    const show = (t>0.6 && (!mobile || Math.floor(s)===i)) || (s>=N && !mobile) ;
    el.classList.toggle('show',show); el.classList.toggle('active',Math.floor(s)===i);
    el.style.transform=`translate(${(proj.x*.5+.5)*w}px,${(-proj.y*.5+.5)*h}px) translate(-10px,-100%)`;
  });
}

function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener('resize',()=>{resize();dirty=3});
resize();

let dirty=5, visible=true;
new IntersectionObserver(e=>{visible=e[0].isIntersecting;dirty=3},{rootMargin:'100px'}).observe(stage);
function loop(){
  requestAnimationFrame(loop);
  if(!visible||dirty<=0)return; dirty--;
  const s=apply(st.p); updateTags(s); renderer.render(scene,camera);
}

if(reduce || !window.gsap){
  st.p=1; dirty=40; loop();
}else{
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({trigger:stage,start:'top 68px',end:()=>'+='+(innerHeight*(N+1.5)),pin:true,scrub:0.6,
    onUpdate:self=>{st.p=self.progress;dirty=8}});
  loop();
}
setDetail(-1);
