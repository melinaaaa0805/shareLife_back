import { Test, TestingModule } from '@nestjs/testing';
import { GroupInvitationsService } from './group-invitations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupInvitation } from './entities/group-invitation.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { User } from '../users/entities/user.entity';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}): User =>
  ({ id: 'user-1', email: 'alice@test.com', firstName: 'Alice', ...overrides } as User);

const makeGroup = (overrides = {}): Group =>
  ({
    id: 'group-1',
    name: 'Coloc',
    owner: makeUser(),
    ...overrides,
  } as unknown as Group);

const makeInvitation = (overrides = {}): GroupInvitation =>
  ({
    id: 'inv-1',
    status: 'PENDING',
    createdAt: new Date('2026-05-01T10:00:00Z'),
    group: makeGroup(),
    invitedUser: makeUser({ id: 'user-2', email: 'bob@test.com', firstName: 'Bob' }),
    invitedBy: makeUser(),
    ...overrides,
  } as unknown as GroupInvitation);

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('GroupInvitationsService', () => {
  let service: GroupInvitationsService;
  let invitationRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;
  let memberRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupInvitationsService,
        { provide: getRepositoryToken(GroupInvitation), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(GroupMember), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<GroupInvitationsService>(GroupInvitationsService);
    invitationRepo = module.get(getRepositoryToken(GroupInvitation));
    groupRepo = module.get(getRepositoryToken(Group));
    memberRepo = module.get(getRepositoryToken(GroupMember));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ── sendInvitation ─────────────────────────────────────────────────────────

  describe('sendInvitation()', () => {
    const groupId = 'group-1';
    const invitedById = 'user-1';
    const email = 'bob@test.com';

    const owner = makeUser({ id: 'user-1' });
    const group = makeGroup({ owner });
    const invitedUser = makeUser({ id: 'user-2', email });

    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.sendInvitation(groupId, invitedById, email)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when invited user email not found', async () => {
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.sendInvitation(groupId, invitedById, email)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when invited user is the group owner', async () => {
      const ownerAsInvitedUser = makeUser({ id: 'user-1', email: 'owner@test.com' });
      groupRepo.findOne.mockResolvedValue(makeGroup({ owner: ownerAsInvitedUser }));
      userRepo.findOne.mockResolvedValueOnce(ownerAsInvitedUser);
      await expect(
        service.sendInvitation(groupId, invitedById, ownerAsInvitedUser.email),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when user is already a member', async () => {
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValueOnce(invitedUser);
      memberRepo.findOne.mockResolvedValue({ id: 'member-1' });
      await expect(service.sendInvitation(groupId, invitedById, email)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when a PENDING invitation already exists', async () => {
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValueOnce(invitedUser);
      memberRepo.findOne.mockResolvedValue(null);
      invitationRepo.findOne.mockResolvedValue({ id: 'inv-existing', status: 'PENDING' });
      await expect(service.sendInvitation(groupId, invitedById, email)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates and returns the invitation on success', async () => {
      const savedInvitation = makeInvitation();
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne.mockResolvedValueOnce(invitedUser);
      memberRepo.findOne.mockResolvedValue(null);
      invitationRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValueOnce(owner);
      invitationRepo.create.mockReturnValue(savedInvitation);
      invitationRepo.save.mockResolvedValue(savedInvitation);

      const result = await service.sendInvitation(groupId, invitedById, email);

      expect(result).toMatchObject({
        id: savedInvitation.id,
        status: 'PENDING',
        group: { id: group.id, name: group.name },
      });
      expect(invitationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' }),
      );
    });
  });

  // ── getMyInvitations ───────────────────────────────────────────────────────

  describe('getMyInvitations()', () => {
    it('returns empty array when no pending invitations', async () => {
      invitationRepo.find.mockResolvedValue([]);
      const result = await service.getMyInvitations('user-2');
      expect(result).toEqual([]);
    });

    it('maps invitations to the expected shape', async () => {
      const inv = makeInvitation();
      invitationRepo.find.mockResolvedValue([inv]);

      const result = await service.getMyInvitations('user-2');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: inv.id,
        status: 'PENDING',
        group: { id: inv.group.id, name: inv.group.name },
        invitedBy: {
          id: inv.invitedBy.id,
          firstName: inv.invitedBy.firstName,
          email: inv.invitedBy.email,
        },
      });
    });

    it('queries only PENDING invitations for the given user', async () => {
      invitationRepo.find.mockResolvedValue([]);
      await service.getMyInvitations('user-2');
      expect(invitationRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  // ── respondToInvitation ────────────────────────────────────────────────────

  describe('respondToInvitation()', () => {
    const userId = 'user-2';

    it('throws NotFoundException when invitation does not exist', async () => {
      invitationRepo.findOne.mockResolvedValue(null);
      await expect(service.respondToInvitation('inv-x', userId, true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when invitation belongs to another user', async () => {
      const inv = makeInvitation({ invitedUser: makeUser({ id: 'user-99' }) });
      invitationRepo.findOne.mockResolvedValue(inv);
      await expect(service.respondToInvitation('inv-1', userId, true)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when invitation is already processed', async () => {
      const inv = makeInvitation({
        status: 'ACCEPTED',
        invitedUser: makeUser({ id: userId }),
      });
      invitationRepo.findOne.mockResolvedValue(inv);
      await expect(service.respondToInvitation('inv-1', userId, true)).rejects.toThrow(
        ConflictException,
      );
    });

    it('accepts invitation: adds member and sets status ACCEPTED', async () => {
      const inv = makeInvitation({ invitedUser: makeUser({ id: userId }) });
      invitationRepo.findOne.mockResolvedValue(inv);
      const newMember = { id: 'gm-1' };
      memberRepo.create.mockReturnValue(newMember);
      memberRepo.save.mockResolvedValue(newMember);
      invitationRepo.save.mockResolvedValue({ ...inv, status: 'ACCEPTED' });

      const result = await service.respondToInvitation('inv-1', userId, true);

      expect(memberRepo.create).toHaveBeenCalled();
      expect(memberRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true, status: 'ACCEPTED' });
    });

    it('declines invitation: does not add member and sets status DECLINED', async () => {
      const inv = makeInvitation({ invitedUser: makeUser({ id: userId }) });
      invitationRepo.findOne.mockResolvedValue(inv);
      invitationRepo.save.mockResolvedValue({ ...inv, status: 'DECLINED' });

      const result = await service.respondToInvitation('inv-1', userId, false);

      expect(memberRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, status: 'DECLINED' });
    });
  });
});
