# Rapports de sprint — ShareLife V1

**Projet** : ShareLife — Application de gestion du quotidien partagé  
**Certification** : RNCP39583 — Expert en développement logiciel  
**Période** : février – mai 2026  

---

## Sprint 1 — Setup & Authentification
**Dates** : 24 février → 3 mars 2026  
**Durée** : 1 semaine (5 jours-hommes)

### Objectifs du sprint

- Mettre en place l'environnement de développement reproductible (Docker + PostgreSQL)
- Initialiser le projet NestJS avec TypeScript
- Implémenter l'authentification JWT complète (register, login, me)
- Implémenter le reset de mot de passe sécurisé

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Création dépôt GitHub (backend + frontend) | 0,5 j | 0,5 j | ✅ |
| Configuration Docker Compose + PostgreSQL 15 | 1 j | 1 j | ✅ |
| Initialisation NestJS 11 + TypeScript | 0,5 j | 0,5 j | ✅ |
| Entité `User` + TypeORM | 0,5 j | 0,5 j | ✅ |
| Module Auth : register + login + JWT | 1,5 j | 1,5 j | ✅ |
| MailService + reset de mot de passe | 1 j | 1 j | ✅ |
| Tests Postman Auth | 0,5 j | 0,5 j | ✅ |

### Livrables produits

