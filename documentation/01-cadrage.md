
1️⃣ Titre du projet

ShareLife – Application de gestion du quotidien partagé

2️⃣ Contexte et problématique

Dans la vie quotidienne, que ce soit en couple, en famille ou en colocation, la répartition des tâches et responsabilités peut générer :

charge mentale

conflits ou incompréhensions

perte de temps dans l’organisation des activités communes

Aujourd’hui, il n’existe pas d’outil simple, accessible et centralisé permettant de suivre, répartir et visualiser les tâches quotidiennes tout en tenant compte de la charge réelle de chaque membre.

Problématique :

Comment concevoir une application mobile permettant de faciliter l’organisation du quotidien partagé, réduire la charge mentale et assurer une répartition équitable des tâches entre les membres d’un groupe ?

3️⃣ Objectifs du projet

L’objectif principal est de développer ShareLife, une application mobile full stack (React Native + NestJS) permettant de :

Gérer des groupes d’utilisateurs (foyer, famille, colocations)

Créer et assigner des tâches avec suivi du statut

Calculer la charge par utilisateur pour visualiser l’équilibre

Créer et partager une liste de course

Possibilité d'ajouter une fonction "qu'est-ce qu'on mange ce soir?"

Envoyer des notifications pour les tâches à réaliser

Permettre une expérience simple, rapide et intuitive

4️⃣ Périmètre fonctionnel V1

Pour la version initiale (V1), le projet inclura :

Backend (NestJS)

Authentification JWT (register/login)

Gestion des utilisateurs et profils

Création et gestion de groupes

Gestion des tâches et assignations

Calcul basique de la charge par membre

Frontend (React Native)

Écran login / register

Dashboard des groupes et tâches

Visualisation de la charge par membre

Notifications de rappel

Hors périmètre V1

Messagerie interne

IA / recommandations automatiques

Synchronisation avec services externes (Drive, courses)

Multi-groupes avancés ou version web desktop

5️⃣ Cibles utilisateurs

Couples souhaitant partager les tâches domestiques

Familles avec enfants

Colocations ou foyers partagés

Une cible large, quotidienne et compréhensible par le jury RNCP

6️⃣ Valeur ajoutée et différenciation

Application mobile natif cross-platform (React Native) pour un usage quotidien

Backend NestJS centralisé, sécurisé et évolutif

Calcul et visualisation de la charge réelle par utilisateur

Possibilité de monétisation via version premium :

Multi-groupes

Statistiques avancées

Notifications intelligentes

7️⃣ Monétisation

Le modèle économique choisi est freemium :

Version	Fonctionnalités
Gratuite	Groupe unique, tâches partagées, notifications de base
Premium (3–5 €/mois)	Multi-groupes, statistiques avancées, notifications intelligentes, historique détaillé

Les utilisateurs paient pour réduire la charge mentale et améliorer l’organisation quotidienne.

8️⃣ Contraintes techniques

Base de données relationnelle : PostgreSQL via Docker

API sécurisée : NestJS + JWT

Frontend mobile : React Native + Expo

Développement en TypeScript

Industrialisation : Docker, tests unitaires, CI/CD