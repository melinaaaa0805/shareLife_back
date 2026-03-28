# ShareLife — Backend

API REST construite avec **NestJS**, **TypeORM** et **PostgreSQL**. Elle expose tous les endpoints nécessaires à l'application mobile ShareLife.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Lancer le projet](#lancer-le-projet)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture)
- [Modules & Entités](#modules--entités)
- [API — Endpoints](#api--endpoints)
- [Authentification](#authentification)
- [Sécurité](#sécurité)
- [Base de données](#base-de-données)

---

## Stack technique

| Outil | Version | Rôle |
|-------|---------|------|
| NestJS | 11 | Framework HTTP |
| TypeORM | 0.3 | ORM |
| PostgreSQL | 15 | Base de données |
| Passport JWT | 4 | Stratégie d'authentification |
| bcryptjs | 3 | Hashage des mots de passe |
| @nestjs/throttler | 6 | Rate limiting |
| Nodemailer | 8 | Envoi d'e-mails |
| class-validator | 0.14 | Validation des DTOs |
| Docker | — | Conteneurisation |

---

## Lancer le projet

### Avec Docker (recommandé)

```bash
docker compose up --build
```

- L'API démarre sur **http://localhost:3000**
- PostgreSQL démarre sur **localhost:5432**

> Le flag `--build` est nécessaire après toute modification du `package.json` pour que les nouvelles dépendances soient installées dans le container.

### Sans Docker

```bash
npm install
# Créer le fichier .env (voir section ci-dessous)
npm run start:dev
```

---

## Variables d'environnement

Créez un fichier `.env` à la racine de `shareLife_back/` :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sharelife_db

# JWT
JWT_SECRET=votre_secret_jwt_long_et_aleatoire

# Serveur
PORT=3000

# SMTP (reset de mot de passe)
MAIL_HOST=smtp.votre-fournisseur.com
MAIL_PORT=587
MAIL_USER=noreply@votre-domaine.com
MAIL_PASS=votre_mot_de_passe_smtp
```

> En environnement Docker, `DB_HOST` est automatiquement défini sur `db` (nom du service dans `docker-compose.yml`).

---

## Architecture

```
src/
├── auth/
│   ├── auth.controller.ts        # register, login, forgot-password, reset-password, me
│   ├── auth.service.ts           # logique métier + reset de mot de passe
│   ├── jwt.strategy.ts           # validation du token JWT
│   ├── mail.service.ts           # envoi d'e-mails via Nodemailer
│   └── dto/
│       ├── register-user.dto.ts
│       ├── login-user.dto.ts
│       ├── forgot-password.dto.ts
│       └── reset-password.dto.ts
│
├── users/
│   ├── users.controller.ts       # PATCH /users/me
│   ├── users.service.ts          # mise à jour du profil
│   └── entities/user.entity.ts
│
├── groups/
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   ├── entities/group.entity.ts
│   └── dto/
│
├── tasks/
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   ├── tasks.seeds.ts            # tâches par défaut à la création d'un groupe
│   └── entities/task.entity.ts
│
├── task-assignment/
│   ├── task-assignment.controller.ts
│   ├── task-assignment.service.ts
│   └── entities/task-assignment.entity.ts
│
├── group-member/
│   └── entities/group-member.entity.ts
│
├── shopping-list/
│   ├── shopping-list.controller.ts
│   ├── shopping-list.service.ts
│   └── entities/shopping-list.entity.ts
│
├── config/typeorm.config.ts      # connexion DB
├── help.ts                       # décorateur @CurrentUser()
├── app.module.ts
└── main.ts
```

---

## Modules & Entités

### Auth

Gère l'inscription, la connexion, le reset de mot de passe et la récupération du profil.

**Entité `User`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| email | string | Unique, stocké en minuscules |
| password | string | Hashé avec bcrypt (12 rounds) |
| firstName | string | Prénom |
| lastName | string | Nom |
| role | ADMIN \| MEMBER | Rôle dans l'application |
| avatarColor | string \| null | Couleur d'avatar HEX |
| resetToken | string \| null | Hash du code de reset (6 chiffres) |
| resetTokenExpiry | Date \| null | Expiration du code (15 min) |

---

### Groups

**Entité `Group`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | string | Nom du groupe |
| mode | FREE \| FUNNY | Mode de fonctionnement (défaut : FREE) |
| owner | User | Propriétaire |
| members | GroupMember[] | Membres |
| weeklyAdmin | User \| null | Admin élu de la semaine (mode Drôle) |
| weeklyAdminWeek | number \| null | Numéro de semaine ISO de l'élection |
| weeklyAdminYear | number \| null | Année correspondante |

**Mode FUNNY** : l'admin de la semaine est tiré au sort via la roue. Seul cet admin peut assigner des tâches pendant la semaine en cours.

---

### Tasks

**Entité `Task`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| title | string | Titre (défaut : "Sans titre") |
| description | string \| null | Description |
| frequency | ONCE \| DAILY \| WEEKLY | Fréquence de récurrence |
| weekNumber | number | Numéro de semaine ISO |
| year | number | Année |
| dayOfWeek | number | 0 = Lundi … 6 = Dimanche |
| weight | number | Poids de charge mentale (1 à 5) |
| duration | number \| null | Durée estimée en minutes |
| date | string \| null | Date YYYY-MM-DD |
| isTemplate | boolean | Tâche modèle réutilisable |

---

### TaskAssignment

**Entité `TaskAssignment`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| task | Task | Tâche assignée |
| user | User | Utilisateur assigné |
| status | PENDING \| DONE | Statut |
| completedAt | Date \| null | Date de complétion |

---

### ShoppingList

**Entité `ShoppingList`**

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| weekNumber | number | Numéro de semaine ISO |
| items | JSON | `[{ name: string, quantity: string }]` |
| group | Group | Groupe associé |
| createdAt | Date | Date de création |

---

## API — Endpoints

### Auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | — | Inscription |
| POST | `/auth/login` | — | Connexion → JWT |
| GET | `/auth/me` | JWT | Profil courant (requête DB fraîche) |
| POST | `/auth/forgot-password` | — | Envoi d'un code reset par e-mail (3 req/min) |
| POST | `/auth/reset-password` | — | Nouveau mot de passe avec le code (5 req/min) |

### Users

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| PATCH | `/users/me` | JWT | Modifier prénom, e-mail, mot de passe, avatar |

### Groups

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/groups` | JWT | Créer un groupe |
| GET | `/groups/me` | JWT | Mes groupes |
| GET | `/groups/:id` | JWT | Détails d'un groupe |
| PATCH | `/groups/:id` | JWT | Modifier un groupe |
| DELETE | `/groups/:id` | JWT | Supprimer un groupe |
| POST | `/groups/:id/members` | JWT | Ajouter un membre (par e-mail) |
| DELETE | `/groups/:id/members/:userId` | JWT | Retirer un membre |
| PATCH | `/groups/:id/mode` | JWT | Changer le mode (FREE / FUNNY) |
| POST | `/groups/:id/elect-admin` | JWT | Élire l'admin de la semaine |
| GET | `/groups/:id/weekly-admin` | JWT | Admin de la semaine courante |

### Tasks

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/tasks/group/:groupId` | JWT | Créer une tâche |
| GET | `/tasks/week/:groupId/:year/:week` | JWT | Tâches d'une semaine |
| GET | `/tasks/:groupId/:date` | JWT | Tâches d'un jour (YYYY-MM-DD) |
| GET | `/tasks/:groupId/template` | JWT | Tâches modèles |
| PATCH | `/tasks/:id` | JWT | Modifier / compléter une tâche |

### Task Assignment

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/task-assignment/:idTask` | JWT | S'assigner une tâche |
| GET | `/task-assignment/users/:id` | JWT | Tâches d'un utilisateur |
| GET | `/task-assignment/unassigned/:idGroup` | JWT | Tâches non assignées du groupe |

### Shopping List

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/shopping-lists/:groupId` | JWT | Créer une liste pour la semaine |
| GET | `/shopping-lists/:groupId` | JWT | Toutes les listes du groupe |
| GET | `/shopping-lists/item/:id` | JWT | Détail d'une liste |
| PUT | `/shopping-lists/:id` | JWT | Mettre à jour les articles |
| DELETE | `/shopping-lists/:id` | JWT | Supprimer une liste |

---

## Authentification

**Flux login :**

```
Client                  Backend
  |                        |
  +--POST /auth/login ----->
  |  { email, password }   + bcrypt.compare (toujours exécuté)
  |                        + Génère JWT (1h)
  |<--{ access_token, user }-+
  |                        |
  +--GET /auth/me ---------->
  |  Bearer <token>        + JwtStrategy valide
  |                        + Requête DB fraîche (pas le payload JWT)
  |<--{ id, email, ... } --+
```

**Flux reset de mot de passe :**

```
Client                        Backend
  |                               |
  +--POST /auth/forgot-password ->
  |  { email }                    + Génère code 6 chiffres
  |                               + Stocke hash bcrypt + expiry 15 min
  |                               + Envoie e-mail
  |<--{ message } ---------------+ (même réponse si e-mail inconnu)
  |                               |
  +--POST /auth/reset-password -->
  |  { email, code, newPassword } + Vérifie code + expiration
  |                               + Hash nouveau mot de passe
  |                               + Efface le token de reset
  |<--{ message } ---------------+
```

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| Hashage | bcrypt, 12 rounds |
| Timing attack | `bcrypt.compare` exécuté même si l'utilisateur est inconnu |
| Anti-énumération | Même réponse générique si e-mail inexistant ou mot de passe incorrect |
| Rate limiting | Global : 30 req/min · Auth : 3–5 req/min par IP |
| Validation des DTOs | `ValidationPipe` global avec `whitelist: true` |
| Force du mot de passe | Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre |
| JWT | Expiration 1 heure, secret via variable d'environnement |
| CORS | Activé globalement |

---

## Base de données

**Relations :**

```
User ──< GroupMember >── Group ──< ShoppingList
 |                         |
 +──< Task (createdBy)     +──< Task
 |       |
 +──< TaskAssignment >── Task
```

> `synchronize: true` est activé en développement : TypeORM crée et modifie les tables automatiquement. **Ne pas utiliser en production** — préférer les migrations TypeORM.
