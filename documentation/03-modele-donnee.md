1️⃣ Entités principales
User

id : UUID

email : string unique

password : hashé

firstName : string

role : ADMIN / MEMBER

createdAt : date

Group

id : UUID

name : string

createdAt : date

GroupMember

id : UUID

userId : référence User

groupId : référence Group

role : ADMIN / MEMBER

joinedAt : date

Task

id : UUID

title : string

description : string

weight : 1–5

frequency : ONCE / DAILY / WEEKLY

dueDate : date

groupId : référence Group

createdBy : référence User

createdAt : date

TaskAssignment

id : UUID

taskId : référence Task

userId : référence User

status : PENDING / DONE

completedAt : date

2️⃣ Relations

User ↔ GroupMember ↔ Group : plusieurs utilisateurs par groupe, un utilisateur peut être dans plusieurs groupes

Task ↔ TaskAssignment ↔ User : une tâche peut être assignée à plusieurs utilisateurs, suivi du statut individuel

Calcul dynamique de la charge par utilisateur = somme des poids des tâches PENDING/DONE

3️⃣ Logique métier clé

Gestion de la charge mentale : équilibrer les tâches entre membres

CRUD complet pour les tâches et assignations

Notifications sur tâches à faire / retard

Possibilité d’évolution : statistiques avancées, multi-groupes