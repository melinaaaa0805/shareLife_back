# Diagramme de Gantt — ShareLife V1

**Période** : 24 février 2026 → 31 mai 2026 (14 semaines)  
**Équipe** : 1 développeuse (Melina Mitterrand)  
**Charge** : ~35 jours-hommes  

---

## Vue d'ensemble par semaine

```
Semaine →   S1   S2   S3   S4   S5   S6   S7   S8   S9   S10  S11  S12  S13  S14
Dates       24/2 03/3 10/3 17/3 24/3 31/3 07/4 14/4 21/4 28/4 05/5 12/5 19/5 26/5
            ─────────────────────────────────────────────────────────────────────────
SPRINT 1    ████ ░░░░
  Repo & Docker  ███
  Entité User         ██
  Auth (JWT)          ████
  Tests Postman            █

SPRINT 2         ░░░░ ████
  Entité Group             ██
  Entité GroupMember        ██
  CRUD groupes              ████
  Gestion membres                █

SPRINT 3              ░░░░ ████ ░░░░
  Entité Task                   ██
  Entité TaskAssignment          ██
  CRUD tâches                    ████
  Assignations                        ██
  Statuts PENDING/DONE                 █

SPRINT 4                   ░░░░ ████ ████
  Projet React Native + Expo        ██
  Screens login / register          ████
  Dashboard groupes                       ██
  Dashboard tâches                         ████
  Intégration JWT front↔back               ████

SPRINT 5                              ░░░░ ████ ████
  Calcul charge backend                         ██
  Mode FUNNY + admin semaine                    ████
  SmartAssign                                        ██
  Insights & Gamification                            ████
  Shopping list & Meals                              ████
  Notifications                                           █

SPRINT 6                                        ░░░░ ████ ████ ████
  Tests unitaires (55 tests)                              ████
  Pipeline CI/CD                                               ██
  Documentation RNCP                                           ████
  Manuel déploiement                                                ██
  Cahier de recettes                                                ██
  CHANGELOG + plan bogues                                           ██
  Déploiement production                                                 ██
  Préparation soutenance                                                 ████

Légende : ████ tâche en cours   ░░░░ sprint planifié
```

---

## Détail par sprint

### Sprint 1 — Setup & Authentification (S1–S2)
**24 fév. → 3 mars 2026 | 5 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Création du dépôt GitHub (backend + frontend) | 0,5 j | 24/02 | 24/02 |
| Configuration Docker Compose + PostgreSQL 15 | 1 j | 24/02 | 25/02 |
| Initialisation NestJS 11 + TypeScript | 0,5 j | 25/02 | 25/02 |
| Entité `User` + configuration TypeORM | 0,5 j | 26/02 | 26/02 |
| `AuthModule` : register + login + JWT | 1,5 j | 26/02 | 28/02 |
| `MailService` + reset de mot de passe | 1 j | 01/03 | 02/03 |
| Tests Postman des endpoints Auth | 0,5 j | 03/03 | 03/03 |
| **Livrable** : Auth fonctionnelle sur Docker | | | **03/03** |

---

### Sprint 2 — Users & Groups (S2–S3)
**4 mars → 10 mars 2026 | 5 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Entité `Group` + entité `GroupMember` | 1 j | 04/03 | 04/03 |
| `GroupsModule` : CRUD groupes | 1,5 j | 05/03 | 06/03 |
| Gestion des membres (ajout par email, retrait) | 1 j | 07/03 | 08/03 |
| `UsersModule` : `PATCH /users/me` | 0,5 j | 09/03 | 09/03 |
| Tests Postman groupes | 1 j | 10/03 | 10/03 |
| **Livrable** : Gestion de groupes fonctionnelle | | | **10/03** |

---

### Sprint 3 — Tasks & Assignments (S3–S5)
**11 mars → 24 mars 2026 | 7 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Entité `Task` (frequency, weight, dayOfWeek…) | 1 j | 11/03 | 11/03 |
| Entité `TaskAssignment` (status, completedAt) | 0,5 j | 12/03 | 12/03 |
| `TasksService.create()` : ONCE + DAILY (7 tâches) | 1 j | 13/03 | 13/03 |
| Endpoints tâches (CRUD + semaine + jour) | 1,5 j | 14/03 | 16/03 |
| `TaskAssignmentService` : create, markDone | 1 j | 17/03 | 18/03 |
| `assignToUser()` + tâches non assignées | 1 j | 19/03 | 20/03 |
| Tâches modèles (isTemplate, applyTemplate) | 1 j | 23/03 | 24/03 |
| **Livrable** : Backend tâches + assignations | | | **24/03** |

