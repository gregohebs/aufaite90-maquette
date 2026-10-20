// Modèles 3D des produits : modèles procéduraux (vrais volumes) et détourés extrudés (photo + épaisseur).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TEX, MAT, rng } from './common.js';

export const RAYONS = {
  debord: 'Débord de toit & Structure', couverture: 'Couverture', etancheite: 'Étanchéité & Isolation',
  zinguerie: 'Quincaillerie & Zinguerie', bardage: 'Bardage & Revêtements', solaire: 'Panneaux Solaires',
  fenetres: 'Fenêtres, Exutoires & Conduits', outillage: 'Outillage & Sécurité', loisirs: 'Loisirs : Piscine & Spa',
};
export const RAYON_ORDER = ['couverture', 'zinguerie', 'etancheite', 'debord', 'bardage', 'fenetres', 'solaire', 'outillage', 'loisirs'];

const M = (o) => new THREE.MeshStandardMaterial(o);
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const wood = (tone, key) => M({ map: TEX.wood(tone, key), roughness: .8 });

// ---------- géométries réutilisables
export function tileGeometry(w = 0.25, len = 0.42) {
  // tuile mécanique : profil à deux côtes extrudé sur la longueur
  const pts = [], n = 28, th = 0.014;
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + w * i / n, u = (x + w / 2) / w;
    const rib = Math.exp(-Math.pow((u - .3) / .06, 2)) + Math.exp(-Math.pow((u - .7) / .06, 2));
    pts.push([x, 0.012 * Math.sin(u * Math.PI) + 0.022 * rib]);
  }
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  pts.forEach(p => s.lineTo(p[0], p[1]));
  for (let i = n; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1] - th);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, steps: 1 });
  g.translate(0, 0, -len / 2);
  return g;
}
function profileSheet(w, len, ribs, h, th = 0.006, trap = true) {
  const s = new THREE.Shape(), p = [], step = w / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = -w / 2 + i * step;
    if (trap) { p.push([x, 0], [x + step * .3, 0], [x + step * .42, h], [x + step * .58, h], [x + step * .7, 0]); }
    else { for (let k = 0; k < 8; k++) p.push([x + step * k / 8, h / 2 * (1 - Math.cos(2 * Math.PI * k / 8))]); }
  }
  p.push([w / 2, 0]);
  s.moveTo(p[0][0], p[0][1]); p.forEach(q => s.lineTo(q[0], q[1]));
  for (let i = p.length - 1; i >= 0; i--) s.lineTo(p[i][0], p[i][1] + th);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2); return g;
}
export function gutterGeometry(r = 0.075, len = 1, th = 0.004) {
  const s = new THREE.Shape();
  const N = 24;
  for (let i = 0; i <= N; i++) { const a = Math.PI + Math.PI * i / N; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const a = Math.PI + Math.PI * i / N; s.lineTo(Math.cos(a) * (r - th), Math.sin(a) * (r - th)); }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 4 });
  // ourlet
  const tube = new THREE.CylinderGeometry(0.009, 0.009, len, 10); tube.rotateX(Math.PI / 2); tube.translate(r + 0.004, 0.006, len / 2);
  const merged = mergeGeometries([g.toNonIndexed(), tube.toNonIndexed()]);
  merged.translate(0, 0, -len / 2);
  return merged;
}

