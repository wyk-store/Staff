# WYK STAFF — livraison 3D et audit du thème

## Architecture livrée

- `badge.html` conserve `S.badgeCard`, `S.bindBadge`, `S.badgeCanvas`, les téléchargements, le profil public et le QR existants.
- `badge3d.js` ajoute `S.badge3D(root, profile, opts)` et charge Three.js r160 depuis `cdn.jsdelivr.net` uniquement.
- La face avant est construite depuis le canvas produit par `S.badgeCanvas`, puis rééchantillonnée en 4096 × 2306 pour la texture GPU. Le rééchantillonnage améliore le format de texture, pas les détails originaux du canvas 1920 × 1081.
- Le dos blanc est généré localement en canvas, avec identifiant, QR du même lien public, puce/bande, signature et hologramme visuel.
- `badge3d.css` s'appuie sur `data-theme` et les tokens sémantiques du site.
- `staff.js` conserve la clé `wyk-staff-theme`, synchronise `color-scheme` et `theme-color`, et écoute les changements de thème stockés / système.
- `moi.html` et `admin.html` chargent la couche 3D et le CSS de thème.

## CSP finale

```text
default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://byrklytqoucdskzvcoau.supabase.co wss://byrklytqoucdskzvcoau.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'
```

`object-src 'none'` bloque les plugins embarqués, `base-uri 'self'` empêche l'injection d'une base distante, `form-action 'self'` limite les destinations de formulaires et `frame-src 'none'` interdit les iframes. Aucun `worker-src blob:` n'est nécessaire : aucun worker n'est créé. Si le site applique aussi une CSP HTTP côté hébergeur, cette politique doit être synchronisée à cet endroit ; une balise meta ne peut pas remplacer ni assouplir une CSP HTTP existante.

## Audit ciblé des styles de thème

| Zone | État initial constaté | Correction appliquée |
|---|---|---|
| En-tête `.top` | Déjà largement basé sur `--bg`, `--line`, `--ink` | Maintenu ; bouton de thème reçoit un libellé accessible et `aria-pressed` |
| Burger et panneau `.drawer` | Fond/texte fixes (`#0e0e10`, `#f3f2ec`) qui restaient sombres en thème clair | Variables `--drawer-bg`, `--drawer-ink`, `--drawer-muted`, `--drawer-line`, `--drawer-soft`, `--drawer-hover` |
| Bouton de thème | Icône mise à jour mais pas de `aria-pressed` ni de couleur navigateur synchronisée | Synchronisation `aria-label`, `aria-pressed`, `color-scheme` et `meta theme-color` |
| Pied `.foot` | Déjà lié à `--mut` et `--line` | Maintenu ; fond transparent explicite |
| Scène 3D | Media query `prefers-color-scheme:light` pouvait contredire `data-theme` | Supprimée au profit de `:root[data-theme="light|dark"]` |
| Cartes générales | La plupart utilisent `--card`, `--line`, `--ink`, mais plusieurs composants spécifiques gardent des couleurs de marque / d'état codées en dur | Les surfaces de la scène et du panneau sont sémantisées. Les couleurs fonctionnelles (rouge de marque, états OK/erreur, scrim de modal) restent intentionnelles. Un audit global pixel-par-pixel de chaque composant de `staff.css` n'est pas revendiqué. |
| Flash de thème | Le thème était principalement appliqué après chargement de `staff.js` | Script inline avant CSS/peinture sur badge, moi et admin ; préférence enregistrée prioritaire, système utilisée si aucune préférence enregistrée |

## Limites techniques honnêtement connues

Cette livraison constitue une intégration 3D enrichie, pas encore la totalité du cahier des charges de simulation haut de gamme. Le lanyard est une géométrie de démonstration, pas une chaîne Verlet ; la fente n'est pas une découpe booléenne réelle ; les contrôles multitouch ne réalisent pas encore le pan centré exact et le long-press loupe ; l'orientation gyroscopique complète, la simulation de matériaux holographiques par shader anisotrope, l'EffectComposer (SMAA/FXAA/bloom), la qualité adaptative à trois paliers, la calibration FPS et les hotspots accessibles détaillés restent à compléter. Le mode reduced-motion et le WebGL indisponible conservent le rendu 2D. Une perte de contexte WebGL bascule vers le 2D.

## Checklist de validation

- [ ] iPhone Safari : portrait/paysage, safe areas, barre d'adresse, zoom tactile et mode reduced-motion.
- [ ] Android Chrome : 320×568, 360×640, 375×667, 390×844, 412×915, 430×932.
- [ ] Tablette : 768×1024 et 1024×768.
- [ ] Desktop : 1366×768, 1920×1080, 2560×1440 ; souris, molette, clavier et plein écran.
- [ ] Rotation d'écran et `visualViewport` : vérifier que le badge reste cadré et entièrement visible au repos.
- [ ] Réglage système clair/sombre sans préférence stockée ; clic `#themeBtn` ; onglet dupliqué / stockage synchronisé ; actualisation.
- [ ] Vérifier en thème clair/sombre : `#top`, marque, bouton thème, burger, drawer, scène, actions, notes, `#foot`, modale QR et toast.
- [ ] `prefers-reduced-motion: reduce` : le badge 2D reste visible, aucun tour 3D lancé.
- [ ] WebGL désactivé / contexte perdu : aucun écran vide, badge 2D disponible.
- [ ] PNG/PDF : comparer visuellement à l'export historique et scanner le QR sur appareil réel.
- [ ] Console et réseau : aucune erreur JS, Three.js servi depuis `cdn.jsdelivr.net/npm/three@0.160.0/`, images et QR correctement chargés.

## Constantes de réglage dans `badge3d.js`

- `CARD_W`, `CARD_H`, `CARD_D`, `CORNER`, `BEVEL` : dimensions et épaisseur de la carte.
- `FRONT_W`, `FRONT_H`, `BACK_W`, `BACK_H` : dimensions des textures.
- `MAX_DPR` : plafond de densité de pixels du renderer.
- `ROTATE_SENSITIVITY`, `DAMPING` : sensibilité et inertie de rotation.
- `MIN_ZOOM`, `MAX_ZOOM`, `SAFE_MARGIN` : limites de zoom et marge de cadrage.

## Décisions prises

1. Conserver le rendu 2D et les fonctions de production comme source de vérité.
2. Ne pas ajouter de dépendance à un bundler ni à une texture externe.
3. Charger Three.js à la demande depuis la version r160 imposée.
4. Faire prévaloir le choix `data-theme` enregistré sur le thème système ; utiliser le thème système uniquement sans préférence enregistrée.
5. Garder les couleurs rouge WYK et les couleurs d'état comme couleurs fonctionnelles, mais rendre les surfaces et le texte du panneau sensibles au thème.
6. Ne pas prétendre que des effets physiques non implémentés sont présents : les éléments non achevés sont listés explicitement ci-dessus.
