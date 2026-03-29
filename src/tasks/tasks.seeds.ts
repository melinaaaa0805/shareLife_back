// task.seed.ts
import { Task } from './entities/task.entity';

export const defaultTasks: Partial<Task>[] = [
  // ── Quotidien ──────────────────────────────────────────────────────────────
  {
    title: 'Préparer le repas',
    description: 'Préparer le dîner pour toute la famille',
    frequency: 'DAILY',
    weight: 4,
    duration: 45,
  },
  {
    title: 'Faire la vaisselle',
    description: 'Laver, sécher et ranger la vaisselle',
    frequency: 'DAILY',
    weight: 3,
    duration: 20,
  },
  {
    title: 'Essuyer les plans de travail',
    description: 'Nettoyer la cuisine après le repas',
    frequency: 'DAILY',
    weight: 1,
    duration: 5,
  },
  {
    title: 'Aérer les pièces',
    description: 'Ouvrir les fenêtres 10 min pour renouveler l\'air',
    frequency: 'DAILY',
    weight: 1,
    duration: 5,
  },
  {
    title: 'Vider le lave-vaisselle',
    description: 'Sortir et ranger la vaisselle propre',
    frequency: 'DAILY',
    weight: 1,
    duration: 10,
  },
  {
    title: 'Ramasser et ranger',
    description: 'Ramasser les affaires traînantes dans les pièces communes',
    frequency: 'DAILY',
    weight: 2,
    duration: 10,
  },
  {
    title: 'Trier le courrier',
    description: 'Ouvrir, trier et archiver le courrier du jour',
    frequency: 'DAILY',
    weight: 1,
    duration: 5,
  },

  // ── Lundi ──────────────────────────────────────────────────────────────────
  {
    title: 'Faire la lessive',
    description: 'Lancer une machine de linge',
    frequency: 'WEEKLY',
    dayOfWeek: 0,
    weight: 2,
    duration: 15,
  },
  {
    title: 'Étendre le linge',
    description: 'Étendre le linge de la machine du matin',
    frequency: 'WEEKLY',
    dayOfWeek: 0,
    weight: 2,
    duration: 15,
  },
  {
    title: 'Plier et ranger le linge',
    description: 'Plier le linge sec et le ranger dans les armoires',
    frequency: 'WEEKLY',
    dayOfWeek: 0,
    weight: 2,
    duration: 20,
  },

  // ── Mardi ──────────────────────────────────────────────────────────────────
  {
    title: 'Passer l\'aspirateur',
    description: 'Aspirer le salon, couloir et chambres',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    weight: 3,
    duration: 30,
  },
  {
    title: 'Dépoussiérer les meubles',
    description: 'Chiffon humide sur meubles, étagères et objets',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    weight: 2,
    duration: 20,
  },
  {
    title: 'Nettoyer les toilettes',
    description: 'Désinfecter et nettoyer les WC',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    weight: 2,
    duration: 10,
  },

  // ── Mercredi ───────────────────────────────────────────────────────────────
  {
    title: 'Faire les courses',
    description: 'Courses de la semaine selon la liste',
    frequency: 'WEEKLY',
    dayOfWeek: 2,
    weight: 4,
    duration: 60,
  },
  {
    title: 'Ranger les courses',
    description: 'Ranger frigo, placards et garde-manger',
    frequency: 'WEEKLY',
    dayOfWeek: 2,
    weight: 2,
    duration: 20,
  },
  {
    title: 'Nettoyer le réfrigérateur',
    description: 'Vérifier les dates, nettoyer les étagères et tiroirs',
    frequency: 'WEEKLY',
    dayOfWeek: 2,
    weight: 2,
    duration: 15,
  },

  // ── Jeudi ──────────────────────────────────────────────────────────────────
  {
    title: 'Nettoyer la salle de bain',
    description: 'Lavabo, baignoire / douche et miroir',
    frequency: 'WEEKLY',
    dayOfWeek: 3,
    weight: 3,
    duration: 25,
  },
  {
    title: 'Nettoyer les vitres et miroirs',
    description: 'Vitres intérieures, miroirs et surfaces vitrées',
    frequency: 'WEEKLY',
    dayOfWeek: 3,
    weight: 2,
    duration: 20,
  },
  {
    title: 'Changer les serviettes et draps',
    description: 'Mettre les serviettes et draps sales à laver',
    frequency: 'WEEKLY',
    dayOfWeek: 3,
    weight: 2,
    duration: 15,
  },

  // ── Vendredi ───────────────────────────────────────────────────────────────
  {
    title: 'Sortir les poubelles',
    description: 'Sortir toutes les poubelles avant 19h',
    frequency: 'WEEKLY',
    dayOfWeek: 4,
    weight: 2,
    duration: 10,
  },
  {
    title: 'Trier et recycler',
    description: 'Trier papiers, plastiques, verre et déchets',
    frequency: 'WEEKLY',
    dayOfWeek: 4,
    weight: 1,
    duration: 10,
  },
  {
    title: 'Nettoyer le four et micro-ondes',
    description: 'Dégraisser l\'intérieur du four et micro-ondes',
    frequency: 'WEEKLY',
    dayOfWeek: 4,
    weight: 3,
    duration: 20,
  },

  // ── Samedi ─────────────────────────────────────────────────────────────────
  {
    title: 'Grand ménage cuisine',
    description: 'Nettoyer électroménager, plans de travail, sol',
    frequency: 'WEEKLY',
    dayOfWeek: 5,
    weight: 4,
    duration: 45,
  },
  {
    title: 'Passer la serpillière',
    description: 'Laver les sols de toute la maison',
    frequency: 'WEEKLY',
    dayOfWeek: 5,
    weight: 3,
    duration: 30,
  },
  {
    title: 'Lessive draps et serviettes',
    description: 'Lancer la machine avec les draps et serviettes',
    frequency: 'WEEKLY',
    dayOfWeek: 5,
    weight: 2,
    duration: 15,
  },
  {
    title: 'Entretenir extérieur / balcon',
    description: 'Balayer terrasse, arroser plantes, désherber',
    frequency: 'WEEKLY',
    dayOfWeek: 5,
    weight: 3,
    duration: 30,
  },

  // ── Dimanche ───────────────────────────────────────────────────────────────
  {
    title: 'Planifier les repas',
    description: 'Choisir les repas de la semaine et préparer la liste de courses',
    frequency: 'WEEKLY',
    dayOfWeek: 6,
    weight: 2,
    duration: 15,
  },
  {
    title: 'Ranger et désencombrer',
    description: 'Ranger jouets, affaires traînantes, vider les sacs',
    frequency: 'WEEKLY',
    dayOfWeek: 6,
    weight: 3,
    duration: 30,
  },
  {
    title: 'Préparer la semaine',
    description: 'Préparer les affaires, vérifier le calendrier famille',
    frequency: 'WEEKLY',
    dayOfWeek: 6,
    weight: 2,
    duration: 20,
  },
  {
    title: 'Nettoyage de la cave / garage',
    description: 'Désencombrer, ranger et nettoyer cave ou garage',
    frequency: 'WEEKLY',
    dayOfWeek: 6,
    weight: 4,
    duration: 60,
  },
];
