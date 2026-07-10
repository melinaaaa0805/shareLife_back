import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as dateUtils from '../common/date.utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}): User =>
  ({ id: 'user-1', email: 'alice@test.com', firstName: 'Alice', ...overrides } as User);

const makeGroup = (overrides = {}): Group =>
  ({
    id: 'group-1',
    name: 'Coloc Paris',
    mode: 'FREE',
    owner: makeUser(),
    members: [],
    weeklyAdmin: null,
    weeklyAdminWeek: null,
    weeklyAdminYear: null,
    ...overrides,
  } as unknown as Group);

const makeGroupMember = (overrides = {}): GroupMember =>
  ({
    id: 'gm-1',
    user: makeUser({ id: 'user-2', email: 'bob@test.com', firstName: 'Bob' }),
    profile: 'ADULT',
    ...overrides,
  } as unknown as GroupMember);

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepo: ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let taskRepo: ReturnType<typeof mockRepo>;
  let assignmentRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    jest.spyOn(dateUtils, 'getISOWeekAndYear').mockReturnValue({ week: 22, year: 2026 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(GroupMember), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Task), useFactory: mockRepo },
        { provide: getRepositoryToken(TaskAssignment), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupRepo = module.get(getRepositoryToken(Group));
    memberRepo = module.get(getRepositoryToken(GroupMember));
    userRepo = module.get(getRepositoryToken(User));
    taskRepo = module.get(getRepositoryToken(Task));
    assignmentRepo = module.get(getRepositoryToken(TaskAssignment));
  });

  afterEach(() => jest.clearAllMocks());

  // ── createGroup ────────────────────────────────────────────────────────────

  describe('createGroup()', () => {
    it('creates the group and seeds default tasks', async () => {
      const owner = makeUser();
      const group = makeGroup();
      groupRepo.create.mockReturnValue(group);
      groupRepo.save.mockResolvedValue(group);
      taskRepo.save.mockResolvedValue([]);

      const result = await service.createGroup({ name: 'Coloc Paris' }, owner);

      expect(groupRepo.create).toHaveBeenCalledWith({ name: 'Coloc Paris', owner });
      expect(groupRepo.save).toHaveBeenCalled();
      expect(taskRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Coloc Paris');
    });
  });

  // ── updateGroup ────────────────────────────────────────────────────────────

  describe('updateGroup()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.updateGroup('group-x', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates group name and saves', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.save.mockResolvedValue({ ...group, name: 'New Name' });

      const result = await service.updateGroup('group-1', { name: 'New Name' });

      expect(groupRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });
  });

  // ── deleteGroup ────────────────────────────────────────────────────────────

  describe('deleteGroup()', () => {
    it('throws NotFoundException when no rows affected', async () => {
      groupRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.deleteGroup('group-x')).rejects.toThrow(NotFoundException);
    });

    it('deletes successfully when group exists', async () => {
      groupRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.deleteGroup('group-1')).resolves.toBeUndefined();
    });
  });

  // ── addMember ──────────────────────────────────────────────────────────────

  describe('addMember()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember('group-x', { userId: 'user-2' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.addMember('group-1', { userId: 'user-x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns existing member without creating duplicate', async () => {
      const group = makeGroup();
      const user = makeUser({ id: 'user-2' });
      const existingMember = makeGroupMember();
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValue(user);
      memberRepo.findOne.mockResolvedValue(existingMember);

      const result = await service.addMember('group-1', { userId: 'user-2' });

      expect(memberRepo.create).not.toHaveBeenCalled();
      expect(result).toBe(existingMember);
    });

    it('creates a new member when not already present', async () => {
      const group = makeGroup();
      const user = makeUser({ id: 'user-2' });
      const newMember = makeGroupMember();
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValue(user);
      memberRepo.findOne.mockResolvedValue(null);
      memberRepo.create.mockReturnValue(newMember);
      memberRepo.save.mockResolvedValue(newMember);

      const result = await service.addMember('group-1', { userId: 'user-2' });

      expect(memberRepo.create).toHaveBeenCalledWith({ group, user });
      expect(result).toBe(newMember);
    });
  });

  // ── removeMember ──────────────────────────────────────────────────────────

  describe('removeMember()', () => {
    it('throws NotFoundException when member not in group', async () => {
      memberRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeMember('group-1', 'user-x')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes member successfully', async () => {
      memberRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.removeMember('group-1', 'user-2')).resolves.toBeUndefined();
    });
  });

  // ── setMode ────────────────────────────────────────────────────────────────

  describe('setMode()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.setMode('group-x', 'FUNNY')).rejects.toThrow(NotFoundException);
    });

    it('sets mode and saves', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.save.mockResolvedValue({ ...group, mode: 'FUNNY' });
      await service.setMode('group-1', 'FUNNY');
      expect(groupRepo.save).toHaveBeenCalledWith(expect.objectContaining({ mode: 'FUNNY' }));
    });
  });

  // ── electWeeklyAdmin ───────────────────────────────────────────────────────

  describe('electWeeklyAdmin()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.electWeeklyAdmin('group-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when group is not in FUNNY mode', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup({ mode: 'FREE' }));
      await expect(service.electWeeklyAdmin('group-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when winner is not a group member', async () => {
      const group = makeGroup({ mode: 'FUNNY', members: [] });
      groupRepo.findOne.mockResolvedValue(group);
      await expect(service.electWeeklyAdmin('group-1', 'user-99')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('elects the owner as admin and saves week/year', async () => {
      const owner = makeUser({ id: 'user-1' });
      const group = makeGroup({ mode: 'FUNNY', owner, members: [] });
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.save.mockResolvedValue(group);

      const result = await service.electWeeklyAdmin('group-1', 'user-1');

      expect(result.admin.id).toBe('user-1');
      expect(groupRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ weeklyAdminWeek: 22, weeklyAdminYear: 2026 }),
      );
    });

    it('elects a regular member as admin', async () => {
      const owner = makeUser({ id: 'user-1' });
      const member = makeGroupMember({ user: makeUser({ id: 'user-2', firstName: 'Bob', email: 'bob@test.com' }) });
      const group = makeGroup({ mode: 'FUNNY', owner, members: [member] });
      groupRepo.findOne.mockResolvedValue(group);
      groupRepo.save.mockResolvedValue(group);

      const result = await service.electWeeklyAdmin('group-1', 'user-2');

      expect(result.admin.id).toBe('user-2');
    });
  });

  // ── setMemberProfile ───────────────────────────────────────────────────────

  describe('setMemberProfile()', () => {
    it('throws NotFoundException when member not found', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.setMemberProfile('group-1', 'user-2', 'CHILD')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates profile and saves', async () => {
      const member = makeGroupMember({ profile: 'ADULT' });
      memberRepo.findOne.mockResolvedValue(member);
      memberRepo.save.mockResolvedValue({ ...member, profile: 'CHILD' });

      await service.setMemberProfile('group-1', 'user-2', 'CHILD');

      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ profile: 'CHILD' }),
      );
    });
  });

  // ── getGroupsForUser ───────────────────────────────────────────────────────

  describe('getGroupsForUser()', () => {
    it('retourne les groupes possédés par l\'utilisateur', async () => {
      const owner = makeUser();
      const group = makeGroup({ owner });
      groupRepo.find.mockResolvedValue([group]);
      // 1er find memberRepo : liens membership de l'utilisateur
      // 2e find memberRepo : membres du groupe owned
      memberRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getGroupsForUser('alice@test.com');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-1');
    });

    it('fusionne les groupes possédés et les groupes membres sans doublons', async () => {
      const owner = makeUser();
      const group1 = makeGroup({ id: 'group-1', name: 'Coloc', owner });
      const group2 = makeGroup({ id: 'group-2', name: 'Bureau', owner: makeUser({ id: 'user-2' }) });

      groupRepo.find.mockResolvedValue([group1]);
      memberRepo.find
        .mockResolvedValueOnce([{ group: group2 }]) // liens membership
        .mockResolvedValueOnce([]) // membres de group1
        .mockResolvedValueOnce([]); // membres de group2

      const result = await service.getGroupsForUser('alice@test.com');

      expect(result).toHaveLength(2);
    });

    it('inclut le créateur en tête si absent des membres', async () => {
      const owner = makeUser();
      const group = makeGroup({ owner });
      groupRepo.find.mockResolvedValue([group]);
      memberRepo.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([makeGroupMember()]); // membre ≠ owner

      const result = await service.getGroupsForUser('alice@test.com');

      expect(result[0].members[0]).toMatchObject({ id: 'user-1' });
    });
  });

  // ── getGroupById ───────────────────────────────────────────────────────────

  describe('getGroupById()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.getGroupById('group-x')).rejects.toThrow(NotFoundException);
    });

    it('retourne le groupe avec ses membres', async () => {
      const group = makeGroup({ owner: makeUser(), members: [], weeklyAdmin: null });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getGroupById('group-1') as any;

      expect(result.id).toBe('group-1');
      expect(result.owner.id).toBe('user-1');
      expect(result.weeklyAdmin).toBeNull();
    });

    it('retourne weeklyAdmin si semaine/année correspondent', async () => {
      const admin = makeUser({ id: 'admin-1', firstName: 'Admin', email: 'admin@test.com' });
      const group = makeGroup({
        owner: makeUser(),
        members: [],
        weeklyAdmin: admin,
        weeklyAdminWeek: 22, // spy retourne week:22
        weeklyAdminYear: 2026,
      });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getGroupById('group-1') as any;

      expect(result.weeklyAdmin?.id).toBe('admin-1');
    });

    it('retourne weeklyAdmin null si semaine différente', async () => {
      const admin = makeUser({ id: 'admin-1', firstName: 'Admin', email: 'admin@test.com' });
      const group = makeGroup({
        owner: makeUser(),
        members: [],
        weeklyAdmin: admin,
        weeklyAdminWeek: 10, // différent de 22
        weeklyAdminYear: 2026,
      });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getGroupById('group-1') as any;

      expect(result.weeklyAdmin).toBeNull();
    });
  });

  // ── getWeeklyAdmin ─────────────────────────────────────────────────────────

  describe('getWeeklyAdmin()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.getWeeklyAdmin('group-x')).rejects.toThrow(NotFoundException);
    });

    it('retourne weeklyAdmin null si la semaine est différente', async () => {
      const group = makeGroup({
        weeklyAdmin: makeUser({ id: 'admin-1' }),
        weeklyAdminWeek: 10,
        weeklyAdminYear: 2026,
      });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getWeeklyAdmin('group-1');

      expect(result.weeklyAdmin).toBeNull();
    });

    it('retourne weeklyAdmin si semaine et année correspondent', async () => {
      const admin = makeUser({ id: 'admin-1', firstName: 'Admin', email: 'admin@test.com' });
      const group = makeGroup({ weeklyAdmin: admin, weeklyAdminWeek: 22, weeklyAdminYear: 2026 });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getWeeklyAdmin('group-1');

      expect(result.weeklyAdmin?.id).toBe('admin-1');
    });

    it('retourne weeklyAdmin null si group.weeklyAdmin est null', async () => {
      const group = makeGroup({ weeklyAdmin: null });
      groupRepo.findOne.mockResolvedValue(group);

      const result = await service.getWeeklyAdmin('group-1');

      expect(result.weeklyAdmin).toBeNull();
    });
  });

  // ── smartAssign ────────────────────────────────────────────────────────────

  const makeTaskQb = (tasks: any[] = []) => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(tasks),
  });

  const makeAssignmentQb = (assignments: any[] = []) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(assignments),
  });

  describe('smartAssign()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.smartAssign('group-x', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('retourne {assigned: 0} si aucune tâche non assignée', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup({ owner: makeUser(), members: [] }));
      taskRepo.createQueryBuilder.mockReturnValue(makeTaskQb([]));

      const result = await service.smartAssign('group-1', 22, 2026);

      expect(result).toEqual({ assigned: 0 });
    });

    it('assigne une tâche FAMILY au seul membre et retourne {assigned: 1}', async () => {
      const owner = makeUser();
      const group = makeGroup({ owner, members: [] });
      const task = { id: 't1', taskType: 'FAMILY', weight: 1, duration: 30 };

      groupRepo.findOne.mockResolvedValue(group);
      taskRepo.createQueryBuilder.mockReturnValue(makeTaskQb([task]));
      assignmentRepo.createQueryBuilder.mockReturnValue(makeAssignmentQb([]));
      assignmentRepo.create.mockImplementation((data: any) => data);
      assignmentRepo.save.mockResolvedValue([task]);

      const result = await service.smartAssign('group-1', 22, 2026);

      expect(result).toEqual({ assigned: 1 });
      expect(assignmentRepo.save).toHaveBeenCalled();
    });

    it('assigne une tâche ADULT uniquement aux adultes', async () => {
      const owner = makeUser();
      const childMember = makeGroupMember({ user: makeUser({ id: 'child-1' }), profile: 'CHILD' });
      const group = makeGroup({ owner, members: [childMember] });
      const task = { id: 't1', taskType: 'ADULT', weight: 1, duration: 30 };

      groupRepo.findOne.mockResolvedValue(group);
      taskRepo.createQueryBuilder.mockReturnValue(makeTaskQb([task]));
      assignmentRepo.createQueryBuilder.mockReturnValue(makeAssignmentQb([]));
      assignmentRepo.create.mockImplementation((data: any) => data);
      assignmentRepo.save.mockResolvedValue([]);

      const result = await service.smartAssign('group-1', 22, 2026);

      // L'adulte (owner) reçoit la tâche
      expect(result.assigned).toBe(1);
    });

    it('ignore la tâche ADULT si aucun adulte disponible', async () => {
      const childMember = makeGroupMember({ user: makeUser({ id: 'child-1' }), profile: 'CHILD' });
      // Owner dans members (ownerInMembers !== undefined), donc pas ajouté → seul enfant
      const owner = makeUser();
      const ownerAsMember = makeGroupMember({ user: owner, profile: 'ADULT' });
      const group = makeGroup({ owner, members: [ownerAsMember, childMember] });
      const adultTask = { id: 't1', taskType: 'ADULT', weight: 1, duration: 30 };
      const childOnlyGroup = makeGroup({ owner: makeUser({ id: 'child-owner' }), members: [childMember] });

      // Only children in group (no adults) → skip ADULT task
      groupRepo.findOne.mockResolvedValue({
        ...makeGroup(),
        owner: { id: 'child-1' }, // owner is in members with CHILD profile
        members: [childMember],
      } as any);
      // owner IS in members list → ownerInMembers is truthy → not added to membersWithProfile
      // BUT the owner-member has CHILD profile → adults=[] → ADULT task skipped

      taskRepo.createQueryBuilder.mockReturnValue(makeTaskQb([adultTask]));
      assignmentRepo.createQueryBuilder.mockReturnValue(makeAssignmentQb([]));

      const result = await service.smartAssign('group-1', 22, 2026);

      expect(result.assigned).toBe(0);
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });
  });
});
