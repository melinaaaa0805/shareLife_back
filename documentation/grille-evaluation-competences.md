# Grille d'évaluation des compétences — ShareLife V1

**Certification** : RNCP39583 — Expert en développement logiciel  
**Établissement** : YNOV Campus  
**Candidate** : Melina Mitterrand  
**Date de soutenance** : juin 2026  

**Légende** :  
- **A** — Acquis : compétence maîtrisée et démontrée  
- **EA** — En cours d'acquisition : compétence partiellement maîtrisée  
- **NA** — Non acquis : compétence non démontrée  

---

## Bloc 1 — Cadrer un projet de développement d'applications logicielles

| Code | Compétence | Preuve dans ShareLife | Niveau |
|---|---|---|---|
| C1.1.1 | Réaliser une cartographie des parties prenantes | Cibles identifiées : familles, couples, colocataires. Rôles définis : ADMIN, MEMBER. Jury = commanditaire fictif. | **A** |
| C1.1.2 | Analyser les besoins et définir les cas d'usage | 93 cas de test dans le cahier de recettes. Périmètre V1 vs hors-périmètre défini dans `01-cadrage.md`. | **A** |
| C1.2.1 | Évaluer la faisabilité technique | Stack évaluée (NestJS vs Express, TypeORM vs Prisma, PostgreSQL vs MongoDB). Contraintes Docker/CI documentées. | **A** |
| C1.2.2 | Réaliser un audit technique de l'existant | Benchmark réalisé lors du choix de la stack. Analyse des alternatives documentée dans `02-architecture.md`. | **A** |
| C1.3.1 | Concevoir l'architecture logicielle | Architecture 3 couches (Controller / Service / Repository). Diagramme dans `02-architecture.md`. | **A** |
| C1.3.2 | Comparer et choisir une architecture | Comparaison monolithique modulaire vs microservices. Choix justifié par la taille de l'équipe (1 dev) et le délai. | **A** |
| C1.4.1 | Estimer la charge de travail en jours-hommes | 47 jours-hommes répartis sur 7 sprints. Détail par tâche dans le Gantt. | **A** |
| C1.4.2 | Planifier les sprints et jalons | Gantt sur 15 semaines, 7 sprints avec livrables définis. Rapports de sprint produits. | **A** |
| C1.5.1 | Identifier les risques et mesures de mitigation | Matrice des risques probabilité × impact (10 risques, cotation P×I, zones rouge/orange/verte, plans de mitigation) dans `01-cadrage.md`. | **A** |
| C1.6 | Construire un argumentaire technique pour le client | Présentation Bloc 1 : problématique charge mentale, solution technique, valeur ajoutée, modèle freemium. | **A** |

**Résultat Bloc 1** : 10 A / 0 EA / 0 NA — Toutes les compétences acquises.

---

## Bloc 2 — Développer une application logicielle sécurisée et industrialisée

| Code | Compétence | Preuve dans ShareLife | Niveau |
|---|---|---|---|
| C2.1.1 | Concevoir et implémenter une API REST | 47+ endpoints documentés (Swagger `/api`) dont `POST /notifications/token`, `PATCH /finance/expenses/:id`, `DELETE /users/me`. Respect des conventions HTTP (201/200/204/400/401/403/404). | **A** |
| C2.1.2 | Implémenter la persistance des données | TypeORM 0.3 + PostgreSQL 15. 10 entités avec relations ManyToMany, OneToMany. | **A** |
| C2.2.1 | Sécuriser l'authentification | JWT 1h + bcrypt 12 rounds + anti-timing-attack + anti-énumération + rate limiting. | **A** |
| C2.2.2 | Sécuriser les endpoints | Guard JWT sur toutes les routes protégées. `ValidationPipe` avec `whitelist: true`. | **A** |
| C2.2.3 | Gérer les autorisations | Rôles ADMIN/MEMBER. Mode FUNNY : ForbiddenException si non-admin. | **A** |
| C2.3.1 | Écrire des tests unitaires | 132 tests Jest : AuthService (21), TasksService (18), TaskAssignmentService (16), GroupInvitationsService (14), GroupsService (14), FinanceService (13), GamificationService (16) + controllers. 0 échec. | **A** |
| C2.3.2 | Mettre en place un pipeline CI/CD | `.github/workflows/ci.yml` : lint + unit-tests (coverage) + build + E2E (PostgreSQL). | **A** |
| C2.4.1 | Documenter le code et l'API | Swagger auto-généré. README complet. JSDoc sur les méthodes critiques. | **A** |
| C2.4.2 | Produire un cahier de recettes | 93 cas de test, 80 passés, récapitulatif par module. | **A** |
| C2.4.3 | Documenter le déploiement | Manuel de déploiement : local Docker, sans Docker, production VPS, migrations, mise à jour. | **A** |
| C2.5.1 | Containeriser et déployer l'application | `Dockerfile` multi-stage (builder + runtime). Backend hébergé sur **AWS EC2** + **RDS PostgreSQL 15**. HTTPS via ALB + ACM. App mobile publiée sur **Google Play Store** et **App Store** via Expo EAS. | **A** |
| C2.5.2 | Gérer les versions et le changelog | Git + CHANGELOG suivant Keep a Changelog. 7 versions documentées (v0.1.0 → v1.0.0). | **A** |

