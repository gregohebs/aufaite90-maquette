# -*- coding: utf-8 -*-
"""Génère le site maquette Au Faite 90 (pages statiques)."""
import os, html, json
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape

# ---------------------------------------------------------------- données
DEPOTS = [
 dict(id='grandvillars', name='Grandvillars', sub='Siège, atelier de pliage, bureaux', img='img/camion2.webp',
      addr='5 rue Pierre de Coubertin', cp='90600 Grandvillars', tel='03 84 23 60 40', mail='grandvillars@aufaite90.com',
      hours='Du lundi au vendredi, 7 h 30 à 12 h et 13 h 30 à 18 h'),
 dict(id='valdoie', name='Valdoie', sub='Territoire de Belfort', img='img/valdoie.webp',
      addr='7 rue André Rousselot', cp='90300 Valdoie', tel='03 84 28 48 49', mail='valdoie@aufaite90.com',
      hours='Du lundi au vendredi, 8 h à 12 h et 13 h 30 à 17 h 30'),
 dict(id='saulnot', name='Saulnot', sub='Haute-Saône, Au Faite 70', img='img/saulnot.webp',
      addr='ZA Champs des Piot', cp='70400 Saulnot', tel='03 67 35 17 67', mail='saulnot@aufaite70.com',
      hours='Du lundi au vendredi, 7 h 30 à 12 h et 13 h 30 à 17 h 30'),
]
def tel_href(t): return 'tel:+33' + t.replace(' ', '')[1:]

# marque -> (fichier logo ou None, site ou None)
BR = {
 'Lignalpes':('Lignalpes',None),'MEP':('MEP',None),'Deceuninck':('Deceuninck',None),'Scierie Weber':('Scierie-Weber',None),
 'W Distribution Bois':('W-Distribution-Bois',None),
 'Terreal':('Terreal','https://www.terreal.com'),'Koramic':('Koramic','https://www.wienerberger.fr'),'Edilians':('Edilians','https://www.edilians.com'),
 'Wienerberger':('Wienerberger','https://www.wienerberger.fr'),'Monier':(None,'https://www.bmigroup.com'),
 'Profil C':('Profil-C','https://www.profilc.com'),'ArcelorMittal':('ArcelorMittal','https://construction-france.arcelormittal.com'),
 'Joris Ide':('Joriside','https://www.joriside.com'),'Bacacier':('Bacacier',None),'Cupa Pizarras':('Cupa-Pizarras','https://www.cupapizarras.com'),
 'Eternit':('Eternit','https://www.eternit.fr'),'Onduline':('Onduline',None),'Sunclear':('Sunclear','https://www.sunclear.fr'),
 'Soprema':('Soprema','https://www.soprema.fr'),'Siplast':('Siplast','https://www.bmigroup.com'),
 'Rockwool':('Rockwool','https://www.rockwool.com'),'Isover':('Isover','https://www.isover.fr'),'Igloo':('Igloo','https://www.cellulose-igloo.com'),
 'IKO':('IKO','https://eu.iko.com'),'Unilin':('Unilin','https://www.unilin.com'),'Knauf':('Knauf','https://www.knauf.com'),
 'ATI':('ATI-Isolation','https://www.ati-isolation.com'),'Renolit':(None,'https://www.renolit.com'),'Novintiss':('Novintiss','https://www.novintiss.com'),
 'VMZinc':('VMZinc',None),'Rheinzink':('Rheinzink',None),
 'Vinylit':('Vinylit',None),'Cedral':('Cedral',None),'Prefa':('Prefa','https://www.prefa.fr'),
 'Ubbink':('Ubbink','https://www.ubbink.com'),
 'Velux':('Velux','https://www.velux.fr'),'Roto':('Roto',None),'Bluetek':('Bluetek',None),'Poujoulat':('Poujoulat',None),
 'Milwaukee':('Milwaukee','https://fr.milwaukeetool.eu'),'Makita':('Makita',None),'Mafell':('Mafell',None),'Bosch':('Bosch',None),
 'Spit Paslode':('Spit',None),'DeWalt':('DeWalt',None),'HiKoki':('HiKoki',None),
 'Stubai':('Stubai',None),'Express':('Express',None),'Stanley':('Stanley',None),'EDMA':('EDMA',None),'Leborgne':('Leborgne',None),
 'Jouanel':('Jouanel',None),'Taliaplast':('Talia-Plast',None),'Pratikal':('Pratikal',None),
 'Bostik':(None,None),'Desa':('Desa',None),'Sika':('Sika',None),'OXO':('OXO',None),'Dalep':('Dalep',None),'Diam':('Diam',None),
 'Simpson Strong-Tie':('Simpson-StrongTie',None),'Pica':('Pica',None),
 'Duarib':('Duarib',None),'Tubesca-Comabi':('Tubesca-Comabi',None),'Secatol':('Secatol',None),
 'Delta Plus':('DeltaPlus',None),'Sassi':('Sassi',None),'FTG Safety':('FTG',None),'Diadora Utility':('Diadora-Utility',None),
 'Blåkläder':('Blaklader',None),'Bosseur':('Bosseur',None),'Timberland Pro':('Timberland-Pro',None),
 'SCP':('SCP','https://www.scpeurope.fr'),
}

B='bac_acier_panneaux_sandwich'; T='couverture_tuiles'; AR='couverture_ardoises'; ET='etancheite_ecrans_membranes'
IS='isolation'; Z='zinguerie'; F='fenetres_exutoires'; O='outillage_epi'; S='solaire'
def imgs(folder, nums): return [f'produits/{folder}/{n:02d}.webp' for n in nums]

