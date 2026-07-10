# Changelog — ShareLife Backend

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format respecte [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et le versionnage suit [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.1.2] — 2026-07-10

### Sécurité

- Ajout du middleware `helmet` (en-têtes de sécurité HTTP : `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, suppression de `X-Powered-By`)
- Mise à jour `nodemailer` 8.x → 9.0.3 (correctif d'une faille SSRF/lecture de fichier via l'option `raw`, non utilisée dans ShareLife)
- `npm audit fix` appliqué : 32 vulnérabilités corrigées (1 critique, 14 hautes, 14 modérées, 3 basses) → 0 vulnérabilité résiduelle
- Nouvelle étape `npm audit --audit-level=high` dans le job `lint` du pipeline CI — tout merge introduisant une CVE haute/critique est désormais bloqué automatiquement

### Modifié

- Frontend : suppression de `.github/workflow/deploy.yml` (workflow Cloud Run non fonctionnel — mauvais nom de dossier non reconnu par GitHub Actions, aucun `Dockerfile` associé, incohérent avec la stratégie de publication mobile via Expo EAS)

---

## [1.1.1] — 2026-06-15

### Ajouté

- Audit d'accessibilité complet sur les 5 écrans principaux (LoginScreen, RegisterScreen, GroupsScreen, TasksScreens, FinanceScreen) : 68 propriétés d'accessibilité (`accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityLiveRegion`)
- Référentiel WCAG 2.1 niveau AA retenu et documenté pour l'application mobile

---

## [1.1.0] — 2026-06-07

### Ajouté

- **Notifications push** : `NotificationsModule` avec `POST /notifications/token` (enregistrement du token Expo) et `DELETE /notifications/token` (désinscription) — token stocké sur `User.pushToken`
- **Déclencheurs de notifications** :
  - `sendInvitation()` → notification à l'utilisateur invité
  - `respondToInvitation(accept)` → notification au propriétaire du groupe si accepté
  - `createExpense()` → notification aux participants (hors payeur)
  - `createReimbursement()` → notification au destinataire
- **`PATCH /finance/expenses/:id`** : modification complète d'une dépense — réservée au payeur (`ForbiddenException` sinon), recalcul des parts participants
- **`DELETE /users/me`** : suppression de compte avec vérification mot de passe — supprime les groupes possédés, cascade sur les memberships
- **`UpdateExpenseDto`** : DTO partiel via `PartialType(CreateExpenseDto)`
- **Frontend `EditExpenseModal`** : modal de modification pré-remplie avec les données de la dépense existante, accessible via icône crayon sur `ExpenseCard` (payeur uniquement)
- **Frontend `SettingsScreen`** refonte complète : dark theme, sections Profil / Mot de passe / Compte, suppression compte en deux étapes (Alert + saisie mot de passe)

### Modifié

- `User` entity : ajout colonne `pushToken varchar nullable`
- `FinanceModule` : import `NotificationsModule`
- `GroupInvitationsModule` : import `NotificationsModule`
- `AuthContext` : appel `registerPushToken()` après login/register/chargement initial, `unregisterPushToken()` au logout

---

## [1.0.0] — 2026-05-31

### Ajouté

- **CI/CD** : pipeline GitHub Actions (`ci.yml`) avec 4 jobs enchaînés — lint, tests unitaires avec couverture, build, tests E2E sur PostgreSQL éphémère
- **Tests unitaires** : 132 tests Jest couvrant `AuthService` (21), `TasksService` (18), `TaskAssignmentService` (16), `GroupInvitationsService` (14), `GroupsService` (14), `FinanceService` (13), `GamificationService` (16) + 18 suites controllers — 0 échec
- **Manuel de déploiement** : procédures complètes pour les environnements local (Docker / sans Docker), recette et production (VPS + Nginx + HTTPS)
- **Swagger** : documentation interactive de l'API accessible sur `/api`

### Modifié

- `tsconfig.json` : ajout de `"types": ["jest", "node"]` pour résoudre l'erreur `Cannot find name 'jest'` dans les fichiers de test
- `docker-compose.yml` : variables d'environnement externalisées vers `.env`

### Sécurité

- Anti-timing-attack : `bcrypt.compare` exécuté systématiquement même lorsque l'utilisateur est introuvable (login)
- Anti-énumération : réponse identique pour email inconnu et mot de passe incorrect

---

## [0.6.0] — 2026-05-15

### Ajouté

- **Module Insights** : analyse intelligente de la charge hebdomadaire — résumé, alerte de surcharge, suggestion de rééquilibrage, détection des tâches en retard, proposition de modèles
- **Module Gamification** : système de badges (`Machine de guerre`, `Fantôme`, `Perfectionniste`, `Éclair`) et suivi des séries de jours actifs (streaks)
- **Module Scores** : calcul et classement des points par membre et par groupe
- **Module Finance** : suivi des dépenses partagées entre membres
- **Timers** : minuteur associé à chaque tâche pour le suivi du temps réel
- `findTemplate()` : récupération des tâches modèles réutilisables d'un groupe
- `applyWeekTemplate()` : duplication des tâches modèles sur une semaine cible
- `deleteWeek()` : suppression en lot de toutes les tâches d'une semaine

### Modifié

- `TasksService.create()` : gestion des fréquences `ONCE` et `DAILY` — la fréquence DAILY génère automatiquement 7 tâches (une par jour de la semaine 0 à 6)
- `TaskAssignmentService.assignToUser()` : vérification du nombre maximum d'assignations selon le type de tâche (`FAMILY` = 1, `ADULT_CHILD` = N)

---

## [0.5.0] — 2026-04-28

### Ajouté

- **Mode FUNNY** : les groupes peuvent basculer en mode `FUNNY` où un admin de la semaine est tiré au sort via la roue — seul cet admin peut assigner des tâches pendant la semaine
- `POST /groups/:id/elect-admin` : élection de l'admin de la semaine avec stockage du numéro de semaine ISO et de l'année
- `GET /groups/:id/weekly-admin` : consultation de l'admin de la semaine courante
- `GroupsService.smartAssign()` : algorithme d'assignation intelligente basé sur la charge pondérée de chaque membre
- `GroupsService.electWeeklyAdmin()` : tirage aléatoire pondéré pour le mode FUNNY
- **Module MealVotes** : vote pour les repas de la semaine au sein d'un groupe
- **Module GroupInvitations** : système d'invitation par token sécurisé

### Modifié

- `TaskAssignmentService.create()` : vérification du mode du groupe — lève `ForbiddenException` en mode FUNNY si l'utilisateur n'est pas l'admin de la semaine

---

## [0.4.0] — 2026-04-10

### Ajouté

- **Module ShoppingList** : création et gestion de listes de courses par semaine et par groupe
  - `POST /shopping-lists/:groupId` — créer une liste
  - `GET /shopping-lists/:groupId` — lister toutes les listes du groupe
  - `PUT /shopping-lists/:id` — mettre à jour les articles (format JSON `[{ name, quantity }]`)
  - `DELETE /shopping-lists/:id` — supprimer une liste
- **Module Meals** : planification des repas par semaine
- `PATCH /users/me` : mise à jour du profil utilisateur (prénom, e-mail, mot de passe, couleur d'avatar)

### Modifié

- `TaskAssignmentService.markDone()` : horodatage de la complétion (`completedAt`) enregistré au moment du passage en statut `DONE`
- `TaskAssignmentService.findByUser()` : réponse enrichie avec `completedAtDate` au format `YYYY-MM-DD`

---

## [0.3.0] — 2026-03-24

### Ajouté

- **Module Tasks** : gestion complète des tâches
  - `POST /tasks/group/:groupId` — créer une tâche (avec groupe et créateur automatiquement assignés)
  - `GET /tasks/week/:groupId/:year/:week` — tâches d'une semaine avec statut et utilisateur assigné
  - `GET /tasks/:groupId/:date` — tâches d'un jour (format `YYYY-MM-DD`)
  - `PATCH /tasks/:id` — modifier les champs d'une tâche existante
  - `DELETE /tasks/:id` — supprimer une tâche et ses assignations
- **Module TaskAssignment** : assignation et suivi des tâches
  - `POST /task-assignment/:idTask` — s'assigner une tâche (mode FREE)
  - `PATCH /task-assignment/:idTask/done` — marquer une tâche comme complétée
  - `POST /task-assignment/:idTask/assign/:userId` — assigner une tâche à un utilisateur cible
  - `GET /task-assignment/users/:id` — tâches assignées à un utilisateur
  - `GET /task-assignment/unassigned/:idGroup` — tâches non assignées d'un groupe
- Entité `Task` : champs `frequency` (ONCE / DAILY / WEEKLY), `weekNumber`, `year`, `dayOfWeek`, `weight`, `duration`, `isTemplate`, `taskType`
- Entité `TaskAssignment` : champs `status` (PENDING / DONE), `completedAt`
- `tasks.seeds.ts` : jeu de tâches par défaut injecté à la création d'un groupe

---

## [0.2.0] — 2026-03-10

### Ajouté

- **Module Groups** : gestion des groupes d'utilisateurs
  - `POST /groups` — créer un groupe
  - `GET /groups/me` — mes groupes
  - `GET /groups/:id` — détails d'un groupe
  - `PATCH /groups/:id` — modifier un groupe
  - `DELETE /groups/:id` — supprimer un groupe
  - `POST /groups/:id/members` — ajouter un membre par e-mail
  - `DELETE /groups/:id/members/:userId` — retirer un membre
  - `PATCH /groups/:id/mode` — changer le mode (FREE / FUNNY)
- Entité `Group` : champs `name`, `mode` (FREE / FUNNY), `owner`, `weeklyAdmin`, `weeklyAdminWeek`, `weeklyAdminYear`
- Entité `GroupMember` : table de jointure `User ↔ Group` avec rôle (ADMIN / MEMBER)
- `GroupsService.addMember()` : ajout d'un membre par adresse e-mail avec vérification d'existence

---

## [0.1.0] — 2026-02-24

### Ajouté

- Initialisation du projet NestJS 11 avec TypeScript
- Configuration Docker Compose : service `backend` (Node 20 Alpine) + service `db` (PostgreSQL 15)
- Configuration TypeORM avec `synchronize: true` en développement
- **Module Auth** : authentification JWT complète
  - `POST /auth/register` — inscription avec hashage bcrypt (12 rounds) et normalisation de l'email
  - `POST /auth/login` — connexion avec token JWT (expiration 1 heure)
  - `GET /auth/me` — profil utilisateur courant (requête DB fraîche, pas le payload JWT)
  - `POST /auth/forgot-password` — envoi d'un code de réinitialisation à 6 chiffres par e-mail (stocké hashé, expiration 15 min)
  - `POST /auth/reset-password` — réinitialisation du mot de passe avec vérification du code
- Entité `User` : champs `id` (UUID), `email`, `password`, `firstName`, `role`, `avatarColor`, `resetToken`, `resetTokenExpiry`
- Stratégie Passport JWT (`JwtStrategy`) pour la protection des endpoints
- `MailService` : envoi d'e-mails transactionnels via Nodemailer
- Rate limiting global : 30 requêtes/min — routes auth : 3–5 requêtes/min par IP
- `ValidationPipe` global avec `whitelist: true` (rejet des propriétés non déclarées dans les DTOs)
- Décorateur `@CurrentUser()` pour accéder à l'utilisateur injecté par le guard JWT
- Variables d'environnement : `DB_*`, `JWT_SECRET`, `PORT`, `MAIL_*`

---

*Ce changelog est maintenu dans le cadre du projet de certification RNCP39583 — ShareLife.*
