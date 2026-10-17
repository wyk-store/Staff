# WYK STAFF — mise en ligne (staff.wykht.com)

Site statique (HTML/CSS/JS) + même projet Supabase que wykht.com. Aucune installation, aucun serveur.

## 1. Supabase (10 min)
1. **SQL Editor** → New query → coller tout `staff-setup.sql` → Run. (Crée les tables `staff_*`, les règles de sécurité, les fonctions et le stockage `staff-media`. Ton compte admin actuel `dcdb1af5-…` est déjà enregistré comme administrateur.)
2. **Authentication → URL Configuration** :
   - *Redirect URLs* : ajouter `https://staff.wykht.com/**`
   - (Site URL : laisse celui de wykht.com.)
3. **Authentication → Providers → Email** : désactive « Confirm email » pour que l'employé arrive directement sur son profil après avoir confirmé son code. Si tu le laisses activé, ça marche aussi : l'employé confirme son email, se connecte, et son profil est créé automatiquement.
4. Admin : connecte-toi sur `staff.wykht.com/connexion` avec **le même email/mot de passe admin que wykht.com** (même projet Supabase = même compte).

## 2. GitHub Pages (5 min)
GitHub Pages n'accepte qu'un domaine par dépôt : crée un **nouveau dépôt** (ex. `wyk-staff`).
1. Envoie-y tous les fichiers de ce dossier (le fichier `CNAME` contient déjà `staff.wykht.com`).
2. Settings → Pages → Source : *Deploy from a branch* → `main` / `/ (root)` → Save.
3. Settings → Pages → *Custom domain* : `staff.wykht.com` → Save, puis coche **Enforce HTTPS** (disponible quand le DNS est reconnu, quelques minutes).

## 3. Namecheap — le sous-domaine
Namecheap → Domain List → **wykht.com → Manage → Advanced DNS** → *Add New Record* :

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME Record | `staff` | `TON-COMPTE-GITHUB.github.io.` | Automatic |

`TON-COMPTE-GITHUB` = le nom d'utilisateur (ou de l'organisation) GitHub qui possède le dépôt `wyk-staff`. Ne touche pas aux enregistrements existants de wykht.com. Propagation : 5 à 30 min en général.

