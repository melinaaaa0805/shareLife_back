# Modèle de données — ShareLife V1

---

## 1. Entités principales

### User

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| email | varchar | unique, not null |
| password | varchar | hashé bcrypt 12 rounds |
| firstName | varchar | not null |
| lastName | varchar | nullable |
| role | varchar | `ADMIN` / `MEMBER`, défaut `MEMBER` |
| avatarColor | varchar | nullable |
| resetToken | varchar | nullable — token de réinitialisation de mot de passe |
| resetTokenExpiry | timestamp | nullable |
| pushToken | varchar | nullable — token Expo Push pour les notifications mobiles |

### Group

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| name | varchar | not null |
| mode | varchar | `FREE` / `FUNNY` / `SMART` |
| weeklyAdminId | UUID | FK → User, nullable |
| weeklyAdminWeek | int | nullable |
| weeklyAdminYear | int | nullable |
| ownerId | UUID | FK → User (RESTRICT) |
| createdAt | timestamp | défaut now() |

### GroupMember

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User (CASCADE on delete) |
| groupId | UUID | FK → Group (CASCADE on delete) |
| profile | varchar | `ADULT` / `CHILD` |
| joinedAt | timestamp | défaut now() |

### Task

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| title | varchar | not null |
| description | varchar | nullable |
| weight | int | 1–5 |
| frequency | varchar | `ONCE` / `DAILY` / `WEEKLY` |
| taskType | varchar | `FAMILY` / `ADULT` / `ADULT_CHILD` |
| dayOfWeek | int | 0–6 |
| weekNumber | int | numéro de semaine ISO |
| year | int | |
| date | date | nullable |
| done | boolean | défaut false |
| duration | int | nullable, en secondes |
| groupId | UUID | FK → Group |
| createdById | UUID | FK → User |
| assignedUserId | UUID | FK → User, nullable |
| createdAt | timestamp | |

### TaskAssignment

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| taskId | UUID | FK → Task (CASCADE on delete) |
| userId | UUID | FK → User |
| status | varchar | `PENDING` / `DONE` |
| completedAt | timestamp | nullable |

### GroupInvitation

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| groupId | UUID | FK → Group |
| invitedUserId | UUID | FK → User |
| invitedById | UUID | FK → User |
| status | varchar | `PENDING` / `ACCEPTED` / `DECLINED` |
| createdAt | timestamp | |

### Expense

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| title | varchar | not null |
| amount | decimal(10,2) | not null |
| category | varchar | `FOOD` / `TRANSPORT` / `HOUSING` / `UTILITIES` / `LEISURE` / `HEALTH` / `OTHER` |
| splitMode | varchar | `EQUAL` / `CUSTOM` |
| date | date | |
| paidById | UUID | FK → User, nullable (SET NULL on delete) |
| groupId | UUID | FK → Group |
| createdAt | timestamp | |

### ExpenseParticipant

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| expenseId | UUID | FK → Expense (CASCADE on delete) |
| userId | UUID | FK → User |
| share | decimal(10,2) | part calculée de la dépense |

### Reimbursement

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| groupId | UUID | FK → Group |
| fromUserId | UUID | FK → User, nullable (SET NULL on delete) |
| toUserId | UUID | FK → User, nullable (SET NULL on delete) |
| amount | decimal(10,2) | not null |
| note | varchar | nullable |
| createdAt | timestamp | |

### Reward

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| title | varchar | not null |
| description | varchar | nullable |
| assignedTo | varchar | `WINNER` / `LOSER` |
| isActive | boolean | défaut true |
| groupId | UUID | FK → Group |
| createdById | UUID | FK → User, nullable |
| createdAt | timestamp | |

### TaskTimer

| Champ | Type | Contrainte |
|---|---|---|
| id | UUID | PK |
| taskId | UUID | FK → Task |
| userId | UUID | FK → User |
| startedAt | timestamp | |
| endedAt | timestamp | nullable |
| durationSeconds | int | nullable |

---

## 2. Relations principales

| Relation | Type | Cascade |
|---|---|---|
| User ↔ GroupMember ↔ Group | ManyToMany via pivot | GroupMember.user : CASCADE on delete |
| Group → User (owner) | ManyToOne | RESTRICT (groupes supprimés avant l'utilisateur) |
| Task ↔ TaskAssignment ↔ User | ManyToMany via pivot | TaskAssignment.task : CASCADE on delete |
| Expense → ExpenseParticipant | OneToMany | CASCADE on delete |
| Group → Expense | OneToMany | — |
| Group → Reimbursement | OneToMany | — |

---

## 3. Logique métier clé

- **Gestion de la charge mentale** : équilibrage automatique via `smartAssign()` (somme des poids par membre)
- **Mode FUNNY** : élection aléatoire pondérée d'un admin de la semaine — seul cet admin peut assigner les tâches
- **Finance partagée** : répartition EQUAL (avec correction d'arrondi) ou CUSTOM ; algorithme de simplification des dettes (greedy bi-directional)
- **Notifications push** : token Expo stocké sur `User.pushToken` — déclenché sur invitation reçue, nouvelle dépense partagée, remboursement reçu, invitation acceptée
- **Gamification** : badges (Machine de guerre, Fantôme, Perfectionniste, Éclair) et séries de jours actifs (streaks)
- **Timers** : minuteur par tâche pour le suivi du temps réel passé

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
