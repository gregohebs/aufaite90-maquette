// Point d'entrée : active la 3D selon les éléments présents dans la page.
import { webglOK } from './common.js';
import { openViewer } from './viewer.js';
import { initHouse } from './house.js';

function noWebGL() {
  document.documentElement.classList.add('no-webgl');
  const s = document.getElementById('stage'), n = document.getElementById('no3d');
  if (s && n && window.LAYERS) { s.style.display = 'none'; n.style.display = 'block'; n.innerHTML = window.LAYERS.map(l => `<h3 style="margin:28px 0 8px">${l.name}</h3><p>${l.txt}</p><p><a class="link" href="rayon-${l.cat}.html">Voir le rayon</a></p>`).join(''); }
}

function init() {
  if (!webglOK()) { noWebGL(); return; }
  window.AF3D = { open: openViewer };
  if (document.getElementById('roof') && window.LAYERS) initHouse(window.LAYERS);

}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
