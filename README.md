# Le Saint Louis · site vitrine

Site one-page du salon de coiffure **Le Saint Louis** (1 place Saint-Louis, 29200 Brest).
HTML / CSS / JavaScript purs : aucune étape de build, aucune dépendance à installer.

## Voir le site en local

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Le dossier peut être publié tel quel sur n'importe quel hébergement statique
(Netlify, Vercel, GitHub Pages, OVH…).

## Structure

```
index.html                 contenu, SEO, données structurées (HairSalon)
favicon.svg
assets/css/style.css       design tokens, mise en page, états, responsive
assets/js/main.js          mise en scène (GSAP + ScrollTrigger + Lenis), carrousel, menu, horaires
assets/img/                photos du salon (+ grain.png, texture photo)
assets/fonts/              Gloock (titres) et Figtree (texte), auto-hébergées
assets/vendor/             gsap, ScrollTrigger, lenis (copies locales, aucun CDN)
```

## Ce qu'il faut savoir pour modifier le site

- **Horaires** : à changer en 3 endroits : la liste `#hours` et le pied de page dans `index.html`, le tableau
  `SCHEDULE` dans `assets/js/main.js` (statut « Ouvert / Fermé » en direct, heure de Paris) et le bloc JSON-LD
  du `<head>`.
- **Photos** : remplacer les fichiers de `assets/img/` en gardant les noms. Les photos fournies sont très petites
  (≈ 200 × 270 px) ; elles sont agrandies et légèrement granulées. Avec des originaux en haute définition
  (idéalement 1200 px de large ou plus), le site sera bien plus net sans toucher au code.
- **Avis** : repris mot pour mot dans `index.html` (section `#avis`). Ne pas les corriger.
- **Prestations** : section `#prestations`. Aucun tarif n'est affiché (non fournis).
- **Chiffres** : section `#chiffres`, uniquement des faits vérifiables (2 coiffeuses, 5 jours, 44 heures
  d'ouverture par semaine). Les valeurs sont dans `data-to` et dans le texte.
- **Couleurs** : variables CSS en tête de `style.css` (`--sauge`, `--or`, `--brume` sont les couleurs imposées).
- **Accessibilité / mouvement** : `prefers-reduced-motion` désactive le smooth scroll, le préchargeur, les sections
  épinglées et le défilement horizontal ; tout le contenu reste lisible.