// ---------- modèles procéduraux
const B = {};
B.tuile = () => { const g = new THREE.Group(); const m = M({ color: '#b2502f', roughness: .65, map: TEX.terracotta() }); const t = mesh(tileGeometry(.25, .42), m); t.rotation.x = -.15; g.add(t); const nib = mesh(new THREE.BoxGeometry(.06, .02, .025), m); nib.position.set(0, -.01, -.21); g.add(nib); return g; };
B.ardoise = () => { const g = new THREE.Group(); const s = new THREE.Shape(); const w = .15, h = .25, c = .012; s.moveTo(-w + c, -h); s.lineTo(w - c, -h); s.lineTo(w, -h + c); s.lineTo(w, h); s.lineTo(-w, h); s.lineTo(-w, -h + c); s.closePath(); const geo = new THREE.ExtrudeGeometry(s, { depth: .007, bevelEnabled: true, bevelThickness: .001, bevelSize: .002, bevelSegments: 1 }); const m = M({ map: TEX.slate(), roughness: .85, color: '#ffffff' }); for (let i = 0; i < 3; i++) { const x = mesh(geo, m); x.rotation.x = -Math.PI / 2; x.position.set(i * .04 - .04, i * .012, i * .05); x.rotation.z = (i - 1) * .06; g.add(x); } return g; };
B.faitiere = () => { const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(.13, .15, .45, 28, 1, true, 0, Math.PI); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2); const m = M({ color: '#a8472b', roughness: .6, side: THREE.DoubleSide, map: TEX.terracotta() }); g.add(mesh(geo, m)); return g; };
B.bac = () => { const g = new THREE.Group(); const m = M({ color: '#7b2b22', metalness: .45, roughness: .45, side: THREE.DoubleSide }); g.add(mesh(profileSheet(1, 1.4, 4, .045), m)); return g; };
B.sandwich = () => { const g = new THREE.Group(); const steel = M({ color: '#5a6066', metalness: .5, roughness: .45, side: THREE.DoubleSide }); g.add(mesh(profileSheet(1, 1.2, 3, .04), steel)); const core = mesh(new THREE.BoxGeometry(1, .08, 1.2), M({ color: '#e8d48a', roughness: .9 })); core.position.y = -.042; g.add(core); const bot = mesh(new THREE.BoxGeometry(1, .004, 1.2), M({ color: '#e9eceb', metalness: .4, roughness: .5 })); bot.position.y = -.084; g.add(bot); return g; };
B.chevron = () => { const g = new THREE.Group(); const m = wood('#c99a62', 'c'); [-.06, .06].forEach((x, i) => { const b = mesh(new THREE.BoxGeometry(.075, .16, 1.5), m); b.position.set(x, 0, i * .1); g.add(b); }); return g; };
B.liteau = () => { const g = new THREE.Group(); const m = wood('#a98a55', 'l'); for (let i = 0; i < 9; i++) { const b = mesh(new THREE.BoxGeometry(.038, .027, 1.6), m); b.position.set((i % 3) * .042 - .042, Math.floor(i / 3) * .03, 0); g.add(b); } const strap = mesh(new THREE.BoxGeometry(.14, .1, .02), M({ color: '#2b2f33', roughness: .6 })); strap.position.set(0, .03, .4); g.add(strap); const s2 = strap.clone(); s2.position.z = -.4; g.add(s2); return g; };
B.lambris = () => { const g = new THREE.Group(); const m = M({ color: '#f2f1ec', roughness: .45 }); for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(.118, .016, 1.4), m); b.position.set(i * .122 - .244, 0, 0); g.add(b); const gr = mesh(new THREE.BoxGeometry(.006, .006, 1.4), M({ color: '#cfcfca' })); gr.position.set(i * .122 - .244 + .061, .006, 0); g.add(gr); } return g; };
B.osb = () => { const g = new THREE.Group(); const m = M({ map: TEX.osb(), roughness: .85 }); for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(.62, .018, 1.25), m); b.position.set(i * .01, i * .019, i * .01); g.add(b); } return g; };
B.lamelle = () => { const g = new THREE.Group(); const m = wood('#d6ab73', 'lc'); const b = mesh(new THREE.BoxGeometry(.14, .36, 1.6), m); g.add(b); for (let i = 1; i < 9; i++) { const l = mesh(new THREE.BoxGeometry(.142, .002, 1.6), M({ color: '#9c7445' })); l.position.y = -.18 + i * .04; g.add(l); } return g; };
B.rouleau = () => { const g = new THREE.Group(); const side = M({ map: TEX.wool(), roughness: 1 }); const cap = M({ map: TEX.spiral(), roughness: 1 }); const c = mesh(new THREE.CylinderGeometry(.24, .24, .6, 40), [side, cap, cap]); c.rotation.z = Math.PI / 2; g.add(c); const film = mesh(new THREE.CylinderGeometry(.243, .243, .44, 40, 1, true), M({ color: '#ffffff', transparent: true, opacity: .35, roughness: .2, side: THREE.DoubleSide })); film.rotation.z = Math.PI / 2; g.add(film); const band = mesh(new THREE.CylinderGeometry(.245, .245, .12, 40, 1, true), M({ color: '#d32a2a', roughness: .5, side: THREE.DoubleSide })); band.rotation.z = Math.PI / 2; g.add(band); return g; };
B.pu = () => { const g = new THREE.Group(); const alu = M({ color: '#d7dbdd', metalness: .8, roughness: .3 }); const core = M({ color: '#e9d68f', roughness: .9 }); for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(.6, .08, 1.2), [core, core, alu, alu, core, core]); b.position.set(i * .015, i * .082, -i * .01); g.add(b); } return g; };
B.ecran = () => { const g = new THREE.Group(); const m = M({ map: TEX.screen(), roughness: .6, side: THREE.DoubleSide }); const r = mesh(new THREE.CylinderGeometry(.09, .09, 1.2, 32), m); r.rotation.z = Math.PI / 2; r.position.set(0, .09, -.35); g.add(r); const sheet = mesh(new THREE.PlaneGeometry(1.2, .8, 1, 8), m); sheet.rotation.x = -Math.PI / 2; sheet.position.set(0, .002, .05); g.add(sheet); return g; };
B.bitume = () => { const g = new THREE.Group(); const m = M({ color: '#1f2224', roughness: .9 }); const c = mesh(new THREE.CylinderGeometry(.13, .13, 1, 36), [m, M({ color: '#2c2f31' }), M({ color: '#2c2f31' })]); g.add(c); const lbl = mesh(new THREE.CylinderGeometry(.132, .132, .18, 36, 1, true), M({ color: '#e8e8e2', roughness: .5 })); g.add(lbl); return g; };
B.gouttiere = () => { const g = new THREE.Group(); const z = MAT.zinc(); const gu = mesh(gutterGeometry(.075, 1.2), z); g.add(gu); [-0.4, 0.4].forEach(zz => { const h = mesh(new THREE.TorusGeometry(.078, .006, 6, 18, Math.PI), MAT.galva()); h.rotation.z = Math.PI; h.position.z = zz; g.add(h); const strap = mesh(new THREE.BoxGeometry(.025, .004, .2), MAT.galva()); strap.position.set(-.09, .02, zz); strap.rotation.z = .2; g.add(strap); }); return g; };
B.descente = () => { const g = new THREE.Group(); const z = MAT.zinc(); const p = mesh(new THREE.CylinderGeometry(.05, .05, 1.1, 28, 1, true), z); g.add(p); const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, .55, 0), new THREE.Vector3(0, .7, 0), new THREE.Vector3(.12, .85, 0), new THREE.Vector3(.14, .95, 0)]); const e = mesh(new THREE.TubeGeometry(curve, 20, .05, 20, false), z); g.add(e); const col = mesh(new THREE.TorusGeometry(.056, .008, 8, 24), MAT.galva()); col.rotation.x = Math.PI / 2; col.position.y = .1; g.add(col); const dau = mesh(new THREE.CylinderGeometry(.06, .07, .3, 24), M({ color: '#2b2f33', metalness: .5, roughness: .5 })); dau.position.y = -.68; g.add(dau); return g; };
B.crochet = () => { const g = new THREE.Group(); const m = MAT.galva(); const a = mesh(new THREE.TorusGeometry(.08, .006, 6, 24, Math.PI), m); a.rotation.z = Math.PI; g.add(a); const b = mesh(new THREE.BoxGeometry(.25, .004, .025), m); b.position.set(-.2, 0, 0); g.add(b); const t = mesh(new THREE.BoxGeometry(.004, .03, .025), m); t.position.set(.08, .015, 0); g.add(t); return g; };
B.fenetre = () => { const g = new THREE.Group(); const fr = mesh(new THREE.BoxGeometry(.78, .1, 1.18), MAT.alu()); g.add(fr); const sash = mesh(new THREE.BoxGeometry(.68, .06, 1.06), M({ color: '#5b4632', roughness: .6 })); sash.position.y = .05; g.add(sash); const gl = mesh(new THREE.BoxGeometry(.6, .02, .96), MAT.glass()); gl.position.y = .085; g.add(gl); const fl = mesh(new THREE.BoxGeometry(.96, .012, 1.38), MAT.alu()); fl.position.y = -.045; g.add(fl); const bar = mesh(new THREE.BoxGeometry(.5, .03, .05), MAT.alu()); bar.position.set(0, .1, .52); g.add(bar); return g; };
B.sortie = () => { const g = new THREE.Group(); const m = M({ color: '#9e4a32', roughness: .7, map: TEX.terracotta() }); const b = mesh(new THREE.BoxGeometry(.42, .9, .42), m); b.position.y = .45; g.add(b); const cap = mesh(new THREE.BoxGeometry(.52, .05, .52), m); cap.position.y = .95; g.add(cap); const top = mesh(new THREE.ConeGeometry(.33, .14, 4), m); top.rotation.y = Math.PI / 4; top.position.y = 1.06; g.add(top); const pipe = mesh(new THREE.CylinderGeometry(.08, .08, .5, 24), M({ color: '#dfe3e5', metalness: .95, roughness: .2 })); pipe.position.y = -.2; g.add(pipe); const base = mesh(new THREE.BoxGeometry(.7, .02, .7), MAT.alu()); g.add(base); return g; };
B.solaire = () => { const g = new THREE.Group(); const pv = mesh(new THREE.BoxGeometry(1, .035, 1.65), [MAT.galva(), MAT.galva(), M({ map: TEX.solar(), metalness: .5, roughness: .2 }), M({ color: '#cfd5d8' }), MAT.galva(), MAT.galva()]); pv.position.y = .08; g.add(pv); [-.45, .45].forEach(z => { const r = mesh(new THREE.BoxGeometry(1.15, .04, .04), MAT.galva()); r.position.set(0, .04, z); g.add(r); }); return g; };
B.bardage = () => { const g = new THREE.Group(); const m = M({ map: TEX.wood('#7e8285', 'bd'), roughness: .75 }); for (let i = 0; i < 6; i++) { const b = mesh(new THREE.BoxGeometry(.13, 1.5, .022), m); b.position.set(i * .145 - .36, 0, (i % 2) * .006); g.add(b); } return g; };
B.clin = () => { const g = new THREE.Group(); const m = M({ color: '#b9b2a6', roughness: .8, map: TEX.gravel() }); for (let i = 0; i < 7; i++) { const b = mesh(new THREE.BoxGeometry(1.4, .19, .012), m); b.position.set(0, i * .17, i * .0); b.rotation.x = -.06; g.add(b); } return g; };
B.facade = () => { const g = new THREE.Group(); const s = M({ color: '#d0d4d6', metalness: .5, roughness: .45, side: THREE.DoubleSide }); const p = mesh(profileSheet(1, 1.6, 6, .02), s); p.rotation.x = Math.PI / 2; p.rotation.z = Math.PI / 2; g.add(p); return g; };
B.piscine = () => { const g = new THREE.Group(); const stone = M({ color: '#e7e1d5', roughness: .9, map: TEX.gravel() }); const W = 1.6, Lg = 2.6; [[0, Lg / 2 + .08, W + .32, .16], [0, -Lg / 2 - .08, W + .32, .16]].forEach(([x, z, w, d]) => { const b = mesh(new THREE.BoxGeometry(w, .06, d), stone); b.position.set(x, 0, z); g.add(b); }); [[W / 2 + .08], [-W / 2 - .08]].forEach(([x]) => { const b = mesh(new THREE.BoxGeometry(.16, .06, Lg), stone); b.position.set(x, 0, 0); g.add(b); }); const basin = mesh(new THREE.BoxGeometry(W, .6, Lg), M({ color: '#9fc9d6', roughness: .4, side: THREE.BackSide })); basin.position.y = -.31; g.add(basin); const w = mesh(new THREE.PlaneGeometry(W, Lg), M({ map: TEX.water(), transparent: true, opacity: .85, roughness: .05, metalness: .1 })); w.rotation.x = -Math.PI / 2; w.position.y = -.05; g.add(w); return g; };
B.spa = () => { const g = new THREE.Group(); const sh = new THREE.Shape(); const r = .1, w = .9; sh.moveTo(-w + r, -w); sh.lineTo(w - r, -w); sh.quadraticCurveTo(w, -w, w, -w + r); sh.lineTo(w, w - r); sh.quadraticCurveTo(w, w, w - r, w); sh.lineTo(-w + r, w); sh.quadraticCurveTo(-w, w, -w, w - r); sh.lineTo(-w, -w + r); sh.quadraticCurveTo(-w, -w, -w + r, -w); const hole = new THREE.Path(); hole.absarc(0, 0, .72, 0, Math.PI * 2, true); sh.holes.push(hole); const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: .8, bevelEnabled: false }), M({ map: TEX.wood('#6b5a4a', 'spa'), roughness: .7 })); body.rotation.x = -Math.PI / 2; g.add(body); const water = mesh(new THREE.CircleGeometry(.72, 40), M({ map: TEX.water(), roughness: .05 })); water.rotation.x = -Math.PI / 2; water.position.y = .7; g.add(water); return g; };
B.sauna = () => { const g = new THREE.Group(); const m = M({ map: TEX.wood('#b98552', 'sa'), roughness: .75 }); const box = mesh(new THREE.BoxGeometry(1.4, 1.9, 1.2), m); box.position.y = .95; g.add(box); const door = mesh(new THREE.BoxGeometry(.6, 1.6, .03), M({ color: '#9fb4bd', metalness: .6, roughness: .08, transparent: true, opacity: .55 })); door.position.set(.2, .85, .61); g.add(door); const roof = mesh(new THREE.BoxGeometry(1.5, .06, 1.3), m); roof.position.y = 1.93; g.add(roof); return g; };
B.chlore = () => { const g = new THREE.Group(); const b = mesh(new THREE.CylinderGeometry(.18, .16, .38, 32), M({ color: '#f4f6f7', roughness: .4 })); b.position.y = .19; g.add(b); const lid = mesh(new THREE.CylinderGeometry(.19, .19, .05, 32), M({ color: '#1f6fb5', roughness: .4 })); lid.position.y = .4; g.add(lid); const lb = mesh(new THREE.CylinderGeometry(.182, .172, .14, 32, 1, true), M({ color: '#2b8bd1', roughness: .5 })); lb.position.y = .18; g.add(lb); return g; };
B.palette = () => { const g = new THREE.Group(); const m = wood('#c9a26c', 'pal'); for (let i = 0; i < 7; i++) { const p = mesh(new THREE.BoxGeometry(.1, .022, .8), m); p.position.set(-0.54 + i * .18, .122, 0); g.add(p); } [-0.35, 0, 0.35].forEach(z => { const s = mesh(new THREE.BoxGeometry(1.2, .022, .1), m); s.position.set(0, .1, z); g.add(s); [-0.55, 0, 0.55].forEach(x => { const d = mesh(new THREE.BoxGeometry(.1, .078, .1), m); d.position.set(x, .05, z); g.add(d); }); }); for (let i = 0; i < 3; i++) { const p = mesh(new THREE.BoxGeometry(.1, .022, .8), m); p.position.set(-0.55 + i * .55, .011, 0); g.add(p); } return g; };

