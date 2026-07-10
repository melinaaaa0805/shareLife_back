import { Test, TestingModule } from '@nestjs/testing';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { User } from '../users/entities/user.entity';

const mockInsightsService = {
  getInsights: jest.fn(),
};

const mockUser: User = { id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User;

describe('InsightsController', () => {
  let controller: InsightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [{ provide: InsightsService, useValue: mockInsightsService }],
    }).compile();

    controller = module.get<InsightsController>(InsightsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getInsights() délègue au service avec les bons paramètres', async () => {
    const expected = [{ id: 'weekly-summary', type: 'WEEKLY_SUMMARY' }];
    mockInsightsService.getInsights.mockResolvedValue(expected);

    const result = await controller.getInsights('group-1', '22', '2026', mockUser);

    expect(mockInsightsService.getInsights).toHaveBeenCalledWith('group-1', 22, 2026, mockUser.id);
    expect(result).toBe(expected);
  });

  it('getInsights() parse correctement week et year en entiers', async () => {
    mockInsightsService.getInsights.mockResolvedValue([]);

    await controller.getInsights('group-1', '5', '2025', mockUser);

    expect(mockInsightsService.getInsights).toHaveBeenCalledWith('group-1', 5, 2025, mockUser.id);
  });
});
