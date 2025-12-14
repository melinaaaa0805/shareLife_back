Structurer les sprints
Sprint 1 : Setup + Auth (1 semaine)

Objectifs :

Docker + PostgreSQL opérationnel

Backend NestJS initialisé

Module Auth complet (register, login, JWT, /me)

Test Postman ou Insomnia

Tâches :

 Créer repo backend / frontend

 Config Docker + DB

 Créer entité User

 Créer AuthModule / AuthService / AuthController

 Tester endpoints Auth

Livrable : Auth fonctionnelle sur Docker avec base PostgreSQL

Sprint 2 : Users & Groups (1 semaine)

Objectifs :

Gérer groupes et membres

Endpoint CRUD pour groupes

Ajouter utilisateurs à groupes, rôle MEMBER / ADMIN

Tâches :

 Créer entité Group et GroupMember

 Créer GroupsModule / GroupsService / GroupsController

 Endpoints : create group, join group, list members

 Tester via Postman

Livrable : Création et gestion de groupes fonctionnelle

Sprint 3 : Tasks & Assignments (1 semaine)

Objectifs :

CRUD tâches

Assignation tâches aux membres

Suivi statut (PENDING → DONE)

Tâches :

 Créer entité Task et TaskAssignment

 Créer TasksModule / TasksService / TasksController

 Endpoints CRUD tâches

 Assignation tâches à membres

 Tester via Postman

Livrable : Backend tâches + assignations fonctionnel

Sprint 4 : Frontend V1 (1–2 semaines)

Objectifs :

React Native + Expo

Écrans : login, register, dashboard groupes, tâches

Connexion JWT avec backend

Tâches :

 Créer projet React Native

 Écran login / register

 Dashboard groupes et tâches

 Récupération données via fetch / axios

 Test intégration frontend ↔ backend

Livrable : Application mobile fonctionnelle avec connexion aux API

Sprint 5 : Dashboard / Charge / Notifications (1 semaine)

Objectifs :

Calcul de la charge par utilisateur

Affichage dashboard simple

Notifications basiques

Tâches :

 Ajouter calcul charge backend

 Endpoint pour dashboard utilisateur

 Frontend : affichage charge, liste tâches

 Notifications locales / push

Livrable : Dashboard V1 complet + notifications

Sprint 6 : Préparation soutenance / V1 prod (1 semaine)

Objectifs :

Documentation RNCP complète

Tests unitaires / e2e

Déploiement prod (Docker / backend)

Préparation démonstration

Tâches :

 Finaliser 01-cadrage.md, 02-architecture.md, 03-modeles-donnees.md, 04-roadmap.md

 Ajouter README complet

 Lancer tests unitaires / e2e

 Déploiement backend Docker

 Build frontend Expo

Livrable : ShareLife V1 prête pour soutenance