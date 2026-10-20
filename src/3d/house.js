// Maison 3D de l'accueil : toiture qui s'ouvre couche par couche au défilement, caméra qui suit chaque couche.
import * as THREE from 'three';
import { makeRenderer, studioEnv, TEX, MAT, rng, reduceMotion, finePointer, clamp, easeInOut } from './common.js';
import { tileGeometry, gutterGeometry } from './models.js';
import { openViewer } from './viewer.js';

const W = 3, H = 3, LW = 6.2, L = 7, P = THREE.MathUtils.degToRad(35);
const RIDGE = H + W * Math.tan(P), OV = 0.45, S = (W + OV) / Math.cos(P);
const NORMAL = new THREE.Vector3(Math.sin(P), Math.cos(P), 0);
const sm = t => t * t * (3 - 2 * t);
const DEBUG = /debug3d/.test(location.search);

const M = o => new THREE.MeshStandardMaterial(o);
const mk = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = mk(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };

function repeatTex(t, rx, ry) { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; }

// ---------------------------------------------------------------- façades
function buildWalls(house) {
  const crepi = M({ map: repeatTex(TEX.crepi(), .45, .45), bumpMap: repeatTex(TEX.crepiBump(), 1.2, 1.2), bumpScale: .6, roughness: .95, color: '#f3efe7' });
  const s = new THREE.Shape(); s.moveTo(-W, 0); s.lineTo(W, 0); s.lineTo(W, H); s.lineTo(0, RIDGE - .02); s.lineTo(-W, H); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: LW, bevelEnabled: false }); g.translate(0, 0, -LW / 2);
  house.add(mk(g, crepi));
  const plinth = M({ color: '#8e8f8a', roughness: .9, map: repeatTex(TEX.gravel(), 1, .2) });
  house.add(box(2 * W + .04, .42, LW + .04, plinth, 0, .21, 0));
  // dalle et terrasse
  house.add(box(2 * W + 1.2, .08, LW + 1.2, M({ color: '#b8b3aa', roughness: .9, map: repeatTex(TEX.gravel(), 3, 3) }), 0, .04, 0));
}

const shutter = M({ color: '#6e8582', roughness: .6 });
const sillM = M({ color: '#d9d5cc', roughness: .8 });
function windowAt(w, h, withShutters = true) {
  const g = new THREE.Group(), pvc = MAT.pvcWhite();
  g.add(box(w + .02, h + .02, .1, M({ color: '#3a3d40', roughness: .9 }), 0, 0, -.05)); // tableau
  const f = .06;
  g.add(box(w, f, .07, pvc, 0, h / 2 - f / 2, .0), box(w, f, .07, pvc, 0, -h / 2 + f / 2, 0), box(f, h, .07, pvc, -w / 2 + f / 2, 0, 0), box(f, h, .07, pvc, w / 2 - f / 2, 0, 0), box(.05, h, .06, pvc, 0, 0, 0));
  const gl = mk(new THREE.PlaneGeometry(w - .1, h - .1), MAT.glass(), false); gl.position.z = -.005; g.add(gl);
  g.add(box(w + .16, .05, .14, sillM, 0, -h / 2 - .03, .05)); // appui
  if (withShutters) {
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group(); const p = box(w / 2, h + .04, .03, shutter); sh.add(p);
      for (let i = -3; i <= 3; i++) sh.add(box(w / 2 - .02, .012, .012, M({ color: '#5d726f' }), 0, i * h / 8, .02));
      sh.position.set(sx * (w * .75 + .02), 0, .02); g.add(sh);
    }
  }
  return g;
}
function doorAt() {
  const g = new THREE.Group();
  g.add(box(1.04, 2.18, .1, M({ color: '#3a3d40' }), 0, 1.09, -.05));
  g.add(box(.94, 2.1, .06, M({ map: TEX.wood('#5a4330', 'door'), roughness: .6 }), 0, 1.05, 0));
  g.add(box(.04, .04, .1, MAT.alu(), .36, 1.05, .05));
  g.add(box(1.3, .14, .5, sillM, 0, .07, .3));
  return g;
}
function placeOpenings(house) {
  const add = (obj, face, u, y) => {
    const z = LW / 2 + .005, x = W + .005;
    if (face === 'front') obj.position.set(u, y, z);
    if (face === 'back') { obj.position.set(u, y, -z); obj.rotation.y = Math.PI; }
    if (face === 'right') { obj.position.set(x, y, u); obj.rotation.y = Math.PI / 2; }
    if (face === 'left') { obj.position.set(-x, y, u); obj.rotation.y = -Math.PI / 2; }
    house.add(obj);
  };
  const d = doorAt(); add(d, 'front', -1.55, 0);
  add(windowAt(.9, 1.15), 'front', .55, 1.65); add(windowAt(.9, 1.15), 'front', 2.0, 1.65);
  add(windowAt(1.0, 1.15), 'right', 1.4, 1.65); add(windowAt(1.0, 1.15), 'right', -1.2, 1.65);
  add(windowAt(1.8, 1.9, false), 'back', .6, 1.35); add(windowAt(.8, 1.0), 'left', .4, 1.7);
}