// catalogue des modèles procéduraux : id -> fiche
export const PROC = {
  tuile: { name: 'Tuile mécanique terre cuite', rayon: 'couverture', brand: 'Terreal, Koramic, Edilians', desc: 'Tuile à emboîtement à deux côtes, pour la rénovation comme pour le neuf.' },
  ardoise: { name: 'Ardoise naturelle', rayon: 'couverture', brand: 'Cupa Pizarras', desc: 'Ardoise naturelle à épaufrures, pose aux crochets.' },
  faitiere: { name: 'Faîtière', rayon: 'couverture', brand: 'Terreal, Koramic', desc: 'Pour couvrir le faîtage et les arêtiers, assortie aux tuiles.' },
  bac: { name: 'Bac acier nervuré', rayon: 'couverture', brand: 'ArcelorMittal, Joris Ide, Bacacier', desc: 'Tôle d’acier laqué pour bâtiments, abris et extensions.' },
  sandwich: { name: 'Panneau sandwich', rayon: 'couverture', brand: 'Joris Ide, ArcelorMittal', desc: 'Deux parements acier et une âme isolante : couverture et isolation en une seule pose.' },
  chevron: { name: 'Chevrons', rayon: 'debord', brand: 'Scierie Weber', desc: 'Bois de charpente sur liste, à la longueur.' },
  liteau: { name: 'Botte de liteaux', rayon: 'debord', brand: 'Scierie Weber, W Distribution Bois', desc: 'Liteaux traités pour la pose des tuiles et la ventilation.' },
  lambris: { name: 'Lambris de sous-face PVC', rayon: 'debord', brand: 'MEP, Deceuninck', desc: 'Pour habiller le dessous des débords de toit sans entretien.' },
  osb: { name: 'Panneaux OSB', rayon: 'debord', brand: '', desc: 'Panneaux de contreventement et de plancher.' },
  lamelle: { name: 'Poutre lamellé-collé', rayon: 'debord', brand: '', desc: 'Grandes portées, bois stable et sans torsion.' },
  rouleau: { name: 'Rouleau de laine minérale', rayon: 'etancheite', brand: 'Rockwool, Isover', desc: 'Isolation des combles et des rampants.' },
  pu: { name: 'Panneaux PU parement alu', rayon: 'etancheite', brand: 'IKO, Knauf, Unilin', desc: 'Isolant rigide à forte performance, pour sarking, murs et sols.' },
  ecran: { name: 'Écran sous-toiture HPV', rayon: 'etancheite', brand: 'Soprema, Siplast', desc: 'Protège l’isolant de l’eau tout en laissant sortir la vapeur.' },
  bitume: { name: 'Membrane bitume', rayon: 'etancheite', brand: 'Siplast, Soprema', desc: 'Étanchéité des toitures-terrasses et des relevés.' },
  gouttiere: { name: 'Gouttière demi-ronde', rayon: 'zinguerie', brand: 'VMZinc, Rheinzink', desc: 'En zinc naturel, anthracite ou quartz, galva, acier laqué ou cuivre.' },
  descente: { name: 'Descente et coude', rayon: 'zinguerie', brand: 'VMZinc, Rheinzink', desc: 'Tuyau de descente, coude cintré, collier et dauphin.' },
  crochet: { name: 'Crochet de gouttière', rayon: 'zinguerie', brand: '', desc: 'Crochets H98, emboutis ou Alsace, galvanisés.' },
  fenetre: { name: 'Fenêtre de toit', rayon: 'fenetres', brand: 'Velux, Roto', desc: 'Avec son raccord d’étanchéité, volets et stores en option.' },
  sortie: { name: 'Sortie de toit et conduit', rayon: 'fenetres', brand: 'Poujoulat', desc: 'Sortie de toit et conduit de fumée isolé inox.' },
  solaire: { name: 'Panneau photovoltaïque', rayon: 'solaire', brand: 'Terreal, Prefa', desc: 'Module en surimposition sur rails, ou intégré à la couverture.' },
  bardage: { name: 'Lames de bardage', rayon: 'bardage', brand: 'Vinylit, Deceuninck', desc: 'Pour habiller pignons et façades.' },
  clin: { name: 'Clins fibre-ciment', rayon: 'bardage', brand: 'Cedral', desc: 'Bardage à recouvrement, teinté dans la masse.' },
  facade: { name: 'Profil de bardage acier', rayon: 'bardage', brand: 'Joris Ide, ArcelorMittal', desc: 'Bardage métallique pour bâtiments professionnels.' },
  piscine: { name: 'Piscine', rayon: 'loisirs', brand: 'SCP', desc: 'Bassins, revêtements et margelles.' },
  spa: { name: 'Spa', rayon: 'loisirs', brand: 'SCP', desc: 'Spas et balnéo, avec leurs équipements.' },
  sauna: { name: 'Sauna', rayon: 'loisirs', brand: 'SCP', desc: 'Cabines de sauna en bois.' },
  chlore: { name: 'Traitement de l’eau', rayon: 'loisirs', brand: 'SCP', desc: 'Chlore, correcteurs de pH et produits d’entretien.' },
};
export function buildProc(id) { const g = B[id](); g.userData.proc = id; return g; }
export const buildPallet = () => B.palette();

