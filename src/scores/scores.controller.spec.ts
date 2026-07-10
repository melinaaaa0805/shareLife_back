import { Test, TestingModule } from '@nestjs/testing';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { User } from '../users/entities/user.entity';
import { RewardAssignee } from './enums/reward-assignee.enum';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

const mockScoresService = {
  getLeaderboard: jest.fn(),
  findRewards: jest.fn(),
  createReward: jest.fn(),
  patchReward: jest.fn(),
  deleteReward: jest.fn(),
};

const mockUser: User = { id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User;

describe('ScoresController', () => {
  let controller: ScoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoresController],
      providers: [{ provide: ScoresService, useValue: mockScoresService }],
    }).compile();

    controller = module.get<ScoresController>(ScoresController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getLeaderboard() délègue au service', async () => {
    const expected = { period: 'weekly', entries: [] };
    mockScoresService.getLeaderboard.mockResolvedValue(expected);
    const q: LeaderboardQueryDto = { period: 'weekly', week: 22, year: 2026 };

    const result = await controller.getLeaderboard('group-1', q);

    expect(mockScoresService.getLeaderboard).toHaveBeenCalledWith('group-1', q);
    expect(result).toBe(expected);
  });

  it('findRewards() délègue au service', async () => {
    const expected = [{ id: 'r-1', title: 'Choix du film' }];
    mockScoresService.findRewards.mockResolvedValue(expected);

    const result = await controller.findRewards('group-1');

    expect(mockScoresService.findRewards).toHaveBeenCalledWith('group-1');
    expect(result).toBe(expected);
  });

  it('createReward() délègue au service avec user', async () => {
    const dto = { title: 'Choix du film', assignedTo: RewardAssignee.WINNER };
    const expected = { id: 'r-1', ...dto };
    mockScoresService.createReward.mockResolvedValue(expected);

    const result = await controller.createReward('group-1', dto, mockUser);

    expect(mockScoresService.createReward).toHaveBeenCalledWith('group-1', dto, mockUser);
    expect(result).toBe(expected);
  });

  it('patchReward() délègue au service', async () => {
    const expected = { id: 'r-1', isActive: false };
    mockScoresService.patchReward.mockResolvedValue(expected);

    const result = await controller.patchReward('r-1', { isActive: false });

    expect(mockScoresService.patchReward).toHaveBeenCalledWith('r-1', { isActive: false });
    expect(result).toBe(expected);
  });

  it('deleteReward() délègue au service', async () => {
    mockScoresService.deleteReward.mockResolvedValue(undefined);

    await controller.deleteReward('r-1');

    expect(mockScoresService.deleteReward).toHaveBeenCalledWith('r-1');
  });
});