// ---------------------------------------------------------------- toiture (un pan)
const WIN = { x0: 1.35, x1: 2.55, z0: 1.4, z1: 2.6 };
const CHIM = { x0: .45, x1: 1.02, z0: 2.78, z1: 3.22 };
function tilesFor(skip) {
  const geo = tileGeometry(.25, .42); geo.rotateY(Math.PI / 2);
  const rows = Math.ceil((S + .06 - .21 - .19) / .32) + 1, cols = Math.round(L / .25), cw = L / cols;
  const pos = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = Math.min(.19 + i * .32, S + .06 - .21), z = -L / 2 + cw / 2 + j * cw;
    if (skip && skip(x, z)) continue; pos.push([x, z, i, j]);
  }
  const mat = M({ color: '#ffffff', map: TEX.terracotta(), roughness: .62 });
  const im = new THREE.InstancedMesh(geo, mat, pos.length); im.castShadow = im.receiveShadow = true;
  const o = new THREE.Object3D(), col = new THREE.Color(), r = rng(9);
  const base = ['#ad4a2c', '#b9562f', '#a0432a', '#b45230', '#96402a', '#c05f36'];
  pos.forEach(([x, z], k) => {
    o.position.set(x, 0, z); o.rotation.set(0, (r() - .5) * .02, THREE.MathUtils.degToRad(4.5) + (r() - .5) * .01); o.updateMatrix();
    im.setMatrixAt(k, o.matrix); col.set(base[(r() * base.length) | 0]).offsetHSL(0, (r() - .5) * .05, (r() - .5) * .06); im.setColorAt(k, col);
  });
  return im;
}

