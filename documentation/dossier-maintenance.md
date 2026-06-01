# Dossier de maintenance — ShareLife Backend

**Version** : 1.0  
**Date** : mai 2026  
**Application** : ShareLife — API REST NestJS 11  
**Certification** : RNCP39583 — Bloc 4  

---

## Sommaire

1. [Surveillance de l'application (monitoring)](#1-surveillance-de-lapplication-monitoring)
2. [Processus de gestion des anomalies](#2-processus-de-gestion-des-anomalies)
3. [Journal des versions](#3-journal-des-versions)
4. [Procédures de maintenance courante](#4-procédures-de-maintenance-courante)
5. [Gestion des dépendances](#5-gestion-des-dépendances)
6. [Évolutions prévues (Roadmap V2)](#6-évolutions-prévues-roadmap-v2)

---

## 1. Surveillance de l'application (monitoring)

### 1.1 Architecture de monitoring en production (AWS)

```
EC2 (NestJS)  ──► CloudWatch Logs  ──► Log Group /sharelife/backend
     │
     ▼
ALB            ──► CloudWatch Metrics (latence, 4xx, 5xx, requêtes/min)
     │
     ▼
RDS PostgreSQL ──► CloudWatch Metrics (CPU, connexions, stockage)
                         │
                         ▼
                   CloudWatch Alarms ──► SNS ──► Email d'alerte
```

### 1.2 Logs applicatifs — CloudWatch

En production sur AWS, les logs NestJS sont envoyés directement à **CloudWatch Logs** via le driver Docker `awslogs` (configuré dans `docker-compose.prod.yml`).

**Consulter les logs depuis la console AWS :**
- CloudWatch → Log groups → `/sharelife/backend` → flux `production`

**Consulter les logs depuis la CLI :**

```bash
# 50 derniers événements
aws logs get-log-events \
  --log-group-name /sharelife/backend \
  --log-stream-name production \
  --limit 50 \
  --region eu-west-3

# Filtrer les erreurs en temps réel
aws logs filter-log-events \
  --log-group-name /sharelife/backend \
  --filter-pattern "ERROR" \
  --region eu-west-3
```

**Niveaux de log utilisés :**

| Niveau | Usage |
|---|---|
| `log` | Démarrage des modules, connexions établies |
| `warn` | Rate limiting déclenché, tentatives d'accès refusées |
| `error` | Erreurs non gérées, échecs de connexion DB, erreurs SMTP |
| `debug` | Requêtes SQL (désactivé en production) |

### 1.3 Indicateurs à surveiller (CloudWatch Metrics)

| Indicateur | Source | Valeur normale | Seuil d'alerte |
|---|---|---|---|
| Latence ALB (`TargetResponseTime`) | ALB | < 200 ms | > 1 000 ms |
| Erreurs HTTP 5xx (`HTTPCode_Target_5XX_Count`) | ALB | < 1/min | > 10/min |
| CPU EC2 (`CPUUtilization`) | EC2 | < 20 % | > 80 % |
| CPU RDS (`CPUUtilization`) | RDS | < 30 % | > 70 % |
| Connexions DB (`DatabaseConnections`) | RDS | < 10 | > 50 |
| Stockage RDS (`FreeStorageSpace`) | RDS | > 5 Go | < 1 Go |
| Mémoire EC2 | CloudWatch Agent | < 60 % | > 85 % |

### 1.4 Configurer les alarmes CloudWatch

```bash
# Alarme si trop d'erreurs 5xx (> 10 erreurs en 5 minutes)
aws cloudwatch put-metric-alarm \
  --alarm-name "ShareLife-5xx-errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions <SNS_TOPIC_ARN> \
  --region eu-west-3
```

Les alarmes envoient une notification par email via **SNS** (Simple Notification Service).

### 1.5 Vérification de santé post-déploiement

Effectuer ces vérifications après chaque mise à jour :

```bash
# 1. Vérifier que le container est démarré sur l'EC2
ssh ubuntu@<EC2_IP> "docker ps | grep sharelife_backend"

# 2. Vérifier que l'API répond via l'ALB (HTTPS)
curl -s -o /dev/null -w "%{http_code}" https://api.sharelife.app/auth/me
# Attendu : 401 (non authentifié = API opérationnelle)

# 3. Vérifier la connexion RDS dans CloudWatch Logs
aws logs filter-log-events \
  --log-group-name /sharelife/backend \
  --filter-pattern "successfully started" \
  --region eu-west-3

# 4. Tester l'authentification
curl -X POST https://api.sharelife.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password1"}'
# Attendu : HTTP 200 avec access_token
```

### 1.6 Tableau de bord CloudWatch

Créer un dashboard CloudWatch regroupant :
- Graphique latence ALB (dernières 24h)
- Graphique taux d'erreurs 5xx
- Graphique CPU EC2 et RDS
- Graphique connexions DB actives

```bash
aws cloudwatch put-dashboard \
  --dashboard-name ShareLife-Production \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region eu-west-3
```

---

## 2. Processus de gestion des anomalies

Voir le document détaillé : [plan-correction-bogues.md](./plan-correction-bogues.md)

### Résumé du processus

```
Anomalie détectée
      │
      ▼
Qualification P1/P2/P3/P4 (< 24h)
      │
      ├── P1 Critique → Correctif en < 4h + déploiement immédiat
      ├── P2 Majeur   → Correctif en < 24h
      ├── P3 Mineur   → Planifié dans le prochain sprint
      └── P4 Cosmet.  → Backlog
      │
      ▼
Correction sur branche fix/<id>
      │
      ▼
Tests (unitaires + non-régression + CI)
      │
      ▼
Merge → déploiement → clôture + CHANGELOG
```

### Canaux de remontée des anomalies

| Canal | Usage |
|---|---|
| Issues GitHub | Bogues techniques, demandes d'évolution |
| Logs Docker | Erreurs runtime non interceptées |
| Cahier de recettes | Cas de test échoués lors de la recette |
| Retour utilisateur | Comportements inattendus en utilisation |

---

## 3. Journal des versions

Le journal des versions complet est maintenu dans le fichier [CHANGELOG.md](../CHANGELOG.md) suivant la convention **Keep a Changelog**.

### Résumé des versions publiées

| Version | Date | Nature | Points clés |
|---|---|---|---|
| v0.1.0 | 24/02/2026 | Majeure | Setup Docker + Auth JWT complète |
| v0.2.0 | 04/03/2026 | Majeure | Groupes, membres, rôles |
| v0.3.0 | 11/03/2026 | Majeure | Tâches, assignations, statuts |
| v0.4.0 | 25/03/2026 | Majeure | ShoppingList, Meals, profil utilisateur |
| v0.5.0 | 10/04/2026 | Majeure | Mode FUNNY, smartAssign, modules avancés |
| v0.6.0 | 05/05/2026 | Majeure | Insights, Gamification, Finance, Scores |
| v1.0.0 | 31/05/2026 | Release | 132 tests unitaires, CI/CD, documentation complète |

### Règles de versionnage (SemVer)

| Type de changement | Version incrémentée |
|---|---|
| Correction de bogue sans impact API | Patch (x.x.**Z**) |
| Nouvelle fonctionnalité rétrocompatible | Mineure (x.**Y**.0) |
| Changement cassant (breaking change) | Majeure (**X**.0.0) |

---

## 4. Procédures de maintenance courante

### 4.1 Redémarrage d'urgence

```bash
# Redémarrer uniquement le backend (sans toucher la base de données)
docker compose restart backend

# Redémarrer tous les services
docker compose down && docker compose up -d
```

### 4.2 Consultation et nettoyage des logs

```bash
# Voir les 200 dernières lignes de logs
docker compose logs backend --tail 200

# Vider les logs Docker d'un container (si disque plein)
truncate -s 0 $(docker inspect --format='{{.LogPath}}' sharelife_backend)
```

### 4.3 Connexion directe à PostgreSQL

```bash
# Ouvrir un shell PostgreSQL
docker exec -it sharelife_db psql -U postgres -d sharelife_db

# Requêtes utiles
\dt                          -- lister les tables
SELECT COUNT(*) FROM "user"; -- compter les utilisateurs
SELECT * FROM "task" LIMIT 10;
```

### 4.4 Mise à jour de l'application

Voir le [Manuel de déploiement — section 7](./manuel-deploiement.md#7-mise-à-jour-de-lapplication) pour la procédure complète.

Résumé en 4 commandes :

```bash
git pull origin main
npm ci
npx typeorm migration:run -d src/config/typeorm.config.ts
docker compose -f docker-compose.prod.yml up -d --build
```

### 4.5 Sauvegarde et restauration

Voir le [Manuel de déploiement — section 9](./manuel-deploiement.md#9-sauvegarde-et-restauration).

```bash
# Sauvegarde
docker exec sharelife_db pg_dump -U postgres sharelife_db > backup_$(date +%Y%m%d).sql

# Restauration
docker exec -i sharelife_db psql -U postgres sharelife_db < backup_20260531.sql
```

---

## 5. Gestion des dépendances

### 5.1 Dépendances critiques et leur rôle

| Package | Version actuelle | Rôle | Risque si obsolète |
|---|---|---|---|
| `@nestjs/core` | 11.x | Framework HTTP | Failles de sécurité, incompatibilité |
| `typeorm` | 0.3.x | ORM PostgreSQL | Failles SQL, incompatibilité Node |
| `bcryptjs` | 3.x | Hashage mots de passe | Algorithme de hashage obsolète |
| `passport-jwt` | 4.x | Validation JWT | Failles d'authentification |
| `@nestjs/throttler` | 6.x | Rate limiting | Contournement DDoS |
| `class-validator` | 0.14.x | Validation DTOs | Injection de données malformées |

### 5.2 Procédure de mise à jour des dépendances

```bash
# 1. Vérifier les mises à jour disponibles
npm outdated

# 2. Mettre à jour les dépendances mineures (non-breaking)
npm update

# 3. Mettre à jour une dépendance majeure (avec précaution)
npm install @nestjs/core@latest

# 4. Vérifier que les tests passent après mise à jour
npm test

# 5. Vérifier que le build fonctionne
npm run build
```

**Fréquence recommandée** : vérification mensuelle des mises à jour de sécurité (`npm audit`), mise à jour trimestrielle des dépendances mineures.

### 5.3 Audit de sécurité

```bash
# Vérifier les vulnérabilités connues
npm audit

# Corriger automatiquement les vulnérabilités non-breaking
npm audit fix

# Rapport détaillé
npm audit --json > audit-$(date +%Y%m%d).json
```

---

## 6. Évolutions prévues (Roadmap V2)

### 6.1 Fonctionnalités planifiées

| Priorité | Fonctionnalité | Justification |
|---|---|---|
| Haute | Notifications push (Expo Push Notifications) | Rappels de tâches en temps réel |
| Haute | Historique complet des tâches et assignations | Analyse de tendances à long terme |
| Moyenne | Messagerie interne entre membres du groupe | Réduire la dépendance aux apps externes |
| Moyenne | Multi-groupes avancés (gestion transversale) | Fonctionnalité premium |
| Basse | Version web admin (React + dashboard) | Supervision pour les familles |
| Basse | IA / suggestions automatiques de répartition | Différenciation concurrentielle |

### 6.2 Évolutions techniques

| Priorité | Évolution | Justification |
|---|---|---|
| Haute | Migrations TypeORM (remplacer `synchronize: true`) | Obligatoire avant toute mise en production réelle |
| Haute | Monitoring Sentry ou Prometheus/Grafana | Visibilité sur les erreurs en production |
| Moyenne | Cache Redis pour les insights | Réduire les requêtes DB répétitives |
| Moyenne | Tests E2E sur l'ensemble des endpoints | Compléter la couverture actuelle |
| Basse | WebSockets pour les mises à jour en temps réel | Expérience collaborative améliorée |

### 6.3 Modèle économique (V2 Premium)

| Offre | Prix | Fonctionnalités |
|---|---|---|
| **Gratuit** | 0 €/mois | 1 groupe, tâches partagées, liste de courses, notifications de base |
| **Premium** | 3–5 €/mois | Multi-groupes, statistiques avancées, historique complet, notifications intelligentes |

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
