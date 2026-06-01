import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import { NotFoundException } from '@nestjs/common';
import { Frequency } from './enums/frequency.enum';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeGroup = (overrides = {}): Group =>
  ({ id: 'group-uuid-1', name: 'Coloc Paris', mode: 'FREE', ...overrides } as Group);

const makeUser = (overrides = {}): User =>
  ({ id: 'user-uuid-1', email: 'alice@example.com', firstName: 'Alice', ...overrides } as User);

const makeTask = (overrides = {}): Task =>
  ({
    id: 'task-uuid-1',
    title: 'Faire la vaisselle',
    description: null,
    frequency: Frequency.ONCE,
    weekNumber: 22,
    year: 2026,
    dayOfWeek: 0,
    weight: 2,
    duration: 30,
    date: '2026-05-25',
    isTemplate: false,
    taskType: 'FAMILY',
    assignments: [],
    group: makeGroup(),
    createdBy: makeUser(),
    ...overrides,
  } as unknown as Task);

const mockTaskRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  manager: { delete: jest.fn(), query: jest.fn() },
});

const mockGroupRepo = () => ({ findOne: jest.fn() });
const mockUserRepo = () => ({ findOne: jest.fn() });
const mockGroupsService = {};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: ReturnType<typeof mockTaskRepo>;
  let groupRepo: ReturnType<typeof mockGroupRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useFactory: mockTaskRepo },
        { provide: getRepositoryToken(Group), useFactory: mockGroupRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: GroupsService, useValue: mockGroupsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepo = module.get(getRepositoryToken(Task));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    const baseDto = {
      title: 'Faire la vaisselle',
      frequency: Frequency.ONCE,
      weekNumber: 22,
      year: 2026,
      dayOfWeek: 0,
      date: '2026-05-25',
      weight: 2,
      duration: 30,
      taskType: 'FAMILY',
    };

    it('cree une tache ONCE et la sauvegarde', async () => {
      const group = makeGroup();
      const user = makeUser();
      const task = makeTask();
      groupRepo.findOne.mockResolvedValue(group);
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue([task]);

      const result = await service.create(baseDto as any, group.id, user);

      expect(groupRepo.findOne).toHaveBeenCalledWith({ where: { id: group.id } });
      expect(taskRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual([task]);
    });

    it('cree 7 taches pour une frequence DAILY (une par jour de la semaine)', async () => {
      const group = makeGroup();
      const user = makeUser();
      groupRepo.findOne.mockResolvedValue(group);
      taskRepo.create.mockImplementation((data: any) => ({ ...data }));
      taskRepo.save.mockImplementation(async (tasks: any[]) => tasks);

      const dailyDto = { ...baseDto, frequency: Frequency.DAILY };
      const result = await service.create(dailyDto as any, group.id, user);

      expect(result).toHaveLength(7);
      const days = (result as any[]).map((t: any) => t.dayOfWeek);
      expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('leve NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(baseDto as any, 'groupe-inexistant', makeUser()),
      ).rejects.toThrow(NotFoundException);
      expect(taskRepo.save).not.toHaveBeenCalled();
    });

    it('assigne le groupe et le createur a la tache', async () => {
      const group = makeGroup();
      const user = makeUser();
      groupRepo.findOne.mockResolvedValue(group);
      let capturedData: any = null;
      taskRepo.create.mockImplementation((data: any) => {
        capturedData = data;
        return data;
      });
      taskRepo.save.mockResolvedValue([capturedData]);

      await service.create(baseDto as any, group.id, user);

      expect(capturedData).toMatchObject({ group, createdBy: user, isTemplate: false });
    });
  });

  // ── findAllByGroupAndWeek() ───────────────────────────────────────────────

  describe('findAllByGroupAndWeek()', () => {
    it('retourne les taches mappees avec les donnees necessaires au frontend', async () => {
      const assignment = { status: 'PENDING', user: { id: 'user-1', firstName: 'Alice', email: 'alice@example.com' } };
      const task = makeTask({ assignments: [assignment] });
      taskRepo.find.mockResolvedValue([task]);

      const result = await service.findAllByGroupAndWeek('group-uuid-1', 22, 2026);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: task.id,
        title: task.title,
        done: false,
        assignedUser: { id: 'user-1', firstName: 'Alice' },
      });
    });

    it('retourne done: true si la premiere assignation est DONE', async () => {
      const assignment = { status: 'DONE', user: { id: 'user-1', firstName: 'Alice', email: 'alice@example.com' } };
      const task = makeTask({ assignments: [assignment] });
      taskRepo.find.mockResolvedValue([task]);

      const result = await service.findAllByGroupAndWeek('group-uuid-1', 22, 2026);

      expect(result[0].done).toBe(true);
    });

    it('retourne assignedUser null si la tache nest pas assignee', async () => {
      const task = makeTask({ assignments: [] });
      taskRepo.find.mockResolvedValue([task]);

      const result = await service.findAllByGroupAndWeek('group-uuid-1', 22, 2026);

      expect(result[0].assignedUser).toBeNull();
    });

    it('retourne un tableau vide si aucune tache nexiste pour cette semaine', async () => {
      taskRepo.find.mockResolvedValue([]);

      const result = await service.findAllByGroupAndWeek('group-uuid-1', 22, 2026);

      expect(result).toEqual([]);
    });
  });

  // ── patch() ───────────────────────────────────────────────────────────────

  describe('patch()', () => {
    it('met a jour les champs fournis et sauvegarde', async () => {
      const task = makeTask();
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.save.mockImplementation(async (t: Task) => t);

      const result = await service.patch(task.id, { title: 'Nouveau titre', weight: 4 });

      expect(result.title).toBe('Nouveau titre');
      expect(result.weight).toBe(4);
      expect(taskRepo.save).toHaveBeenCalledTimes(1);
    });

    it('ne modifie pas les champs non fournis', async () => {
      const task = makeTask({ weight: 2, duration: 30 });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.save.mockImplementation(async (t: Task) => t);

      const result = await service.patch(task.id, { title: 'Autre titre' });

      expect(result.weight).toBe(2);
      expect(result.duration).toBe(30);
    });

    it('leve NotFoundException si la tache est introuvable', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.patch('inexistant', { title: 'X' })).rejects.toThrow(NotFoundException);
      expect(taskRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── remove() ─────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('supprime les assignations puis la tache', async () => {
      const assignment = { id: 'assign-1' };
      const task = makeTask({ assignments: [assignment] });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.manager.delete.mockResolvedValue({ affected: 1 });
      taskRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(task.id);

      expect(taskRepo.manager.delete).toHaveBeenCalledWith('task_assignment', ['assign-1']);
      expect(taskRepo.delete).toHaveBeenCalledWith(task.id);
    });

    it('supprime la tache meme sans assignations', async () => {
      const task = makeTask({ assignments: [] });
      taskRepo.findOne.mockResolvedValue(task);
      taskRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove(task.id);

      expect(taskRepo.manager.delete).not.toHaveBeenCalled();
      expect(taskRepo.delete).toHaveBeenCalledWith(task.id);
    });

    it('ne leve pas d erreur si la tache est introuvable', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('inexistant')).resolves.toBeUndefined();
      expect(taskRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ── deleteWeek() ──────────────────────────────────────────────────────────

  describe('deleteWeek()', () => {
    it('supprime toutes les taches de la semaine et retourne le compte', async () => {
      const tasks = [makeTask({ id: 'task-1', assignments: [] }), makeTask({ id: 'task-2', assignments: [] })];
      taskRepo.find.mockResolvedValue(tasks);
      taskRepo.delete.mockResolvedValue({ affected: 2 });

      const result = await service.deleteWeek('group-uuid-1', 22, 2026);

      expect(result).toEqual({ deleted: 2 });
      expect(taskRepo.delete).toHaveBeenCalledWith(['task-1', 'task-2']);
    });

    it('retourne deleted 0 si aucune tache nexiste pour cette semaine', async () => {
      taskRepo.find.mockResolvedValue([]);

      const result = await service.deleteWeek('group-uuid-1', 22, 2026);

      expect(result).toEqual({ deleted: 0 });
      expect(taskRepo.delete).not.toHaveBeenCalled();
    });

    it('supprime les assignations avant les taches', async () => {
      const tasks = [makeTask({ id: 'task-1', assignments: [{ id: 'assign-1' }] })];
      taskRepo.find.mockResolvedValue(tasks);
      taskRepo.manager.delete.mockResolvedValue({ affected: 1 });
      taskRepo.delete.mockResolvedValue({ affected: 1 });

      await service.deleteWeek('group-uuid-1', 22, 2026);

      expect(taskRepo.manager.delete).toHaveBeenCalledWith('task_assignment', ['assign-1']);
      expect(taskRepo.delete).toHaveBeenCalledWith(['task-1']);
    });
  });

  // ── findTemplate() ────────────────────────────────────────────────────────

  describe('findTemplate()', () => {
    it('retourne uniquement les taches templates du groupe', async () => {
      const templates = [makeTask({ isTemplate: true }), makeTask({ id: 'task-2', isTemplate: true })];
      taskRepo.find.mockResolvedValue(templates);

      const result = await service.findTemplate('group-uuid-1');

      expect(taskRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { group: { id: 'group-uuid-1' }, isTemplate: true } }),
      );
      expect(result).toEqual(templates);
    });
  });
});