function makePitch(full) {
  const g = new THREE.Group(), layers = {};
  const layer = k => { const l = new THREE.Group(); g.add(l); layers[k] = l; return l; };
  const woodM = M({ map: TEX.wood('#c79a63', 'ch'), roughness: .78 });
  const ch = layer('charpente');
  for (let z = -L / 2 + .2; z <= L / 2 - .15; z += .6) ch.add(box(S, .16, .075, woodM, S / 2, .08, z));
  ch.add(box(.16, .26, LW - .1, woodM, .05, -.1, 0));
  if (full) { [1.3, 2.6].forEach(x => ch.add(box(.14, .22, LW - .1, woodM, x, -.12, 0))); }
  if (full) {
    const is = layer('isolant'), wool = M({ map: TEX.wool(), roughness: 1 });
    for (let z = -L / 2 + .2; z < L / 2 - .5; z += .6) is.add(box(3.25, .15, .52, wool, .3 + 3.25 / 2, .08, z + .3));
  }
  const ec = layer('ecran'); ec.add(box(S, .006, L, M({ map: TEX.screen(), roughness: .6 }), S / 2, .165, 0));
  const li = layer('liteaux'), bat = M({ map: TEX.wood('#a8895a', 'li'), roughness: .85 });
  for (let z = -L / 2 + .2; z <= L / 2 - .15; z += .6) li.add(box(S, .025, .04, bat, S / 2, .181, z));
  for (let x = .16; x < S; x += .32) li.add(box(.038, .027, L, bat, x, .207, 0));
  const tu = layer('tuiles');
  const skip = full ? (x, z) => (x > WIN.x0 + .04 && x < WIN.x1 - .04 && z > WIN.z0 + .02 && z < WIN.z1 - .02) || (x > CHIM.x0 && x < CHIM.x1 && z > CHIM.z0 && z < CHIM.z1) : null;
  const t = tilesFor(skip); t.position.y = .235; tu.add(t);
  // faîtières
  if (full) {
    const n = Math.round(L / .42), len = L / n;
    const fg = new THREE.CylinderGeometry(.2, .21, len + .025, 24, 1, true, 0, Math.PI); fg.rotateX(Math.PI / 2); fg.rotateZ(Math.PI / 2);
    const fm = M({ color: '#9f4429', roughness: .6, side: THREE.DoubleSide, map: TEX.terracotta() });
    const fi = new THREE.InstancedMesh(fg, fm, n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set(0, 0, -L / 2 + len / 2 + i * len); o.updateMatrix(); fi.setMatrixAt(i, o.matrix); }
    fi.castShadow = true; fi.receiveShadow = true;
    // demi-cercles de fermeture aux deux pignons
    const end = new THREE.CircleGeometry(.205, 24, 0, Math.PI);
    const ridgeWrap = new THREE.Group(); ridgeWrap.add(fi);
    [-1, 1].forEach(sz => { const e = mk(end, fm); e.position.z = sz * (L / 2 + .012); ridgeWrap.add(e); });
    // le faîtage se pose sur les tuiles des deux pans (repère du pan droit, ramené à l'horizontale)
    const h = .255 / Math.cos(P) - .07;
    ridgeWrap.position.set(-h * Math.sin(P), h * Math.cos(P), 0); ridgeWrap.rotation.z = P;
    tu.add(ridgeWrap);
  }
  if (full) {
    const fw = layer('fenetre'), cx = (WIN.x0 + WIN.x1) / 2, cz = (WIN.z0 + WIN.z1) / 2, ww = WIN.x1 - WIN.x0, wd = WIN.z1 - WIN.z0;
    fw.add(box(ww + .12, .03, wd + .12, MAT.alu(), cx, .3, cz));
    fw.add(box(ww, .16, wd, MAT.alu(), cx, .32, cz));
    fw.add(box(ww - .1, .06, wd - .1, M({ color: '#5b4632', roughness: .6 }), cx, .36, cz));
    fw.add(box(ww - .2, .02, wd - .2, MAT.glass(), cx, .395, cz));
    fw.add(box(.05, .03, wd * .6, MAT.alu(), cx - ww / 2 + .08, .4, cz));
    const so = layer('solaire'), pv = M({ map: TEX.solar(), metalness: .4, roughness: .2 }), fr = MAT.galva();
    [.75, 3.25].forEach(x => so.add(box(.05, .05, 3.7, fr, x, .43, -1.25)));
    for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) {
      const panel = mk(new THREE.BoxGeometry(1.6, .04, 1.06), [fr, fr, pv, fr, fr, fr]); panel.position.set(1.18 + a * 1.68, .47, -2.85 + b * 1.12); so.add(panel);
    }
  }
  return { g, layers };
}