## 4. Utilisation
- **Admin** (`/admin`) : *Postes* (liste modifiable) → *Catégories & visibilité* (cases à cocher par catégorie) → *Invitations* (code + poste + catégorie → « Copier le lien ») → *Profils* (voir, modifier, activer / désactiver / suspendre / mettre en examen, supprimer).
- **Employé** : ouvre le lien `…/activer?code=XXXX` (ou saisit son code sur la page d'accueil) → crée son compte → son profil est créé avec son poste, son **ID automatique** (`WYK-CTO-001`) et la **date d'activation automatique** → il complète photo, parcours, compétences, CV.
- **Profil public** : `https://staff.wykht.com/profil?id=WYK-CTO-001` (c'est aussi le contenu du QR code). Seuls les champs cochés pour sa catégorie sortent de la base ; un profil inactif / suspendu / en examen affiche « Profil indisponible ».

## Notes
- Sécurité : la visibilité est appliquée **côté base de données** (fonction `staff_public_profile`), pas seulement à l'affichage. Un employé ne peut jamais changer son statut, son poste, sa catégorie, son ID ni sa date d'activation.
- Les photos et CV sont dans un stockage public (adresses non devinables) : une photo « non publique » n'est affichée nulle part, mais quelqu'un qui connaîtrait son adresse exacte pourrait l'ouvrir.
- Les profils sont en `noindex` (non référencés par Google).
- Le bouton « Télécharger le CV » génère un CV propre via l'impression du navigateur (« Enregistrer au format PDF ») ; si l'employé téléverse son propre PDF, c'est lui qui est proposé.
- La ligne « Français » du menu est en place ; les autres langues ne sont pas encore traduites.
- Textes « Confidentialité » et « Conditions » : modèles de départ à faire relire.
- Suppression d'un profil : supprime le profil, pas le compte de connexion (à retirer dans Supabase → Authentication si besoin).

## 5. Badges de confiance (ajout)
- **SSLCanary** : le badge `staff.wykht.com` est dans le pied de page partagé (`staff.js`, style dans `staff.css`). Les `href` / `src` fournis par SSLCanary sont inchangés.
- **« Employé vérifié par WYK »** : exécute une fois `staff-verified.sql` dans Supabase > SQL Editor. Ensuite, Admin > Profils > bouton **Vérifier** / **Retirer le badge**. Le badge apparaît à côté du nom (page publique, « Mon profil », liste admin) uniquement si l'admin a validé le profil ; un employé ne peut pas se l'attribuer (protégé par le trigger `staff_guard`).


## 6. Mise à jour v2 — sécurité, badge animé, CV, âge automatique
**À faire dans cet ordre :**
1. Supabase > SQL Editor > exécute **`staff-v2.sql`** une seule fois (idempotent ; il remplace `staff-verified.sql`). Il ajoute : date/lieu de naissance, nationalité, identifiant public aléatoire, description du poste, et met à jour la protection + le profil public.
2. Remplace tous les fichiers du dépôt GitHub par ceux de ce dossier (nouveaux : `badge.html`, `info.js`, `404.html`, `staff-v2.sql`).
3. Admin > **Postes** : renseigne la « Description du poste » (elle s'affiche sur le badge). Admin > **Catégories & visibilité** : coche ce qui est public (nouveaux choix : Âge, Date de naissance exacte, Lieu de naissance, Nationalité — **cachés par défaut**).

**Sécurité**
- « Mot de passe oublié » supprimé. Un mot de passe perdu se réinitialise dans Supabase > Authentication > Users (ou en envoyant un lien depuis ce tableau de bord).
- La connexion n'est plus liée nulle part : ni accueil, ni menu. Elle n'existe que via l'URL `/connexion`. Pour la cacher davantage : renomme `connexion.html` (ex. `acces-7k2m.html`) et change `S.LOGIN` en haut de `staff.js`. `/admin` affiche une fausse page 404 aux visiteurs non-admin.
- Blocage après 5 échecs de connexion, déconnexion après 30 min d'inactivité, mot de passe 8 caractères + lettre + chiffre à l'inscription, case d'acceptation de la confidentialité, CSP (liste blanche des sources) sur chaque page.
- Liens de profil/badge : `…/profil?id=ABC123…` et `…/badge?id=ABC123…` avec un identifiant aléatoire. Les anciens liens avec l'ID employé (ex. WYK-CTO-001) marchent encore ; pour les désactiver, retire `or upper(employee_code)=…` dans `staff_public_profile`.
- Dans Supabase > Authentication > Providers > Email, mets « Minimum password length » à 8 et active la protection contre les mots de passe compromis.

**Badge xlogs** : colle l'adresse de vérification fournie par xlogs dans `S.XLOGS.url` (haut de `staff.js`) ; le badge « xlogs Verified » apparaîtra alors sur les profils. Tant que c'est vide, il est masqué.


## 7. Mise à jour v3 — accueil épuré, badge identique au modèle, icônes de poste, connexion par ID
**À faire dans cet ordre :**
1. Supabase > SQL Editor > exécute **`staff-v3.sql.txt`** une seule fois (idempotent).
2. Supabase > Authentication > Providers > Email : **désactive « Confirm email »** (obligatoire : les comptes employés n'ont plus d'email réel, ils ne peuvent donc pas confirmer un lien).
3. Remplace tous les fichiers du dépôt GitHub par ceux de ce dossier.
4. Admin > **Postes** : choisis l'icône de chaque poste (ou laisse « Auto » : elle est détectée d'après l'intitulé).

**Ce qui change**
- Accueil : plus aucun champ « J'ai un code » ni étapes liées à un code. Les employés ouvrent le lien d'invitation `…/activer?code=XXXX`. Email de contact : contact@wykht.com (pied de page, accueil, page Contact).
- Inscription : plus d'email. L'employé choisit un mot de passe ; son **ID employé** (ex. WYK-CTO-001) lui est affiché à la fin. Un email de contact public est facultatif.
- Connexion (`/connexion`) : **ID employé + mot de passe**. L'administrateur peut toujours saisir son adresse email dans le même champ. Les comptes existants créés avec un vrai email se connectent aussi avec cet email.
- Badge : même mise en page que le modèle (police du site conservée), ID affiché en permanence, QR code plus grand en bas à droite, icône propre à chaque poste. Boutons **Enregistrer l'image** (PNG, forme exacte) et **Télécharger en PDF**. Aucune mention « vérifié » sur le badge téléchargé.
- CV : mis en page sur une seule page A4, sans mention « vérifié ». Le bouton ouvre la fenêtre d'impression : choisir « Enregistrer au format PDF ».
- Mot de passe perdu : l'administrateur le réinitialise dans Supabase > Authentication > Users (le compte employé est `staff-xxxx@staff.wykht.com`, retrouvable via son profil).


## Visite 3D du badge (ajout v3.6)
Les fichiers `badge3d.js` et `badge3d.css` ajoutent une scène Three.js progressive aux pages `badge.html`, `moi.html` et à l'aperçu badge de `admin.html`. La page garde le badge 2D comme solution de repli. La face avant est issue de `S.badgeCanvas` afin de conserver la composition exportée; le dos est généré localement avec un QR public, un effet PVC clair, une zone de puce et un hologramme graphique.

- Three.js est chargé à la demande depuis `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`.
- Aucun `worker-src blob:` n'est nécessaire; aucune texture ou image supplémentaire distante n'est chargée.
- `S.badge3D(root, profile, {code})` renvoie une instance contenant `dispose`, `flip`, `reset`, `tour` et `host`.
- Le mode 3D est désactivé si `prefers-reduced-motion: reduce` est actif ou si WebGL n'est pas disponible.
- Les exports PNG/PDF et les fonctions existantes du badge restent assurés par `staff.js`.


## Visite 3D (v3.7)

La page du badge, l’aperçu du profil et la vue badge d’administration chargent `badge3d.js` et `badge3d.css`. Voir `AUDIT-3D-THEME.md` pour la CSP, l’audit ciblé du thème, les limites fonctionnelles connues et la checklist de test. La 3D est progressive et le badge 2D existant reste le repli.


## Réinitialiser le mot de passe d'un employé (v4)
1. Supabase > SQL Editor : exécute **une fois** `staff-v4.sql.txt`.
2. Admin > **Profils** > bouton **Mot de passe** sur la ligne de l'employé : un mot de passe temporaire est généré (modifiable). Clique **Réinitialiser**, puis **Copier le message complet** et envoie-le à l'employé par un canal privé (WhatsApp, SMS…).
3. L'employé est déconnecté de tous ses appareils. Il se connecte avec son ID + le mot de passe temporaire, puis la page **Mon espace > Sécurité** s'ouvre toute seule pour qu'il choisisse son propre mot de passe.
4. Un employé peut aussi changer son mot de passe quand il veut depuis **Mon espace > Sécurité**.
- Le mot de passe d'un autre administrateur ne peut pas être réinitialisé depuis cette page.
