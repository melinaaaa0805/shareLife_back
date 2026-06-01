import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { Group } from '../groups/entities/group.entity';

// ── Types ─────────────────────────────────────────────────────────────────────

type InsightType =
  | 'OVERLOAD_WARNING'
  | 'REBALANCE_SUGGESTION'
  | 'WEEKLY_SUMMARY'
  | 'LATE_TASKS'
  | 'TEMPLATE_SUGGESTION';

type InsightSeverity = 'warning' | 'info' | 'success';

interface InsightAction {
  label: string;
  type: 'NAVIGATE_SMART_ASSIGN' | 'NAVIGATE_WEEK_TEMPLATE' | 'NAVIGATE_DAY';
  payload?: Record<string, unknown>;
}

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  icon: string;
  title: string;
  body: string;
  action?: InsightAction;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  async getInsights(
    groupId: string,
    weekNumber: number,
    year: number,
    currentUserId: string,
  ): Promise<Insight[]> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    // All members (owner + members)
    const allMembers: { id: string; firstName: string }[] = [];
    allMembers.push({ id: group.owner.id, firstName: group.owner.firstName });
    for (const gm of group.members) {
      if (!allMembers.find((m) => m.id === gm.user.id)) {
        allMembers.push({ id: gm.user.id, firstName: gm.user.firstName });
      }
    }

    // Fetch this week's tasks with assignments
    const tasks = await this.taskRepo.find({
      where: { group: { id: groupId }, weekNumber, year, isTemplate: false },
      relations: ['assignments', 'assignments.user'],
    });

    const insights: Insight[] = [];

    // ── 1. Weekly summary ───────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) =>
      t.assignments?.some((a) => a.status === 'DONE'),
    ).length;

    const myTasks = tasks.filter((t) =>
      t.assignments?.some((a) => (a.user as any)?.id === currentUserId),
    );
    const myDoneTasks = myTasks.filter((t) =>
      t.assignments?.some(
        (a) => (a.user as any)?.id === currentUserId && a.status === 'DONE',
      ),
    );

    if (totalTasks > 0) {
      const groupPct = Math.round((doneTasks / totalTasks) * 100);
      const myContribPct =
        doneTasks > 0
          ? Math.round((myDoneTasks.length / doneTasks) * 100)
          : 0;
      const myTaskPct =
        myTasks.length > 0
          ? Math.round((myDoneTasks.length / myTasks.length) * 100)
          : 0;

      let summaryBody = '';
      let summarySeverity: InsightSeverity = 'info';

      if (myTasks.length === 0) {
        summaryBody = `Aucune tâche ne t'est assignée cette semaine (${groupPct}% du groupe avancé).`;
      } else if (myTaskPct === 100) {
        summaryBody = `Toutes tes tâches sont faites ! Tu as contribué à ${myContribPct}% de l'avancement du groupe.`;
        summarySeverity = 'success';
      } else {
        summaryBody = `${myDoneTasks.length}/${myTasks.length} tâches faites · tu représentes ${myContribPct}% de l'avancement du groupe (${groupPct}% au total).`;
      }

      insights.push({
        id: 'weekly-summary',
        type: 'WEEKLY_SUMMARY',
        severity: summarySeverity,
        icon: '📊',
        title: 'Résumé de la semaine',
        body: summaryBody,
      });
    }

    // ── 2. Load per member ──────────────────────────────────────────────────
    const loadMap = new Map<string, number>();
    for (const m of allMembers) loadMap.set(m.id, 0);

    for (const task of tasks) {
      for (const assignment of task.assignments ?? []) {
        const uid = (assignment.user as any)?.id as string;
        if (uid && loadMap.has(uid)) {
          const w = task.weight ?? 1;
          const d = Math.min(task.duration ?? 30, 120);
          loadMap.set(uid, (loadMap.get(uid) ?? 0) + w * (1 + d / 60));
        }
      }
    }

    const loads = Array.from(loadMap.entries()).map(([id, load]) => ({
      id,
      firstName: allMembers.find((m) => m.id === id)?.firstName ?? '?',
      load,
    }));

    const membersWithTasks = loads.filter((m) => m.load > 0);

    if (membersWithTasks.length >= 2) {
      const avgLoad =
        membersWithTasks.reduce((s, m) => s + m.load, 0) /
        membersWithTasks.length;

      const OVERLOAD_THRESHOLD = 8;
      const OVERLOAD_RATIO = 1.6;

      const overloaded = membersWithTasks.filter(
        (m) =>
          m.load > avgLoad * OVERLOAD_RATIO && m.load >= OVERLOAD_THRESHOLD,
      );

      for (const over of overloaded) {
        const isMe = over.id === currentUserId;
        insights.push({
          id: `overload-${over.id}`,
          type: 'OVERLOAD_WARNING',
          severity: 'warning',
          icon: '⚠️',
          title: isMe ? 'Tu es surchargé(e)' : `${over.firstName} est surchargé(e)`,
          body: `Charge de ${over.load.toFixed(1)} pts contre une moyenne de ${avgLoad.toFixed(1)} pts.`,
          action: {
            label: 'Répartir intelligemment',
            type: 'NAVIGATE_SMART_ASSIGN',
            payload: { groupId },
          },
        });
      }

      // Rebalance suggestion: lightest eligible member ≠ overloaded
      if (overloaded.length > 0) {
        const overloadedIds = new Set(overloaded.map((m) => m.id));
        const lightest = loads
          .filter((m) => !overloadedIds.has(m.id))
          .sort((a, b) => a.load - b.load)[0];

        if (lightest) {
          insights.push({
            id: `rebalance-${lightest.id}`,
            type: 'REBALANCE_SUGGESTION',
            severity: 'info',
            icon: '💡',
            title: `Rééquilibrer avec ${lightest.firstName} ?`,
            body: `${lightest.firstName} a une charge de ${lightest.load.toFixed(1)} pts, il/elle peut prendre des tâches.`,
            action: {
              label: 'Lancer la répartition auto',
              type: 'NAVIGATE_SMART_ASSIGN',
              payload: { groupId },
            },
          });
        }
      }
    }

    // ── 3. Late tasks (assigned to me, PENDING, day already passed) ─────────
    const todayDow = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
    const lateTasks = tasks.filter(
      (t) =>
        t.dayOfWeek < todayDow &&
        t.assignments?.some(
          (a) => (a.user as any)?.id === currentUserId && a.status === 'PENDING',
        ),
    );

    if (lateTasks.length > 0) {
      insights.push({
        id: 'late-tasks',
        type: 'LATE_TASKS',
        severity: 'warning',
        icon: '⏰',
        title: `${lateTasks.length} tâche${lateTasks.length > 1 ? 's' : ''} en retard`,
        body:
          lateTasks.length === 1
            ? `"${lateTasks[0].title}" était prévue ${this.dowLabel(lateTasks[0].dayOfWeek)} et n'est pas encore faite.`
            : `${lateTasks.map((t) => `"${t.title}"`).join(', ')} sont en retard sur cette semaine.`,
        action: {
          label: 'Voir les tâches',
          type: 'NAVIGATE_DAY',
          payload: { date: lateTasks[0].date ?? undefined },
        },
      });
    }

    // ── 4. Template suggestions (tasks done 2+ times same title) ────────────
    const templateRows: { title: string; weekCount: string }[] =
      await this.taskRepo.manager.query(
        `
      SELECT t.title, COUNT(DISTINCT t."weekNumber") AS "weekCount"
      FROM task t
      JOIN task_assignment ta ON ta."taskId" = t.id
      JOIN "group" g ON t."groupId" = g.id
      WHERE g.id = $1
        AND t."isTemplate" = false
        AND ta.status = 'DONE'
        AND NOT (t."weekNumber" = $2 AND t."year" = $3)
      GROUP BY t.title
      HAVING COUNT(DISTINCT t."weekNumber") >= 2
      ORDER BY "weekCount" DESC
      LIMIT 2
    `,
        [groupId, weekNumber, year],
      );

    for (const row of templateRows) {
      const count = parseInt(row.weekCount, 10);
      insights.push({
        id: `template-${row.title}`,
        type: 'TEMPLATE_SUGGESTION',
        severity: 'info',
        icon: '📋',
        title: `Transformer en template ?`,
        body: `"${row.title}" a été faite ${count} fois sur les semaines précédentes. En faire un template gagnerait du temps.`,
        action: {
          label: 'Gérer les templates',
          type: 'NAVIGATE_WEEK_TEMPLATE',
        },
      });
    }

    return insights;
  }

  private dowLabel(dow: number): string {
    const labels = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    return labels[dow] ?? `jour ${dow}`;
  }
}
