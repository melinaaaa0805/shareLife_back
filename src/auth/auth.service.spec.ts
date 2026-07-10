import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid-1',
    email: 'alice@example.com',
    firstName: 'Alice',
    password: 'hashed-password',
    role: 'MEMBER',
    avatarColor: null,
    resetToken: null,
    resetTokenExpiry: null,
    ...overrides,
  } as User);

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') };
const mockMailService = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) };

// bcrypt avec cost 12 prend ~300ms-1s : on augmente le timeout global de la suite
jest.setTimeout(20000);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto = { email: 'Alice@Example.com', password: 'Password1', firstName: ' Alice ' };

    it('crée un utilisateur et retourne un token JWT', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const fakeUser = makeUser();
      userRepo.create.mockReturnValue(fakeUser);
      userRepo.save.mockResolvedValue(fakeUser);

      const result = await service.register(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
      expect(userRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toMatchObject({ email: fakeUser.email, firstName: fakeUser.firstName });
      expect(result.user).not.toHaveProperty('password');
    });

    it("normalise l'email en minuscules et supprime les espaces du prénom", async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(makeUser());
      userRepo.save.mockResolvedValue(makeUser());

      await service.register(dto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@example.com', firstName: 'Alice' }),
      );
    });

    it("lève UnauthorizedException si l'email est déjà utilisé", async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(service.register(dto)).rejects.toThrow(UnauthorizedException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('hash le mot de passe avec bcrypt avant de sauvegarder', async () => {
      userRepo.findOne.mockResolvedValue(null);
      let capturedPassword = '';
      userRepo.create.mockImplementation((data: any) => {
        capturedPassword = data.password;
        return makeUser({ password: data.password });
      });
      userRepo.save.mockImplementation(async (u: User) => u);

      await service.register(dto);

      // Le mot de passe brut ne doit jamais être stocké
      expect(capturedPassword).not.toBe(dto.password);
      // bcrypt.compare valide que le hash correspond bien au mot de passe original
      const isHashed = await bcrypt.compare(dto.password, capturedPassword);
      expect(isHashed).toBe(true);
    }, 20000);
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login()', () => {
    const dto = { email: 'alice@example.com', password: 'Password1' };

    it('retourne un token JWT pour des identifiants valides', async () => {
      // cost 4 : suffisant pour les tests (cost 12 est réservé à la prod)
      const hashed = await bcrypt.hash(dto.password, 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));

      const result = await service.login(dto);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result.user).toMatchObject({ id: 'user-uuid-1', email: 'alice@example.com' });
    });

    it('ne renvoie pas le mot de passe hashé dans la réponse', async () => {
      const hashed = await bcrypt.hash(dto.password, 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));

      const result = await service.login(dto);

      expect(result.user).not.toHaveProperty('password');
    });

    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      const hashed = await bcrypt.hash('mauvais-mot-de-passe', 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("lève UnauthorizedException si l'utilisateur est introuvable", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("retourne le même message d'erreur que le mot de passe soit faux ou l'utilisateur inexistant (anti-énumération)", async () => {
      // Utilisateur inexistant
      userRepo.findOne.mockResolvedValue(null);
      let errorWhenNoUser: UnauthorizedException | null = null;
      try { await service.login(dto); } catch (e) { errorWhenNoUser = e as UnauthorizedException; }

      // Mauvais mot de passe
      const hashed = await bcrypt.hash('mauvais-mdp', 4);
      userRepo.findOne.mockResolvedValue(makeUser({ password: hashed }));
      let errorWhenBadPwd: UnauthorizedException | null = null;
      try { await service.login(dto); } catch (e) { errorWhenBadPwd = e as UnauthorizedException; }

      expect(errorWhenNoUser?.message).toBe(errorWhenBadPwd?.message);
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe()', () => {
    it("retourne le profil sécurisé de l'utilisateur", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getMe(user.id);

      expect(result).toMatchObject({ id: user.id, email: user.email, firstName: user.firstName });
      expect(result).not.toHaveProperty('password');
    });

    it("lève UnauthorizedException si l'utilisateur est introuvable", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getMe('inexistant-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── validateUser ─────────────────────────────────────────────────────────

  describe('validateUser()', () => {
    it("retourne l'utilisateur correspondant à l'id", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.validateUser(user.id);

      expect(result).toEqual(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: user.id } });
    });

    it("retourne null si l'utilisateur n'existe pas", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser('inexistant');

      expect(result).toBeNull();
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it("envoie un e-mail de réinitialisation si l'utilisateur existe", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);

      await service.forgotPassword(user.email);

      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(
        user.email,
        expect.stringMatching(/^\d{6}$/),
      );
      expect(userRepo.save).toHaveBeenCalledTimes(1);
    });

    it('stocke un resetToken hashé avec une expiration à 15 minutes', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      let savedUser: User | null = null;
      userRepo.save.mockImplementation(async (u: User) => {
        savedUser = u;
        return u;
      });

      const before = Date.now();
      await service.forgotPassword(user.email);
      const after = Date.now();

      expect(savedUser!.resetToken).toBeTruthy();
      expect(savedUser!.resetTokenExpiry!.getTime()).toBeGreaterThanOrEqual(
        before + 14 * 60 * 1000,
      );
      expect(savedUser!.resetTokenExpiry!.getTime()).toBeLessThanOrEqual(
        after + 15 * 60 * 1000,
      );
    });

    it("ne lève pas d'erreur si l'email est inconnu (anti-énumération)", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.forgotPassword('inconnu@example.com')).resolves.toBeUndefined();
      expect(mockMailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    const code = '123456';
    const newPassword = 'NewPassword1';

    const makeUserWithToken = async (): Promise<User> => {
      const hashed = await bcrypt.hash(code, 10);
      return makeUser({
        resetToken: hashed,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
    };

    it('réinitialise le mot de passe et efface le token de reset', async () => {
      const user = await makeUserWithToken();
      userRepo.findOne.mockResolvedValue(user);

      let savedUser: User | null = null;
      userRepo.save.mockImplementation(async (u: User) => {
        savedUser = u;
        return u;
      });

      await service.resetPassword(user.email, code, newPassword);

      const isNewPasswordHashed = await bcrypt.compare(newPassword, savedUser!.password);
      expect(isNewPasswordHashed).toBe(true);
      expect(savedUser!.resetToken).toBeNull();
      expect(savedUser!.resetTokenExpiry).toBeNull();
    });

    it('lève BadRequestException si le code est invalide', async () => {
      const user = await makeUserWithToken();
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.resetPassword(user.email, '000000', newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si le token est expiré', async () => {
      const hashed = await bcrypt.hash(code, 10);
      const user = makeUser({
        resetToken: hashed,
        resetTokenExpiry: new Date(Date.now() - 1000),
      });
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.resetPassword(user.email, code, newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it("lève BadRequestException si l'utilisateur est introuvable", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('inconnu@example.com', code, newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si aucun token de reset existe', async () => {
      const user = makeUser({ resetToken: null, resetTokenExpiry: null });
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.resetPassword(user.email, code, newPassword),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