RAYONS = [
 dict(id='debord', name='Débord de toit & Structure', short='Débord de toit et structure', photo='img/bois.webp',
  what="Lambris, rives et cache-pannes en bois ou PVC, bois de charpente et panneaux.",
  lead="Tout ce qui se voit sous l'avancée du toit, et tout ce qui le porte : lambris, bandeaux de rive, bois de structure et panneaux.",
  stock=['img/stock/bois1.webp','img/stock/bois2.webp','img/stock/bois3.webp'],
  blocks=[
   dict(t='Débord de toit en bois', tag='Lambris et bandeaux de rive', fam=['Lambris de sous-toiture en sapin du Nord','Teinte gris anthracite','Teinte noix','Teinte blanc pur','Bandeaux de rive'], br=['Lignalpes']),
   dict(t='Débord de toit en PVC', tag='Lambris, rives et cache-pannes', fam=['Lambris PVC','Rives','Cache-pannes','Dessous de toit','Avant-toits'], br=['MEP','Deceuninck']),
   dict(t='Structure en bois', tag='Charpente, panneaux et bois de couverture', fam=['Charpente sur liste','Chevrons','Poutres','Liteaux','Lattes','Voliges','KVH','Contrecollé','Lamellé-collé','Panneaux 3 plis','Contreplaqué','OSB','Panneaux antidérapants'], br=['Scierie Weber','W Distribution Bois']),
  ]),
 dict(id='couverture', name='Couverture', short='Couverture', photo='img/tuiles.webp',
  what="Tuiles, ardoise, bac acier, panneaux isolés, fibrociment, translucide et bardeaux.",
  lead="Tuiles terre cuite, béton ou verre, ardoise naturelle, tôles et panneaux d'acier, fibrociment, plaques translucides et bardeaux. Les gammes sont exposées au dépôt de Grandvillars.",
  stock=['img/stock/couv1.webp','img/stock/couv2.webp','img/stock/couv3.webp','img/stock/couv4.webp'],
  blocks=[
   dict(t='Couverture en tuile', tag='Terre cuite, béton et verre', fam=['Jura Nova','MegaS','Optima','Côte de Beaune','Volany Tandem','H 10 flammé rustique','PV 10 flammé rustique','Standard 9 rouge','Tuiles de verre','Faîtières et accessoires'], br=['Terreal','Koramic','Edilians','Wienerberger','Monier'], img=imgs(T,range(1,16))),
   dict(t="Couverture en tôle d'acier sec", tag='Bacs acier et tôles nervurées', fam=['Halny 6.183','Fréquence 5.177.51','Trapeza 3.45.1000 TS','JI 45/333/1000','JI 33/250/1000','JI 46/150/900','Rives et solins'], br=['Profil C','ArcelorMittal','Joris Ide','Bacacier'], img=imgs(B,[1,5,7,8,9,10,11,12,13])),
   dict(t="Couverture en panneaux d'acier isolés", tag='Panneaux sandwich', fam=['Ondatherm TH, ép. 80 mm','Ondatherm L','Ondarock T','JI Roof Plus','JI TF Wall 1100'], br=['Joris Ide','ArcelorMittal','Bacacier'], img=imgs(B,[2,3,4,14,19,20])),
   dict(t='Couverture en ardoise', tag='Ardoise naturelle', fam=['Ardoise naturelle','Crochets et accessoires de pose'], br=['Cupa Pizarras'], img=imgs(AR,[1,2,3])),
   dict(t='Couverture en fibrociment', tag='Plaques ondulées', fam=['Plaques ondulées','Agrotherm Plus rouge','Coloragri'], br=['Eternit'], img=imgs(B,[6])),
   dict(t='Couverture translucide', tag='PVC, polycarbonate et polyester', fam=['Onduclair PC opaline','Onduclair PC cristal','Thermoclear Plus 6 mm','Thermoclear Plus 10 mm','Polycarbonate compact UV 2 faces'], br=['Onduline','Sunclear']),
   dict(t='Couverture en bardeau', tag='Bardeaux bitumés', fam=['Sopratuile 4 pattes','Bardoline Classic 3 pattes','Versite'], br=['Soprema','Onduline','Siplast']),
   dict(t='Autres couvertures', tag='Bitume, joints debout, tasseaux', fam=['Bitume','Joints debout','Tasseaux'], br=[], img=imgs(B,[21])),
  ]),
 dict(id='etancheite', name='Étanchéité & Isolation', short='Étanchéité et isolation', photo='img/isolant.webp',
  what="Laines minérales et végétales, ouate, PU, isolants minces, membranes PVC, EPDM et bitume.",
  lead="Isolants pour la toiture, les murs et les sols, et membranes d'étanchéité pour les toits plats comme pour les raccords. La machine à souffler se loue au dépôt.",
  stock=['img/stock/iso1.webp','img/stock/iso2.webp','img/stock/iso3.webp'],
  blocks=[
   dict(t='Isolation minérale', tag='Laine de roche', fam=['Laine de roche en rouleaux','Panneaux','Laine à souffler'], br=['Rockwool'], img=imgs(IS,[1,2,3,12])),
   dict(t='Isolation végétale', tag='Laine de bois', fam=['Panneaux de fibre de bois'], br=['Isover'], img=imgs(IS,[5])),
   dict(t='Isolation végétale', tag='Ouate de cellulose', fam=['Ouate en sac','Ouate à souffler'], br=['Igloo'], img=imgs(IS,[13,14]), anchor='ouate'),
   dict(t='Polyuréthane et polystyrène', tag='Panneaux isolants rigides', fam=['Enertherm Mur','Enertherm KR Alu','Enertherm Alu 50','Knauf Thane sol','Knauf Thane Façade MI'], br=['IKO','Unilin','Knauf'], img=imgs(IS,[4,6,7,8,9,10,11])),
   dict(t='Isolants minces', tag='Multicouches', fam=['Isolants minces multicouches réflecteurs'], br=['ATI'], img=imgs(ET,[12])),
   dict(t='Étanchéité PVC', tag='Membranes pour toitures-terrasses', fam=['Alkorplan Classic','Alkorplan Non Slip Walkway','Alkorplan F pour bac acier'], br=['Renolit'], img=imgs(B,[17,18])+imgs(ET,[9])),
   dict(t='Étanchéité EPDM', tag='Membranes caoutchouc et raccords', fam=['Sekurtoit EPDM','Adhésif double face 30 cm','PS Russ Strip 15 cm'], br=['Novintiss'], img=imgs(ET,[8,10,11])),
   dict(t='Étanchéité bitume', tag='Membranes et bandes', fam=['Parafor Solo GS','Paradiène 40','Paradiène FM','Galon Butyle SF','Sopralène Joint','Élastophène 180/25'], br=['Siplast','Soprema'], img=imgs(ET,[1,2,3,4,5,6,7,13])),
  ]),
 dict(id='zinguerie', name='Quincaillerie & Zinguerie', short='Quincaillerie et zinguerie', photo='img/cuivre.webp',
  what="Gouttières, descentes et tous leurs accessoires, en zinc, galva, acier laqué ou cuivre.",
  lead="Gouttières et descentes en six finitions, et toutes les pièces pour les poser. Ce qui n'existe pas en standard se plie sur mesure à l'atelier de Grandvillars.",
  stock=['img/stock/zing1.webp','img/stock/zing2.webp','img/stock/zing3.webp'],
  blocks=[
   dict(t='Gouttières', tag='Profils lyonnaise et carré, développés 25, 33 et 40', fam=['Zinc naturel','Zinc anthracite','Zinc quartz','Galva','Acier laqué','Cuivre'], br=['VMZinc','Rheinzink']),
   dict(t='Accessoires de gouttières', tag='En galva, acier laqué, zinc, cuivre et inox', fam=['Talons','Crochets H98','Crochets emboutis','Stop-feuilles','Crapaudines','Naissances cylindriques','Naissances agrafables','Naissances obliques','Naissances carrées','Naissances plates','Équerres intérieures','Équerres extérieures'], br=[], img=imgs(Z,[10,14,15,20,22,23,24,26,27,28,29,30,31])),
   dict(t='Tuyaux de descente', tag='Profils lyonnaise et carré, diamètres 75, 100 et 120', fam=['Zinc naturel','Zinc anthracite','Zinc quartz','Galva','Acier laqué','Cuivre'], br=[]),
   dict(t='Accessoires de descente', tag='Pour finir proprement chaque descente', fam=['Dauphins','Colliers emboutis','Boîtes à eau','Évacuations d’eau','Noquets','Cuvettes','Rosaces','Étoiles','Coudes cintrés','Coudes 2 pièces','Contre-coudes','Bagues et spirales'], br=[], img=imgs(Z,[1,2,3,4,5,6,7,8,9,11,12,13,16,17,18,19,21,25])),
   dict(t='Feuilles, bobineaux et tôles', tag='Pour le pliage et les ouvrages sur mesure', fam=['Feuilles','Bobineaux','Tôles'], br=[], img=imgs(Z,[32]), extra='<p><a class="link" href="services.html#pliage">L’atelier de pliage de Grandvillars</a> travaille l’aluminium, le zinc et les couvertines jusqu’à 2 m.</p>'),
  ]),
 dict(id='bardage', name='Bardage & Revêtements', short='Bardage et revêtements', photo='img/sandwich.webp',
  what="Bardage acier, panneaux de façade, PVC et fibre-ciment.",
  lead="Pour habiller les façades et les pignons : bardages métalliques et panneaux isolés, lames PVC, fibre-ciment et aluminium.",
  stock=['img/stock/bard1.webp','img/stock/bard2.webp','img/catalogue-bardage.webp'],
  blocks=[
   dict(t='Bardage métallique', tag='Panneaux et profils de façade', fam=['Profils de bardage','Panneaux isolés de façade','Habillages et finitions'], br=['Joris Ide','ArcelorMittal','Bacacier'], img=imgs(B,[15,16])),
   dict(t='Bardage PVC et fibre-ciment', tag='Lames et panneaux de façade', fam=['Lames PVC','Clins fibre-ciment','Accessoires de finition'], br=['Vinylit','Deceuninck','Cedral']),
   dict(t='Bardage aluminium', tag='Panneaux et profils', fam=['Panneaux aluminium','Profils et accessoires'], br=['Prefa']),
  ]),
 dict(id='solaire', name='Panneaux Solaires', short='Panneaux solaires', photo='img/solaire.webp',
  what="Modules intégrés ou en surimposition, systèmes de montage et accessoires.",
  lead="Des modules photovoltaïques qui s'intègrent à la couverture ou se posent par-dessus, avec les fixations et passe-câbles adaptés.",
  stock=[],
  blocks=[
   dict(t='Terreal', tag='Modules et solutions intégrées', fam=['Modules photovoltaïques UN','Surimposition sur tuile Terreal','Solterre PV Premium'], br=['Terreal'], img=imgs(S,[1,2])),
   dict(t='Prefa', tag='Toiture solaire aluminium', fam=['Plaque solaire anthracite','Module solaire Prefalz','Système de montage Prefa'], br=['Prefa']),
   dict(t='Accessoires', tag='Raccords et fixations', fam=['Passe-câbles photovoltaïque pour pente de 15° à 55°','Fixations et rails'], br=['Ubbink'], img=imgs(S,[3])),
  ]),
 dict(id='fenetres', name='Fenêtres, Exutoires & Conduits de fumée', short='Fenêtres, exutoires et conduits', photo='img/velux.webp',
  what="Fenêtres de toit, volets, stores, verrières, lanterneaux, conduits et sorties de toit.",
  lead="De la fenêtre de toit au lanterneau de désenfumage, et les conduits qui traversent la couverture.",
  stock=[],
  blocks=[
   dict(t='Fenêtres de toit', tag='Volets, stores, verrières et lanterneaux', fam=['Fenêtres de toit','Volets','Stores','Verrières','Lanterneaux','Raccords d’étanchéité'], br=['Velux','Roto','Bluetek'], img=imgs(F,[1,7,8,2,3,4,5,6,9,10])),
   dict(t='Exutoires de fumée', tag='Conduits, sorties de toit et ventilations', fam=['Conduits de fumée','Sorties de toit','Ventilations'], br=['Poujoulat']),
  ]),
 dict(id='outillage', name='Outillage & Sécurité', short='Outillage et sécurité', photo='img/showroom.webp',
  what="Électroportatif, outils de couvreur, consommables, manutention et EPI.",
  lead="L'outillage est exposé dans nos 270 m² de bureaux à Grandvillars : venez prendre en main avant d'acheter.",
  stock=['img/stock/outil1.webp','img/stock/outil2.webp','img/stock/outil3.webp'],
  blocks=[
   dict(t='Outillage électroportatif', tag='Machines sur batterie et filaires', fam=['Scies circulaires','Visseuses','Meuleuses','Rabots','Multi-outils','Cloueurs à gaz'], br=['Milwaukee','Makita','Mafell','Bosch','Spit Paslode','DeWalt','HiKoki'], img=imgs(O,[1,2,3,4,5,6,12,13])),
   dict(t='Outillage à main', tag='Outils de couvreur et de charpentier', fam=['Cordeaux traceurs','Pinces à sertir','Cisailles','Marteaux','Massettes','Pochettes porte-outils','Sangles d’arrimage','Maillets à ourler'], br=['Stubai','Express','Stanley','EDMA','Leborgne','Jouanel','Taliaplast','Pratikal'], img=imgs(O,[7,8,14,15,16])),
   dict(t='Consommables', tag='Colles, mastics, fixations et marquage', fam=['Colles et mastics','Résines de scellement','Disques et forets','Marqueurs'], br=['Bostik','Desa','Sika','OXO','Dalep','Diam','Simpson Strong-Tie','Pica']),
   dict(t='Accessoires de manutention', tag='Échelles, escabeaux et échafaudages', fam=['Échelles','Escaliers fixes','Échafaudages roulants','Échafaudages fixes avec garde-corps'], br=['Duarib','Tubesca-Comabi','Secatol']),
   dict(t='Équipements de protection', tag='Chaussures, protections, vêtements et harnais', fam=['Chaussures de sécurité','Vêtements de travail','Casques','Harnais et mousquetons','Gants et protections'], br=['Milwaukee','Delta Plus','Sassi','FTG Safety','Diadora Utility','Blåkläder','Bosseur','Timberland Pro'], img=imgs(O,[9,10,11])),
  ]),
 dict(id='loisirs', name='Loisirs : Piscine & Spa', short='Loisirs : piscine et spa', photo='img/piscine.webp',
  what="Piscines, saunas, spas, traitement, équipements, pergolas et douches.",
  lead="Notre fournisseur SCP couvre tout ce qui entoure le bassin : la piscine elle-même, le sauna, le spa, l'entretien et les équipements.",
  stock=['img/stock/loisir1.webp','img/stock/loisir2.webp','img/stock/loisir3.webp'],
  blocks=[
   dict(t='Piscine, sauna et spa', tag='Bassins et cabines', fam=['Piscines','Saunas','Spas','Revêtements de bassin'], br=['SCP']),
   dict(t='Traitement et équipements', tag='Traitements, éclairages, balnéo, pompes et accessoires', fam=['Chlore','Correcteurs de pH','Robots de nettoyage','Éclairages','Balnéo','Pompes','Accessoires'], br=['SCP']),
   dict(t='Autour du bassin', tag='Pergolas, douches, cascades et chauffage', fam=['Pergolas','Douches','Cascades','Chauffage'], br=['SCP']),
  ]),
]
RID = {r['id']: r for r in RAYONS}

