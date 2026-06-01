# Roadmap — ShareLife

---

## 1. Version V1 (livrable RNCP — mai 2026)

### Fonctionnalités implémentées

| Module | Statut | Description |
|---|---|---|
| Authentification JWT | ✅ | register / login / me / reset password |
| Gestion des groupes | ✅ | CRUD groupes, membres, invitations par email |
| Gestion des tâches | ✅ | CRUD tâches ONCE/DAILY/WEEKLY, assignation, timer |
| Mode FUNNY | ✅ | Élection admin de la semaine via roue de fortune |
| SmartAssign | ✅ | Assignation équilibrée par charge pondérée |
| Insights | ✅ | Analyse de charge, alertes, suggestions de rééquilibrage |
| Finance partagée | ✅ | Dépenses, remboursements, soldes, PATCH/DELETE |
| Shopping List | ✅ | Liste de courses partagée par semaine |
| Repas & votes | ✅ | Planification des repas + votes hebdomadaires |
| Scores & récompenses | ✅ | Classement par points, récompenses WINNER/LOSER |
| Gamification | ✅ | Badges (4), streaks de jours actifs |
| Paramètres utilisateur | ✅ | Édition profil, changement mot de passe, suppression compte |
| **Notifications push** | ✅ | Token Expo stocké sur User — envoi via Expo Push API sur invitation, dépense, remboursement |
| Tests unitaires | ✅ | 132 tests Jest — 0 échec |
| CI/CD | ✅ | GitHub Actions : lint + tests + build + E2E |
| Documentation RNCP | ✅ | Tous les fichiers requis produits |

### Stack V1

- **Backend** : NestJS 11 + TypeScript + TypeORM 0.3 + PostgreSQL 15
- **Frontend** : React Native + Expo SDK 54 + expo-notifications
- **Infra** : Docker Compose (dev) — AWS EC2 + RDS PostgreSQL (prod)
- **Push** : Expo Push API (HTTPS, aucun SDK tiers côté serveur)

---

## 2. Évolutions V2 (post-soutenance)

| Fonctionnalité | Priorité | Complexité |
|---|---|---|
| Multi-groupes avancés (archivage, export) | Haute | Moyenne |
| Historique complet des tâches et assignations | Haute | Faible |
| Messagerie interne entre membres | Moyenne | Haute |
| Notifications intelligentes (rappels planifiés, résumé hebdomadaire) | Moyenne | Moyenne |
| Version web admin (Next.js) | Basse | Haute |
| IA / suggestions automatiques d’assignation | Basse | Très haute |

---

## 3. Modèle de monétisation (freemium)

| Tier | Prix | Fonctionnalités |
|---|---|---|
| Gratuit | 0 € | 1 groupe, tâches, finance de base, notifications |
| Premium | 3–5 €/mois | Multi-groupes, stats avancées, historique, rappels intelligents |

*Argument au jury : le modèle freemium démontre la viabilité commerciale et l’industrialisation du projet au-delà du MVP.*

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*