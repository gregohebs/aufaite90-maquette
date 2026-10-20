// Le dépôt en 3D : une palette par rayon ; un clic éclate la palette en tous ses produits.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeRenderer, studioEnv, TEX, reduceMotion, finePointer, tween, loadRayon, rng } from './common.js';
import { PROC, RAYONS, RAYON_ORDER, buildProc, buildCutout, buildPallet, normalize } from './models.js';
import { openViewer } from './viewer.js';

const GRID = 7.5;
const SHORT = { couverture: 'Couverture', zinguerie: 'Zinguerie', etancheite: 'Isolation', debord: 'Bois', bardage: 'Bardage', fenetres: 'Fenêtres', solaire: 'Solaire', outillage: 'Outillage', loisirs: 'Loisirs' };
const procByRayon = id => Object.keys(PROC).filter(k => PROC[k].rayon === id);

export async function initCatalogue() {
  const root = document.getElementById('depot3d'); if (!root) return;
  const canvas = root.querySelector('canvas'), stage = root.querySelector('.dep3d-stage');
  const tabs = root.querySelector('.dep3d-tabs'), tip = root.querySelector('.dep3d-tip'), info = root.querySelector('.dep3d-info'), labels = root.querySelector('.dep3d-labels');
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#23282C'); scene.fog = new THREE.Fog('#23282C', 30, 60);
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 200);
  scene.add(new THREE.HemisphereLight('#eef3f6', '#40382e', .7));
  const sun = new THREE.DirectionalLight('#fff3e2', 2.2); sun.position.set(8, 18, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); sun.shadow.bias = -.0004; scene.add(sun);
  // sol du dépôt : enrobé + marquage au sol
  const asphalt = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: '#4a4f52', roughness: .95, map: (() => { const t = TEX.gravel().clone(); t.repeat.set(16, 16); t.needsUpdate = true; return t; })() }));
  asphalt.rotation.x = -Math.PI / 2; asphalt.receiveShadow = true; scene.add(asphalt);
  const lineM = new THREE.MeshBasicMaterial({ color: '#d9c44a' });
  for (let i = -1; i <= 1; i++) for (const a of [0, 1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(a ? .08 : GRID * 3, a ? GRID * 3 : .08), lineM); l.rotation.x = -Math.PI / 2; l.position.set(a ? (i + .5) * GRID : 0, .01, a ? 0 : (i + .5) * GRID); if (Math.abs(i + .5) < 2) scene.add(l); }

  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .08, enablePan: false, maxPolarAngle: Math.PI * .47, minDistance: 3, maxDistance: 40 });
  if (!finePointer) { controls.enableRotate = false; controls.enableZoom = false; }

  // une palette par rayon
  const clusters = {};
  RAYON_ORDER.forEach((id, k) => {
    const cx = ((k % 3) - 1) * GRID, cz = (Math.floor(k / 3) - 1) * GRID;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
    const pal = normalize(buildPallet(), 2.4); g.add(pal);
    const film = new THREE.Mesh(new THREE.BoxGeometry(2.45, 1.45, 1.7), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: .16, roughness: .15, metalness: 0, depthWrite: false }));
    film.position.y = .3 + .73; g.add(film);
    const items = new THREE.Group(); g.add(items);
    const lab = document.createElement('button'); lab.type = 'button'; lab.className = 'dep3d-label'; lab.innerHTML = `<span class="l">${RAYONS[id]}</span><span class="s">${SHORT[id]}</span>`; lab.dataset.id = id; labels.appendChild(lab);
    clusters[id] = { id, g, film, items, lab, entries: [], open: 0, loaded: false };
  });

  // positions « palette » (rangé) et « éclaté » (mur de produits devant la palette)
  function layout(c) {
    const narrow = stage.clientWidth / stage.clientHeight < 1, n = c.entries.length, cols = Math.min(narrow ? 5 : 8, Math.ceil(Math.sqrt(n * 1.8))), rows = Math.ceil(n / cols), r = rng(n + 3);
    c.entries.forEach((e, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      // rangé : petits colis empilés sur la palette
      const pc = 4, px = (i % pc) - (pc - 1) / 2, pz = Math.floor(i / pc) % 3 - 1, py = Math.floor(i / (pc * 3));
      e.packed = { p: new THREE.Vector3(px * .56, .36 + py * .36, pz * .48), s: .42, r: new THREE.Euler(0, 0, 0) };
      const x = (col - (cols - 1) / 2) * 1.3, y = 1.0 + (rows - 1 - row) * 1.25, z = -Math.abs(x) * .18 + 1.4 + (r() - .5) * .7;
      e.burst = { p: new THREE.Vector3(x, y, z), s: 1, r: new THREE.Euler((r() - .5) * .25, -x * .07 + (r() - .5) * .3, (r() - .5) * .12) };
    });
    c.wall = { w: cols * 1.3, h: rows * 1.25 + 1 };
  }
  function place(c, t) {
    c.entries.forEach(e => {
      const a = e.packed, b = e.burst, k = Math.min(1, Math.max(0, t * 1.15 - e.delay));
      const q = k * k * (3 - 2 * k);
      e.obj.position.lerpVectors(a.p, b.p, q); e.obj.scale.setScalar(a.s + (b.s - a.s) * q);
      e.obj.rotation.set(a.r.x + (b.r.x - a.r.x) * q, a.r.y + (b.r.y - a.r.y) * q, a.r.z + (b.r.z - a.r.z) * q);
    });
    c.film.material.opacity = .16 * (1 - t); c.film.visible = t < .98;
  }
  async function fill(c) {
    if (c.loaded) return; c.loaded = true;
    const cut = await loadRayon(c.id);
    const specs = [...procByRayon(c.id).map(id => ({ type: 'proc', id, name: PROC[id].name })), ...cut.map(it => ({ type: 'cut', rayon: c.id, id: it.id, name: it.name, item: it }))];
    specs.forEach((sp, i) => {
      const o = normalize(sp.type === 'proc' ? buildProc(sp.id) : buildCutout(sp.item, .07), .95);
      o.traverse(m => { if (m.isMesh) m.userData.entry = { c: c.id, i }; });
      c.items.add(o); c.entries.push({ spec: { type: sp.type, id: sp.id, rayon: c.id }, name: sp.name, obj: o, delay: (i % 7) * .025 });
    });
    layout(c); place(c, c.open);
  }

  // caméra
  const home = { p: new THREE.Vector3(0, 13.5, 17.5), t: new THREE.Vector3(0, .4, .6) };
  if (stage.clientWidth / stage.clientHeight < 1) { camera.fov = 52; camera.updateProjectionMatrix(); home.p.set(0, 36, 17); home.t.set(0, 0, .8); scene.fog.near = 50; scene.fog.far = 95; }
  camera.position.copy(home.p); controls.target.copy(home.t);
  let focus = null, stop = () => {}, dirty = 10, visible = true, offX = 0;
  const shiftTo = v => { const a = offX; tween(1100, k => { offX = a + (v - a) * k; dirty = 2; }); };
  function fly(p, t, dur = 1100, done) {
    stop(); const p0 = camera.position.clone(), t0 = controls.target.clone(); controls.enabled = false;
    stop = tween(dur, k => { camera.position.lerpVectors(p0, p, k); controls.target.lerpVectors(t0, t, k); dirty = 2; }, () => { controls.enabled = true; done && done(); });
  }
  function frameFor(c) {
    const aspect = stage.clientWidth / stage.clientHeight, fov = THREE.MathUtils.degToRad(camera.fov);
    const needH = c.wall.h + 1, needW = c.wall.w + 1.2, dist = Math.max(needH / 2 / Math.tan(fov / 2), needW / 2 / Math.tan(fov / 2) / aspect) * 1.05;
    const t = c.g.position.clone().add(new THREE.Vector3(0, c.wall.h / 2 + .2, 1));
    return [t.clone().add(new THREE.Vector3(0, dist * .22, dist)), t];
  }
  async function openCluster(id) {
    const c = clusters[id]; if (focus && focus !== c) closeCluster(focus, false);
    const r = stage.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    focus = c; tabsSel(id); shiftTo(stage.clientWidth >= 860 ? -.13 : 0); await fill(c);
    const [p, t] = frameFor(c); fly(p, t, 1200);
    const o0 = c.open; tween(1300, k => { c.open = o0 + (1 - o0) * k; place(c, c.open); dirty = 2; });
    info.hidden = false;
    info.innerHTML = `<h3>${RAYONS[id]}</h3><p>${c.entries.length} produits. Cliquez sur un produit pour le voir en 3D.</p><div class="d-acts"><a href="rayon-${id}.html">Voir le rayon</a><button type="button" class="dep3d-back">Retour au dépôt</button></div>`;
    labels.classList.add('hidden');
  }
  function closeCluster(c, flyHome = true) {
    const o0 = c.open; tween(700, k => { c.open = o0 * (1 - k); place(c, c.open); dirty = 2; });
    if (flyHome) { focus = null; tabsSel(null); shiftTo(0); fly(home.p, home.t, 1100); info.hidden = true; labels.classList.remove('hidden'); }
  }
  function tabsSel(id) { tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === (id || 'all')))); }
  tabs.innerHTML = `<button type="button" data-id="all" aria-pressed="true">Tout le dépôt</button>` + RAYON_ORDER.map(id => `<button type="button" data-id="${id}" aria-pressed="false">${RAYONS[id]}</button>`).join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.id === 'all') { if (focus) closeCluster(focus); } else openCluster(b.dataset.id); });
  labels.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openCluster(b.dataset.id); });
  info.addEventListener('click', e => { if (e.target.closest('.dep3d-back') && focus) closeCluster(focus); });

  // survol, clic
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2(); let hover = null, downAt = null;
  function hitTest(e) {
    const r = canvas.getBoundingClientRect(); m2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(m2, camera);
    const objs = focus ? [focus.items] : Object.values(clusters).map(c => c.g);
    const h = ray.intersectObjects(objs, true)[0]; if (!h) return null;
    if (!focus) { for (const c of Object.values(clusters)) { let o = h.object; while (o) { if (o === c.g) return { cluster: c.id }; o = o.parent; } } return null; }
    return h.object.userData.entry || null;
  }
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const h = hitTest(e); canvas.style.cursor = h ? 'pointer' : '';
    const key = h ? (h.cluster || h.c + h.i) : null;
    if (key !== hover) {
      if (hover && hover.obj) hover.obj.scale.multiplyScalar(1 / 1.08);
      hover = null;
      if (h && !h.cluster) { const en = clusters[h.c].entries[h.i]; en.obj.scale.multiplyScalar(1.08); hover = { obj: en.obj, key }; tip.textContent = en.name; tip.hidden = false; }
      else if (h && h.cluster) { hover = { key }; tip.textContent = RAYONS[h.cluster] + ' : ouvrir la palette'; tip.hidden = false; }
      else tip.hidden = true;
      dirty = 2;
    }
    const r = stage.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 14}px,${e.clientY - r.top + 14}px)`;
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  canvas.addEventListener('click', e => {
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // c'était une rotation
    const h = hitTest(e); if (!h) return;
    if (h.cluster) { openCluster(h.cluster); return; }
    const c = clusters[h.c]; openViewer(c.entries[h.i].spec, c.entries.map(x => x.spec));
  });

  // étiquettes des palettes
  const v = new THREE.Vector3();
  function updLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    Object.values(clusters).forEach(c => { v.copy(c.g.position); v.y += 1.95; v.project(camera); c.lab.style.transform = `translate(${(v.x * .5 + .5) * w}px,${(-v.y * .5 + .5) * h}px) translate(-50%,-100%)`; });
  }
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = 3; }
  addEventListener('resize', resize); resize();
  controls.addEventListener('change', () => { dirty = 2; });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; dirty = 3; }).observe(stage);
  (function loop() { requestAnimationFrame(loop); const moving = controls.update(); if (!visible || (dirty <= 0 && !moving)) return; dirty = Math.max(0, dirty - 1); const w = stage.clientWidth, h = stage.clientHeight; if (offX) camera.setViewOffset(w, h, offX * w, 0, w, h); else camera.clearViewOffset(); updLabels(); renderer.render(scene, camera); })();
  // les palettes affichent leurs produits rangés dès le départ (chargement en arrière-plan)
  for (const id of RAYON_ORDER) { await fill(clusters[id]); dirty = 2; }
}