MACHINES = [('Pompe de traitement de charpente','Grandvillars'),('Machine à souffler Jetrock','Grandvillars'),('Machine à souffler Jetrock','Valdoie'),
 ('Cardeuse à ouate','Grandvillars'),('Cloueurs Paslode Spit IM 65 et IM 90','Grandvillars'),('Pistolet à air chaud Leister','Grandvillars'),
 ('Pompe de traitement Dalep','Valdoie'),('Palonnier à ventouse','Grandvillars'),('Carotteuse','Grandvillars')]

# ---------------------------------------------------------------- gabarit
NAV = [('index.html','Accueil'),('entreprise.html','L’entreprise'),('produits.html','Nos produits'),('services.html','Services'),('contact.html','Contact')]

def head(title, desc, extra=''):
    return f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="icon" href="assets/logos/af90-embleme.png">
<link rel="stylesheet" href="assets/site.css">
{extra}</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<div class="demo-note"><strong>Maquette de démonstration</strong>, non officielle, réalisée pour présentation à Au Faite 90.</div>
'''

def header(active):
    lis = []
    for href, label in NAV:
        cur = ' aria-current="page"' if active == href else ''
        if href == 'produits.html':
            sub = ''.join(f'<li><a href="rayon-{r["id"]}.html"{" aria-current=page" if active=="rayon-"+r["id"]+".html" else ""}>{E(r["name"])}</a></li>' for r in RAYONS)
            cur = ' aria-current="page"' if active == href or active.startswith('rayon-') else ''
            lis.append(f'<li class="has-sub"><a class="nl" href="{href}"{cur}>{label}</a><ul class="sub"><li><a href="produits.html">Tous les rayons</a></li>{sub}</ul></li>')
        else:
            lis.append(f'<li><a class="nl" href="{href}"{cur}>{label}</a></li>')
    return f'''<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="Au Faite 90, accueil"><img src="assets/logos/af90-embleme.png" alt=""><span>Au Faite <b>90</b></span></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="main" id="nav" aria-label="Navigation principale"><ul>{''.join(lis)}</ul></nav>
    <div class="actions">
      <a class="btn btn-line btn-call" href="tel:+33384236040" aria-label="Appeler Grandvillars, 03 84 23 60 40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg><span>03 84 23 60 40</span></a>
      <a class="btn btn-red btn-devis" href="contact.html#devis">Demander un devis</a>
    </div>
  </div>
