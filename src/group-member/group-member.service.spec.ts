import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupMemberService } from './group-member.service';
import { GroupMember } from './entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
});

const makeUser = (overrides: Partial<User> = {}): User =>
  ({ id: 'user-1', email: 'alice@test.com', firstName: 'Alice', ...overrides } as User);

const makeGroup = (): Group =>
  ({ id: 'group-1', name: 'Coloc', owner: makeUser() } as unknown as Group);

const makeMember = (user: User): GroupMember =>
  ({ id: 'gm-1', user, group: makeGroup() } as unknown as GroupMember);

describe('GroupMemberService', () => {
  let service: GroupMemberService;
  let groupMemberRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupMemberService,
        { provide: getRepositoryToken(GroupMember), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<GroupMemberService>(GroupMemberService);
    groupMemberRepo = module.get(getRepositoryToken(GroupMember));
    groupRepo = module.get(getRepositoryToken(Group));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── addMemberByEmail ───────────────────────────────────────────────────────

  describe('addMemberByEmail()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.addMemberByEmail('alice@test.com', 'group-x')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException si l\'utilisateur est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.addMemberByEmail('unknown@test.com', 'group-1')).rejects.toThrow(NotFoundException);
    });

    it('retourne le membre existant sans créer de doublon', async () => {
      const user = makeUser();
      const existing = makeMember(user);
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(user);
      groupMemberRepo.findOne.mockResolvedValue(existing);

      const result = await service.addMemberByEmail('alice@test.com', 'group-1');

      expect(groupMemberRepo.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('crée et sauvegarde un nouveau membre', async () => {
      const user = makeUser();
      const group = makeGroup();
      const newMember = makeMember(user);
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValue(user);
      groupMemberRepo.findOne.mockResolvedValue(null);
      groupMemberRepo.create.mockReturnValue(newMember);
      groupMemberRepo.save.mockResolvedValue(newMember);

      const result = await service.addMemberByEmail('alice@test.com', 'group-1');

      expect(groupMemberRepo.create).toHaveBeenCalledWith({ group, user });
      expect(result).toBe(newMember);
    });
  });

  // ── getUsersByGroup ────────────────────────────────────────────────────────

  describe('getUsersByGroup()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.getUsersByGroup('group-x')).rejects.toThrow(NotFoundException);
    });

    it('retourne les membres du groupe (owner déjà dans la liste)', async () => {
      const owner = makeUser({ id: 'owner-1' });
      const member2 = makeUser({ id: 'user-2', email: 'bob@test.com', firstName: 'Bob' });
      groupRepo.findOne.mockResolvedValue({ id: 'group-1', owner } as any);
      groupMemberRepo.find.mockResolvedValue([
        { user: owner },
        { user: member2 },
      ]);

      const result = await service.getUsersByGroup('group-1');

      expect(result).toHaveLength(2);
    });

    it('ajoute le propriétaire en tête s\'il est absent des membres', async () => {
      const owner = makeUser({ id: 'owner-1', email: 'owner@test.com', firstName: 'Owner' });
      const member = makeUser({ id: 'user-2', email: 'bob@test.com', firstName: 'Bob' });
      groupRepo.findOne.mockResolvedValue({ id: 'group-1', owner } as any);
      groupMemberRepo.find.mockResolvedValue([{ user: member }]);

      const result = await service.getUsersByGroup('group-1');

      expect(result[0].id).toBe('owner-1');
      expect(result).toHaveLength(2);
    });
  });
});