// ---------- détouré extrudé : la photo devient une pièce avec de l'épaisseur
const texCache = new Map();
function texFor(item) {
  if (texCache.has(item.id)) return texCache.get(item.id);
  const t = new THREE.TextureLoader().load(item.img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(item.id, t); return t;
}
export function buildCutout(item, depth = 0.05) {
  const shapes = item.shapes.map(pts => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); return s; });
  const d = item.flat ? depth * 0.35 : depth;
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: d, bevelEnabled: !item.flat, bevelThickness: d * .25, bevelSize: .004, bevelSegments: 2, curveSegments: 2 });
  geo.translate(-0.5, -0.5, -d / 2);
  geo.scale(item.ar, 1, 1);
  const map = texFor(item);
  const face = new THREE.MeshStandardMaterial({ map, alphaTest: .5, roughness: .55, metalness: .05, side: THREE.DoubleSide });
  const side = new THREE.MeshStandardMaterial({ color: item.side, roughness: .6 });
  const m = new THREE.Mesh(geo, [face, side]); m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); g.userData.cut = item.id;
  return g;
}

// ramène un objet à une taille donnée, posé sur y = 0 et centré
export function normalize(obj, size = 1) {
  const box = new THREE.Box3().setFromObject(obj); const s = new THREE.Vector3(); box.getSize(s);
  const k = size / Math.max(s.x, s.y, s.z, 1e-3); obj.scale.multiplyScalar(k);
  box.setFromObject(obj); const c = new THREE.Vector3(); box.getCenter(c);
  obj.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
  const wrap = new THREE.Group(); wrap.add(obj); return wrap;
}
export { rng };