</header>
<main id="contenu">
'''

def footer(scripts=''):
    deps = ''.join(f'<div><h4>{d["name"]}</h4>{d["addr"]}<br>{d["cp"]}<br><a href="{tel_href(d["tel"])}">{d["tel"]}</a><br><a href="mailto:{d["mail"]}">{d["mail"]}</a></div>' for d in DEPOTS)
    rays = ''.join(f'<li><a href="rayon-{r["id"]}.html">{E(r["short"])}</a></li>' for r in RAYONS)
    return f'''</main>
<footer>
  <div class="wrap">
    <div class="cols">
      <div><h4>Au Faite 90 · 70</h4><p>Négoce de matériaux de couverture depuis 2007. Ouvert aux professionnels et aux particuliers, livraison en France et en Suisse.</p>
        <ul><li><a href="entreprise.html">L’entreprise</a></li><li><a href="services.html">Livraison, pliage, location</a></li><li><a href="contact.html#devis">Demander un devis</a></li></ul></div>
      {deps}
      <div><h4>Nos produits</h4><ul>{rays}</ul></div>
    </div>
    <div class="legal"><span>Maquette de démonstration, non officielle</span><a href="mentions-legales.html">Mentions légales</a><a href="https://www.facebook.com/p/Au-faite-90-100054362705318/">Facebook</a><a href="https://www.instagram.com/au_faite_70.90">Instagram</a><a href="http://linkedin.com/company/au-faite-90">LinkedIn</a><a href="https://www.google.com/search?q=Au+Faite+90+Avis">Avis Google</a></div>
  </div>
</footer>
<script src="assets/site.js"></script>
{scripts}</body>
</html>
'''

def page_head(title, lead, img, crumbs, alt=''):
    cr = ' <span>/</span> '.join(f'<a href="{h}">{E(t)}</a>' if h else E(t) for h, t in crumbs)
    return f'''<section class="page-head">
  <div class="txt"><div class="crumbs">{cr}</div><h1>{E(title)}</h1><p class="lead">{lead}</p></div>
  <div class="pic"><img src="assets/{img}" alt="{E(alt)}"></div>
</section>
'''

def cta_band(title='Une liste de matériaux à chiffrer ?', q=''):
    tels = ''.join(f'<span>{d["name"]} <a href="{tel_href(d["tel"])}">{d["tel"]}</a></span>' for d in DEPOTS)
    return f'''<section class="cta-band"><div class="wrap"><div><h2>{title}</h2><div class="tels" style="margin-top:16px">{tels}</div></div><a class="btn btn-red" href="contact.html{q}#devis">Demander un devis</a></div></section>
'''

def rayon_cards(cls='rayons'):
    return f'<div class="{cls}">' + ''.join(
        f'<a class="rayon" href="rayon-{r["id"]}.html"><div class="ph"><img src="assets/{r["photo"]}" alt="" loading="lazy"></div><div class="bd"><h3>{E(r["name"])}</h3><p class="what">{E(r["what"])}</p><span class="go">Voir le rayon</span></div></a>'
        for r in RAYONS) + '</div>'

def dep_cards():
    out = []
    for d in DEPOTS:
        maps = 'https://www.google.com/maps/search/?api=1&query=' + ('Au Faite ' + d['addr'] + ' ' + d['cp']).replace(' ', '+')
        out.append(f'''<article class="dep" id="{d["id"]}"><img src="assets/{d["img"]}" alt="Dépôt Au Faite de {d["name"]}" loading="lazy"><div class="body">
