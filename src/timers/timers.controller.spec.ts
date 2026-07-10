import { Test, TestingModule } from '@nestjs/testing';
import { TimersController } from './timers.controller';
import { TimersService } from './timers.service';
import { User } from '../users/entities/user.entity';

const mockTimersService = {
  start: jest.fn(),
  stop: jest.fn(),
  getForTask: jest.fn(),
};

const mockUser: User = { id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User;

describe('TimersController', () => {
  let controller: TimersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimersController],
      providers: [{ provide: TimersService, useValue: mockTimersService }],
    }).compile();

    controller = module.get<TimersController>(TimersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('start() délègue au service', async () => {
    const expected = { id: 'timer-1', isRunning: true };
    mockTimersService.start.mockResolvedValue(expected);

    const result = await controller.start('task-1', mockUser);

    expect(mockTimersService.start).toHaveBeenCalledWith('task-1', mockUser);
    expect(result).toBe(expected);
  });

  it('stop() délègue au service', async () => {
    const expected = { id: 'timer-1', isRunning: false, durationSeconds: 60 };
    mockTimersService.stop.mockResolvedValue(expected);

    const result = await controller.stop('task-1', mockUser);

    expect(mockTimersService.stop).toHaveBeenCalledWith('task-1', mockUser);
    expect(result).toBe(expected);
  });

  it('getForTask() délègue au service avec userId', async () => {
    const expected = { isRunning: false, totalSeconds: 200, sessions: 2 };
    mockTimersService.getForTask.mockResolvedValue(expected);

    const result = await controller.getForTask('task-1', mockUser);

    expect(mockTimersService.getForTask).toHaveBeenCalledWith('task-1', mockUser.id);
    expect(result).toBe(expected);
  });
});