// éléments en repère « monde »
function buildChimney() {
  const g = new THREE.Group(), cx = .76, cz = 3.0;
  const brick = M({ color: '#9e4a32', roughness: .75, map: TEX.terracotta() });
  g.add(box(.5, 2.2, .5, brick, cx, 4.9, cz));
  g.add(box(.62, .06, .62, brick, cx, 6.03, cz));
  const roof = mk(new THREE.ConeGeometry(.42, .16, 4), brick); roof.rotation.y = Math.PI / 4; roof.position.set(cx, 6.14, cz); g.add(roof);
  const pipe = mk(new THREE.CylinderGeometry(.09, .09, 2.6, 24), M({ color: '#dde2e4', metalness: .95, roughness: .2 })); pipe.position.set(cx, 4.2, cz); g.add(pipe);
  const roofY = RIDGE - cx * Math.tan(P) + .28 / Math.cos(P);
  const zincMat = M({ color: '#a9b1b5', metalness: .55, roughness: .42 });
  const skirt = mk(new THREE.BoxGeometry(.58, .2, .58), zincMat); skirt.position.set(cx, roofY + .02, cz); g.add(skirt);
  // bavette amont/aval posée dans la pente
  const apron = mk(new THREE.BoxGeometry(.74, .02, .7), zincMat); apron.position.set(cx, RIDGE - cx * Math.tan(P) + .25 / Math.cos(P), cz); apron.rotation.z = -P; g.add(apron);
  return g;
}
function eaveTip(side = 1) { const e = new THREE.Vector3(S, .17, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -P).add(new THREE.Vector3(0, RIDGE, 0)); e.x *= side; return e; }
function buildGutter(side) {
  const g = new THREE.Group(), z = MAT.zinc(), e = eaveTip(side), gx = e.x + side * .07, gy = e.y - .12;
  const gu = mk(gutterGeometry(.075, L + .1), z); gu.position.set(gx, gy, 0); if (side < 0) gu.rotation.y = Math.PI; g.add(gu);
  for (let zz = -L / 2 + .3; zz < L / 2; zz += .7) { const h = mk(new THREE.TorusGeometry(.079, .006, 6, 16, Math.PI), MAT.galva()); h.rotation.z = Math.PI; h.position.set(gx, gy, zz); g.add(h); }
  const zp = side > 0 ? LW / 2 - .3 : -LW / 2 + .3, wx = side * (W + .09);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(gx, gy - .02, zp), new THREE.Vector3(gx, gy - .3, zp), new THREE.Vector3((gx + wx) / 2, gy - .62, zp), new THREE.Vector3(wx, gy - .95, zp), new THREE.Vector3(wx, .5, zp), new THREE.Vector3(wx, .35, zp)], false, 'centripetal');
  g.add(mk(new THREE.TubeGeometry(curve, 60, .055, 16, false), z));
  for (let y = .9; y < gy - 1.1; y += 1.0) { const c = mk(new THREE.TorusGeometry(.062, .012, 6, 16), MAT.galva()); c.rotation.x = Math.PI / 2; c.position.set(wx, y, zp); g.add(c); }
  g.add(box(.14, .4, .14, M({ color: '#2b2f33', metalness: .5, roughness: .5 }), wx, .2, zp));
  return g;
}
function buildDebord(side) {
  const g = new THREE.Group(), lam = M({ color: '#f2f1ec', roughness: .5 }), e = eaveTip(side);
  const yS = RIDGE - (W + OV) * Math.tan(P) + .005;
  for (let i = 0; i < 4; i++) g.add(box(.11, .015, L, lam, side * (W + .06 + i * .113), yS, 0));
  g.add(box(.025, .24, L + .06, lam, side * (W + OV + .015), yS + .08, 0)); // planche de rive
  // sous-face des débords de pignon : ferme le dessous du toit entre le mur et la rive
  const fr = new THREE.Group(); fr.position.set(0, RIDGE, 0); fr.rotation.z = -P * side; if (side < 0) fr.scale.x = -1;
  [-1, 1].forEach(zs => fr.add(box(S, .018, (L - LW) / 2 + .01, lam, S / 2, -.012, zs * (LW / 2 + (L - LW) / 4))));
  g.add(fr);
  // planches de rive des pignons : coupées d'aplomb au faîtage, elles se rejoignent sans se croiser
  const X = W + OV + .03, yt = x => RIDGE + .33 / Math.cos(P) - x * Math.tan(P), th = .4 / Math.cos(P);
  const sh = new THREE.Shape(); sh.moveTo(0, yt(0)); sh.lineTo(X, yt(X)); sh.lineTo(X, yt(X) - th); sh.lineTo(0, yt(0) - th); sh.closePath();
  [-1, 1].forEach(zs => {
    const m = mk(new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: false }), lam);
    m.scale.x = side; m.position.z = zs * (L / 2 + .016) - .015; g.add(m);
  });
  return g;
}
function buildBardage() {
  const g = new THREE.Group(), m = M({ map: TEX.wood('#8a8d8f', 'bd'), roughness: .75 }), z = LW / 2 + .03;
  for (let x = -W + .08; x <= W - .07; x += .15) {
    const top = RIDGE - Math.abs(x) * Math.tan(P) - .05, h = top - H;
    if (h < .06) continue; g.add(box(.13, h, .025, m, x, H + h / 2, z + ((Math.round(x / .15) % 2) ? .008 : 0)));
  }
  g.add(box(2 * W, .1, .05, M({ color: '#6c6f71' }), 0, H + .02, z + .01));
  return g;
}
function buildGarden(scene) {
  const lawn = mk(new THREE.CircleGeometry(48, 64), M({ map: TEX.lawn(), roughness: 1, color: '#9fb08a' }), false);
  lawn.rotation.x = -Math.PI / 2; scene.add(lawn);
  const path = mk(new THREE.BoxGeometry(1.2, .03, 4.5), M({ map: repeatTex(TEX.gravel(), 1, 4), roughness: 1 }), false); path.position.set(-1.55, .02, LW / 2 + 2.85); scene.add(path);
  const r = rng(4), leaf = [M({ color: '#4e6b3a', roughness: .9 }), M({ color: '#5d7a44', roughness: .9 }), M({ color: '#3f5a31', roughness: .9 })];
  const bush = (x, z, s) => { const b = new THREE.Group(); for (let i = 0; i < 4; i++) { const m = mk(new THREE.IcosahedronGeometry(s * (.6 + r() * .4), 1), leaf[i % 3]); m.position.set((r() - .5) * s, s * .5 + r() * s * .3, (r() - .5) * s); b.add(m); } b.position.set(x, 0, z); scene.add(b); };
  [[-3.8, 2.4, .55], [-3.7, .9, .45], [-3.9, -1.5, .6], [-1.2, -4.1, .5], [1.5, -4.2, .65], [4.2, -3.3, .5]].forEach(a => bush(...a));
  const tree = new THREE.Group(); tree.add(box(.22, 2.2, .22, M({ color: '#5b4632' }), 0, 1.1, 0));
  [[0, 2.8, 0, 1.2], [.6, 2.4, .3, .9], [-.5, 2.5, -.3, .95], [.1, 3.4, .1, .8]].forEach(([x, y, z, s], i) => { const c = mk(new THREE.IcosahedronGeometry(s, 1), leaf[i % 3]); c.position.set(x, y, z); tree.add(c); });
  tree.position.set(-6.2, 0, -4.4); scene.add(tree);
}