---

### Sprint 4 — Frontend V1 (S5–S7)
**25 mars → 9 avril 2026 | 8 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Initialisation React Native + Expo | 0,5 j | 25/03 | 25/03 |
| Navigation (React Navigation) | 0,5 j | 26/03 | 26/03 |
| Screens login / register | 1,5 j | 27/03 | 28/03 |
| Dashboard groupes | 1 j | 31/03 | 31/03 |
| Dashboard tâches de la semaine | 1,5 j | 01/04 | 02/04 |
| Intégration JWT (stockage token + intercepteurs) | 1 j | 03/04 | 04/04 |
| Tests intégration frontend ↔ backend | 2 j | 07/04 | 09/04 |
| **Livrable** : App mobile fonctionnelle | | | **09/04** |

---

### Sprint 5 — Fonctionnalités avancées (S7–S10)
**10 avril → 28 avril 2026 | 8 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Mode FUNNY + élection admin de la semaine | 1,5 j | 10/04 | 11/04 |
| `GroupsService.electWeeklyAdmin()` + roue frontend | 1 j | 12/04 | 13/04 |
| `GroupsService.smartAssign()` | 1 j | 14/04 | 14/04 |
| `InsightsService` : charge, alertes, suggestions | 1,5 j | 21/04 | 22/04 |
| `GamificationService` : badges + streaks | 1 j | 23/04 | 24/04 |
| `ShoppingListModule` + `MealsModule` | 1 j | 25/04 | 26/04 |
| `GroupInvitations` + `Finance` + `Scores` | 1 j | 27/04 | 28/04 |
| **Livrable** : Fonctionnalités avancées V1 | | | **28/04** |

---

### Sprint 6 — Qualité & Soutenance (S11–S14)
**5 mai → 31 mai 2026 | 9 jours-hommes**

| Tâche | Durée | Début | Fin |
|---|---|---|---|
| Correction `tsconfig.json` (types jest) | 0,5 j | 05/05 | 05/05 |
| `auth.service.spec.ts` (21 tests) | 1 j | 06/05 | 07/05 |
| `tasks.service.spec.ts` (18 tests) | 1 j | 08/05 | 09/05 |
| `task-assignment.service.spec.ts` (16 tests) | 1 j | 12/05 | 13/05 |
| Pipeline CI/CD GitHub Actions | 0,5 j | 14/05 | 14/05 |
| Manuel de déploiement | 0,5 j | 15/05 | 15/05 |
| CHANGELOG | 0,5 j | 19/05 | 19/05 |
| Cahier de recettes | 0,5 j | 20/05 | 20/05 |
| Plan de correction des bogues | 0,5 j | 21/05 | 21/05 |
| Gantt + rapports de sprint + grille compétences | 1 j | 22/05 | 23/05 |
| Dossier de maintenance (Bloc 4) | 0,5 j | 26/05 | 26/05 |
| Préparation slides soutenance | 1,5 j | 27/05 | 30/05 |
| Répétition générale | 0,5 j | 31/05 | 31/05 |
| **Livrable** : ShareLife V1 prête pour soutenance | | | **31/05** |

---

## Synthèse de charge

| Sprint | Durée | Charge (j-h) | Cumul |
|---|---|---|---|
| Sprint 1 — Setup & Auth | 1 sem. | 5 | 5 |
| Sprint 2 — Users & Groups | 1 sem. | 5 | 10 |
| Sprint 3 — Tasks & Assignments | 2 sem. | 7 | 17 |
| Sprint 4 — Frontend V1 | 2 sem. | 8 | 25 |
| Sprint 5 — Fonctionnalités avancées | 3 sem. | 8 | 33 |
| Sprint 6 — Qualité & Soutenance | 4 sem. | 9 | **42** |

> **42 jours-hommes** sur 14 semaines à ~3 j-h/semaine (projet réalisé en parallèle de la formation YNOV).

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
