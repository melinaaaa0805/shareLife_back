import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.setTimeout(20000);

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}): User =>
  ({
    id: 'user-1',
    email: 'alice@test.com',
    firstName: 'Alice',
    role: 'MEMBER',
    avatarColor: null,
    password: 'hashed-password',
    ...overrides,
  } as User);

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('retourne un utilisateur existant', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      const result = await service.findOne('user-1');
      expect(result).toBe(user);
    });

    it('lève NotFoundException si l\'utilisateur est introuvable', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateProfile ──────────────────────────────────────────────────────────

  describe('updateProfile()', () => {
    it('met à jour le prénom', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, firstName: 'Alicia' });

      const result = await service.updateProfile('user-1', { firstName: 'Alicia' });

      expect(userRepo.save).toHaveBeenCalled();
      expect(result.firstName).toBe('Alicia');
    });

    it('lève ConflictException si le nouvel email est déjà utilisé', async () => {
      const user = makeUser();
      userRepo.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(makeUser({ id: 'user-2', email: 'bob@test.com' }));

      await expect(
        service.updateProfile('user-1', { email: 'bob@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('lève UnauthorizedException si currentPassword est absent pour changer le mot de passe', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      await expect(
        service.updateProfile('user-1', { newPassword: 'Nouveau1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si currentPassword est incorrect', async () => {
      const hashed = await bcrypt.hash('CorrectPassword', 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));

      await expect(
        service.updateProfile('user-1', {
          currentPassword: 'MauvaisPassword',
          newPassword: 'Nouveau1!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── deleteAccount ──────────────────────────────────────────────────────────

  describe('deleteAccount()', () => {
    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      const hashed = await bcrypt.hash('CorrectPassword', 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));

      await expect(service.deleteAccount('user-1', 'MauvaisPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('supprime les groupes possédés puis le compte', async () => {
      const hashed = await bcrypt.hash('Password1', 4);
      const user = makeUser({ password: hashed });
      userRepo.findOne.mockResolvedValue(user);
      groupRepo.find.mockResolvedValue([{ id: 'group-1' }, { id: 'group-2' }]);
      groupRepo.delete.mockResolvedValue({ affected: 1 });
      userRepo.delete.mockResolvedValue({ affected: 1 });

      await service.deleteAccount('user-1', 'Password1');

      expect(groupRepo.delete).toHaveBeenCalledTimes(2);
      expect(userRepo.delete).toHaveBeenCalledWith('user-1');
    });
  });
});
