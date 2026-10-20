# Au Faite 90 — maquette de site (non officielle)

Maquette de démonstration réalisée pour présentation à Au Faite 90, négoce de matériaux de couverture
(Grandvillars, Valdoie, Saulnot). Ce n'est pas le site officiel de l'entreprise.

## Voir la maquette
Ouvrir `index.html` dans un navigateur (fonctionne hors ligne).

## Pages
- `index.html` : accueil, avec la vue éclatée 3D de la toiture
- `entreprise.html`, `produits.html`, `rayon-*.html` (9 rayons), `services.html`, `contact.html`, `mentions-legales.html`

## Modifier
- Textes et données : `src/build.py`, puis `python src/build.py`
- 3D : `src/roof.src.js`, puis `npx esbuild src/roof.src.js --bundle --minify --format=iife --outfile=assets/roof.js`

## À faire avant toute mise en ligne
- Brancher le formulaire de devis (il n'envoie rien)
- Faire valider la page Bardage & Revêtements et les mentions légales (SIRET/RCS)
- Obtenir l'accord pour les logos et visuels fournisseurs
- Retirer la mention « maquette » uniquement si le client valide