<h3>{d["name"]}<small>{d["sub"]}</small></h3><span class="status" data-status="{d["id"]}">Horaires</span>
<address>{d["addr"]}, {d["cp"]}<br><a href="mailto:{d["mail"]}">{d["mail"]}</a></address><div class="hours">{d["hours"]}. Fermé le week-end.</div>
<div class="acts"><a class="btn btn-red" href="{tel_href(d["tel"])}">Appeler le {d["tel"]}</a><a class="btn btn-line" href="{maps}" target="_blank" rel="noopener">Itinéraire</a></div></div></article>''')
    return '<div class="dep-grid">' + ''.join(out) + '</div>'

def brand_tile(name):
    logo, url = BR[name]
    inner = f'<img src="assets/logos/f/{logo}.webp" alt="{E(name)}" loading="lazy">' if logo else f'<span class="txtb">{E(name)}</span>'
    if url: return f'<a href="{url}" target="_blank" rel="noopener" title="Voir la gamme {E(name)}">{inner}</a>'
    return f'<span class="b">{inner}</span>'

def write(name, s):
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(s)



# ---------------------------------------------------------------- pages rayon
def slug(s):
    import unicodedata, re
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

for i, r in enumerate(RAYONS):
    toc, blocks = [], []
    for b in r['blocks']:
        a = b.get('anchor') or slug(b['t'])
        toc.append(f'<li><a href="#{a}">{E(b["t"])}{" ("+E(b["tag"].split(",")[0].lower())+")" if b.get("anchor") or b["t"] in ("Isolation végétale",) else ""}</a></li>')
        fam = ''.join(f'<li>{E(x)}</li>' for x in b['fam'])
        br = ('<p class="lbl-s">Nos fournisseurs</p><div class="brands">' + ''.join(brand_tile(x) for x in b['br']) + '</div>') if b['br'] else ''
        gal = ('<div class="gallery">' + ''.join(f'<figure><img src="assets/{p}" alt="" loading="lazy"></figure>' for p in b['img']) + '</div>') if b.get('img') else ''
        blocks.append(f'<section class="block" id="{a}"><h2>{E(b["t"])}</h2><p class="tagline">{E(b["tag"])}</p><ul class="fam">{fam}</ul>{br}{b.get("extra","")}{gal}</section>')
    stock = ''
    if r['stock']:
        stock = '<section class="block" id="au-depot"><h2>Au dépôt</h2><p class="tagline">Une partie du stock, photographiée chez nous.</p><div class="strip">' + ''.join(f'<img src="assets/{p}" alt="" loading="lazy">' for p in r['stock']) + '</div></section>'
        toc.append('<li><a href="#au-depot">Au dépôt</a></li>')
    prv, nxt = RAYONS[i-1], RAYONS[(i+1) % len(RAYONS)]
    body = head(f'{r["name"]} – Au Faite 90', r['lead']) + header(f'rayon-{r["id"]}.html') + page_head(
        r['name'], E(r['lead']), r['photo'], [('index.html','Accueil'),('produits.html','Nos produits'),(None,r['short'])]) + f'''
<section class="sec"><div class="wrap rayon-layout">
  <aside class="toc"><h2>Dans ce rayon</h2><ol>{''.join(toc)}</ol><a class="btn btn-red" href="contact.html?rayon={r["id"]}#devis">Demander un devis</a></aside>
  <div>
    <p class="lead" style="margin-bottom:48px">Les marques ci-dessous sont celles que nous travaillons le plus. Cliquez sur un logo pour voir toute la gamme du fournisseur : ce qui n’est pas en stock, nous le commandons.</p>
    {''.join(blocks)}{stock}
  </div>
</div></section>
<section class="sec alt" style="padding:48px 0"><div class="wrap pn">
  <a href="rayon-{prv["id"]}.html"><small>Rayon précédent</small><b>{E(prv["name"])}</b></a>
  <a class="next" href="rayon-{nxt["id"]}.html"><small>Rayon suivant</small><b>{E(nxt["name"])}</b></a>
</div></section>
''' + cta_band('Un chantier à chiffrer ?', f'?rayon={r["id"]}') + footer()
    write(f'rayon-{r["id"]}.html', body)



# ---------------------------------------------------------------- produits
write('produits.html', head('Nos produits – Au Faite 90', 'Bardage, isolation, bois, couverture, zinguerie : les neuf rayons d’Au Faite 90.') + header('produits.html') +
 page_head('Nos produits', 'Neuf rayons pour couvrir, isoler, habiller et équiper un toit. Ce qui n’est pas en stock, nous le commandons chez nos fournisseurs.', 'img/stock/couv1.webp',
   [('index.html','Accueil'),(None,'Nos produits')], 'Présentoirs de tuiles au dépôt de Grandvillars') +
 f'<section class="sec alt"><div class="wrap">{rayon_cards()}</div></section>' + cta_band() + footer())

# ---------------------------------------------------------------- entreprise
ALL_LOGOS = sorted(f[:-5] for f in os.listdir(OUT + '/assets/logos/f') if f.endswith('.webp'))
URLS = {v[0]: v[1] for v in BR.values() if v[0] and v[1]}
wall = ''.join((f'<a href="{URLS[n]}" target="_blank" rel="noopener"><img src="assets/logos/f/{n}.webp" alt="{n.replace("-"," ")}" loading="lazy"></a>' if n in URLS
               else f'<div><img src="assets/logos/f/{n}.webp" alt="{n.replace("-"," ")}" loading="lazy"></div>') for n in ALL_LOGOS)
write('entreprise.html', head('L’entreprise – Au Faite 90', 'Au Faite 90, négoce de matériaux de couverture créé en 2007 à Grandvillars.') + header('entreprise.html') +
 page_head('L’entreprise', 'Un négoce de couverture né à Grandvillars en 2007, qui a grandi avec ses clients : trois dépôts, des services pour les chantiers et une équipe qui connaît le métier.',
   'img/aerial2.webp', [('index.html','Accueil'),(None,'L’entreprise')], 'Vue aérienne du site de Grandvillars') + f'''
<section class="sec"><div class="wrap duo">
  <div><h2>Le quatrième magasin Au Faite</h2><p class="lead" style="margin-top:20px">En 2007, Damien Chavanne crée Au Faite 90 à Grandvillars, quatrième magasin du réseau Au Faite. Le métier de départ : négocier auprès des fabricants et vendre des matériaux de couverture.</p>
  <p>Depuis, l’entreprise a ajouté ce qui manquait sur les chantiers de ses clients : la livraison avec grutage, le pliage à la demande et la location de machines. Elle accueille les artisans comme les particuliers, en France et en Suisse.</p></div>
  <img src="assets/img/equipe/comptoir.webp" alt="L’équipe au comptoir du magasin de Grandvillars" loading="lazy">
