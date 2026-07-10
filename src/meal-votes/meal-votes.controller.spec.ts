import { Test, TestingModule } from '@nestjs/testing';
import { MealVotesController } from './meal-votes.controller';
import { MealVotesService } from './meal-votes.service';

const mockMealVotesService = {
  vote: jest.fn(),
  getVotesForDay: jest.fn(),
  getVotesForWeek: jest.fn(),
  getUserVoteForDay: jest.fn(),
  removeVote: jest.fn(),
};

const mockReq = { user: { id: 'user-1' } };

describe('MealVotesController', () => {
  let controller: MealVotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealVotesController],
      providers: [{ provide: MealVotesService, useValue: mockMealVotesService }],
    }).compile();

    controller = module.get<MealVotesController>(MealVotesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('vote() extrait userId du request et délègue au service', async () => {
    const body = { mealId: 'meal-1', dayOfWeek: 1, groupId: 'group-1', weekNumber: 22, year: 2026 };
    mockMealVotesService.vote.mockResolvedValue({ id: 'vote-1' });

    await controller.vote(mockReq, body);

    expect(mockMealVotesService.vote).toHaveBeenCalledWith(
      'user-1', 'meal-1', 1, 'group-1', 22, 2026,
    );
  });

  it('getVotesForDay() convertit les params et délègue', async () => {
    mockMealVotesService.getVotesForDay.mockResolvedValue([]);
    await controller.getVotesForDay('group-1', '2026', '22', '1');
    expect(mockMealVotesService.getVotesForDay).toHaveBeenCalledWith('group-1', 2026, 22, 1);
  });

  it('getVotesForWeek() convertit les params et délègue', async () => {
    mockMealVotesService.getVotesForWeek.mockResolvedValue([]);
    await controller.getVotesForWeek('group-1', '2026', '22');
    expect(mockMealVotesService.getVotesForWeek).toHaveBeenCalledWith('group-1', 2026, 22);
  });

  it('getMyVote() extrait userId et délègue', async () => {
    mockMealVotesService.getUserVoteForDay.mockResolvedValue(null);
    await controller.getMyVote(mockReq, 'group-1', '2026', '22', '1');
    expect(mockMealVotesService.getUserVoteForDay).toHaveBeenCalledWith('user-1', 'group-1', 2026, 22, 1);
  });

  it('removeVote() délègue au service', async () => {
    mockMealVotesService.removeVote.mockResolvedValue(undefined);
    await controller.removeVote('vote-1');
    expect(mockMealVotesService.removeVote).toHaveBeenCalledWith('vote-1');
  });
});
