1️⃣ Architecture globale

ShareLife est conçue en architecture mobile full stack, avec un backend centralisé hébergé sur AWS.

```
[ React Native App ]           [ React Native App ]
  Google Play Store               Apple App Store
        |                               |
        +───────────────────────────────+
                        |
                   HTTPS / JWT
                        |
                        ▼
            [ Route 53 — api.sharelife.app ]
                        |
                        ▼
         [ Application Load Balancer (ALB) ]
           ACM Certificate (TLS terminé ici)
                        |
                        ▼
              [ EC2 t3.small — Ubuntu 22.04 ]
                [ Docker — NestJS 11 :3000 ]
                        |
              +---------+---------+
              |                   |
              ▼                   ▼
   [ Amazon RDS ]         [ CloudWatch Logs ]
   PostgreSQL 15          Métriques + Alarmes SNS
   (subnet privé)
```

Frontend mobile : React Native + Expo, publié sur **Google Play Store** et **Apple App Store** via Expo EAS Build

Backend : NestJS + TypeORM, hébergé sur **EC2**, sécurisé JWT, logique métier, calcul charge utilisateurs

Base de données : **Amazon RDS PostgreSQL 15** (managée, backups automatiques, subnet privé)

Infrastructure : **AWS** (EC2, RDS, ALB, ACM, Route 53, Secrets Manager, CloudWatch)

CI/CD : **GitHub Actions** (lint + tests + build + E2E) → déploiement manuel sur EC2

---

2️⃣ Stack technique

| Côté | Technologie | Utilité |
|---|---|---|
| Frontend | React Native + Expo | Mobile cross-platform, iOS + Android |
| Frontend | React Hook Form | Gestion formulaires et validations |
| Frontend | React Navigation | Navigation entre screens |
| Frontend | Expo EAS Build | Build et publication sur les stores |
| Backend | NestJS 11 | API REST sécurisée, logique métier |
| Backend | TypeORM 0.3 | ORM pour PostgreSQL |
| Backend | JWT / bcryptjs | Authentification sécurisée |
| Backend | class-validator | Validation des DTOs |
| Base de données | Amazon RDS PostgreSQL 15 | Stockage relationnel managé AWS |
| Cloud | AWS EC2 | Hébergement du backend Docker |
| Cloud | AWS ALB + ACM | HTTPS, terminaison TLS |
| Cloud | AWS Route 53 | DNS api.sharelife.app |
| Cloud | AWS Secrets Manager | Variables d'environnement sécurisées |
| Cloud | AWS CloudWatch | Logs, métriques, alarmes |
| DevOps | Docker + Docker Compose | Containerisation du backend |
| CI/CD | GitHub Actions | Tests automatiques (lint + unit + build + E2E) |

---

3️⃣ Sécurité

| Mesure | Détail |
|---|---|
| HTTPS | TLS 1.2/1.3 terminé sur l'ALB avec certificat ACM |
| Authentification | JWT (expiration 1h) + bcryptjs 12 rounds |
| Anti-timing-attack | bcrypt.compare exécuté même si l'utilisateur est inconnu |
| Anti-énumération | Même réponse pour email inconnu et mot de passe incorrect |
| Rate limiting | 30 req/min global, 3–5 req/min sur les routes auth |
| Validation | ValidationPipe global avec whitelist: true |
| Secrets | Variables d'environnement dans AWS Secrets Manager (jamais dans le code) |
| Réseau | RDS dans un subnet privé AWS, non exposé à Internet |
| Rôles | ADMIN / MEMBER par groupe. Mode FUNNY : ForbiddenException si non-admin |

---

4️⃣ Justification des choix techniques

**NestJS vs Express** : NestJS impose une structure modulaire (Controller / Service / Repository) qui rend le code testable unitairement et maintenable sur la durée. Express aurait demandé de recréer cette structure manuellement.

**TypeORM vs Prisma** : TypeORM s'intègre nativement dans l'écosystème NestJS (`@nestjs/typeorm`) et gère les migrations. Prisma aurait nécessité des ajustements supplémentaires pour les tests unitaires avec mocks.

**PostgreSQL vs MongoDB** : Les données de ShareLife (utilisateurs, groupes, tâches, assignations) sont relationnelles et bénéficient des contraintes de clés étrangères et des transactions ACID. MongoDB aurait complexifié les jointures.

**AWS vs VPS** : AWS offre une haute disponibilité (SLA 99,9 %), des backups RDS automatiques, le scaling horizontal facilité, et une intégration native avec CloudWatch pour le monitoring. Un VPS simple aurait nécessité de gérer manuellement les sauvegardes et la surveillance.

**Expo EAS vs React Native CLI** : Expo simplifie le build et la publication sur les deux stores sans nécessiter macOS pour le build iOS. EAS Submit automatise la soumission aux stores.
