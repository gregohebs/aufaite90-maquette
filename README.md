# Au Faite 90 — maquette de site (non officielle)

Maquette de démonstration réalisée pour présentation à Au Faite 90, négoce de matériaux de couverture
(Grandvillars, Valdoie, Saulnot). Ce n'est pas le site officiel de l'entreprise.

## Voir la maquette
Ouvrir `index.html` dans un navigateur (fonctionne hors ligne).

## Pages
- `index.html` : accueil, avec la vue éclatée 3D de la toiture
- `entreprise.html`, `produits.html`, `rayon-*.html` (9 rayons), `services.html`, `contact.html`, `mentions-legales.html`

## La 3D
- Accueil : maison réaliste dont la toiture s'ouvre en 11 couches au défilement. La caméra cadre chaque couche. Les étiquettes mènent aux pages rayon, et un clic sur un élément de la maison l'ouvre dans la visionneuse 3D.
- La 3D est réservée à l'accueil. Les éléments de la maison sont des modèles construits en code (`src/3d/models.js`).

## Modifier
- Textes et données des pages : `src/build.py`, puis `npm run build:pages`
- 3D : `src/3d/*.js`, puis `npm install` (une fois) et `npm run build:3d`

## À faire avant toute mise en ligne
- Brancher le formulaire de devis (il n'envoie rien)
- Faire valider la page Bardage & Revêtements et les mentions légales (SIRET/RCS)
- Obtenir l'accord pour les logos et visuels fournisseurs
- Retirer la mention « maquette » uniquement si le client valide
