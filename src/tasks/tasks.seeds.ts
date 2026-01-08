// task.seed.ts
import { Task } from './entities/task.entity';

export const defaultTasks: Partial<Task>[] = [
  {
    title: 'Faire la vaisselle',
    description: 'Laver et ranger la vaisselle du dîner',
    frequency: 'DAILY',
    weight: 3,
    duration: 15,
  },
  {
    title: 'Sortir les poubelles',
    description: 'Sortir les poubelles avant 19h',
    frequency: 'WEEKLY',
    dayOfWeek: 4, // vendredi
    weight: 4,
    duration: 10,
  },
  {
    title: 'Préparer le repas',
    description: 'Préparer le dîner pour la famille',
    frequency: 'DAILY',
    weight: 5,
    duration: 45,
  },
  {
    title: 'Passer l’aspirateur',
    description: 'Aspirer le salon et la cuisine',
    frequency: 'WEEKLY',
    dayOfWeek: 5, // samedi
    weight: 3,
    duration: 20,
  },
];
