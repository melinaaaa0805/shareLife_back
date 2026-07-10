import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';

const mockNotificationsService = {
  saveToken: jest.fn(),
  removeToken: jest.fn(),
};

const mockUser: User = { id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User;

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('registerToken() délègue au service avec userId et token', async () => {
    mockNotificationsService.saveToken.mockResolvedValue(undefined);

    await controller.registerToken(mockUser, 'ExponentPushToken[abc]');

    expect(mockNotificationsService.saveToken).toHaveBeenCalledWith('user-1', 'ExponentPushToken[abc]');
  });

  it('removeToken() délègue au service avec userId', async () => {
    mockNotificationsService.removeToken.mockResolvedValue(undefined);

    await controller.removeToken(mockUser);

    expect(mockNotificationsService.removeToken).toHaveBeenCalledWith('user-1');
  });
});
