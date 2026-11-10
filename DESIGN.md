# Le Saint Louis · système visuel

Fil rouge : **l'arche-miroir** (miroirs en arc et baie vitrée du salon, dorures) et **la feuille** (plantes, papier
peint vert). Toutes les photos sont cadrées en arche avec un filet décalé ; les sections s'enchaînent par des
arcades ou des dômes.

## Couleurs (rôles)

| Jeton | Valeur | Rôle |
|---|---|---|
| `--sauge` | `#8A9E85` | Champ dominant : hero, chiffres, menu mobile. Texte dessus : toujours `--foret`. |
| `--or` | `#C8A752` | Dorures, actions sur fond sombre. Jamais en texte sur fond clair. |
| `--brume` | `#C6C3C8` | Section « visite », panneaux de prestations. |
| `--foret` | `#1C2820` | Encre et fonds profonds (marquee, prestations, appel à l'action, pied de page). |
| `--mousse` | `#4B5F4C` | Vert intermédiaire : avis, filets, feuilles. |
| `--papier` | `#F1EFF1` | Fond clair teinté de gris lavande. |
| `--or-encre` | `#7C6119` | Or assombri, réservé à un éventuel texte doré sur fond clair. |

## Typographie

- **Gloock** (titres) : forte, contrastée, chaleureuse. Hero et pied de page en très grand corps, `h2` jusqu'à 5,6 rem.
- **Figtree** (texte) : ronde et lisible. Corps 17–18 px, interligne 1,6.

## Formes et motifs

- `.arche` : `border-radius: 999px 999px 0 0` + grain photo ; `.frame` ajoute le filet d'arche décalé.
- Séparateurs : `.edge-bumps` (arcades) et `.edge-dome` (dôme), pilotés par `data-edge`.
- Feuilles : symboles SVG `#leaf-a`, `#leaf-b`, `#leaf-o` (trait) et `#sprig` (rameau) dans `index.html`.

## Mouvement

Une idée par section, jamais deux fois la même :
préchargeur (traversée de l'arche) · hero (parallaxe 4 couches + souris + reflet) · marquee (vitesse et sens liés au
scroll) · manifeste (mots révélés + ciseaux) · visite (section épinglée, masques) · prestations (défilement horizontal
+ inclinaison 3D) · chiffres (compteurs) · galerie (masque circulaire, dérive, inclinaison) · avis (carrousel) ·
appel à l'action (projecteur doré, chiffres qui roulent) · carte (rideau).
Courbes `expo` / `power3`, transform / opacity / clip-path uniquement.