- `docker-compose.yml` + `Dockerfile` opérationnels
- Module `Auth` : `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Module `Auth` : `POST /auth/forgot-password`, `POST /auth/reset-password`
- Entité `User` avec hashage bcrypt 12 rounds
- JWT avec expiration 1 heure
- Rate limiting : 3–5 req/min sur les routes auth

### Points positifs

- La séparation claire du `MailService` en service indépendant facilitera les tests unitaires.
- Le mécanisme anti-timing-attack (bcrypt.compare exécuté même si l'utilisateur est inconnu) a été intégré dès le départ.

### Points d'amélioration identifiés

- `synchronize: true` actif en développement : à désactiver et remplacer par des migrations TypeORM avant la mise en production.
- Les variables d'environnement sont codées en dur dans `docker-compose.yml` pour le développement : externaliser dans `.env`.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 5 |
| Jours-hommes réalisés | 5 |
| Tâches terminées | 7/7 |
| Incidents bloquants | 0 |

---

## Sprint 2 — Users & Groups
**Dates** : 4 → 10 mars 2026  
**Durée** : 1 semaine (5 jours-hommes)

### Objectifs du sprint

- Modéliser et persister les groupes d'utilisateurs
- Implémenter le CRUD complet des groupes
- Gérer l'adhésion des membres avec rôles (ADMIN / MEMBER)
- Permettre la modification du profil utilisateur

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Entité `Group` + entité `GroupMember` | 1 j | 1 j | ✅ |
| `GroupsModule` — CRUD groupes | 1,5 j | 1,5 j | ✅ |
| Ajout de membre par email + retrait | 1 j | 1 j | ✅ |
| `UsersModule` — PATCH /users/me | 0,5 j | 0,5 j | ✅ |
| Tests Postman groupes | 1 j | 1 j | ✅ |

### Livrables produits

- Entités `Group` et `GroupMember` (table de jointure)
- 10 endpoints groupes (CRUD + membres + mode)
- `PATCH /users/me` (prénom, email, mot de passe, couleur d'avatar)

### Points positifs

- La table de jointure `GroupMember` est suffisamment flexible pour porter des métadonnées futures (score, date d'adhésion).
- L'ajout de membre par email (et non par ID) correspond au besoin réel utilisateur.

### Points d'amélioration identifiés

- Absence de vérification qu'un utilisateur appartient bien au groupe avant d'accéder aux ressources du groupe : à sécuriser dans les prochains sprints avec un guard dédié.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 5 |
| Jours-hommes réalisés | 5 |
| Tâches terminées | 5/5 |
| Incidents bloquants | 0 |

---

## Sprint 3 — Tasks & Assignments
**Dates** : 11 → 24 mars 2026  
**Durée** : 2 semaines (7 jours-hommes)

### Objectifs du sprint

- Modéliser les tâches avec fréquence, poids et assignation
- Implémenter la création ONCE et DAILY (7 tâches automatiques)
- Implémenter le système d'assignation avec statuts PENDING/DONE
- Introduire les tâches modèles (templates)

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Entité `Task` (frequency, weight, dayOfWeek…) | 1 j | 1 j | ✅ |
| Entité `TaskAssignment` (status, completedAt) | 0,5 j | 0,5 j | ✅ |
| `TasksService.create()` : ONCE + DAILY | 1 j | 1 j | ✅ |
| Endpoints tâches — CRUD + semaine + jour | 1,5 j | 1,5 j | ✅ |
| `TaskAssignmentService` : create + markDone | 1 j | 1 j | ✅ |
| `assignToUser()` + tâches non assignées | 1 j | 1 j | ✅ |
| Tâches modèles (isTemplate, applyTemplate) | 1 j | 1 j | ✅ |

### Livrables produits

- Entités `Task` et `TaskAssignment`
- `TasksService` : create (ONCE/DAILY), findAllByGroupAndWeek, patch, remove, deleteWeek, findTemplate, applyWeekTemplate
- `TaskAssignmentService` : create (mode FREE/FUNNY), markDone, assignToUser, findByUser
- `tasks.seeds.ts` : tâches par défaut injectées à la création d'un groupe

### Points positifs

- La logique DAILY (génération automatique de 7 tâches) simplifie considérablement la saisie côté frontend.
- Le champ `weight` (1–5) posera les bases du calcul de charge mentale dans les prochains sprints.

### Points d'amélioration identifiés

- La suppression d'une tâche nécessite de supprimer manuellement ses assignations (contrainte de clé étrangère) : traité via `manager.delete()` mais à documenter explicitement.
- Le mode FUNNY (restriction d'assignation à l'admin) n'est pas encore implémenté — planifié pour Sprint 5.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 7 |
| Jours-hommes réalisés | 7 |
| Tâches terminées | 7/7 |
| Incidents bloquants | 0 |

---

## Sprint 4 — Frontend V1
**Dates** : 25 mars → 9 avril 2026  
**Durée** : 2 semaines (8 jours-hommes)

### Objectifs du sprint

- Initialiser le projet React Native avec Expo
- Implémenter les écrans d'authentification (login, register)
- Implémenter le dashboard groupes et le dashboard tâches
- Connecter le frontend au backend via JWT

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Initialisation React Native + Expo | 0,5 j | 0,5 j | ✅ |
| Navigation (React Navigation) | 0,5 j | 0,5 j | ✅ |
| Screens login / register | 1,5 j | 2 j | ⚠️ |
| Dashboard groupes | 1 j | 1 j | ✅ |
| Dashboard tâches de la semaine | 1,5 j | 1,5 j | ✅ |
| Intégration JWT (stockage + intercepteurs) | 1 j | 1 j | ✅ |
| Tests intégration frontend ↔ backend | 2 j | 1,5 j | ✅ |

### Livrables produits

- Application React Native + Expo fonctionnelle sur iOS et Android
- Écrans : login, register, liste des groupes, tâches de la semaine
- Stockage du token JWT avec AsyncStorage
- Intercepteurs Axios pour l'injection automatique du Bearer token

### Points positifs

- L'utilisation d'Expo simplifie considérablement la configuration native (pas besoin de Xcode ou Android Studio pour le développement).
- La navigation par stack + tabs donne une UX fluide et intuitive.

### Points d'amélioration identifiés

- Les écrans login/register ont pris 0,5 jour de plus que prévu en raison de la gestion des erreurs de validation côté formulaire.
- Les tests d'intégration ont gagné 0,5 jour par rapport au plan grâce à la stabilité de l'API backend.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 8 |
| Jours-hommes réalisés | 8 |
| Tâches terminées | 7/7 |
| Incidents bloquants | 0 |
| Dérive | +0,5 j login/register, -0,5 j tests intégration |

---

## Sprint 5 — Fonctionnalités avancées
**Dates** : 10 → 28 avril 2026  
**Durée** : 3 semaines (8 jours-hommes)

### Objectifs du sprint

- Implémenter le mode FUNNY avec élection de l'admin de la semaine
- Ajouter l'analyse de charge (Insights) et la gamification (badges, streaks)
- Ajouter les modules complémentaires : ShoppingList, Meals, Finance, Scores

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Mode FUNNY + élection admin | 1,5 j | 1,5 j | ✅ |
| Roue frontend + `electWeeklyAdmin()` | 1 j | 1 j | ✅ |
| `GroupsService.smartAssign()` | 1 j | 1 j | ✅ |
| `InsightsService` — charge, alertes, suggestions | 1,5 j | 2 j | ⚠️ |
| `GamificationService` — badges + streaks | 1 j | 1 j | ✅ |
| `ShoppingListModule` + `MealsModule` | 1 j | 1 j | ✅ |
| `GroupInvitations` + `Finance` + `Scores` | 1 j | 0,5 j | ✅ |

### Livrables produits

- Mode FUNNY : restriction d'assignation à l'admin élu, `ForbiddenException` pour les autres membres
- `InsightsService` : résumé hebdomadaire, alerte de surcharge, suggestion de rééquilibrage, tâches en retard, suggestion de modèle
- Badges : Machine de guerre, Fantôme, Perfectionniste, Éclair
- Modules : ShoppingList, Meals, MealVotes, GroupInvitations, Finance, Scores, Timers

### Points positifs

- L'algorithme smartAssign utilisant les poids TypeORM est plus élégant et maintenable que prévu.
- La gamification ajoute une dimension motivationnelle forte, bien adaptée à l'argument "réduction de la charge mentale".

### Points d'amélioration identifiés

- `InsightsService` a pris 0,5 jour de plus : la logique d'alerte de surcharge nécessitait de définir précisément le seuil (choix de weight × 5 tâches/semaine).
- `GroupInvitations`, `Finance` et `Scores` ont été traités plus rapidement grâce à la réutilisation des patterns établis.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 8 |
| Jours-hommes réalisés | 8 |
| Tâches terminées | 7/7 |
| Incidents bloquants | 0 |
| Dérive | +0,5 j Insights, -0,5 j modules annexes |

---

## Sprint 6 — Qualité, documentation & soutenance
**Dates** : 5 → 31 mai 2026  
**Durée** : 4 semaines (9 jours-hommes)

### Objectifs du sprint

- Atteindre 132 tests unitaires Jest (0 échec) couvrant les services et controllers
- Mettre en place le pipeline CI/CD GitHub Actions
- Produire toute la documentation RNCP manquante
- Préparer et répéter la soutenance

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| Correction `tsconfig.json` (types jest) | 0,5 j | 0,5 j | ✅ |
| `auth.service.spec.ts` — 21 tests | 1 j | 1 j | ✅ |
| `tasks.service.spec.ts` — 18 tests | 1 j | 1 j | ✅ |
| `task-assignment.service.spec.ts` — 16 tests | 1 j | 1 j | ✅ |
| `group-invitations.service.spec.ts` — 14 tests | 0,5 j | 0,5 j | ✅ |
| `groups.service.spec.ts` — 14 tests | 0,5 j | 0,5 j | ✅ |
| `finance.service.spec.ts` — 13 tests | 0,5 j | 0,5 j | ✅ |
| `gamification.service.spec.ts` — 16 tests | 0,5 j | 0,5 j | ✅ |
| Pipeline CI/CD GitHub Actions | 0,5 j | 0,5 j | ✅ |
| Manuel de déploiement | 0,5 j | 0,5 j | ✅ |
| CHANGELOG | 0,5 j | 0,5 j | ✅ |
| Cahier de recettes (93 cas) | 0,5 j | 0,5 j | ✅ |
| Plan de correction des bogues | 0,5 j | 0,5 j | ✅ |
| Gantt + rapports de sprint | 0,5 j | 0,5 j | ✅ |
| Grille d'évaluation des compétences | 0,5 j | 0,5 j | ✅ |
| Dossier de maintenance Bloc 4 | 0,5 j | 0,5 j | ✅ |
| Préparation slides + répétition | 2 j | 2 j | ✅ |

### Livrables produits

- **132 tests unitaires Jest** : 21 Auth + 18 Tasks + 16 TaskAssignment + 14 GroupInvitations + 14 Groups + 13 Finance + 16 Gamification + controllers — 0 échec
- **Pipeline GitHub Actions** : lint + unit-tests + build + E2E (PostgreSQL service)
- **Documentation complète** : README, manuel de déploiement, CHANGELOG, cahier de recettes, plan de correction des bogues, Gantt, rapports de sprint, grille de compétences, dossier de maintenance

### Bogues rencontrés et résolus

| ID | Description | Priorité | Résolution |
|---|---|---|---|
| BUG-2026-001 | `jest.spyOn(bcrypt, 'compare')` impossible sur CommonJS | P3 | Test réécrit sans espion |
| BUG-2026-002 | `Cannot find name 'jest'` — types manquants dans tsconfig | P3 | Ajout `"types": ["jest", "node"]` |
| BUG-2026-003 | Apostrophes françaises cassant le parsing TypeScript | P3 | Descriptions réécrites sans apostrophes |

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 9 |
| Jours-hommes réalisés | 9 |
| Tâches terminées | 13/13 |
| Incidents bloquants | 3 (résolus) |

---

---

## Sprint 7 — Notifications push & finitions frontend
**Dates** : 31 mai → 7 juin 2026  
**Durée** : 1 semaine (5 jours-hommes)

### Objectifs du sprint

- Implémenter le système de notifications push via Expo Push API
- Compléter le frontend : édition de dépense (EditExpenseModal), refonte SettingsScreen
- Implémenter PATCH `/finance/expenses/:id` et DELETE `/users/me` côté backend

### Tâches planifiées vs réalisées

| Tâche | Planifié | Réalisé | Statut |
|---|---|---|---|
| `NotificationsModule` (service + controller + module) | 0,5 j | 0,5 j | ✅ |
| Colonne `pushToken` sur entité `User` | 0,25 j | 0,25 j | ✅ |
| Déclenchement notifications : invitation, dépense, remboursement | 0,5 j | 0,5 j | ✅ |
| `utils/notifications.ts` frontend (register/unregister/listener) | 0,5 j | 0,5 j | ✅ |
| Intégration notification dans `AuthContext` (login/register/logout) | 0,25 j | 0,25 j | ✅ |
| Backend `PATCH /finance/expenses/:id` + `UpdateExpenseDto` | 0,5 j | 0,5 j | ✅ |
| Backend `DELETE /users/me` + `deleteAccount()` | 0,5 j | 0,5 j | ✅ |
| Frontend `EditExpenseModal` + bouton crayon sur `ExpenseCard` | 0,75 j | 0,75 j | ✅ |
| Refonte complète `SettingsScreen` (dark theme + suppression compte) | 0,75 j | 0,75 j | ✅ |
| Mise à jour documentation (modèle données, roadmap, grille, changelog) | 0,5 j | 0,5 j | ✅ |

### Livrables produits

- **`NotificationsModule`** : `POST /notifications/token` (enregistrement) + `DELETE /notifications/token` (désinscription) — token Expo stocké sur `User.pushToken`
- **Déclencheurs push** :
  - `sendInvitation()` → notifie l'utilisateur invité
  - `respondToInvitation(accept=true)` → notifie le propriétaire du groupe
  - `createExpense()` → notifie tous les participants sauf le payeur
  - `createReimbursement()` → notifie le destinataire
- **`PATCH /finance/expenses/:id`** : modification complète (titre, montant, catégorie, date, splitMode, participants) — réservé au payeur
- **`DELETE /users/me`** : vérification mot de passe, suppression des groupes possédés, cascade sur les membres
- **`EditExpenseModal`** : formulaire pré-rempli, appel PATCH, accessible via icône crayon sur chaque dépense (payeur uniquement)
- **`SettingsScreen`** redessiné : dark theme cohérent, sections Profil / Mot de passe / Compte, déconnexion + suppression compte avec confirmation en deux étapes

### Points positifs

- L'utilisation de `fetch()` natif (Node 18+) pour appeler l'Expo Push API évite toute dépendance serveur supplémentaire.
- Le pattern `void service.send(...)` garantit que les notifications ne bloquent jamais la réponse API.
- Le système est non-intrusif : si le token est absent ou le push échoue, l'application continue normalement.

### Points d'amélioration identifiés

- En production, les envois push devraient passer par une file d'attente (BullMQ) pour éviter la latence en cas de batch important.
- `expo-notifications` requiert `expo install expo-notifications expo-constants` + configuration du `projectId` EAS dans `app.json`.

### Vélocité

| Métrique | Valeur |
|---|---|
| Jours-hommes planifiés | 5 |
| Jours-hommes réalisés | 5 |
| Tâches terminées | 10/10 |
| Incidents bloquants | 0 |

---

## Bilan global du projet

| Sprint | Charge planifiée | Charge réelle | Écart |
|---|---|---|---|
| Sprint 1 | 5 j-h | 5 j-h | 0 |
| Sprint 2 | 5 j-h | 5 j-h | 0 |
| Sprint 3 | 7 j-h | 7 j-h | 0 |
| Sprint 4 | 8 j-h | 8 j-h | 0 |
| Sprint 5 | 8 j-h | 8 j-h | 0 |
| Sprint 6 | 9 j-h | 9 j-h | 0 |
| Sprint 7 | 5 j-h | 5 j-h | 0 |
| **TOTAL** | **47 j-h** | **47 j-h** | **0** |

**Aucune dérive de charge globale.** Le Sprint 7 consolide la V1 avec les notifications push, la gestion complète des dépenses (édition/suppression) et la refonte des paramètres utilisateur — fonctionnalités directement démontrables lors de la soutenance.

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, juin 2026.*
