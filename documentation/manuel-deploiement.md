# Manuel de déploiement — ShareLife Backend

**Version** : 1.0  
**Date** : mai 2026  
**Application** : ShareLife — API REST NestJS 11  
**Environnements couverts** : développement local, recette, production  

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Déploiement local — avec Docker (recommandé)](#3-déploiement-local--avec-docker-recommandé)
4. [Déploiement local — sans Docker](#4-déploiement-local--sans-docker)
5. [Déploiement en production — AWS](#5-déploiement-en-production--aws)
6. [Migrations de base de données](#6-migrations-de-base-de-données)
7. [Mise à jour de l'application](#7-mise-à-jour-de-lapplication)
8. [Vérification du déploiement](#8-vérification-du-déploiement)
9. [Sauvegarde et restauration](#9-sauvegarde-et-restauration)
10. [Publication de l'application mobile](#10-publication-de-lapplication-mobile)
11. [Résolution des problèmes courants](#11-résolution-des-problèmes-courants)

---

## 1. Prérequis

### Logiciels requis

| Logiciel | Version minimale | Utilité |
|---|---|---|
| Node.js | 20 LTS | Exécution du serveur NestJS |
| npm | 10 | Gestionnaire de paquets |
| PostgreSQL | 15 | Base de données relationnelle |
| Docker | 24 | Conteneurisation (recommandé) |
| Docker Compose | 2.x | Orchestration des services |
| Git | 2.x | Récupération des sources |

### Ressources serveur minimales (production)

| Ressource | Minimum recommandé |
|---|---|
| CPU | 1 vCPU |
| RAM | 1 Go |
| Disque | 10 Go |
| OS | Ubuntu 22.04 LTS ou Debian 12 |

---

## 2. Variables d'environnement

Créer un fichier `.env` à la racine de `shareLife_back/`. Ce fichier ne doit **jamais** être versionné (il est dans `.gitignore`).

```env
# ── Base de données ───────────────────────────────────────────
DB_HOST=localhost          # "db" en environnement Docker Compose
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=MotDePasseForte2026!
DB_NAME=sharelife_db

# ── Authentification JWT ──────────────────────────────────────
JWT_SECRET=remplacez_par_une_chaine_aleatoire_longue_et_unique

# ── Serveur ───────────────────────────────────────────────────
PORT=3000
NODE_ENV=production        # "development" en local

# ── SMTP (réinitialisation de mot de passe) ───────────────────
MAIL_HOST=smtp.votre-fournisseur.com
MAIL_PORT=587
MAIL_USER=noreply@votre-domaine.com
MAIL_PASS=mot_de_passe_smtp
```

> **Sécurité** : `JWT_SECRET` doit être généré avec une commande comme `openssl rand -base64 64`. Ne jamais utiliser la valeur d'exemple ci-dessus en production.

---

## 3. Déploiement local — avec Docker (recommandé)

Cette méthode démarre simultanément l'API NestJS et une instance PostgreSQL 15, sans rien installer localement hormis Docker.

### 3.1 Cloner le dépôt

```bash
git clone <url-du-depot>
cd sharelife/shareLife_back
```

### 3.2 Créer le fichier `.env`

Copier le modèle de la section 2 et adapter les valeurs.

### 3.3 Lancer les services

```bash
docker compose up --build
```

Le flag `--build` reconstruit l'image à partir du `Dockerfile`. À utiliser après toute modification du `package.json` ou du `Dockerfile`.

**Services démarrés :**

| Service | Port exposé | Description |
|---|---|---|
| `backend` | 3000 | API NestJS (hot-reload activé) |
| `db` | 5432 | PostgreSQL 15 |

### 3.4 Vérifier que l'API répond

```bash
curl http://localhost:3000/auth/me
# Réponse attendue : HTTP 401 (non authentifié → API opérationnelle)
```

### 3.5 Arrêter les services

```bash
docker compose down          # arrête les containers sans supprimer les volumes
docker compose down -v       # arrête ET supprime les données PostgreSQL
```

---

## 4. Déploiement local — sans Docker

### 4.1 Prérequis

PostgreSQL 15 doit être installé et démarré localement. Créer la base de données :

```sql
CREATE DATABASE sharelife_db;
```

### 4.2 Installation des dépendances

```bash
cd shareLife_back
npm install
```

### 4.3 Configuration

Créer le fichier `.env` (section 2) avec `DB_HOST=localhost`.

### 4.4 Démarrage

```bash
# Mode développement (hot-reload)
npm run start:dev

# Mode production (nécessite un build préalable)
npm run build
npm run start:prod
```

---

## 5. Déploiement en production — AWS

### 5.1 Architecture AWS cible

```
Internet
    │ HTTPS (443)
    ▼
Application Load Balancer (ALB)
    │ ACM certificate (api.sharelife.app)
    │ HTTP interne (3000)
    ▼
EC2 t3.small — Ubuntu 22.04
    │ Docker (NestJS backend)
    │
    ▼
Amazon RDS — PostgreSQL 15
    (subnet privé, pas exposé à Internet)

Route 53 → api.sharelife.app → ALB
AWS Secrets Manager → variables d'environnement
CloudWatch → logs + métriques
```

**Services AWS utilisés :**

| Service AWS | Utilité | Coût estimé |
|---|---|---|
| EC2 t3.small | Exécution du backend Docker | ~15 €/mois |
| RDS db.t3.micro (PostgreSQL 15) | Base de données managée | ~15 €/mois |
| Application Load Balancer | HTTPS, terminaison TLS | ~20 €/mois |
| ACM (Certificate Manager) | Certificat TLS gratuit | Gratuit |
| Route 53 | DNS `api.sharelife.app` | ~0,50 €/mois |
| Secrets Manager | Variables d'environnement sécurisées | ~0,50 €/mois |
| CloudWatch | Logs et monitoring | ~2 €/mois |

---

### 5.2 Créer l'instance EC2

1. **Console AWS** → EC2 → Lancer une instance
   - AMI : Ubuntu Server 22.04 LTS
   - Type : `t3.small` (2 vCPU, 2 Go RAM)
   - Stockage : 20 Go gp3
   - Groupe de sécurité :
     - Port 22 (SSH) — restreint à ton IP
     - Port 3000 (HTTP) — depuis le Security Group de l'ALB uniquement

2. **Elastic IP** → Associer à l'instance pour avoir une IP fixe

3. **Se connecter et préparer l'instance :**

```bash
ssh -i sharelife-key.pem ubuntu@<ELASTIC_IP>

# Installation Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
```

---

### 5.3 Créer la base de données RDS

1. **Console AWS** → RDS → Créer une base de données
   - Moteur : PostgreSQL 15
   - Modèle : Free tier (`db.t3.micro`) ou `db.t3.small` en production
   - Identifiant de base : `sharelife_db`
   - Utilisateur principal : `postgres`
   - Mot de passe : générer un mot de passe fort
   - VPC : même VPC que l'EC2
   - Accès public : **Non** (accès uniquement depuis le VPC)
   - Groupe de sécurité : autoriser le port 5432 depuis le Security Group EC2

2. **Récupérer l'endpoint RDS** (ex : `sharelife-db.xxxxxxx.eu-west-3.rds.amazonaws.com`)

---

### 5.4 Stocker les secrets dans AWS Secrets Manager

```bash
# Créer un secret pour les variables d'environnement
aws secretsmanager create-secret \
  --name "sharelife/prod" \
  --secret-string '{
    "DB_HOST": "sharelife-db.xxxxxxx.eu-west-3.rds.amazonaws.com",
    "DB_PORT": "5432",
    "DB_USER": "postgres",
    "DB_PASSWORD": "MotDePasseForte2026!",
    "DB_NAME": "sharelife_db",
    "JWT_SECRET": "votre_secret_jwt_64_caracteres",
    "MAIL_HOST": "smtp.votre-fournisseur.com",
    "MAIL_PORT": "587",
    "MAIL_USER": "noreply@sharelife.app",
    "MAIL_PASS": "mot_de_passe_smtp"
  }'
```

Sur l'EC2, récupérer les secrets et créer le `.env` :

```bash
aws secretsmanager get-secret-value \
  --secret-id "sharelife/prod" \
  --query SecretString \
  --output text | jq -r 'to_entries[] | "\(.key)=\(.value)"' > /opt/sharelife/.env

echo "NODE_ENV=production" >> /opt/sharelife/.env
echo "PORT=3000" >> /opt/sharelife/.env
```

---

### 5.5 Créer le `Dockerfile.prod` et déployer

Sur l'EC2, créer `Dockerfile.prod` à la racine du backend :

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

Créer `docker-compose.prod.yml` (sans service `db` — RDS gère la base) :

```yaml
version: '3.9'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: sharelife_backend
    restart: always
    ports:
      - '3000:3000'
    env_file: /opt/sharelife/.env
```

Déployer :

```bash
cd /opt/sharelife/shareLife_back
git clone <url-du-depot> .
docker compose -f docker-compose.prod.yml up -d --build
```

---

### 5.6 Configurer l'ALB et le certificat HTTPS

1. **ACM** → Demander un certificat public pour `api.sharelife.app` → Validation DNS via Route 53 (automatique)

2. **EC2** → Load Balancers → Créer un ALB :
   - Schéma : Internet-facing
   - Listener HTTPS (443) → Target Group → EC2 port 3000
   - Certificat : sélectionner le certificat ACM créé

3. **Route 53** → Créer un enregistrement A (Alias) :
   - Nom : `api.sharelife.app`
   - Cible : ARN de l'ALB

L'API est ensuite accessible sur `https://api.sharelife.app`.

---

### 5.7 Configurer CloudWatch Logs

Dans `docker-compose.prod.yml`, ajouter le driver CloudWatch :

```yaml
services:
  backend:
    logging:
      driver: awslogs
      options:
        awslogs-region: eu-west-3
        awslogs-group: /sharelife/backend
        awslogs-stream: production
```

Créer le log group dans CloudWatch :

```bash
aws logs create-log-group --log-group-name /sharelife/backend --region eu-west-3
```

Les logs sont ensuite consultables dans **CloudWatch → Log groups → /sharelife/backend**.

---

## 6. Migrations de base de données

> **Important** : le projet utilise `synchronize: true` en développement. Ce mode est **interdit en production** car il peut supprimer des colonnes lors d'un changement d'entité. En production, utiliser les migrations TypeORM.

### 6.1 Générer une migration

Après toute modification d'une entité (`*.entity.ts`) :

```bash
npm run build
npx typeorm migration:generate src/migrations/NomDeLaMigration -d src/config/typeorm.config.ts
```

### 6.2 Appliquer les migrations

```bash
npx typeorm migration:run -d src/config/typeorm.config.ts
```

### 6.3 Annuler la dernière migration

```bash
npx typeorm migration:revert -d src/config/typeorm.config.ts
```

### 6.4 Désactiver `synchronize` en production

Dans `src/config/typeorm.config.ts`, s'assurer que :

```typescript
synchronize: process.env.NODE_ENV !== 'production',
```

---

## 7. Mise à jour de l'application

### 7.1 Récupérer les nouvelles sources

```bash
cd /opt/sharelife
git pull origin main
```

### 7.2 Mettre à jour les dépendances (si `package.json` a changé)

```bash
cd shareLife_back
npm ci
```

### 7.3 Appliquer les migrations de base de données

```bash
npx typeorm migration:run -d src/config/typeorm.config.ts
```

### 7.4 Reconstruire et redémarrer

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

L'option `-d` relance les containers en arrière-plan. Si seul le code a changé (pas le `Dockerfile`), le rebuild est rapide grâce au cache Docker.

### 7.5 Vérifier l'état des services après mise à jour

```bash
docker compose ps
docker compose logs backend --tail 50
```

---

## 8. Vérification du déploiement

### 8.1 Contrôles à effectuer après chaque déploiement

| Contrôle | Commande / URL | Résultat attendu |
|---|---|---|
| API démarrée | `curl http://localhost:3000/auth/me` | HTTP 401 |
| Base de données connectée | `docker compose logs backend` | `Nest application successfully started` |
| Inscription utilisateur | `POST /auth/register` | HTTP 201 + token JWT |
| Connexion utilisateur | `POST /auth/login` | HTTP 200 + token JWT |
| Endpoint protégé | `GET /auth/me` avec Bearer token | HTTP 200 + profil |

### 8.2 Documentation Swagger

L'interface Swagger est disponible en développement à l'adresse :

```
http://localhost:3000/api
```

Elle permet de tester tous les endpoints directement depuis le navigateur.

### 8.3 Vérifier les logs en temps réel

```bash
# Logs de l'API
docker compose logs -f backend

# Logs PostgreSQL
docker compose logs -f db
```

---

## 9. Sauvegarde et restauration

### 9.1 Sauvegarde de la base de données

```bash
# Dump complet au format SQL
docker exec sharelife_db pg_dump -U postgres sharelife_db > backup_$(date +%Y%m%d_%H%M).sql
```

Automatiser cette commande via un cron (toutes les nuits à 2h00) :

```bash
crontab -e
# Ajouter la ligne :
0 2 * * * docker exec sharelife_db pg_dump -U postgres sharelife_db > /opt/backups/sharelife_$(date +\%Y\%m\%d).sql
```

### 9.2 Restauration de la base de données

```bash
# Restaurer depuis un fichier de sauvegarde
docker exec -i sharelife_db psql -U postgres sharelife_db < backup_20260525_020000.sql
```

> **Attention** : la restauration écrase les données existantes. Toujours faire une sauvegarde avant de restaurer.

---

## 10. Publication de l'application mobile

L'application frontend est développée avec **React Native + Expo**. La publication sur les stores utilise **Expo EAS Build** (Expo Application Services).

### 10.1 Prérequis

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à son compte Expo
eas login
```

Configurer l'URL de production de l'API dans le frontend (variable d'environnement ou fichier de config) :

```
API_URL=https://api.sharelife.app
```

### 10.2 Configuration EAS

À la racine du projet frontend, initialiser EAS :

```bash
eas build:configure
```

Cela crée `eas.json` :

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### 10.3 Publication sur le Google Play Store

**Prérequis** : compte Google Play Console (25 $ une fois).

```bash
# Build Android (AAB — Android App Bundle)
eas build --platform android --profile production
```

EAS compile le fichier `.aab` dans le cloud. Une fois prêt (10–20 min) :

1. **Google Play Console** → Créer une application → Nom : ShareLife
2. **Production** → Créer une version → Importer le `.aab` téléchargé
3. Remplir la fiche store :
   - Description courte : "Réduisez la charge mentale, partagez les tâches du quotidien"
   - Captures d'écran (obligatoire : téléphone 16:9, tablette optionnelle)
   - Icône 512×512 px
   - Classification du contenu : PEGI 3
4. Soumettre pour examen → délai : 1–3 jours ouvrés

**Mises à jour ultérieures :**

```bash
# Incrémenter versionCode dans app.json, puis :
eas build --platform android --profile production
eas submit --platform android
```

---

### 10.4 Publication sur l'App Store (Apple)

**Prérequis** : compte Apple Developer Program (99 $/an).

```bash
# Build iOS (IPA)
eas build --platform ios --profile production
```

1. **App Store Connect** → Nouvelle application → Nom : ShareLife
2. **TestFlight** (optionnel) : tester l'IPA en interne avant soumission
3. **App Store** → Nouvelle version → Importer l'IPA via EAS Submit :
   ```bash
   eas submit --platform ios
   ```
4. Remplir la fiche store :
   - Description : 4 000 caractères max
   - Captures d'écran : iPhone 6,5" (obligatoire) + iPad (si compatible)
   - Icône 1024×1024 px (sans transparence)
   - Classification : 4+
   - Mentions de confidentialité (RGPD) : déclarer les données collectées
5. Soumettre pour examen → délai : 1–7 jours ouvrés

**Mises à jour ultérieures :**

```bash
# Incrémenter buildNumber dans app.json, puis :
eas build --platform ios --profile production
eas submit --platform ios
```

---

### 10.5 Mises à jour OTA (Over The Air)

Pour les changements JavaScript uniquement (sans modification native), Expo Upd ates permet de déployer sans passer par la revue des stores :

```bash
eas update --branch production --message "Fix: correction du calcul de charge"
```

> Les mises à jour OTA sont limitées au code JavaScript. Tout changement de dépendance native (permissions, SDK) nécessite un nouveau build complet soumis aux stores.

---

## 11. Résolution des problèmes courants

### L'API ne démarre pas — erreur de connexion à la base de données

**Symptôme** : `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Causes et solutions** :
- En Docker Compose, `DB_HOST` doit valoir `db` (nom du service), pas `localhost`.
- Vérifier que le service `db` est bien démarré : `docker compose ps`.
- Attendre quelques secondes que PostgreSQL soit prêt avant que NestJS tente la connexion.

### Port 3000 déjà utilisé

**Symptôme** : `Error: listen EADDRINUSE: address already in use :::3000`

```bash
# Identifier le processus qui utilise le port
sudo lsof -i :3000
# Tuer le processus (remplacer <PID> par l'identifiant trouvé)
kill -9 <PID>
```

### Erreur `FATAL: role "postgres" does not exist`

PostgreSQL n'a pas été initialisé avec les bonnes variables d'environnement. Supprimer le volume et relancer :

```bash
docker compose down -v
docker compose up --build
```

### Les migrations échouent

**Symptôme** : `QueryFailedError: relation "xxx" already exists`

La migration tente de créer une table déjà présente (conflit entre `synchronize: true` et les migrations). Solution : désactiver `synchronize` avant d'utiliser les migrations, ou générer une migration depuis l'état actuel de la base.

### Le token JWT est rejeté (`401 Unauthorized`)

- Vérifier que `JWT_SECRET` est identique entre l'environnement qui a généré le token et celui qui le valide.
- Vérifier l'expiration du token (1 heure par défaut) : regénérer un token via `POST /auth/login`.

### L'e-mail de reset de mot de passe n'arrive pas

- Vérifier les variables `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`.
- S'assurer que le port SMTP (587) n'est pas bloqué par le pare-feu du serveur.
- Consulter les logs NestJS : `docker compose logs backend | grep mail`.

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