</div></section>
<section class="sec alt"><div class="wrap">
  <div class="sec-head"><h2>Comment on en est arrivés là</h2><p class="lead muted">Les grandes étapes, de la création à aujourd’hui.</p></div>
  <ol class="timeline">
    <li><div class="when">2007</div><div><h3>Création à Grandvillars</h3><p>Ouverture du premier dépôt, rue Pierre de Coubertin. Négoce de matériaux de couverture.</p></div></li>
    <li><div class="when">Ensuite</div><div><h3>Des services pour les chantiers</h3><p>Livraison et grutage, atelier de pliage, location de machines.</p></div></li>
    <li><div class="when">Valdoie</div><div><h3>Un premier dépôt supplémentaire</h3><p>Premier dépôt supplémentaire, dans le Territoire de Belfort, pour les professionnels comme pour les particuliers.</p></div></li>
    <li><div class="when">Saulnot</div><div><h3>Au Faite 70 en Haute-Saône</h3><p>Au Faite 70 ouvre en Haute-Saône, à tous les clients, avec un nouveau service de pliage sur mesure sur place.</p></div></li>
    <li><div class="when">Aujourd’hui</div><div><h3>Des bureaux de 270 m²</h3><p>Un open space à Grandvillars, où l’outillage et les matériaux sont exposés.</p></div></li>
  </ol>
</div></section>
<section class="sec"><div class="wrap">
  <div class="sec-head"><h2>Les gens derrière le comptoir</h2><p class="lead muted">À Grandvillars, Valdoie et Saulnot, les mêmes personnes vous conseillent, préparent la commande et la livrent.</p></div>
  <div class="photos3"><img src="assets/img/bureaux/open1.webp" alt="Les bureaux de 270 m² à Grandvillars" loading="lazy"><img src="assets/img/equipe/saulnot.webp" alt="Devant le dépôt Au Faite 70 de Saulnot" loading="lazy"><img src="assets/img/equipe/cariste.webp" alt="Préparation des commandes au chariot élévateur" loading="lazy"></div>
</div></section>
<section class="sec alt" id="partenaires"><div class="wrap">
  <div class="sec-head"><h2>Nos partenaires</h2><p class="lead muted">Plus de 80 fournisseurs. Cliquez sur un logo pour voir l’ensemble des produits que nous pouvons obtenir.</p></div>
  <div class="logo-wall">{wall}</div>
</div></section>
''' + cta_band() + footer())

# ---------------------------------------------------------------- services
mach = ''.join(f'<li>{E(m)}<small>{E(d)}</small></li>' for m, d in MACHINES)
write('services.html', head('Services – Au Faite 90', 'Livraison et grutage, atelier de pliage, location de machines.') + header('services.html') +
 page_head('Livraison, pliage, location', 'Ce qui fait gagner une demi-journée sur un chantier : les palettes déposées à la grue, les pièces pliées à la cote, et le matériel qu’on n’achète pas pour un seul chantier.',
   'img/camion.webp', [('index.html','Accueil'),(None,'Services')], 'Camion plateau-grue Au Faite 90') + f'''
<section class="sec"><div class="wrap">
  <div class="svc" id="livraison">
    <div class="svc-img"><img src="assets/img/camion3.webp" alt="Camion-grue Au Faite 90 en livraison" loading="lazy"></div>
    <div><h2>Livraison et grutage</h2>
      <p>Des livraisons rapides et fiables, avec mise en place des matériaux sur le chantier par grutage. Nous vous tenons informé de l’avancement de la commande jusqu’à la livraison.</p>
      <ul class="fleet"><li><b>4</b><span>camions plateaux-grues</span></li><li><b>1</b><span>camion bâché</span></li><li><b>1</b><span>utilitaire Boxer</span></li><li><b>3</b><span>utilitaires Expert</span></li></ul>
    </div>
  </div>
  <div class="svc flip" id="perimetre">
    <div class="svc-img"><img src="assets/img/carte-livraison.webp" alt="Carte du périmètre de livraison, de Vesoul à Bâle et de Remiremont à Delémont" loading="lazy"></div>
    <div><h2>Notre périmètre de livraison</h2>
      <p>De Vesoul à Bâle, de Remiremont au Jura suisse : Territoire de Belfort, nord de la Haute-Saône et du Doubs, sud des Vosges et du Haut-Rhin, et les cantons du Jura et de Bâle.</p>
      <p class="muted">Votre chantier est en dehors de la zone ? Appelez le dépôt le plus proche, on regarde ensemble.</p>
      <a class="btn btn-line" href="contact.html">Contacter un dépôt</a>
    </div>
  </div>
  <div class="svc" id="pliage">
    <div class="svc-img"><img src="assets/img/pliage.webp" alt="Plieuse et guillotine de l’atelier de Grandvillars" loading="lazy"><span class="cap">Jusqu’à 2 m de longueur</span></div>
    <div><h2>Atelier de pliage</h2>
      <p>À Grandvillars, une plieuse et une guillotine sont à votre disposition sur demande pour le pliage de tôles fines : aluminium, zinc et couvertines, jusqu’à 2 m.</p>
      <p>À Saulnot, le dépôt propose aussi le pliage sur mesure sur place.</p>
      <a class="btn btn-red" href="contact.html?service=pliage#devis">Demander un pliage</a>
    </div>
  </div>
  <div class="svc flip" id="location">
    <div class="svc-img"><img src="assets/img/location.webp" alt="Machine à souffler l’isolant" loading="lazy"></div>
    <div><h2>Location de machines</h2><p>Neuf machines disponibles à la location, à réserver auprès du dépôt indiqué.</p><ul class="machines">{mach}</ul></div>
  </div>
</div></section>
''' + cta_band('Une livraison ou une location à prévoir ?') + footer())

# ---------------------------------------------------------------- contact
needs = ''.join(f'<input type="checkbox" name="besoin" id="n-{r["id"]}" data-id="{r["id"]}" value="{E(r["short"])}"><label for="n-{r["id"]}">{E(r["short"])}</label>' for r in RAYONS)
write('contact.html', head('Contactez-nous – Au Faite 90', 'Devis gratuit par e-mail ou par téléphone : demande de stock, livraison ou conseil.') + header('contact.html') +
 page_head('Contactez-nous', 'Un devis gratuit, une question de stock, une livraison ou un conseil : appelez le dépôt le plus proche ou envoyez votre demande.',
   'img/grandvillars.webp', [('index.html','Accueil'),(None,'Contact')], 'Panneau d’accueil du site de Grandvillars') + f'''
<section class="sec alt" id="depots"><div class="wrap">
  <div class="sec-head"><h2>Trois dépôts</h2><p class="lead muted">Ouverts du lundi au vendredi, fermés le samedi et le dimanche. L’indication d’ouverture se met à jour en temps réel.</p></div>
  {dep_cards()}
