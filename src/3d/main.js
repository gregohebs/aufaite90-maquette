// Point d'entrée : active la 3D selon les éléments présents dans la page.
import { webglOK, loadRayon } from './common.js';
import { openViewer } from './viewer.js';
import { initHouse } from './house.js';
import { initCatalogue } from './catalogue.js';

function noWebGL() {
  document.documentElement.classList.add('no-webgl');
  const s = document.getElementById('stage'), n = document.getElementById('no3d');
  if (s && n && window.LAYERS) { s.style.display = 'none'; n.style.display = 'block'; n.innerHTML = window.LAYERS.map(l => `<h3 style="margin:28px 0 8px">${l.name}</h3><p>${l.txt}</p><p><a class="link" href="rayon-${l.cat}.html">Voir le rayon</a></p>`).join(''); }
  const d = document.getElementById('depot3d'); if (d) d.hidden = true;
}

function init() {
  if (!webglOK()) { noWebGL(); return; }
  window.AF3D = { open: openViewer };
  if (document.getElementById('roof') && window.LAYERS) initHouse(window.LAYERS);
  if (document.getElementById('depot3d')) initCatalogue();
  // galeries des pages rayon : chaque visuel s'ouvre en 3D
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-v3d]'); if (!b) return; e.preventDefault();
    const [rayon, id] = [b.dataset.ray, b.dataset.v3d];
    const all = [...document.querySelectorAll('[data-v3d]')].map(x => ({ type: x.dataset.type || 'cut', rayon: x.dataset.ray, id: x.dataset.v3d }));
    if (b.dataset.type === 'proc') return openViewer({ type: 'proc', id }, all);
    await loadRayon(rayon);
    openViewer({ type: 'cut', rayon, id }, all);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
