// Outils partagés : rendu, environnement, textures générées (aucune image externe nécessaire).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(pointer: fine)').matches;

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

export function makeRenderer(canvas, { shadows = true } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  if (shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
  return r;
}

export function studioEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  return t;
}

// pseudo-aléatoire stable
export function rng(seed = 1) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function canvasTexture(w, h, draw, { repeat = [1, 1], color = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}

function noise(g, w, h, n, colors, size = [1, 3], alpha = 0.5, seed = 3) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * r();
    g.fillStyle = colors[(r() * colors.length) | 0];
    const s = size[0] + r() * (size[1] - size[0]);
    g.fillRect(r() * w, r() * h, s, s);
  }
  g.globalAlpha = 1;
}

const cache = {};
const once = (k, f) => cache[k] || (cache[k] = f());

export const TEX = {
  crepi: () => once('crepi', () => canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#ece7de'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 26000, ['#ffffff', '#d9d2c5', '#c9c1b2', '#f6f2ea'], [1, 3], 0.55, 11);
  }, { repeat: [3, 3] })),
  crepiBump: () => once('crepiB', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, ['#ffffff', '#000000'], [1, 2], 0.5, 12);
  }, { repeat: [6, 6], color: false })),
  wood: (tone = '#c79a63', key = 'w') => once('wood' + key + tone, () => canvasTexture(256, 1024, (g, w, h) => {
    g.fillStyle = tone; g.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = r() > .5 ? 'rgba(90,55,25,.18)' : 'rgba(255,240,210,.14)';
      g.lineWidth = 1 + r() * 3; g.beginPath();
      const x = r() * w; g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y / 90 + i) * 6 * r(), y);
      g.stroke();
    }
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(80,45,20,.35)'; g.beginPath(); g.ellipse(r() * w, r() * h, 5 + r() * 6, 9 + r() * 10, 0, 0, 7); g.fill(); }
  })),
  lawn: () => once('lawn', () => canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#56703f'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 30000, ['#6c8a4c', '#4a6136', '#7d9a59', '#3f552e'], [1, 4], 0.6, 5);
  }, { repeat: [10, 10] })),
  gravel: () => once('gravel', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#b9b3a8'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9000, ['#d8d3ca', '#8f897f', '#a59f94', '#ece8e0'], [2, 5], 0.8, 9);
  }, { repeat: [4, 4] })),
  terracotta: () => once('terra', () => canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 2500, ['#e8d8d0', '#ffffff', '#d6c2b8'], [1, 3], 0.6, 4);
  })),
  osb: () => once('osb', () => canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#c9a56b'; g.fillRect(0, 0, w, h);
    const r = rng(21);
    for (let i = 0; i < 900; i++) {
      g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3.14);
      g.fillStyle = ['#d8b77c', '#b88f55', '#e0c48e', '#a77d47'][(r() * 4) | 0];
      g.fillRect(-14 - r() * 18, -4, 28 + r() * 30, 7 + r() * 5); g.restore();
    }
  })),
  solar: () => once('solar', () => canvasTexture(256, 384, (g, w, h) => {
    g.fillStyle = '#121c2e'; g.fillRect(0, 0, w, h);
    const cw = w / 6, ch = h / 10;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
      const gr = g.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch);
      gr.addColorStop(0, '#1d2d4a'); gr.addColorStop(1, '#0f1726');
      g.fillStyle = gr; g.fillRect(i * cw + 1.5, j * ch + 1.5, cw - 3, ch - 3);
      g.fillStyle = 'rgba(190,200,215,.35)'; g.fillRect(i * cw + cw / 3, j * ch, 1, ch); g.fillRect(i * cw + 2 * cw / 3, j * ch, 1, ch);
    }
  }, { repeat: [1, 1] })),
  screen: () => once('screen', () => canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#4b6f86'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 128 + 18); g.lineTo(w, i * 128 + 18); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.28)'; g.font = 'bold 28px Arial';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillText('HPV', j * 180 + 30 + (i % 2) * 60, i * 128 + 80);
  }, { repeat: [2, 2] })),
  wool: () => once('wool', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d9c27a'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 12000, ['#e9d692', '#c4ab63', '#f2e3a8', '#b89c55'], [1, 3], 0.6, 8);
  }, { repeat: [3, 3] })),
  spiral: () => once('spiral', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d9c27a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,95,40,.55)'; g.lineWidth = 2; g.beginPath();
    for (let a = 0; a < 40; a += 0.05) { const r = 4 + a * 2.9; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    g.stroke();
  })),
  water: () => once('water', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#3ea7c4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
    const r = rng(2);
    for (let i = 0; i < 40; i++) { g.beginPath(); const x = r() * w, y = r() * h; g.ellipse(x, y, 10 + r() * 20, 3 + r() * 5, r(), 0, 6.28); g.stroke(); }
  }, { repeat: [2, 2] })),
  slate: () => once('slate', () => canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#3c4247'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 3000, ['#4a5157', '#30353a', '#555c62'], [1, 3], 0.6, 6);
    g.strokeStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 2); g.stroke(); }
  })),
};

export const MAT = {
  zinc: () => once('m-zinc', () => new THREE.MeshStandardMaterial({ color: '#aab3b8', metalness: .9, roughness: .35, side: THREE.DoubleSide })),
  galva: () => once('m-galva', () => new THREE.MeshStandardMaterial({ color: '#c4cacd', metalness: .85, roughness: .4, side: THREE.DoubleSide })),
  alu: () => once('m-alu', () => new THREE.MeshStandardMaterial({ color: '#3b4247', metalness: .55, roughness: .45 })),
  glass: () => once('m-glass', () => new THREE.MeshStandardMaterial({ color: '#6f8ea3', metalness: .9, roughness: .05, envMapIntensity: 1.4 })),
  pvcWhite: () => once('m-pvc', () => new THREE.MeshStandardMaterial({ color: '#f1f1ee', roughness: .45 })),
};

// léger « ressort » d'interpolation
export const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// animation simple (sans dépendance)
export function tween(dur, onUpdate, onDone) {
  if (reduceMotion) { onUpdate(1); onDone && onDone(); return () => {}; }
  const t0 = performance.now(); let stop = false;
  (function step(now) {
    if (stop) return;
    const t = clamp((now - t0) / dur); onUpdate(easeInOut(t));
    if (t < 1) requestAnimationFrame(step); else onDone && onDone();
  })(t0);
  return () => { stop = true; };
}

// charge un script une seule fois (fonctionne aussi en file://)
const loading = {};
export const HAS_P3D = ['couverture', 'bardage', 'etancheite', 'fenetres', 'outillage', 'solaire', 'zinguerie'];
export function loadScript(src) {
  return loading[src] || (loading[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  }));
}
export function assetBase() {
  const s = document.querySelector('script[src*="af3d.js"]');
  return s ? s.getAttribute('src').replace(/af3d\.js.*$/, '') : 'assets/';
}
export async function loadRayon(id) {
  window.P3D = window.P3D || {};
  if (window.P3D[id]) return window.P3D[id];
  if (!HAS_P3D.includes(id)) return [];
  try { await loadScript(assetBase() + 'p3d/' + id + '.js'); } catch (e) { /* rayon sans détourés */ }
  return window.P3D[id] || [];
}