**Résultat Bloc 2** : 12 A / 0 EA / 0 NA — Toutes les compétences éliminatoires acquises.

---

## Bloc 3 — Piloter un projet de développement logiciel

| Code | Compétence | Preuve dans ShareLife | Niveau |
|---|---|---|---|
| C3.1.1 | Décomposer le projet en sprints | 7 sprints définis avec objectifs, tâches, livrables. Rapports produits. | **A** |
| C3.1.2 | Réaliser un diagramme de Gantt | Gantt sur 14 semaines avec dépendances et charge par tâche. | **A** |
| C3.2.1 | Produire des rapports de sprint | 6 rapports avec planifié vs réalisé, vélocité, points positifs/d'amélioration. | **A** |
| C3.2.2 | Mesurer la vélocité et les écarts | Tableau synthèse : 42 j-h planifiés = 42 j-h réalisés. Dérives internes documentées. | **A** |
| C3.3.1 | Évaluer les compétences acquises | Présente grille d'évaluation auto-positionnée. | **A** |
| C3.3.2 | Identifier les axes d'amélioration | Points d'amélioration listés dans chaque rapport de sprint. | **A** |
| C3.4.1 | Travailler en mode agile (Scrum/Kanban) | Cycles itératifs de 1–4 semaines. Livrable fonctionnel à chaque sprint. | **A** |
| C3.4.2 | Gérer les risques et imprévus | 3 bogues rencontrés, qualifiés (P3), corrigés et documentés dans le plan de correction. | **A** |

**Résultat Bloc 3** : 8 A / 0 EA / 0 NA — Toutes les compétences acquises.

---

## Bloc 4 — Maintenir et faire évoluer une application logicielle

| Code | Compétence | Preuve dans ShareLife | Niveau |
|---|---|---|---|
| C4.1.1 | Mettre en place un système de monitoring | **AWS CloudWatch** : logs via driver `awslogs`, métriques ALB/EC2/RDS, alarmes SNS, tableau de bord. | **A** |
| C4.1.2 | Définir un processus de gestion des anomalies | Plan de correction des bogues : fiche de signalement, niveaux P1–P4, critères de clôture. | **A** |
| C4.2.1 | Gérer les versions et les migrations | Migrations TypeORM documentées. `synchronize: false` en production. CHANGELOG tenu. | **A** |
| C4.2.2 | Écrire un journal de version | CHANGELOG suivant Keep a Changelog. 7 versions avec Added/Modified/Fixed/Security. | **A** |
| C4.3.1 | Documenter les procédures de maintenance | Manuel de déploiement : mise à jour, sauvegarde/restauration, résolution des problèmes courants. | **A** |
| C4.3.2 | Anticiper les évolutions futures | Roadmap V2 documentée : multi-groupes, IA, notifications intelligentes planifiées (BullMQ), messagerie interne, version web admin. Notifications push V1 déjà implémentées. | **A** |
| C4.4.1 | Assurer la non-régression lors des mises à jour | 132 tests unitaires + pipeline CI bloquant si test échoue. | **A** |

**Résultat Bloc 4** : 7 A / 0 EA / 0 NA — Toutes les compétences acquises.

---

## Synthèse globale

| Bloc | Compétences | A | EA | NA | Éliminatoires |
|---|---|---|---|---|---|
| Bloc 1 — Cadrage | 10 | 10 | 0 | 0 | ✅ Toutes acquises |
| Bloc 2 — Développement | 12 | 12 | 0 | 0 | ✅ Toutes acquises |
| Bloc 3 — Pilotage | 8 | 8 | 0 | 0 | ✅ Toutes acquises |
| Bloc 4 — Maintenance | 7 | 7 | 0 | 0 | ✅ Toutes acquises |
| **TOTAL** | **37** | **37** | **0** | **0** | ✅ |

**Taux d'acquisition global : 100 %**  
Aucune compétence éliminatoire non acquise. Aucune compétence non acquise.

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
