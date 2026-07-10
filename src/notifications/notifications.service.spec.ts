import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';

const mockUserRepo = () => ({
  update: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const makeUser = (pushToken: string | null = null): User =>
  ({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com', pushToken } as User);

describe('NotificationsService', () => {
  let service: NotificationsService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ── saveToken ──────────────────────────────────────────────────────────────

  it('saveToken() met à jour le pushToken de l\'utilisateur', async () => {
    userRepo.update.mockResolvedValue({ affected: 1 });

    await service.saveToken('user-1', 'ExponentPushToken[abc]');

    expect(userRepo.update).toHaveBeenCalledWith('user-1', { pushToken: 'ExponentPushToken[abc]' });
  });

  // ── removeToken ────────────────────────────────────────────────────────────

  it('removeToken() met à jour pushToken à null', async () => {
    userRepo.update.mockResolvedValue({ affected: 1 });

    await service.removeToken('user-1');

    expect(userRepo.update).toHaveBeenCalledWith('user-1', { pushToken: null });
  });

  // ── sendToUser ─────────────────────────────────────────────────────────────

  it('sendToUser() n\'envoie rien si l\'utilisateur n\'a pas de pushToken', async () => {
    userRepo.findOne.mockResolvedValue(makeUser(null));
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUser('user-1', 'Titre', 'Corps');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('sendToUser() envoie la notification si l\'utilisateur a un pushToken valide', async () => {
    userRepo.findOne.mockResolvedValue(makeUser('ExponentPushToken[abc123]'));
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUser('user-1', 'Titre', 'Corps');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({ method: 'POST' }),
    );
    fetchSpy.mockRestore();
  });

  // ── sendToUsers ────────────────────────────────────────────────────────────

  it('sendToUsers() retourne immédiatement si la liste est vide', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await service.sendToUsers([], 'Titre', 'Corps');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(userRepo.find).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('sendToUsers() n\'appelle pas fetch si aucun token valide (null)', async () => {
    userRepo.find.mockResolvedValue([makeUser(null), makeUser(null)]);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUsers(['user-1', 'user-2'], 'Titre', 'Corps');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('send() retourne sans fetch si tous les tokens sont non-Expo', async () => {
    userRepo.find.mockResolvedValue([makeUser('fcm-token-abc')]);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUsers(['user-1'], 'Titre', 'Corps');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('sendToUsers() envoie à tous les tokens valides', async () => {
    userRepo.find.mockResolvedValue([
      makeUser('ExponentPushToken[aaa]'),
      makeUser('ExponentPushToken[bbb]'),
    ]);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUsers(['user-1', 'user-2'], 'Titre', 'Corps');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(body).toHaveLength(2);
    fetchSpy.mockRestore();
  });

  it('sendToUsers() ignore les tokens qui ne commencent pas par ExponentPushToken[', async () => {
    userRepo.find.mockResolvedValue([
      makeUser('invalid-token'),
      makeUser('ExponentPushToken[valid]'),
    ]);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await service.sendToUsers(['user-1', 'user-2'], 'Titre', 'Corps');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as any).body);
    expect(body).toHaveLength(1);
    expect(body[0].to).toBe('ExponentPushToken[valid]');
    fetchSpy.mockRestore();
  });
});
