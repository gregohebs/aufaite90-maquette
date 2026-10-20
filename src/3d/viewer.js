// Visionneuse 3D d'un produit : modale plein écran, rotation à la souris ou au doigt, zoom.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeRenderer, studioEnv, reduceMotion, loadRayon } from './common.js';
import { PROC, RAYONS, buildProc, buildCutout, normalize } from './models.js';

let ui, renderer, scene, camera, controls, current, list = [], idx = 0, raf = 0, lastFocus = null, opened = false;

function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

function setup() {
  ui = el(`<div class="v3d" role="dialog" aria-modal="true" aria-labelledby="v3d-title" hidden>
    <div class="v3d-box">
      <div class="v3d-stage"><canvas></canvas><p class="v3d-hint">Glissez pour tourner, molette ou pincement pour zoomer</p>
        <button class="v3d-nav prev" type="button" aria-label="Produit précédent">‹</button><button class="v3d-nav next" type="button" aria-label="Produit suivant">›</button></div>
      <aside class="v3d-info">
        <button class="v3d-close" type="button" aria-label="Fermer">Fermer</button>
        <p class="v3d-ray"></p><h2 id="v3d-title"></h2><p class="v3d-brand"></p><p class="v3d-desc"></p>
        <div class="v3d-acts"><a class="btn btn-red v3d-devis" href="#">Demander un devis</a><a class="btn btn-line v3d-page" href="#">Voir le rayon</a></div>
        <p class="v3d-count"></p>
      </aside>
    </div></div>`);
  document.body.appendChild(ui);
  const canvas = ui.querySelector('canvas');
  renderer = makeRenderer(canvas);
  scene = new THREE.Scene(); scene.background = new THREE.Color('#e9ecec');
  scene.environment = studioEnv(renderer);
  camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2a6', .6));
  const key = new THREE.DirectionalLight('#fff6ea', 2.2); key.position.set(2.5, 4, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 }); key.shadow.bias = -.0005; scene.add(key);
  const rim = new THREE.DirectionalLight('#cfe0ff', .8); rim.position.set(-3, 2, -3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: .18 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .08, enablePan: false, minDistance: 1.2, maxDistance: 6, maxPolarAngle: Math.PI * .52 });
  controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 1.6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  ui.querySelector('.v3d-close').onclick = close;
  ui.addEventListener('click', e => { if (e.target === ui) close(); });
  ui.querySelector('.prev').onclick = () => go(-1);
  ui.querySelector('.next').onclick = () => go(1);
  document.addEventListener('keydown', e => {
    if (!opened) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'Tab') { // garde le focus dans la modale
      const f = [...ui.querySelectorAll('button:not([hidden]),a[href]')].filter(x => x.offsetParent);
      if (!f.length) return; const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    }
  });
  addEventListener('resize', () => opened && resize());
}

function resize() {
  const c = renderer.domElement.parentElement; const w = c.clientWidth, h = c.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

async function show(spec) {
  if (current) { scene.remove(current); current.traverse(o => { if (o.geometry) o.geometry.dispose(); }); current = null; }
  let obj, info;
  if (spec.type === 'proc') {
    const p = PROC[spec.id]; obj = buildProc(spec.id);
    info = { name: p.name, rayon: p.rayon, brand: p.brand, desc: p.desc };
  } else {
    const items = await loadRayon(spec.rayon); const it = items.find(x => x.id === spec.id);
    if (!it) return;
    obj = buildCutout(it, .06); obj.rotation.x = 0;
    info = { name: it.name, rayon: spec.rayon, brand: it.brand, desc: 'Visuel fournisseur. Disponibilité et variantes : demandez au dépôt.' };
  }
  current = normalize(obj, 1.25); scene.add(current);
  const box = new THREE.Box3().setFromObject(current); const c = new THREE.Vector3(); box.getCenter(c);
  const sph = new THREE.Sphere(); box.getBoundingSphere(sph);
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  const dist = sph.radius / Math.sin(Math.min(vf, hf)) * 1.08;
  controls.target.copy(c); camera.position.copy(c).add(new THREE.Vector3(1.5, .9, 2.1).normalize().multiplyScalar(dist));
  controls.minDistance = dist * .45; controls.maxDistance = dist * 2.2; controls.autoRotate = !reduceMotion; controls.update();
  ui.querySelector('.v3d-ray').textContent = RAYONS[info.rayon] || '';
  ui.querySelector('#v3d-title').textContent = info.name;
  const br = ui.querySelector('.v3d-brand'); br.textContent = info.brand ? 'Marques : ' + info.brand : ''; br.hidden = !info.brand;
  ui.querySelector('.v3d-desc').textContent = info.desc || '';
  ui.querySelector('.v3d-devis').href = 'contact.html?rayon=' + info.rayon + '#devis';
  const pg = ui.querySelector('.v3d-page'); pg.href = 'rayon-' + info.rayon + '.html';
  pg.hidden = location.pathname.endsWith('rayon-' + info.rayon + '.html');
  const many = list.length > 1;
  ui.querySelectorAll('.v3d-nav').forEach(b => b.hidden = !many);
  ui.querySelector('.v3d-count').textContent = many ? `Produit ${idx + 1} sur ${list.length}` : '';
}

function go(d) { if (list.length < 2) return; idx = (idx + d + list.length) % list.length; show(list[idx]); }

function loop() { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }

export async function openViewer(spec, items = null) {
  if (!ui) setup();
  list = items && items.length ? items : [spec];
  idx = Math.max(0, list.findIndex(x => x.type === spec.type && x.id === spec.id));
  lastFocus = document.activeElement;
  ui.hidden = false; opened = true; document.documentElement.classList.add('v3d-open');
  resize(); await show(list[idx]);
  cancelAnimationFrame(raf); loop();
  ui.querySelector('.v3d-close').focus();
}
export function close() {
  if (!opened) return; opened = false; ui.hidden = true; cancelAnimationFrame(raf);
  document.documentElement.classList.remove('v3d-open');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
