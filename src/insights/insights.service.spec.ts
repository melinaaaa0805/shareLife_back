import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InsightsService } from './insights.service';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (id = 'user-1', firstName = 'Alice'): User =>
  ({ id, firstName, email: `${firstName.toLowerCase()}@test.com` } as User);

const makeGroup = (overrides: Partial<Group> = {}): Group =>
  ({
    id: 'group-1',
    name: 'Coloc',
    owner: makeUser('user-1', 'Alice'),
    members: [{ user: makeUser('user-2', 'Bob') }],
    ...overrides,
  } as unknown as Group);

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-1',
    title: 'Vaisselle',
    dayOfWeek: 1,
    weekNumber: 22,
    year: 2026,
    weight: 2,
    duration: 30,
    isTemplate: false,
    assignments: [],
    ...overrides,
  } as unknown as Task);

const makeAssignment = (userId: string, status: 'PENDING' | 'DONE'): TaskAssignment =>
  ({ user: makeUser(userId), status } as unknown as TaskAssignment);

const mockTaskRepo = () => ({
  find: jest.fn(),
  manager: { query: jest.fn().mockResolvedValue([]) },
});

const mockAssignmentRepo = () => ({});
const mockGroupRepo = () => ({ findOne: jest.fn() });

describe('InsightsService', () => {
  let service: InsightsService;
  let taskRepo: ReturnType<typeof mockTaskRepo>;
  let groupRepo: ReturnType<typeof mockGroupRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepo },
        { provide: getRepositoryToken(TaskAssignment), useFactory: mockAssignmentRepo },
        { provide: getRepositoryToken(Group), useFactory: mockGroupRepo },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
    taskRepo = module.get(getRepositoryToken(Task));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  // ── NotFoundException ──────────────────────────────────────────────────────

  it('throws NotFoundException quand le groupe est introuvable', async () => {
    groupRepo.findOne.mockResolvedValue(null);
    await expect(service.getInsights('group-x', 22, 2026, 'user-1')).rejects.toThrow(NotFoundException);
  });

  // ── Pas de tâches ─────────────────────────────────────────────────────────

  it('retourne un tableau vide quand il n\'y a aucune tâche cette semaine', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());
    taskRepo.find.mockResolvedValue([]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    expect(result).toEqual([]);
  });

  // ── WEEKLY_SUMMARY — aucune tâche assignée à l'utilisateur ────────────────

  it('génère WEEKLY_SUMMARY avec mention "aucune tâche assignée" si user sans tâche', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());
    taskRepo.find.mockResolvedValue([
      makeTask({ assignments: [makeAssignment('user-2', 'PENDING')] }),
    ]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const summary = result.find((i) => i.type === 'WEEKLY_SUMMARY');
    expect(summary).toBeDefined();
    expect(summary!.body).toContain('Aucune tâche ne t\'est assignée');
  });

  // ── WEEKLY_SUMMARY — toutes les tâches terminées ──────────────────────────

  it('génère WEEKLY_SUMMARY severity=success quand toutes mes tâches sont faites', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());
    taskRepo.find.mockResolvedValue([
      makeTask({ assignments: [makeAssignment('user-1', 'DONE')] }),
    ]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const summary = result.find((i) => i.type === 'WEEKLY_SUMMARY');
    expect(summary).toBeDefined();
    expect(summary!.severity).toBe('success');
  });

  // ── WEEKLY_SUMMARY — tâches en cours ──────────────────────────────────────

  it('génère WEEKLY_SUMMARY avec ratio X/Y quand mes tâches sont en cours', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());
    taskRepo.find.mockResolvedValue([
      makeTask({ id: 't1', assignments: [makeAssignment('user-1', 'DONE')] }),
      makeTask({ id: 't2', assignments: [makeAssignment('user-1', 'PENDING')] }),
    ]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const summary = result.find((i) => i.type === 'WEEKLY_SUMMARY');
    expect(summary!.body).toContain('1/2');
  });

  // ── OVERLOAD_WARNING ───────────────────────────────────────────────────────

  it('génère OVERLOAD_WARNING quand un membre a une charge bien supérieure à la moyenne', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());

    // Bob (user-2) cumule 10 tâches de poids 5 chacune → charge très élevée
    const heavyTasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({
        id: `t${i}`,
        weight: 5,
        duration: 120,
        assignments: [makeAssignment('user-2', 'PENDING')],
      }),
    );
    // Alice (user-1) n'a qu'une seule tâche légère
    const lightTask = makeTask({ id: 'tlight', weight: 1, duration: 10, assignments: [makeAssignment('user-1', 'DONE')] });

    taskRepo.find.mockResolvedValue([...heavyTasks, lightTask]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const overload = result.find((i) => i.type === 'OVERLOAD_WARNING');
    expect(overload).toBeDefined();
    expect(overload!.severity).toBe('warning');
  });

  // ── LATE_TASKS ─────────────────────────────────────────────────────────────

  it('génère LATE_TASKS quand l\'utilisateur a des tâches PENDING d\'un jour déjà passé', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());

    // dayOfWeek=0 (lundi) — ce jour est passé si today >= mardi
    const lateTask = makeTask({
      id: 'late',
      dayOfWeek: 0,
      title: 'Poubelles',
      assignments: [makeAssignment('user-1', 'PENDING')],
    });

    taskRepo.find.mockResolvedValue([lateTask]);
    taskRepo.manager.query.mockResolvedValue([]);

    // Force today = Wednesday JS (getDay()=3 → 0=Sun), giving Mon index 2 in (Mon=0) scheme
    // The service computes todayDow = (new Date().getDay() + 6) % 7
    // getDay()=3 (Wed JS) → todayDow = (3+6)%7 = 2 (Wed in Mon-based scheme)
    // task.dayOfWeek=0 (Mon) < 2 → late
    const getDay = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(3);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    getDay.mockRestore();

    const late = result.find((i) => i.type === 'LATE_TASKS');
    expect(late).toBeDefined();
  });

  // ── TEMPLATE_SUGGESTION ────────────────────────────────────────────────────

  it('génère TEMPLATE_SUGGESTION quand manager.query retourne des titres récurrents', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());
    taskRepo.find.mockResolvedValue([]);
    taskRepo.manager.query.mockResolvedValue([
      { title: 'Vaisselle', weekCount: '3' },
    ]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const template = result.find((i) => i.type === 'TEMPLATE_SUGGESTION');
    expect(template).toBeDefined();
    expect(template!.body).toContain('Vaisselle');
    expect(template!.body).toContain('3 fois');
  });

  // ── REBALANCE_SUGGESTION ───────────────────────────────────────────────────

  it('génère REBALANCE_SUGGESTION quand un membre est surchargé et un autre disponible', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());

    const heavyTasks = Array.from({ length: 12 }, (_, i) =>
      makeTask({ id: `h${i}`, weight: 5, duration: 120, assignments: [makeAssignment('user-2', 'PENDING')] }),
    );
    const lightTask = makeTask({ id: 'l1', weight: 1, duration: 10, assignments: [makeAssignment('user-1', 'DONE')] });
    taskRepo.find.mockResolvedValue([...heavyTasks, lightTask]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const rebalance = result.find((i) => i.type === 'REBALANCE_SUGGESTION');
    expect(rebalance).toBeDefined();
    expect(rebalance!.action?.type).toBe('NAVIGATE_SMART_ASSIGN');
  });

  it('REBALANCE_SUGGESTION : trie les membres non-surchargés pour choisir le plus léger', async () => {
    // Groupe à 3 membres : user-1 (Alice), user-2 (Bob), user-3 (Charlie)
    const threeUserGroup = {
      id: 'group-1',
      name: 'Coloc',
      owner: makeUser('user-1', 'Alice'),
      members: [
        { user: makeUser('user-2', 'Bob') },
        { user: makeUser('user-3', 'Charlie') },
      ],
    } as any;
    groupRepo.findOne.mockResolvedValue(threeUserGroup);

    // user-2 surchargé
    const heavyTasks = Array.from({ length: 15 }, (_, i) =>
      makeTask({ id: `h${i}`, weight: 5, duration: 120, assignments: [makeAssignment('user-2', 'PENDING')] }),
    );
    // user-1 : charge moyenne
    const mediumTask = makeTask({ id: 'm1', weight: 3, duration: 60, assignments: [makeAssignment('user-1', 'PENDING')] });
    // user-3 (Charlie) : charge légère → doit être choisi
    const lightTask = makeTask({ id: 'l1', weight: 1, duration: 5, assignments: [
      { user: makeUser('user-3', 'Charlie'), status: 'PENDING' } as any,
    ]});

    taskRepo.find.mockResolvedValue([...heavyTasks, mediumTask, lightTask]);
    taskRepo.manager.query.mockResolvedValue([]);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');

    const rebalance = result.find((i) => i.type === 'REBALANCE_SUGGESTION');
    expect(rebalance).toBeDefined();
    // Le tri sélectionne Charlie (charge la plus faible parmi les non-surchargés)
    expect(rebalance!.title).toContain('Charlie');
  });

  it('LATE_TASKS : génère un body multi-tâches quand plusieurs tâches sont en retard', async () => {
    groupRepo.findOne.mockResolvedValue(makeGroup());

    const lateTask1 = makeTask({ id: 'l1', dayOfWeek: 0, title: 'Poubelles', assignments: [makeAssignment('user-1', 'PENDING')] });
    const lateTask2 = makeTask({ id: 'l2', dayOfWeek: 1, title: 'Vaisselle', assignments: [makeAssignment('user-1', 'PENDING')] });
    taskRepo.find.mockResolvedValue([lateTask1, lateTask2]);
    taskRepo.manager.query.mockResolvedValue([]);

    // today = jeudi JS (getDay()=4 → todayDow=(4+6)%7=3) → lundi(0) et mardi(1) sont passés
    const getDay = jest.spyOn(Date.prototype, 'getDay').mockReturnValue(4);

    const result = await service.getInsights('group-1', 22, 2026, 'user-1');
    getDay.mockRestore();

    const late = result.find((i) => i.type === 'LATE_TASKS');
    expect(late).toBeDefined();
    expect(late!.body).toContain('en retard sur cette semaine');
  });
});
