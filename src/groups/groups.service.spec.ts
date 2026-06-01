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
    module.get(getRepositoryToken(TaskAssignment));
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
});