</div></section>
<section class="sec dark on-dark" id="devis"><div class="wrap quote-grid">
  <div><h2>Demande de devis</h2><p class="lead" style="margin-top:20px">Décrivez le chantier ou joignez votre liste de matériaux. Le dépôt choisi vous recontacte avec un chiffrage gratuit.</p>
    <div class="direct">Vous préférez appeler ?{''.join(f'<a href="{tel_href(d["tel"])}">{d["name"]} {d["tel"]}</a>' for d in DEPOTS)}</div></div>
  <div>
    <form class="devis" id="devisForm" novalidate>
      <fieldset class="full"><legend>Vous êtes</legend><div class="seg">
        <input type="radio" name="profil" id="p-pro" value="Professionnel" checked><label for="p-pro">Professionnel</label>
        <input type="radio" name="profil" id="p-part" value="Particulier"><label for="p-part">Particulier</label></div></fieldset>
      <fieldset class="full"><legend>Rayons concernés <span class="opt">(facultatif)</span></legend><div class="seg">{needs}</div></fieldset>
      <div class="full"><label class="lbl" for="desc">Votre demande</label><textarea id="desc" name="desc" placeholder="Ex. : réfection d’un pan de 60 m² en tuiles terre cuite, avec écran sous-toiture et gouttières zinc."></textarea></div>
      <div><label class="lbl" for="depot">Dépôt</label><select id="depot" name="depot"><option>Grandvillars</option><option>Valdoie</option><option>Saulnot</option><option>Le plus proche de mon chantier</option></select></div>
      <fieldset><legend>Livraison sur chantier</legend><div class="seg">
        <input type="radio" name="livraison" id="l-oui" value="Oui" checked><label for="l-oui">Oui</label>
        <input type="radio" name="livraison" id="l-non" value="Non"><label for="l-non">J’enlève au dépôt</label></div></fieldset>
      <div id="f-nom"><label class="lbl" for="nom">Nom ou entreprise</label><input type="text" id="nom" name="nom" autocomplete="name"><div class="err">Indiquez un nom pour que le dépôt sache qui rappeler.</div></div>
      <div id="f-tel"><label class="lbl" for="tel">Téléphone</label><input type="tel" id="tel" name="tel" autocomplete="tel" placeholder="06 12 34 56 78"><div class="err">Indiquez un numéro à 10 chiffres.</div></div>
      <div class="full"><label class="lbl" for="email">E-mail <span class="opt">(facultatif)</span></label><input type="email" id="email" name="email" autocomplete="email"></div>
      <div class="full"><label class="lbl" for="pj">Plans, photos ou liste de matériaux <span class="opt">(facultatif)</span></label><input type="file" id="pj" name="pj" multiple accept="image/*,.pdf,.xls,.xlsx,.doc,.docx"></div>
      <div class="full form-foot"><button class="btn btn-red" type="submit">Envoyer ma demande</button><small>Vos coordonnées servent uniquement à répondre à cette demande.</small></div>
    </form>
    <div class="sent" id="sent" role="status" tabindex="-1"></div>
  </div>
</div></section>
''' + footer())

# ---------------------------------------------------------------- mentions légales
write('mentions-legales.html', head('Mentions légales – Au Faite 90', 'Mentions légales du site Au Faite 90.') + header('') +
 page_head('Mentions légales', 'Informations sur l’éditeur du site, son hébergement et le traitement des données.', 'img/hero.webp',
   [('index.html','Accueil'),(None,'Mentions légales')]) + '''
<section class="sec"><div class="wrap prose">
  <p class="muted">Reprise des mentions du site actuel. À faire relire et compléter (numéro SIRET et RCS) avant mise en ligne.</p>
  <h2>Éditeur</h2>
  <dl><dt>Raison sociale</dt><dd>AU FAITE 90</dd><dt>Forme juridique</dt><dd>SASU au capital social de 171 600 €</dd>
  <dt>Siège</dt><dd>Rue Pierre de Coubertin, 90600 Grandvillars</dd><dt>TVA intracommunautaire</dt><dd>FR52494195290</dd>
  <dt>Directeur de la publication</dt><dd>AU FAITE 90, <a class="link" href="mailto:aufaite90@aufaite90.com">aufaite90@aufaite90.com</a></dd>
  <dt>Webmestre</dt><dd>AU FAITE 90, aufaite90@aufaite90.com</dd></dl>
  <h2>Hébergement</h2>
  <dl><dt>Hébergeur</dt><dd>OVH, 2 rue Kellermann, 59100 Roubaix</dd></dl>
  <h2>Données personnelles</h2>
  <dl><dt>Responsable du traitement</dt><dd>Damien Chavanne, représentant légal</dd><dt>Délégué à la protection des données</dt><dd>AU FAITE 90, aufaite90@aufaite90.com</dd></dl>
  <p style="margin-top:18px">Les informations transmises par le formulaire de devis servent uniquement à répondre à la demande. Vous pouvez demander leur consultation, leur rectification ou leur suppression à l’adresse ci-dessus.</p>
  <h2>Droit applicable</h2>
  <p>Le site est soumis au droit français. Tout litige relève de la compétence exclusive des tribunaux de Belfort.</p>