// ---------------------------------------------------------------- scène
const OFFS = {
  solaire: ['p', new THREE.Vector3(-.2, 3.9, 0)], fenetre: ['p', new THREE.Vector3(.2, 3.1, 0)], conduit: ['w', NORMAL.clone().multiplyScalar(2.7)],
  tuiles: ['p', new THREE.Vector3(0, 2.45, 0)], zinguerie: ['w', new THREE.Vector3(1.7, -.25, 0)], debord: ['w', new THREE.Vector3(1.0, -1.0, 0)],
  bardage: ['w', new THREE.Vector3(0, 0, 1.9)], liteaux: ['p', new THREE.Vector3(0, 1.65, 0)], ecran: ['p', new THREE.Vector3(0, 1.08, 0)],
  isolant: ['p', new THREE.Vector3(0, .55, 0)], charpente: ['p', new THREE.Vector3(0, 0, 0)],
};
const ANCH = {
  solaire: ['p', 2.9, .7, -3.4], fenetre: ['p', 2.0, .62, 2.0], conduit: ['w', .76, 6.25, 3.0], tuiles: ['p', 3.4, .45, .2],
  zinguerie: ['w', 3.7, 2.66, -1.6], debord: ['w', 3.25, 2.62, -2.6], bardage: ['w', -1.3, 3.85, LW / 2 + .05], liteaux: ['p', 3.6, .33, 3.1],
  ecran: ['p', 3.95, .2, 1.2], isolant: ['p', 3.3, .2, -.7], charpente: ['p', 3.9, .12, -2.6],
};
// cadrages de caméra : intro, une vue par couche, vue d'ensemble
const KF = {
  intro: [[13.5, 7, 16], [.6, 3, 0]], solaire: [[11, 14, 14], [3, 7.2, -1.4]], fenetre: [[10, 11.5, 15], [2.8, 6.6, 1.4]],
  conduit: [[8, 10.5, 15.5], [2, 6.4, 2.4]], tuiles: [[12.5, 10.5, 15.5], [2.8, 5.8, 0]], zinguerie: [[12.5, 5, 12], [4.6, 2.8, .4]],
  debord: [[11, 1.6, 11.5], [3.8, 2.5, 0]], bardage: [[2, 5, 16.5], [0, 4.2, 3.6]], liteaux: [[11.5, 10, 14.5], [2.6, 5.4, 0]],
  ecran: [[11, 9.5, 14.2], [2.4, 5.1, 0]], isolant: [[10.4, 9, 13.6], [2.2, 4.8, 0]], charpente: [[9.8, 8.4, 13], [1.9, 4.5, 0]],
  overview: [[17, 11.5, 20], [2.2, 4.6, .4]],
};
const PRODUCT = { solaire: 'solaire', fenetre: 'fenetre', conduit: 'sortie', tuiles: 'tuile', zinguerie: 'gouttiere', debord: 'lambris', bardage: 'bardage', liteaux: 'liteau', ecran: 'ecran', isolant: 'rouleau', charpente: 'chevron' };

