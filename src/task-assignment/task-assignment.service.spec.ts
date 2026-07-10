import { Test, TestingModule } from '@nestjs/testing';
import { TaskAssignmentService } from './task-assignment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as dateUtils from '../common/date.utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}): User =>
  ({ id: 'user-uuid-1', email: 'alice@example.com', firstName: 'Alice', ...overrides } as User);

const makeGroup = (overrides = {}): Group =>
  ({ id: 'group-uuid-1', name: 'Coloc Paris', mode: 'FREE', weeklyAdmin: null, weeklyAdminWeek: null, weeklyAdminYear: null, ...overrides } as unknown as Group);

const makeTask = (overrides = {}): Task =>
  ({
    id: 'task-uuid-1',
    title: 'Faire la vaisselle',
    weight: 2,
    duration: 30,
    taskType: 'FAMILY',
    isTemplate: false,
    assignments: [],
    group: makeGroup(),
    ...overrides,
  } as unknown as Task);

const makeAssignment = (overrides = {}): TaskAssignment =>
  ({
    id: 'assign-uuid-1',
    status: 'PENDING',
    completedAt: null,
    task: makeTask(),
    user: makeUser(),
    ...overrides,
  } as unknown as TaskAssignment);

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('TaskAssignmentService', () => {
  let service: TaskAssignmentService;
  let assignmentRepo: ReturnType<typeof mockRepo>;
  let taskRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    jest.spyOn(dateUtils, 'getISOWeekAndYear').mockReturnValue({ week: 22, year: 2026 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskAssignmentService,
        { provide: getRepositoryToken(TaskAssignment), useFactory: mockRepo },
        { provide: getRepositoryToken(Task), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<TaskAssignmentService>(TaskAssignmentService);
    assignmentRepo = module.get(getRepositoryToken(TaskAssignment));
    taskRepo = module.get(getRepositoryToken(Task));
    userRepo = module.get(getRepositoryToken(User));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('cree une assignation en mode FREE et retourne le resultat sauvegarde', async () => {
      const task = makeTask({ assignments: [] });
      const user = makeUser();
      const group = makeGroup({ mode: 'FREE' });
      const assignment = makeAssignment({ task, user });

      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(group);
      assignmentRepo.create.mockReturnValue(assignment);
      assignmentRepo.save.mockResolvedValue(assignment);

      const result = await service.create(task.id, user);

      expect(result).toEqual(assignment);
      expect(assignmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ task, user, status: 'PENDING' }),
      );
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });

    it('leve NotFoundException si la tache est introuvable', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.create('inexistant', makeUser())).rejects.toThrow(NotFoundException);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });

    it('leve BadRequestException si la tache est deja assignee', async () => {
      const existingAssignment = makeAssignment();
      const task = makeTask({ assignments: [existingAssignment] });
      taskRepo.findOne.mockResolvedValue(task);

      await expect(service.create(task.id, makeUser())).rejects.toThrow(BadRequestException);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });

    it("leve ForbiddenException en mode FUNNY si l'utilisateur n'est pas l'admin de la semaine", async () => {
      const task = makeTask({ assignments: [] });
      const user = makeUser({ id: 'user-lambda' });
      const weeklyAdmin = makeUser({ id: 'admin-uuid' });
      const group = makeGroup({ mode: 'FUNNY', weeklyAdmin, weeklyAdminWeek: 22, weeklyAdminYear: 2026 });

      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(group);

      await expect(service.create(task.id, user)).rejects.toThrow(ForbiddenException);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });

    it("autorise l'assignation en mode FUNNY si l'utilisateur est l'admin de la semaine", async () => {
      const adminUser = makeUser({ id: 'admin-uuid' });
      const task = makeTask({ assignments: [] });
      const group = makeGroup({ mode: 'FUNNY', weeklyAdmin: adminUser, weeklyAdminWeek: 22, weeklyAdminYear: 2026 });
      const assignment = makeAssignment({ task, user: adminUser });

      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(group);
      assignmentRepo.create.mockReturnValue(assignment);
      assignmentRepo.save.mockResolvedValue(assignment);

      const result = await service.create(task.id, adminUser);

      expect(result).toEqual(assignment);
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ── markDone() ────────────────────────────────────────────────────────────

  describe('markDone()', () => {
    it('passe le statut a DONE et enregistre la date de completion', async () => {
      const assignment = makeAssignment({ status: 'PENDING' });
      assignmentRepo.findOne.mockResolvedValue(assignment);
      assignmentRepo.save.mockImplementation(async (a: TaskAssignment) => a);

      const result = await service.markDone('task-uuid-1', 'user-uuid-1');

      expect(result.status).toBe('DONE');
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });

    it("leve NotFoundException si l'assignation est introuvable", async () => {
      assignmentRepo.findOne.mockResolvedValue(null);

      await expect(service.markDone('inexistant', 'user-uuid-1')).rejects.toThrow(NotFoundException);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── assignToUser() ────────────────────────────────────────────────────────

  describe('assignToUser()', () => {
    it('assigne une tache a un utilisateur cible en mode FREE', async () => {
      const task = makeTask({ assignments: [], taskType: 'FAMILY' });
      const targetUser = makeUser({ id: 'target-uuid' });
      const group = makeGroup({ mode: 'FREE' });
      const assignment = makeAssignment({ task, user: targetUser });

      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValue(targetUser);
      assignmentRepo.create.mockReturnValue(assignment);
      assignmentRepo.save.mockResolvedValue(assignment);

      const result = await service.assignToUser(task.id, targetUser.id, 'requester-uuid');

      expect(result).toEqual(assignment);
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });

    it('leve NotFoundException si la tache est introuvable', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assignToUser('inexistant', 'target-uuid', 'requester-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('leve BadRequestException si le nombre maximum d assignations est atteint', async () => {
      const task = makeTask({ taskType: 'FAMILY', assignments: [makeAssignment()] });
      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(makeGroup({ mode: 'FREE' }));

      await expect(
        service.assignToUser(task.id, 'target-uuid', 'requester-uuid'),
      ).rejects.toThrow(BadRequestException);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });

    it('leve BadRequestException si l utilisateur est deja assigne', async () => {
      const targetUserId = 'target-uuid';
      const existingAssignment = { ...makeAssignment(), user: { id: targetUserId } };
      const task = makeTask({ taskType: 'ADULT_CHILD', assignments: [existingAssignment] });
      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(makeGroup({ mode: 'FREE' }));

      await expect(
        service.assignToUser(task.id, targetUserId, 'requester-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('leve ForbiddenException en mode FUNNY si le requester n est pas l admin de la semaine', async () => {
      const task = makeTask({ assignments: [], taskType: 'FAMILY' });
      const weeklyAdmin = makeUser({ id: 'admin-uuid' });
      const group = makeGroup({ mode: 'FUNNY', weeklyAdmin, weeklyAdminWeek: 22, weeklyAdminYear: 2026 });

      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(group);

      await expect(
        service.assignToUser(task.id, 'target-uuid', 'user-lambda'),
      ).rejects.toThrow(ForbiddenException);
    });

    it("leve NotFoundException si l'utilisateur cible est introuvable", async () => {
      const task = makeTask({ assignments: [], taskType: 'FAMILY' });
      taskRepo.findOne.mockResolvedValue(task);
      groupRepo.findOne.mockResolvedValue(makeGroup({ mode: 'FREE' }));
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assignToUser(task.id, 'inexistant', 'requester-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByUser() ──────────────────────────────────────────────────────────

  describe('findByUser()', () => {
    it('retourne les assignations mappees pour un utilisateur', async () => {
      const user = makeUser();
      const task = makeTask();
      const completedAt = new Date('2026-05-25T10:00:00Z');
      const assignment = makeAssignment({ task, user, status: 'DONE', completedAt });

      userRepo.findOne.mockResolvedValue(user);
      assignmentRepo.find.mockResolvedValue([assignment]);

      const result = await service.findByUser(user.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: task.id,
        title: task.title,
        status: 'DONE',
        completedAtDate: '2026-05-25',
      });
    });

    it("retourne un tableau vide si l'utilisateur n'a aucune assignation", async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      assignmentRepo.find.mockResolvedValue([]);

      const result = await service.findByUser('user-uuid-1');

      expect(result).toEqual([]);
    });

    it("leve NotFoundException si l'utilisateur est introuvable", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findByUser('inexistant')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnassignedTasks()', () => {
    it('retourne les tâches non assignées via QueryBuilder', async () => {
      const tasks = [{ id: 'task-1', title: 'Vaisselle' }];
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tasks),
      };
      taskRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getUnassignedTasks('group-1');

      expect(taskRepo.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockQb.getMany).toHaveBeenCalled();
      expect(result).toBe(tasks);
    });
  });
});
