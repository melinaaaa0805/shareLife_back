
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

Base de données relationnelle : Amazon RDS PostgreSQL 15

API sécurisée : NestJS + JWT, hébergée sur AWS EC2

Frontend mobile : React Native + Expo, publié sur Google Play Store et App Store

Développement en TypeScript

Industrialisation : Docker, tests unitaires (132 tests Jest), CI/CD GitHub Actions

---

9️⃣ Analyse des risques

**Grille de cotation :**
- Probabilité : 1 (faible) → 3 (élevée)
- Impact : 1 (mineur) → 3 (critique)
- Criticité = Probabilité × Impact

| ID | Risque | Catégorie | Prob. | Impact | Criticité | Plan de mitigation |
|---|---|---|---|---|---|---|
| R01 | Faille de sécurité JWT (token volé ou forgé) | Sécurité | 2 | 3 | **6** | Secret JWT long et aléatoire (64 chars), expiration 1h, stockage sécurisé côté client, HTTPS obligatoire |
| R02 | Indisponibilité AWS EC2 (panne instance) | Infrastructure | 1 | 3 | **3** | SLA AWS 99,9 %. Redémarrage automatique Docker (`restart: always`). Snapshot EC2 hebdomadaire |
| R03 | Perte de données PostgreSQL (RDS) | Infrastructure | 1 | 3 | **3** | Backups automatiques RDS (rétention 7 jours). Export pg_dump quotidien vers S3 |
| R04 | Refus de publication sur les stores (App Store / Play Store) | Commercial | 2 | 2 | **4** | Respect des guidelines dès la conception. TestFlight + test interne avant soumission. Délai de 7 jours prévu |
| R05 | Dérive du calendrier de développement | Planning | 2 | 2 | **4** | Sprints courts (1–2 semaines) avec livrable fonctionnel. Périmètre V1 clairement borné |
| R06 | Régression fonctionnelle lors d'une mise à jour | Qualité | 2 | 2 | **4** | 132 tests unitaires + pipeline CI bloquant. Cahier de recettes rejoué après chaque déploiement |
| R07 | Surcharge serveur EC2 (pic d'usage) | Performance | 1 | 2 | **2** | Rate limiting (30 req/min). Possibilité de passer en t3.medium ou d'ajouter un Auto Scaling Group |
| R08 | Vulnérabilité dans une dépendance npm | Sécurité | 2 | 2 | **4** | `npm audit` mensuel. Mises à jour de sécurité appliquées sous 48h |
| R09 | Mauvaise adoption utilisateur | Produit | 2 | 1 | **2** | UX testée avec des utilisateurs cibles. Onboarding simplifié. Mode FREE sans inscription payante |
| R10 | Coûts AWS dépassant le budget | Budget | 1 | 2 | **2** | Budget AWS Budgets configuré avec alerte à 50 €/mois. Architecture optimisée (t3.micro → t3.small uniquement si nécessaire) |

**Matrice probabilité × impact :**

```
         Impact
         1 (mineur)   2 (modéré)   3 (critique)
        ┌────────────┬────────────┬────────────┐
Prob. 3 │            │            │            │
(élevée)│            │            │            │
        ├────────────┼────────────┼────────────┤
Prob. 2 │     R09    │  R04 R05   │    R01     │
(moyen) │            │  R06 R08   │            │
        ├────────────┼────────────┼────────────┤
Prob. 1 │     R07    │  R03 R07   │  R02 R03   │
(faible)│     R10    │  R10       │            │
        └────────────┴────────────┴────────────┘

Zone rouge (criticité ≥ 6)  : R01 — surveillance prioritaire
Zone orange (criticité 3–5) : R02 R03 R04 R05 R06 R08 — traités dans le plan de mitigation
Zone verte (criticité ≤ 2)  : R07 R09 R10 — acceptés
```