export function initHouse(LAYERS) {
  const stage = document.getElementById('stage'), canvas = document.getElementById('roof');
  const listEl = document.getElementById('layerList'), detailEl = document.getElementById('detail'), tagsEl = document.getElementById('tags');
  const N = LAYERS.length;
  listEl.innerHTML = LAYERS.map((l, i) => `<li><button type="button" data-i="${i}">${l.name}</button></li>`).join('');
  const tagEls = LAYERS.map(l => { const a = document.createElement('a'); a.className = 'tag'; a.href = 'rayon-' + l.cat + '.html'; a.textContent = l.name; a.title = 'Voir le rayon ' + l.name.toLowerCase(); a.tabIndex = -1; tagsEl.appendChild(a); return a; });

  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#23282C'); scene.fog = new THREE.Fog('#23282C', 24, 44);
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
  scene.add(new THREE.HemisphereLight('#e6eef4', '#3b3a30', .65));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.6); sun.position.set(10, 17, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; scene.add(sun);
  const rim = new THREE.DirectionalLight('#a9bfd1', .6); rim.position.set(-10, 6, -8); scene.add(rim);

  buildGarden(scene);
  const house = new THREE.Group(); scene.add(house);
  buildWalls(house); placeOpenings(house);
  const right = makePitch(true); right.g.position.set(0, RIDGE, 0); right.g.rotation.z = -P; house.add(right.g);
  const left = makePitch(false); left.g.position.set(0, RIDGE, 0); left.g.rotation.z = P; left.g.scale.x = -1; house.add(left.g);
  house.add(buildGutter(-1), buildDebord(-1));
  const backBard = buildBardage(); backBard.rotation.y = Math.PI; house.add(backBard);
  const world = { conduit: buildChimney(), zinguerie: buildGutter(1), debord: buildDebord(1), bardage: buildBardage() };
  Object.values(world).forEach(o => house.add(o));
  const LAY = { ...right.layers, ...world };

  // matériaux propres à chaque couche (pour la surbrillance)
  const mats = {}, pick = [];
  for (const [k, grp] of Object.entries(LAY)) {
    const set = new Map();
    grp.traverse(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; const cl = ms.map(m => { if (!set.has(m)) set.set(m, m.clone()); return set.get(m); }); o.material = Array.isArray(o.material) ? cl : cl[0]; o.userData.layer = k; pick.push(o); } });
    mats[k] = [...set.values()];
  }
  const glow = (k, v) => mats[k] && mats[k].forEach(m => { m.emissive = m.emissive || new THREE.Color(); m.emissive.set('#ff3b30'); m.emissiveIntensity = v; });

  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const keys = ['intro', ...LAYERS.map(l => l.key), 'overview'].map(k => KF[k]);
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  let s = -0.6, hovered = null, active = -2, dirty = 6, visible = true;

  function setActive(i) {
    if (i === active) return; active = i;
    const L0 = i < 0 ? { name: 'Une toiture complète', txt: 'Tout ce que vous voyez ici se trouve dans nos dépôts, de la charpente aux panneaux solaires. Faites défiler pour l’ouvrir.', brands: '' }
      : i >= N ? { name: 'Tout en un seul endroit', txt: 'Onze couches, plus de 80 fournisseurs, trois dépôts. Cliquez sur une étiquette pour ouvrir le rayon, ou sur un élément pour le voir en 3D.', brands: '', cat: 'devis' } : LAYERS[i];
    detailEl.classList.add('out');
    setTimeout(() => {
      detailEl.innerHTML = `<h3>${L0.name}</h3><p>${L0.txt}</p>${L0.brands ? `<p class="brands-t">${L0.brands}</p>` : ''}` +
        (L0.cat === 'devis' ? '<div class="d-acts"><a href="contact.html#devis">Demander un devis</a></div>' : L0.cat ? `<div class="d-acts"><button type="button" class="see3d" data-k="${L0.key}">Voir en 3D</button><a href="rayon-${L0.cat}.html">Voir le rayon</a></div>` : '');
      detailEl.classList.remove('out');
    }, reduceMotion ? 0 : 160);
    [...listEl.children].forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', i >= N || k < i); });
    document.getElementById('progress').textContent = i < 0 ? '' : i >= N ? 'Vue d’ensemble' : `Couche ${i + 1} sur ${N}`;
  }

  function frame() {
    // ouverture des couches
    LAYERS.forEach((l, i) => {
      const t = easeInOut(clamp(s - i)), [, off] = OFFS[l.key], g = LAY[l.key];
      if (g) g.position.copy(off).multiplyScalar(t);
    });
    // caméra : interpolation entre cadrages
    const u = clamp(s + .55, 0, keys.length - 1), a = Math.floor(u), b = Math.min(a + 1, keys.length - 1), f = sm(u - a);
    tmpA.fromArray(keys[a][0]).lerp(tmpB.fromArray(keys[b][0]), f); camPos.copy(tmpA);
    tmpA.fromArray(keys[a][1]).lerp(tmpB.fromArray(keys[b][1]), f); camTgt.copy(tmpA);
    const w = stage.clientWidth, h = stage.clientHeight, aspect = w / h;
    const back = aspect < .9 ? 1.75 : aspect < 1.3 ? 1.25 : 1;
    camera.position.copy(camTgt).add(camPos.sub(camTgt).multiplyScalar(back));
    if (aspect < .9) camera.position.y += 1.2;
    scene.fog.near = 24 * back; scene.fog.far = 44 * back;
    par.x += (par.tx - par.x) * .08; par.y += (par.ty - par.y) * .08;
    camera.position.x += par.x * .6; camera.position.y += par.y * .4;
    camera.lookAt(camTgt);
    if (w >= 860) camera.setViewOffset(w, h, -w * .15, 0, w, h); else camera.setViewOffset(w, h, 0, h * .17, w, h);
    if (DEBUG && window.__houseCam) { const o = window.__houseCam; camera.clearViewOffset(); camera.position.fromArray(o[0]); camera.lookAt(new THREE.Vector3().fromArray(o[1])); if (o[2]) s = o[2]; }
    const idx = s < 0 ? -1 : Math.min(N, Math.floor(s)); setActive(idx);
    LAYERS.forEach(l => glow(l.key, l.key === hovered ? .22 : 0));
    document.getElementById('hint').style.opacity = s > -.4 ? 0 : 1;
    // étiquettes
    const mobile = w < 860, p = new THREE.Vector3();
    LAYERS.forEach((l, i) => {
      const [sp, x, y, z] = ANCH[l.key]; p.set(x, y, z);
      if (sp === 'p') LAY[l.key].localToWorld(p); else { p.add(LAY[l.key].position); house.localToWorld(p); }
      p.project(camera);
      const el = tagEls[i], t = clamp(s - i), show = (t > .55 && (!mobile || idx === i)) || (s >= N && !mobile);
      el.classList.toggle('show', show); el.classList.toggle('active', idx === i || l.key === hovered);
      el.tabIndex = show ? 0 : -1;
      el.style.transform = `translate(${(p.x * .5 + .5) * w}px,${(-p.y * .5 + .5) * h}px) translate(-12px,-100%)`;
    });
    renderer.render(scene, camera);
    return Math.abs(par.tx - par.x) > .002 || Math.abs(par.ty - par.y) > .002;
  }

  function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = 3; }
  addEventListener('resize', resize); resize();
  new IntersectionObserver(e => { visible = e[0].isIntersecting; dirty = 3; }, { rootMargin: '120px' }).observe(stage);
  if (DEBUG) window.__houseRedraw = () => { dirty = 6; };
  (function loop() { requestAnimationFrame(loop); if (!visible || dirty <= 0) return; dirty--; if (frame()) dirty = Math.max(dirty, 1); })();

  // interactions : survol et clic sur les éléments 3D
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function hit(e) {
    const r = canvas.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera); const h = ray.intersectObjects(pick, false)[0]; return h ? h.object.userData.layer : null;
  }
  canvas.addEventListener('pointermove', e => {
    if (finePointer && !reduceMotion) { const r = canvas.getBoundingClientRect(); par.tx = ((e.clientX - r.left) / r.width - .5); par.ty = -((e.clientY - r.top) / r.height - .5); }
    const k = e.pointerType === 'mouse' ? hit(e) : null;
    if (k !== hovered) { hovered = k; canvas.style.cursor = k ? 'pointer' : ''; }
    dirty = 4;
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; par.tx = par.ty = 0; dirty = 30; });
  canvas.addEventListener('click', e => { const k = hit(e); if (k) openViewer({ type: 'proc', id: PRODUCT[k] }); });
  tagEls.forEach((el, i) => { el.addEventListener('mouseenter', () => { hovered = LAYERS[i].key; dirty = 4; }); el.addEventListener('mouseleave', () => { hovered = null; dirty = 4; }); });
  detailEl.addEventListener('click', e => { const b = e.target.closest('.see3d'); if (b) openViewer({ type: 'proc', id: PRODUCT[b.dataset.k] }); });

  // défilement : la scène est épinglée pendant l'ouverture
  const spanFor = () => innerHeight * (N * .7 + 1.2);
  let st = null;
  if (reduceMotion || !window.ScrollTrigger) { s = N + .6; dirty = 40; }
  else {
    gsap.registerPlugin(ScrollTrigger);
    st = ScrollTrigger.create({ trigger: stage, start: 'top 68px', end: () => '+=' + spanFor(), pin: true, scrub: .7, onUpdate: self => { s = self.progress * (N + 1.3) - .6; dirty = 8; } });
  }
  // liste des couches : aller directement à une couche
  listEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const i = +b.dataset.i;
    if (st) { const y = st.start + (i + .62 + .6) / (N + 1.3) * (st.end - st.start); window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' }); }
    else openViewer({ type: 'proc', id: PRODUCT[LAYERS[i].key] });
  });
  setActive(-1);
}
