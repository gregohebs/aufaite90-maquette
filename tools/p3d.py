# -*- coding: utf-8 -*-
"""Prépare les données 3D des produits détourés : texture embarquée (data URI) + contour pour l'extrusion.
Source : les PNG détourés du tri (dossier 02_PRODUITS_DETOURES). Sortie : assets/p3d/<rayon>.js"""
import os, sys, glob, json, base64, io
import numpy as np, cv2
from PIL import Image
from PIL import PngImagePlugin; PngImagePlugin.MAX_TEXT_CHUNK = 100*1024*1024
SRC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/aufaite-tri/02_PRODUITS_DETOURES'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'p3d')

G = 'Accessoire de gouttière'; D = 'Accessoire de descente'
# dossier -> {numéro: (rayon, nom, marque ou '')}
N = {
 'bac_acier_panneaux_sandwich': {
  1:('couverture','Halny 6.183, tôle acier aspect tuile',''),2:('couverture','Ondarock T, panneau laine de roche',''),
  3:('couverture','Ondatherm L, panneau sandwich',''),4:('couverture','Ondatherm TH, ép. 80 mm',''),
  5:('couverture','Trapeza 3.45.1000 TS',''),6:('couverture','Agrotherm Plus rouge',''),7:('couverture','Bac acier brun',''),
  8:('couverture','Bac acier rouge',''),9:('couverture','Rive et solin acier',''),10:('couverture','Fréquence 5.177.51',''),
  11:('couverture','JI 33/250/1000','Joris Ide'),12:('couverture','JI 45/333/1000','Joris Ide'),13:('couverture','JI 46/150/900','Joris Ide'),
  14:('couverture','JI Roof Plus','Joris Ide'),15:('bardage','JI TF Wall 1100','Joris Ide'),16:('bardage','JI TF Wall 1100, autre teinte','Joris Ide'),
  17:('etancheite','Alkorplan F sur bac acier','Renolit'),18:('etancheite','Membrane PVC',''),19:('couverture','Panneau sandwich anthracite',''),
  20:('couverture','Panneau isolé multicouche',''),21:('couverture','Couverture à joint debout','')},
 'couverture_tuiles': {1:('couverture','Jura Nova','Koramic'),2:('couverture','MegaS','Koramic'),3:('couverture','Optima',''),
  5:('couverture','Côte de Beaune, vieilli Bourgogne','Terreal'),6:('couverture','Volany Tandem, vieilli Bourgogne','Terreal'),
  7:('couverture','H 10 flammé rustique',''),8:('couverture','PV 10 flammé rustique',''),9:('couverture','Standard 9 rouge','')},
 'couverture_ardoises': {},
 'etancheite_ecrans_membranes': {1:('etancheite','Membrane bitume',''),2:('etancheite','Galon Butyle SF','Soprema'),3:('etancheite','Bande d’étanchéité',''),
  4:('etancheite','Membrane bitume',''),5:('etancheite','Membrane bitume',''),6:('etancheite','Membrane bitume',''),7:('etancheite','Membrane d’étanchéité',''),
  8:('etancheite','Adhésif double face 30 cm pour EPDM','Novintiss'),9:('etancheite','Alkorplan Non Slip Walkway','Renolit'),
  10:('etancheite','Sekurtoit EPDM','Novintiss'),11:('etancheite','PS Russ Strip 15 cm','Novintiss'),12:('etancheite','Isolant mince multicouche','ATI'),
  13:('etancheite','Écran sous-toiture','')},
 'isolation': {1:('etancheite','Le Flocon 3, laine à souffler','Rockwool'),2:('etancheite','Rouleau de laine de roche','Rockwool'),
  3:('etancheite','Panneau de laine de roche','Rockwool'),4:('etancheite','Panneau isolant PIR','Unilin'),5:('etancheite','Panneau de fibre de bois',''),
  6:('etancheite','Knauf Thane Façade MI','Knauf'),7:('etancheite','Knauf Thane sol','Knauf'),8:('etancheite','Enertherm Alu 50','IKO'),
  9:('etancheite','Enertherm Mur','IKO'),10:('etancheite','Enertherm KR Alu','IKO'),11:('etancheite','Panneau isolant',''),
  12:('etancheite','Rouleaux de laine minérale','Isover'),13:('etancheite','Ouate de cellulose','Igloo'),14:('etancheite','Ouate de cellulose','Igloo')},
 'fenetres_exutoires': {1:('fenetres','Fenêtre de toit R7','Roto'),2:('fenetres','Lanterneau',''),3:('fenetres','Exutoire de désenfumage',''),
  4:('fenetres','Exutoire de désenfumage',''),5:('fenetres','Lanterneau plat',''),6:('fenetres','Verrière',''),7:('fenetres','Fenêtre de toit, vue intérieure',''),
  8:('fenetres','Fenêtre de toit, vue intérieure',''),9:('fenetres','Lanterneau',''),10:('fenetres','Lanterneau en rénovation','')},
 'outillage_epi': {1:('outillage','Scie circulaire sans fil',''),2:('outillage','Ponceuse excentrique',''),3:('outillage','Perceuse-visseuse',''),
  4:('outillage','Perceuse-visseuse',''),5:('outillage','Rabot électrique',''),6:('outillage','Multi-outil',''),7:('outillage','Marteau de charpentier',''),
  8:('outillage','Pochette porte-outils',''),9:('outillage','Harnais antichute',''),10:('outillage','Mousqueton',''),11:('outillage','Casque de chantier',''),
  12:('outillage','Cloueur Paslode','Spit Paslode'),13:('outillage','Cloueur à gaz',''),14:('outillage','Cisaille',''),15:('outillage','Pince de couvreur',''),16:('outillage','Pince de couvreur','')},
 'solaire': {1:('solaire','Modules photovoltaïques UN','Terreal'),2:('solaire','Solterre PV Premium','Terreal'),3:('solaire','Accessoire de pose solaire','')},
 'zinguerie': {3:('zinguerie','Coude cintré',''),8:('zinguerie','Boîte à eau',''),9:('zinguerie','Boîte à eau carrée',''),10:('zinguerie','Équerre de gouttière',''),
  13:('zinguerie','Étoile',''),14:('zinguerie','Crapaudine',''),15:('zinguerie','Crochet de gouttière',''),16:('zinguerie','Tuyaux de descente',''),
  17:('zinguerie','Tuyau de descente',''),18:('zinguerie','Tuyaux de descente',''),20:('zinguerie','Crochet de gouttière',''),23:('zinguerie','Talon de gouttière',''),
  24:('zinguerie','Collier de descente',''),28:('zinguerie','Équerre de gouttière',''),29:('zinguerie','Crochet Alsace galvanisé, dév. 33',''),
  30:('zinguerie','Crochet embouti galvanisé, dév. 33',''),31:('zinguerie','Crochet H98 galvanisé, dév. 33',''),32:('zinguerie','Tôles','')},
}
DEFAULT = {'couverture_tuiles':('couverture','Tuile terre cuite',''),'couverture_ardoises':('couverture','Ardoise naturelle','Cupa Pizarras')}
ZG = {10,14,15,20,22,23,24,26,27,28,29,30,31}