</div></section>
''' + footer())

# ---------------------------------------------------------------- accueil
LAYERS = [
 dict(key='solaire',name='Panneaux solaires',txt="Modules en surimposition sur rails ou intégrés à la couverture, avec les fixations adaptées à votre tuile.",brands='Terreal, Prefa, Ubbink',cat='solaire'),
 dict(key='fenetre',name='Fenêtre de toit',txt="Fenêtres de toit, volets, stores, verrières et lanterneaux, avec leurs raccords d'étanchéité.",brands='Velux, Roto, Bluetek',cat='fenetres'),
 dict(key='conduit',name='Sortie de toit et conduit',txt="Sorties de toit, conduits de fumée isolés et ventilations, avec l'abergement zinc autour.",brands='Poujoulat',cat='fenetres'),
 dict(key='tuiles',name='Couverture',txt="Tuiles terre cuite, béton et verre, faîtières, ardoise, bac acier et panneaux isolés. Les gammes sont exposées au dépôt pour choisir la teinte sur pièce.",brands='Terreal, Koramic, Edilians, Cupa Pizarras, Joris Ide, ArcelorMittal',cat='couverture'),
 dict(key='zinguerie',name='Zinguerie',txt="Gouttières, crochets, descentes, coudes, colliers et dauphins, en zinc, galva, acier laqué ou cuivre. Pliage sur mesure jusqu'à 2 m à Grandvillars.",brands='VMZinc, Rheinzink',cat='zinguerie'),
 dict(key='debord',name='Débord de toit',txt="Lambris de sous-face, planches et bandeaux de rive, en bois ou en PVC sans entretien.",brands='Lignalpes, MEP, Deceuninck',cat='debord'),
 dict(key='bardage',name='Bardage du pignon',txt="Lames de bardage bois, PVC ou fibre-ciment pour habiller pignons et façades.",brands='Vinylit, Deceuninck, Cedral',cat='bardage'),
 dict(key='liteaux',name='Liteaux et contre-liteaux',txt="Bois de couverture traité pour poser les tuiles et ventiler sous la couverture.",brands='Scierie Weber, W Distribution Bois',cat='debord'),
 dict(key='ecran',name='Écran sous-toiture',txt="Écrans HPV, membranes bitume, EPDM et PVC, bandes et adhésifs pour l'étanchéité.",brands='Soprema, Siplast, Novintiss, Renolit',cat='etancheite'),
 dict(key='isolant',name='Isolation',txt="Laine de roche, laine de bois, ouate, panneaux PU et isolants minces. La machine à souffler Jetrock se loue au dépôt.",brands='Rockwool, Isover, Igloo, IKO, Knauf, Unilin',cat='etancheite'),
 dict(key='charpente',name='Charpente',txt="Chevrons, pannes, faîtage, lamellé-collé et panneaux : la charpente sur liste, à la longueur.",brands='Scierie Weber, Lignalpes',cat='debord'),
]
home = head('Au Faite 90 – Matériaux de couverture', 'Négoce de matériaux de couverture à Grandvillars, Valdoie et Saulnot. Tuiles, ardoises, bac acier, zinguerie, isolation, fenêtres de toit. Livraison par camion-grue.') + header('index.html') + f'''
<section class="hero">
  <div class="txt">
    <h1>Tout ce qui fait un toit.</h1>
    <p class="lead">Négoce de matériaux de couverture depuis 2007, en France et en Suisse. Pour les particuliers comme pour les professionnels, en construction, rénovation et aménagement.</p>
    <div class="ctas"><a class="btn btn-red" href="contact.html#devis">Demander un devis</a><a class="btn btn-line light" href="contact.html#depots">Trouver un dépôt</a></div>
    <div class="facts"><div><b>Grandvillars</b>Territoire de Belfort</div><div><b>Valdoie</b>Territoire de Belfort</div><div><b>Saulnot</b>Haute-Saône</div></div>
  </div>
  <div class="pic"><img src="assets/img/hero.webp" alt="Vue aérienne du dépôt Au Faite 90 de Grandvillars, avec ses palettes de tuiles et ses hangars" fetchpriority="high"><div class="tri" aria-hidden="true"></div></div>
</section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><h2>Deux nouveaux dépôts, le même comptoir.</h2><p class="lead muted">Après Grandvillars, Au Faite a ouvert Valdoie et Saulnot : plus près de vos chantiers, avec le même stock et les mêmes conseils.</p></div>
  <div class="figures"><div><b>2007</b><span>création à Grandvillars</span></div><div><b>3</b><span>dépôts</span></div><div><b>80+</b><span>fournisseurs</span></div><div><b>9</b><span>rayons de produits</span></div></div>
</div></section>

<section class="explode" id="toiture" aria-labelledby="t-toiture">
  <div class="wrap intro"><div class="sec-head" style="margin-bottom:0"><h2 id="t-toiture">Du chevron à la tuile, on a chaque couche.</h2><p class="lead">Faites défiler : la toiture s’ouvre couche par couche. Cliquez sur une étiquette pour ouvrir le rayon, ou sur un élément de la maison pour le voir en 3D.</p></div></div>
  <div class="stage" id="stage">
    <canvas id="roof" aria-hidden="true"></canvas>
    <div class="tags" id="tags" aria-hidden="true"></div>
    <div class="panel"><ol class="layer-list" id="layerList"></ol><div class="detail" aria-live="polite"><div class="swap" id="detail"></div></div></div>
    <div class="progress" id="progress"></div>
    <div class="scroll-hint" id="hint">Faites défiler pour ouvrir la toiture</div>
  </div>
  <div class="no3d wrap" id="no3d"></div>
</section>
<div class="roofline" aria-hidden="true"></div>

<section class="sec" id="produits"><div class="wrap">
  <div class="sec-head"><h2>Nos produits</h2><p class="lead muted">Bardage, isolation, bois, couverture, zinguerie : neuf rayons, et ce qui n’est pas en stock, on le commande.</p></div>
  {rayon_cards()}
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="svc">
    <div class="svc-img"><img src="assets/img/camion.webp" alt="Camion plateau-grue Scania aux couleurs d’Au Faite 90" loading="lazy"><span class="cap">Livré, grué, posé au pied du chantier</span></div>
    <div><h2>Livraison et grutage</h2><p>Des livraisons rapides et fiables, avec mise en place des matériaux sur chantier par grutage, et un suivi de la commande jusqu’à la livraison.</p>
      <ul class="fleet"><li><b>4</b><span>plateaux-grues</span></li><li><b>1</b><span>camion bâché</span></li><li><b>1</b><span>utilitaire Boxer</span></li><li><b>3</b><span>utilitaires Expert</span></li></ul>
      <p style="margin-top:26px"><a class="btn btn-line" href="services.html#perimetre">Voir notre périmètre de livraison</a></p></div>
  </div>
  <div class="svc flip">
    <div class="svc-img"><img src="assets/img/pliage.webp" alt="Atelier de pliage" loading="lazy"></div>
    <div><h2>Pliage et location</h2><p>Une plieuse et une guillotine à Grandvillars pour l’aluminium, le zinc et les couvertines jusqu’à 2 m, le pliage sur mesure à Saulnot, et neuf machines en location : souffleuses Jetrock, cardeuse, cloueurs, carotteuse…</p>
      <p style="margin-top:22px"><a class="btn btn-line" href="services.html#pliage">Le pliage</a> <a class="btn btn-line" href="services.html#location">La location</a></p></div>
  </div>
</div></section>

<section class="sec" id="depots"><div class="wrap">
  <div class="sec-head"><h2>Trois dépôts, du stock dans chacun.</h2><p class="lead muted">Fermés le samedi et le dimanche. L’indication d’ouverture se met à jour en temps réel.</p></div>
  {dep_cards()}
</div></section>

<section class="sec alt" style="padding:56px 0"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:20px 40px;align-items:center;justify-content:space-between">
  <div><h2 style="font-size:clamp(32px,3.4vw,48px)">Vous êtes déjà client ?</h2><p class="lead muted" style="margin:10px 0 0">Votre avis aide les artisans et les particuliers de la région à nous trouver.</p></div>
  <a class="btn btn-line" href="https://www.google.com/search?q=Au+Faite+90+Avis" target="_blank" rel="noopener">Laisser un avis Google</a>
</div></section>
''' + cta_band() + footer(f'''<script>window.LAYERS={json.dumps(LAYERS, ensure_ascii=False)};</script>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/ScrollTrigger.min.js"></script>
<script src="assets/af3d.js"></script>
''')
write('index.html', home)
print('ok', len(os.listdir(OUT)))
