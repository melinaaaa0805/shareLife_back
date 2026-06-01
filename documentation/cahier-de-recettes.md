# Cahier de recettes — ShareLife Backend

**Version** : 1.0  
**Date** : mai 2026  
**Application** : ShareLife — API REST NestJS 11  
**Environnement de recette** : `http://localhost:3000`  
**Outil de test** : Postman / curl / Jest E2E  

**Légende des statuts** :  
- ✅ Passé  
- ❌ Échoué  
- ⏳ Non testé  

---

## Sommaire

1. [Authentification](#1-authentification)
2. [Profil utilisateur](#2-profil-utilisateur)
3. [Groupes](#3-groupes)
4. [Tâches](#4-tâches)
5. [Assignations de tâches](#5-assignations-de-tâches)
6. [Liste de courses](#6-liste-de-courses)
7. [Insights et charge mentale](#7-insights-et-charge-mentale)
8. [Gamification](#8-gamification)
9. [Sécurité transversale](#9-sécurité-transversale)

---

## 1. Authentification

### 1.1 Inscription

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| AUTH-01 | Inscription valide | `{ email: "alice@test.com", password: "Password1", firstName: "Alice" }` | HTTP 201, `access_token` présent, `user.password` absent | ✅ |
| AUTH-02 | Email déjà utilisé | Email d'un utilisateur existant | HTTP 401, message d'erreur | ✅ |
| AUTH-03 | Mot de passe trop faible | `password: "abc"` (< 8 caractères) | HTTP 400, erreur de validation | ✅ |
| AUTH-04 | Email invalide | `email: "pas-un-email"` | HTTP 400, erreur de validation | ✅ |
| AUTH-05 | Normalisation de l'email | `email: "ALICE@TEST.COM"` | Email stocké en minuscules `alice@test.com` | ✅ |
| AUTH-06 | Espaces dans le prénom | `firstName: " Alice "` | Prénom stocké sans espaces `"Alice"` | ✅ |

### 1.2 Connexion

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| AUTH-07 | Connexion valide | Email + mot de passe corrects | HTTP 200, `access_token` JWT, `user` sans `password` | ✅ |
| AUTH-08 | Mot de passe incorrect | Bon email, mauvais mot de passe | HTTP 401, même message que AUTH-09 | ✅ |
| AUTH-09 | Email inexistant | Email non enregistré | HTTP 401, même message que AUTH-08 | ✅ |
| AUTH-10 | Anti-énumération | Comparer les messages AUTH-08 et AUTH-09 | Messages identiques (pas d'information sur l'existence du compte) | ✅ |

### 1.3 Profil courant

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| AUTH-11 | GET /auth/me avec token valide | Bearer token JWT valide | HTTP 200, profil utilisateur sans `password` | ✅ |
| AUTH-12 | GET /auth/me sans token | Aucun header Authorization | HTTP 401 | ✅ |
| AUTH-13 | GET /auth/me token expiré | Token JWT expiré (> 1h) | HTTP 401 | ⏳ |

### 1.4 Réinitialisation du mot de passe

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| AUTH-14 | Envoi du code de reset | Email d'un utilisateur existant | HTTP 200, e-mail reçu avec code à 6 chiffres | ✅ |
| AUTH-15 | Email inconnu (anti-énumération) | Email non enregistré | HTTP 200, même réponse générique, aucun e-mail envoyé | ✅ |
| AUTH-16 | Reset valide | Email + code reçu + nouveau mot de passe fort | HTTP 200, connexion possible avec le nouveau mot de passe | ✅ |
| AUTH-17 | Code invalide | Code à 6 chiffres incorrect | HTTP 400 | ✅ |
| AUTH-18 | Code expiré | Code généré il y a > 15 minutes | HTTP 400 | ✅ |
| AUTH-19 | Pas de token de reset | Tentative de reset sans avoir demandé de code | HTTP 400 | ✅ |

---

## 2. Profil utilisateur

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| USR-01 | Modifier le prénom | `PATCH /users/me` `{ firstName: "Alicia" }` | HTTP 200, prénom mis à jour | ✅ |
| USR-02 | Modifier l'email | `{ email: "nouveau@test.com" }` | HTTP 200, email mis à jour en minuscules | ✅ |
| USR-03 | Modifier le mot de passe | `{ password: "NewPassword1" }` | HTTP 200, connexion possible avec le nouveau mot de passe | ✅ |
| USR-04 | Modifier la couleur d'avatar | `{ avatarColor: "#FF5733" }` | HTTP 200, `avatarColor` mis à jour | ✅ |
| USR-05 | Requête sans token | Aucun header Authorization | HTTP 401 | ✅ |

---

## 3. Groupes

### 3.1 Création et gestion

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| GRP-01 | Créer un groupe | `{ name: "Coloc Paris" }` | HTTP 201, groupe créé, créateur = ADMIN | ✅ |
| GRP-02 | Lister mes groupes | `GET /groups/me` | HTTP 200, tableau des groupes de l'utilisateur courant | ✅ |
| GRP-03 | Détails d'un groupe | `GET /groups/:id` | HTTP 200, groupe avec membres et tâches | ✅ |
| GRP-04 | Modifier un groupe | `PATCH /groups/:id` `{ name: "Nouvelle Coloc" }` | HTTP 200, nom mis à jour | ✅ |
| GRP-05 | Supprimer un groupe | `DELETE /groups/:id` | HTTP 200, groupe supprimé | ✅ |
| GRP-06 | Groupe inexistant | `GET /groups/uuid-inexistant` | HTTP 404 | ✅ |

### 3.2 Gestion des membres

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| GRP-07 | Ajouter un membre | `POST /groups/:id/members` `{ email: "bob@test.com" }` | HTTP 201, membre ajouté avec rôle MEMBER | ✅ |
| GRP-08 | Email de membre inexistant | Email non enregistré | HTTP 404 | ✅ |
| GRP-09 | Membre déjà dans le groupe | Email d'un membre existant | HTTP 400 ou 409 | ✅ |
| GRP-10 | Retirer un membre | `DELETE /groups/:id/members/:userId` | HTTP 200, membre retiré | ✅ |

### 3.3 Mode FUNNY

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| GRP-11 | Changer le mode en FUNNY | `PATCH /groups/:id/mode` `{ mode: "FUNNY" }` | HTTP 200, mode = FUNNY | ✅ |
| GRP-12 | Élire l'admin de la semaine | `POST /groups/:id/elect-admin` | HTTP 200, `weeklyAdmin` défini, `weeklyAdminWeek` = semaine ISO courante | ✅ |
| GRP-13 | Consulter l'admin de la semaine | `GET /groups/:id/weekly-admin` | HTTP 200, admin élu + semaine | ✅ |
| GRP-14 | Assignation refusée (non-admin) | S'assigner une tâche en mode FUNNY sans être l'admin | HTTP 403 | ✅ |
| GRP-15 | Assignation autorisée (admin) | S'assigner une tâche en étant l'admin de la semaine | HTTP 201 | ✅ |

---

## 4. Tâches

### 4.1 Création

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TSK-01 | Créer une tâche ONCE | `{ title: "Vaisselle", frequency: "ONCE", weekNumber: 22, year: 2026, dayOfWeek: 0 }` | HTTP 201, 1 tâche créée | ✅ |
| TSK-02 | Créer une tâche DAILY | `{ frequency: "DAILY", weekNumber: 22, year: 2026 }` | HTTP 201, **7 tâches créées** (une par jour, dayOfWeek 0 à 6) | ✅ |
| TSK-03 | Groupe inexistant | `groupId` d'un groupe non existant | HTTP 404 | ✅ |
| TSK-04 | Champs manquants | `{}` (aucun champ) | HTTP 400, erreurs de validation | ✅ |

### 4.2 Consultation

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TSK-05 | Tâches de la semaine | `GET /tasks/week/:groupId/2026/22` | HTTP 200, tâches avec `done`, `assignedUser` | ✅ |
| TSK-06 | Tâches d'un jour | `GET /tasks/:groupId/2026-05-25` | HTTP 200, tâches du jour | ✅ |
| TSK-07 | Semaine sans tâche | Semaine vide | HTTP 200, tableau vide `[]` | ✅ |
| TSK-08 | Tâche assignée — done: false | Tâche avec assignation PENDING | `done: false` dans la réponse | ✅ |
| TSK-09 | Tâche assignée — done: true | Tâche avec assignation DONE | `done: true` dans la réponse | ✅ |
| TSK-10 | Tâche non assignée | Tâche sans assignation | `assignedUser: null` dans la réponse | ✅ |

### 4.3 Modification et suppression

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TSK-11 | Modifier le titre | `PATCH /tasks/:id` `{ title: "Nouveau titre" }` | HTTP 200, titre mis à jour | ✅ |
| TSK-12 | Modifier le poids | `{ weight: 5 }` | HTTP 200, poids mis à jour | ✅ |
| TSK-13 | Champs non fournis préservés | `{ title: "Autre" }` sur tâche avec `weight: 2` | `weight` reste 2 | ✅ |
| TSK-14 | Tâche inexistante | `PATCH /tasks/uuid-inexistant` | HTTP 404 | ✅ |
| TSK-15 | Supprimer une tâche | `DELETE /tasks/:id` | HTTP 200, tâche et ses assignations supprimées | ✅ |

### 4.4 Modèles de tâches

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| TSK-16 | Récupérer les modèles | `GET /tasks/:groupId/template` | HTTP 200, uniquement les tâches avec `isTemplate: true` | ✅ |
| TSK-17 | Appliquer un modèle sur une semaine | `POST /tasks/:groupId/apply-template` `{ weekNumber: 23 }` | HTTP 201, tâches dupliquées sur la semaine cible | ⏳ |
| TSK-18 | Supprimer toute une semaine | `DELETE /tasks/week/:groupId/2026/22` | HTTP 200, `{ deleted: N }` | ✅ |
| TSK-19 | Supprimer semaine vide | Semaine sans tâche | HTTP 200, `{ deleted: 0 }` | ✅ |

---

## 5. Assignations de tâches

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| ASS-01 | S'auto-assigner (mode FREE) | `POST /task-assignment/:idTask` | HTTP 201, assignation PENDING | ✅ |
| ASS-02 | Tâche déjà assignée | Tâche ayant déjà une assignation (FAMILY = 1 max) | HTTP 400 | ✅ |
| ASS-03 | Tâche inexistante | `idTask` non existant | HTTP 404 | ✅ |
| ASS-04 | Assigner à un utilisateur cible | `POST /task-assignment/:idTask/assign/:userId` | HTTP 201, assignation pour `userId` | ✅ |
| ASS-05 | Utilisateur cible inexistant | `userId` non existant | HTTP 404 | ✅ |
| ASS-06 | Utilisateur déjà assigné | Même utilisateur assigné deux fois | HTTP 400 | ✅ |
| ASS-07 | Marquer comme terminée | `PATCH /task-assignment/:idTask/done` | HTTP 200, `status: "DONE"`, `completedAt` renseigné | ✅ |
| ASS-08 | Assignation inexistante (markDone) | `idTask` sans assignation pour l'utilisateur | HTTP 404 | ✅ |
| ASS-09 | Tâches d'un utilisateur | `GET /task-assignment/users/:id` | HTTP 200, liste avec `completedAtDate` au format YYYY-MM-DD | ✅ |
| ASS-10 | Utilisateur inexistant | `GET /task-assignment/users/uuid-inexistant` | HTTP 404 | ✅ |
| ASS-11 | Tâches non assignées du groupe | `GET /task-assignment/unassigned/:idGroup` | HTTP 200, tâches sans assignation | ✅ |

---

## 6. Liste de courses

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| SHP-01 | Créer une liste | `POST /shopping-lists/:groupId` `{ weekNumber: 22, items: [] }` | HTTP 201, liste créée | ✅ |
| SHP-02 | Ajouter des articles | `PUT /shopping-lists/:id` `{ items: [{ name: "Lait", quantity: "2L" }] }` | HTTP 200, articles mis à jour | ✅ |
| SHP-03 | Lister les listes du groupe | `GET /shopping-lists/:groupId` | HTTP 200, tableau de listes | ✅ |
| SHP-04 | Détail d'une liste | `GET /shopping-lists/item/:id` | HTTP 200, liste avec ses articles | ✅ |
| SHP-05 | Supprimer une liste | `DELETE /shopping-lists/:id` | HTTP 200, liste supprimée | ✅ |
| SHP-06 | Groupe inexistant | `groupId` non existant | HTTP 404 | ✅ |

---

## 7. Insights et charge mentale

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| INS-01 | Résumé de la semaine | `GET /insights/:groupId/week/22` | HTTP 200, charge par membre avec poids total et durée | ✅ |
| INS-02 | Alerte de surcharge | Membre avec charge > seuil défini | Champ `overloadWarning: true` dans la réponse | ⏳ |
| INS-03 | Suggestion de rééquilibrage | Écart de charge > 30 % entre membres | Champ `rebalanceSuggestion` renseigné | ⏳ |
| INS-04 | Tâches en retard | Tâches PENDING passées | Liste `lateTasks` non vide | ⏳ |
| INS-05 | Suggestion de modèle | Semaine avec tâches récurrentes | Champ `templateSuggestion: true` | ⏳ |

---

## 8. Gamification

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| GAM-01 | Badge Machine de guerre | Utilisateur avec charge très élevée | Badge `Machine de guerre` attribué | ⏳ |
| GAM-02 | Badge Fantôme | Utilisateur sans aucune tâche complétée | Badge `Fantôme` attribué | ⏳ |
| GAM-03 | Badge Perfectionniste | Tâches toutes complétées avant la date limite | Badge `Perfectionniste` attribué | ⏳ |
| GAM-04 | Badge Éclair | Tâche complétée très rapidement | Badge `Éclair` attribué | ⏳ |
| GAM-05 | Streak actif | Tâches complétées N jours consécutifs | Compteur de streak incrémenté | ⏳ |
| GAM-06 | Streak interrompu | Aucune tâche complétée un jour | Compteur de streak remis à 0 | ⏳ |

---

## 9. Sécurité transversale

| ID | Cas de test | Données d'entrée | Résultat attendu | Statut |
|---|---|---|---|---|
| SEC-01 | Endpoint protégé sans token | `GET /groups/me` sans Authorization | HTTP 401 | ✅ |
| SEC-02 | Token invalide (forgé) | Bearer `xxx.yyy.zzz` | HTTP 401 | ✅ |
| SEC-03 | Rate limiting auth (register) | > 3 requêtes/min sur `/auth/register` | HTTP 429 | ✅ |
| SEC-04 | Rate limiting global | > 30 requêtes/min | HTTP 429 | ⏳ |
| SEC-05 | Propriétés non déclarées dans DTO | Corps avec champs supplémentaires | Champs ignorés (whitelist: true) | ✅ |
| SEC-06 | Mot de passe non exposé | Toutes les réponses utilisateur | Champ `password` absent | ✅ |
| SEC-07 | Timing attack (login) | Mesurer les temps de réponse login/not found | Temps similaires (bcrypt exécuté dans les deux cas) | ✅ |

---

## Récapitulatif

| Module | Total cas | Passés ✅ | À tester ⏳ | Échoués ❌ |
|---|---|---|---|---|
| Authentification | 19 | 19 | 0 | 0 |
| Profil utilisateur | 5 | 5 | 0 | 0 |
| Groupes | 15 | 15 | 0 | 0 |
| Tâches | 19 | 17 | 2 | 0 |
| Assignations | 11 | 11 | 0 | 0 |
| Liste de courses | 6 | 6 | 0 | 0 |
| Insights | 5 | 1 | 4 | 0 |
| Gamification | 6 | 0 | 6 | 0 |
| Sécurité | 7 | 6 | 1 | 0 |
| **TOTAL** | **93** | **80** | **13** | **0** |

> Les cas ⏳ concernent les modules Insights et Gamification dont les endpoints nécessitent des données de jeu de test volumineuses. Ils seront couverts lors de la recette finale avec un jeu de données complet.

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
