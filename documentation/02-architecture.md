1️⃣ Architecture globale

ShareLife est conçue en architecture mobile full stack, avec un backend centralisé sécurisé.

[ React Native App ]
        |
        | HTTPS / JWT
        v
     [ API NestJS ]
        |
        v
    [ PostgreSQL ]
        |
        + Redis (notifications / cache, optionnel)


Frontend mobile : React Native + Expo, gestion UI, navigation, formulaires, notifications

Backend : NestJS + TypeORM/Prisma, sécurisation JWT, logique métier, calcul charge utilisateurs

Base de données : PostgreSQL, relationnelle pour gérer utilisateurs, groupes, tâches et assignations

Cache / notifications (optionnel) : Redis pour stockage temporaire et notifications push

2️⃣ Stack technique
Côté	Technologie	Utilité
Frontend	React Native + Expo	Mobile cross-platform, expérience utilisateur fluide
Frontend	React Hook Form	Gestion formulaires et validations
Frontend	React Navigation	Navigation entre screens
Backend	NestJS	API REST sécurisée, logique métier
Backend	TypeORM / Prisma	ORM pour PostgreSQL
Backend	JWT / bcrypt	Authentification sécurisée
Base	PostgreSQL	Stockage relationnel des données
DevOps	Docker + Docker Compose	Isolation des environnements, reproducibilité
CI/CD	GitHub Actions	Tests et build automatiques
3️⃣ Sécurité

JWT + refresh token pour sécuriser l’accès aux endpoints

Hash des mots de passe avec bcrypt

Validation des entrées avec class-validator

Gestion des rôles (ADMIN / MEMBER) pour groupes

Rate limiting (optionnel) pour prévenir abus

HTTPS pour la communication mobile ↔ backend

Tout choix est défendable pour le jury RNCP : sécurité, industrialisation et évolutivité.