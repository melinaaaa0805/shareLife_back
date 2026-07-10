import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { TimersService } from './timers.service';
import { TaskTimer } from './entities/task-timer.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';

const mockTimerRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockTaskRepo = () => ({
  findOne: jest.fn(),
});

const makeUser = (): User =>
  ({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User);

const makeTask = (): Task => ({ id: 'task-1', title: 'Vaisselle' } as Task);

const makeTimer = (overrides: Partial<TaskTimer> = {}): TaskTimer => ({
  id: 'timer-1',
  task: makeTask(),
  user: makeUser(),
  startedAt: new Date('2026-06-01T10:00:00Z'),
  endedAt: null,
  durationSeconds: null,
  createdAt: new Date(),
  ...overrides,
} as TaskTimer);

describe('TimersService', () => {
  let service: TimersService;
  let timerRepo: ReturnType<typeof mockTimerRepo>;
  let taskRepo: ReturnType<typeof mockTaskRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimersService,
        { provide: getRepositoryToken(TaskTimer), useFactory: mockTimerRepo },
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepo },
      ],
    }).compile();

    service = module.get<TimersService>(TimersService);
    timerRepo = module.get(getRepositoryToken(TaskTimer));
    taskRepo = module.get(getRepositoryToken(Task));
  });

  afterEach(() => jest.clearAllMocks());

  // ── start ──────────────────────────────────────────────────────────────────

  describe('start()', () => {
    it('throws NotFoundException quand la tâche est introuvable', async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.start('task-x', makeUser())).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException quand un timer est déjà en cours', async () => {
      taskRepo.findOne.mockResolvedValue(makeTask());
      timerRepo.findOne.mockResolvedValue(makeTimer());
      await expect(service.start('task-1', makeUser())).rejects.toThrow(BadRequestException);
    });

    it('crée et retourne un timer démarré', async () => {
      const task = makeTask();
      const user = makeUser();
      const timer = makeTimer();
      taskRepo.findOne.mockResolvedValue(task);
      timerRepo.findOne.mockResolvedValue(null);
      timerRepo.create.mockReturnValue(timer);
      timerRepo.save.mockResolvedValue(timer);

      const result = await service.start('task-1', user) as any;

      expect(timerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ task, user, endedAt: null, durationSeconds: null }),
      );
      expect(timerRepo.save).toHaveBeenCalledWith(timer);
      expect(result).toHaveProperty('id', 'timer-1');
      expect(result).toHaveProperty('isRunning', true);
    });
  });

  // ── stop ───────────────────────────────────────────────────────────────────

  describe('stop()', () => {
    it('throws NotFoundException quand aucun timer en cours', async () => {
      timerRepo.findOne.mockResolvedValue(null);
      await expect(service.stop('task-1', makeUser())).rejects.toThrow(NotFoundException);
    });

    it('stoppe le timer, calcule durationSeconds et le retourne', async () => {
      const startedAt = new Date(Date.now() - 60_000); // 60s ago
      const running = makeTimer({ startedAt, endedAt: null, durationSeconds: null });
      timerRepo.findOne.mockResolvedValue(running);
      timerRepo.save.mockImplementation(async (t: TaskTimer) => t);

      const result = await service.stop('task-1', makeUser()) as any;

      expect(result.durationSeconds).toBeGreaterThanOrEqual(59);
      expect(result.isRunning).toBe(false);
      expect(result.endedAt).not.toBeNull();
    });
  });

  // ── getForTask ─────────────────────────────────────────────────────────────

  describe('getForTask()', () => {
    it('retourne isRunning=false et totalSeconds=0 quand aucun timer', async () => {
      timerRepo.find.mockResolvedValue([]);

      const result = await service.getForTask('task-1', 'user-1') as any;

      expect(result.isRunning).toBe(false);
      expect(result.totalSeconds).toBe(0);
      expect(result.sessions).toBe(0);
    });

    it('retourne isRunning=true quand un timer n\'a pas de endedAt', async () => {
      const running = makeTimer({ endedAt: null, durationSeconds: null });
      timerRepo.find.mockResolvedValue([running]);

      const result = await service.getForTask('task-1', 'user-1') as any;

      expect(result.isRunning).toBe(true);
      expect(result.runningTimerId).toBe('timer-1');
    });

    it('additionne les durationSeconds des sessions terminées', async () => {
      const done1 = makeTimer({ id: 't1', endedAt: new Date(), durationSeconds: 120 });
      const done2 = makeTimer({ id: 't2', endedAt: new Date(), durationSeconds: 80 });
      timerRepo.find.mockResolvedValue([done1, done2]);

      const result = await service.getForTask('task-1', 'user-1') as any;

      expect(result.totalSeconds).toBe(200);
      expect(result.sessions).toBe(2);
      expect(result.isRunning).toBe(false);
    });
  });
});
