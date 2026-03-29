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

  // ── Dimanche ───────────────────────────────────────────────────────────────
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
];
