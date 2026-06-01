import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { TaskTimer } from '../timers/entities/task-timer.entity';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeAssignment = (completedAt: Date | null, overrides = {}): TaskAssignment =>
  ({
    id: 'assign-1',
    status: 'DONE',
    completedAt,
    user: { id: 'user-1' },
    ...overrides,
  } as unknown as TaskAssignment);

const dayOf = (daysAgo: number): Date => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
};

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('GamificationService', () => {
  let service: GamificationService;
  let assignmentRepo: ReturnType<typeof mockRepo>;
  let timerRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(TaskAssignment), useFactory: mockRepo },
        { provide: getRepositoryToken(TaskTimer), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    assignmentRepo = module.get(getRepositoryToken(TaskAssignment));
    timerRepo = module.get(getRepositoryToken(TaskTimer));
  });

  afterEach(() => jest.clearAllMocks());

  // ── Streak calculation ─────────────────────────────────────────────────────

  describe('getProfile() — streak', () => {
    beforeEach(() => {
      timerRepo.find.mockResolvedValue([]);
    });

    it('returns streak 0 and bestStreak 0 when no tasks done', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const result = await service.getProfile('user-1');
      expect(result.streak).toBe(0);
      expect(result.bestStreak).toBe(0);
    });

    it('returns streak 1 when only one task done today', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(0))]);
      const result = await service.getProfile('user-1');
      expect(result.streak).toBe(1);
    });

    it('returns streak 1 when only task was yesterday', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(1))]);
      const result = await service.getProfile('user-1');
      expect(result.streak).toBe(1);
    });

    it('returns streak 0 when last task was 2 days ago', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(2))]);
      const result = await service.getProfile('user-1');
      expect(result.streak).toBe(0);
    });

    it('returns streak 3 for 3 consecutive days ending today', async () => {
      assignmentRepo.find.mockResolvedValue([
        makeAssignment(dayOf(2), { id: 'a1' }),
        makeAssignment(dayOf(1), { id: 'a2' }),
        makeAssignment(dayOf(0), { id: 'a3' }),
      ]);
      const result = await service.getProfile('user-1');
      expect(result.streak).toBe(3);
      expect(result.bestStreak).toBe(3);
    });

    it('bestStreak reflects the longest historical run', async () => {
      // Streak of 4 days old, then gap, then 2 days recent
      assignmentRepo.find.mockResolvedValue([
        makeAssignment(dayOf(10), { id: 'a1' }),
        makeAssignment(dayOf(9), { id: 'a2' }),
        makeAssignment(dayOf(8), { id: 'a3' }),
        makeAssignment(dayOf(7), { id: 'a4' }),
        // gap
        makeAssignment(dayOf(1), { id: 'a5' }),
        makeAssignment(dayOf(0), { id: 'a6' }),
      ]);
      const result = await service.getProfile('user-1');
      expect(result.bestStreak).toBe(4);
      expect(result.streak).toBe(2);
    });
  });

  // ── Badges ─────────────────────────────────────────────────────────────────

  describe('getProfile() — badges', () => {
    beforeEach(() => {
      timerRepo.find.mockResolvedValue([]);
    });

    it('earns "machine_de_guerre" badge with streak >= 5', async () => {
      const days = [0, 1, 2, 3, 4].map((i) =>
        makeAssignment(dayOf(i), { id: `a${i}` }),
      );
      assignmentRepo.find.mockResolvedValue(days);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'machine_de_guerre');
      expect(badge?.earned).toBe(true);
    });

    it('does not earn "machine_de_guerre" with streak < 5', async () => {
      assignmentRepo.find.mockResolvedValue([
        makeAssignment(dayOf(1), { id: 'a1' }),
        makeAssignment(dayOf(0), { id: 'a2' }),
      ]);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'machine_de_guerre');
      expect(badge?.earned).toBe(false);
    });

    it('earns "fantome" badge when user has done tasks but none in last 7 days', async () => {
      // One task done 10 days ago
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(10))]);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'fantome');
      expect(badge?.earned).toBe(true);
    });

    it('does not earn "fantome" badge when user has recent activity', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(0))]);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'fantome');
      expect(badge?.earned).toBe(false);
    });

    it('does not earn "fantome" badge when user has never done any task', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'fantome');
      expect(badge?.earned).toBe(false);
    });

    it('earns "perfectionniste" badge with >= 10 tasks done this ISO week', async () => {
      const thisWeekTasks = Array.from({ length: 10 }, (_, i) =>
        makeAssignment(dayOf(0), { id: `a${i}` }),
      );
      assignmentRepo.find.mockResolvedValue(thisWeekTasks);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'perfectionniste');
      expect(badge?.earned).toBe(true);
    });

    it('does not earn "perfectionniste" badge with < 10 tasks this week', async () => {
      assignmentRepo.find.mockResolvedValue([makeAssignment(dayOf(0))]);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'perfectionniste');
      expect(badge?.earned).toBe(false);
    });

    it('earns "rapide" badge with >= 5 tasks done in a single day', async () => {
      const sameDayTasks = Array.from({ length: 5 }, (_, i) =>
        makeAssignment(dayOf(0), { id: `a${i}` }),
      );
      assignmentRepo.find.mockResolvedValue(sameDayTasks);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'rapide');
      expect(badge?.earned).toBe(true);
    });

    it('does not earn "rapide" badge with < 5 tasks in a single day', async () => {
      const tasks = Array.from({ length: 4 }, (_, i) =>
        makeAssignment(dayOf(0), { id: `a${i}` }),
      );
      assignmentRepo.find.mockResolvedValue(tasks);
      const { badges } = await service.getProfile('user-1');
      const badge = badges.find((b) => b.id === 'rapide');
      expect(badge?.earned).toBe(false);
    });
  });

  // ── Total time ─────────────────────────────────────────────────────────────

  describe('getProfile() — totalTimeSeconds', () => {
    it('sums duration from all timer sessions', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      timerRepo.find.mockResolvedValue([
        { durationSeconds: 120 },
        { durationSeconds: 300 },
        { durationSeconds: 60 },
      ]);
      const { totalTimeSeconds } = await service.getProfile('user-1');
      expect(totalTimeSeconds).toBe(480);
    });

    it('returns 0 when no timer sessions', async () => {
      assignmentRepo.find.mockResolvedValue([]);
      timerRepo.find.mockResolvedValue([]);
      const { totalTimeSeconds } = await service.getProfile('user-1');
      expect(totalTimeSeconds).toBe(0);
    });
  });

  // ── totalTasksDone ─────────────────────────────────────────────────────────

  describe('getProfile() — totalTasksDone', () => {
    it('counts all DONE assignments', async () => {
      const tasks = Array.from({ length: 7 }, (_, i) =>
        makeAssignment(dayOf(i), { id: `a${i}` }),
      );
      assignmentRepo.find.mockResolvedValue(tasks);
      timerRepo.find.mockResolvedValue([]);
      const { totalTasksDone } = await service.getProfile('user-1');
      expect(totalTasksDone).toBe(7);
    });
  });
});