def contours(alpha, W, H):
    m = (alpha > 110).astype(np.uint8)*255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5,5),np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cs = [c for c in cs if cv2.contourArea(c) > 0.004*W*H]
    cs.sort(key=cv2.contourArea, reverse=True); out = []
    for c in cs[:6]:
        eps = 0.004*cv2.arcLength(c, True)
        a = cv2.approxPolyDP(c, eps, True)[:,0,:]
        if len(a) < 3: continue
        out.append([[round(float(x)/W,4), round(1-float(y)/H,4)] for x,y in a])
    return out

def main():
    os.makedirs(OUT, exist_ok=True); data = {}
    for d in sorted(glob.glob(SRC+'/*/')):
        folder = os.path.basename(d[:-1])
        for f in sorted(glob.glob(d+'*.png')):
            n = int(os.path.basename(f)[:2])
            im = Image.open(f).convert('RGBA'); im.thumbnail((384,384), Image.LANCZOS)
            a = np.array(im); W,H = im.size
            cov = (a[:,:,3] > 110).mean()
            if folder in N and n in N[folder]: ray, name, brand = N[folder][n]
            elif folder in DEFAULT: ray, name, brand = DEFAULT[folder]
            elif folder == 'zinguerie': ray, name, brand = ('zinguerie', G if n in ZG else D, '')
            else: continue
            shapes = contours(a[:,:,3], W, H)
            if not shapes: continue
            op = a[:,:,3] > 110
            side = (a[:,:,:3][op].mean(0)*0.7).astype(int)
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=78, method=6)
            data.setdefault(ray, []).append(dict(id=f'{folder}/{n:02d}', name=name, brand=brand, ar=round(W/H,4),
                 side='#%02x%02x%02x' % tuple(side), flat=bool(cov > 0.96), shapes=shapes,
                 img='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()))
    for ray, items in data.items():
        js = 'window.P3D=window.P3D||{};window.P3D[%s]=%s;' % (json.dumps(ray), json.dumps(items, ensure_ascii=False, separators=(',',':')))
        open(os.path.join(OUT, ray+'.js'), 'w', encoding='utf-8').write(js)
        print(ray, len(items), round(len(js)/1024), 'Ko', 'plats:', sum(i['flat'] for i in items))
main()
