# Plan de correction des bogues — ShareLife Backend

**Version** : 1.0  
**Date** : mai 2026  
**Application** : ShareLife — API REST NestJS 11  

---

## Sommaire

1. [Processus de traitement d'un bogue](#1-processus-de-traitement-dun-bogue)
2. [Niveaux de priorité](#2-niveaux-de-priorité)
3. [Fiche de signalement](#3-fiche-de-signalement)
4. [Journal des bogues connus](#4-journal-des-bogues-connus)
5. [Critères de clôture](#5-critères-de-clôture)
6. [Responsabilités](#6-responsabilités)

---

## 1. Processus de traitement d'un bogue

```
Signalement
    │
    ▼
Qualification (< 24h)
    │  • Reproductible ?
    │  • Priorité assignée
    │
    ▼
Analyse et diagnostic
    │  • Identification de la cause racine
    │  • Impact estimé
    │
    ▼
Correction
    │  • Branche de fix : fix/<id>-description
    │  • Tests unitaires ajoutés ou mis à jour
    │  • Pull request vers develop
    │
    ▼
Vérification (recette)
    │  • Cas de test du cahier de recettes rejoué
    │  • Tests de non-régression
    │
    ▼
Déploiement
    │  • Merge vers main
    │  • CHANGELOG mis à jour (section [Fixed])
    │  • Tag de version si bogue critique
    │
    ▼
Clôture
```

---

## 2. Niveaux de priorité

| Priorité | Libellé | Définition | Délai de correction |
|---|---|---|---|
| **P1** | Critique | L'application est inutilisable pour tous les utilisateurs. Perte de données possible. Faille de sécurité avérée. | < 4 heures |
| **P2** | Majeur | Une fonctionnalité principale est en échec mais une contournement temporaire existe. | < 24 heures |
| **P3** | Mineur | Comportement incorrect sur un cas marginal. Aucun impact sur les fonctionnalités principales. | < 1 semaine |
| **P4** | Cosmétique | Problème d'affichage, de libellé ou de performance sans impact fonctionnel. | À planifier |

---

## 3. Fiche de signalement

Tout bogue doit être documenté avec les informations suivantes avant toute correction :

```
ID           : BUG-AAAA-NNN (ex : BUG-2026-001)
Date         : YYYY-MM-DD
Rapporté par : Prénom Nom
Priorité     : P1 / P2 / P3 / P4
Statut       : Ouvert / En cours / Résolu / Fermé

Titre        : (une ligne, verbe d'action + contexte)

Environnement :
  - OS        : (ex : Ubuntu 22.04 / Windows 10)
  - Node.js   : (ex : 20.11.0)
  - Version   : (ex : 1.0.0 / commit SHA)

Étapes pour reproduire :
  1. ...
  2. ...
  3. ...

Résultat observé :
  ...

Résultat attendu :
  ...

Logs / captures :
  (coller les logs pertinents ou le message d'erreur HTTP)

Cause racine identifiée :
  ...

Correction appliquée :
  Branche : fix/BUG-2026-001-description
  Commit  : (SHA)
  Fichiers modifiés : ...

Date de résolution : YYYY-MM-DD
Testé par          : Prénom Nom
```

---

## 4. Journal des bogues connus

### BUG-2026-001 — `jest.spyOn(bcrypt, 'compare')` échoue avec "Cannot redefine property"

| Champ | Valeur |
|---|---|
| **Date** | 2026-05-29 |
| **Priorité** | P3 |
| **Statut** | ✅ Résolu |
| **Environnement** | Node 20, Jest 30, bcryptjs 3.0.3 |

**Description** : Dans `auth.service.spec.ts`, le test vérifiant que `bcrypt.compare` est toujours appelé même quand l'utilisateur est inexistant échouait avec `TypeError: Cannot redefine property: compare`. bcryptjs est un module CommonJS dont les propriétés sont non-configurables, ce qui empêche `jest.spyOn` de les espionner.

**Cause racine** : `Object.defineProperty` ne peut pas redéfinir une propriété marquée `configurable: false` dans un module CommonJS compilé.

**Correction** : Le test a été réécrit sans espion. Il vérifie l'invariant comportemental (anti-énumération) en comparant les messages d'erreur retournés pour un email inconnu et un mot de passe incorrect — les deux doivent être identiques.

**Fichiers modifiés** : `src/auth/auth.service.spec.ts`  
**Date de résolution** : 2026-05-29

---

### BUG-2026-002 — `Cannot find name 'jest'` à la compilation TypeScript

| Champ | Valeur |
|---|---|
| **Date** | 2026-05-29 |
| **Priorité** | P3 |
| **Statut** | ✅ Résolu |
| **Environnement** | TypeScript 5.7, @types/jest 30 |

**Description** : Les fichiers `*.spec.ts` remontaient l'erreur `TS2304: Cannot find name 'jest'` malgré la présence de `@types/jest` dans `devDependencies`.

**Cause racine** : Le champ `compilerOptions.types` était absent dans `tsconfig.json`. Sans ce champ, TypeScript inclut tous les `@types/*` dans le répertoire `node_modules`, mais la configuration globale de NestJS limitait les types disponibles.

**Correction** : Ajout de `"types": ["jest", "node"]` dans `tsconfig.json`.

**Fichiers modifiés** : `tsconfig.json`  
**Date de résolution** : 2026-05-29

---

### BUG-2026-003 — Apostrophes françaises dans les descriptions de tests

| Champ | Valeur |
|---|---|
| **Date** | 2026-05-30 |
| **Priorité** | P3 |
| **Statut** | ✅ Résolu |
| **Environnement** | ts-jest 29, TypeScript 5.7 |

**Description** : Les chaînes de description de tests contenant des apostrophes françaises (`n'est`, `d'erreur`, `l'utilisateur`) dans des strings délimitées par des guillemets simples `'...'` provoquaient des erreurs de parsing TypeScript et faisaient échouer la compilation des specs.

**Cause racine** : L'apostrophe typographique `'` est interprétée comme la fermeture du littéral de chaîne `'...'`.

**Correction** : Remplacement des apostrophes dans les descriptions de tests (ex. `"nest pas assignee"`, `"d erreur"`) ou passage aux guillemets doubles `"..."`.

**Fichiers modifiés** : `src/tasks/tasks.service.spec.ts`  
**Date de résolution** : 2026-05-30

---

## 5. Critères de clôture

Un bogue est considéré comme **résolu** lorsque les conditions suivantes sont toutes satisfaites :

1. **Reproductibilité** : le cas de test qui déclenchait le bogue ne produit plus l'erreur.
2. **Tests unitaires** : un test Jest couvrant le cas de bogue est présent et passe (ou un test existant a été corrigé).
3. **Non-régression** : tous les tests de la suite passent (`npm test` — 0 échec).
4. **Pipeline CI** : le pipeline GitHub Actions passe intégralement (lint + unit tests + build).
5. **Cahier de recettes** : le cas de test correspondant dans le cahier de recettes est marqué ✅.
6. **CHANGELOG** : la correction est documentée dans une section `[Fixed]` de la version courante.
7. **Revue** : la pull request de correction a été relue et approuvée.

---

## 6. Responsabilités

| Rôle | Responsabilité |
|---|---|
| **Développeur** | Signaler, analyser, corriger et tester le bogue. Mettre à jour le CHANGELOG. |
| **Responsable qualité** | Valider la correction en recette. Mettre à jour le cahier de recettes. Prononcer la clôture. |
| **Chef de projet** | Prioriser les bogues P1/P2. Décider des reports de livraison si nécessaire. |

> Dans le cadre du projet ShareLife (équipe solo), ces trois rôles sont assurés par la même personne. La séparation est maintenue sous forme de checklist afin de garantir la rigueur du processus.

---

*Document rédigé dans le cadre du projet de certification RNCP39583 — ShareLife, mai 2026.*
