import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { TaskTimer } from '../timers/entities/task-timer.entity';

// ── Badge definitions ─────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
}

const BADGE_DEFS: Omit<Badge, 'earned'>[] = [
  {
    id: 'machine_de_guerre',
    label: 'Machine de guerre',
    icon: '🔥',
    description: 'Actif(ve) au moins 5 jours consécutifs',
  },
  {
    id: 'fantome',
    label: 'Fantôme',
    icon: '👻',
    description: 'Aucune tâche faite depuis 7 jours',
  },
  {
    id: 'perfectionniste',
    label: 'Perfectionniste',
    icon: '⭐',
    description: '10 tâches ou plus complétées cette semaine',
  },
  {
    id: 'rapide',
    label: 'Éclair',
    icon: '⚡',
    description: '5 tâches faites en une seule journée',
  },
];

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(TaskTimer)
    private readonly timerRepo: Repository<TaskTimer>,
  ) {}

  async getProfile(userId: string): Promise<{
    streak: number;
    bestStreak: number;
    badges: Badge[];
    totalTasksDone: number;
    totalTimeSeconds: number;
  }> {
    // ── 1. Fetch all DONE assignments with completedAt ────────────────────
    const doneAssignments = await this.assignmentRepo.find({
      where: { user: { id: userId }, status: 'DONE' },
      order: { completedAt: 'ASC' },
    });

    const totalTasksDone = doneAssignments.length;

    // ── 2. Compute streaks ───────────────────────────────────────────────
    const activeDays = new Set<string>();
    for (const a of doneAssignments) {
      if (a.completedAt) {
        activeDays.add(a.completedAt.toISOString().split('T')[0]);
      }
    }
    const { current: streak, best: bestStreak } = this.computeStreaks(activeDays);

    // ── 3. Total time from timers ────────────────────────────────────────
    const timers = await this.timerRepo.find({
      where: { user: { id: userId } },
      select: ['durationSeconds'],
    });
    const totalTimeSeconds = timers.reduce(
      (s, t) => s + (t.durationSeconds ?? 0),
      0,
    );

    // ── 4. Badges ────────────────────────────────────────────────────────
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    // Tasks done this ISO week
    const { week: currentWeek, year: currentYear } = this.isoWeek(now);
    const doneThisWeek = doneAssignments.filter((a) => {
      if (!a.completedAt) return false;
      const { week, year } = this.isoWeek(a.completedAt);
      return week === currentWeek && year === currentYear;
    }).length;

    // Tasks done in last 7 days
    const recentDone = doneAssignments.filter(
      (a) => a.completedAt && a.completedAt >= sevenDaysAgo,
    ).length;

    // Max tasks done in a single day
    const dayCount = new Map<string, number>();
    for (const a of doneAssignments) {
      if (!a.completedAt) continue;
      const day = a.completedAt.toISOString().split('T')[0];
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
    }
    const maxInOneDay = Math.max(0, ...dayCount.values());

    const badges: Badge[] = BADGE_DEFS.map((def) => {
      let earned = false;
      switch (def.id) {
        case 'machine_de_guerre': earned = streak >= 5; break;
        case 'fantome':           earned = recentDone === 0 && totalTasksDone > 0; break;
        case 'perfectionniste':   earned = doneThisWeek >= 10; break;
        case 'rapide':            earned = maxInOneDay >= 5; break;
      }
      return { ...def, earned };
    });

    return { streak, bestStreak, badges, totalTasksDone, totalTimeSeconds };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private computeStreaks(activeDays: Set<string>): {
    current: number;
    best: number;
  } {
    if (activeDays.size === 0) return { current: 0, best: 0 };

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Sorted descending
    const days = Array.from(activeDays).sort().reverse();

    // Current streak starts from today or yesterday
    const start = activeDays.has(today)
      ? today
      : activeDays.has(yesterday)
        ? yesterday
        : null;

    let current = 0;
    if (start) {
      let cursor = new Date(start);
      while (activeDays.has(cursor.toISOString().split('T')[0])) {
        current++;
        cursor = new Date(cursor.getTime() - 86400000);
      }
    }

    // Best streak: iterate sorted ascending
    const asc = Array.from(activeDays).sort();
    let best = 1;
    let run = 1;
    for (let i = 1; i < asc.length; i++) {
      const prev = new Date(asc[i - 1]);
      const curr = new Date(asc[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (Math.round(diff) === 1) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }

    return { current, best };
  }

  private isoWeek(date: Date): { week: number; year: number } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return { week, year: d.getFullYear() };
  }
}
