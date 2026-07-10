import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealVotesService } from './meal-votes.service';
import { MealVote } from './entities/meal-vote.entity';
import { WeeklyMeal } from '../meals/entities/weekly-meal.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';

const makeMockQb = (rows: any[] = []) => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(rows),
});

const mockVoteRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});
const mockMealRepo = () => ({ findOne: jest.fn() });
const mockUserRepo = () => ({ findOne: jest.fn() });
const mockGroupRepo = () => ({ findOne: jest.fn() });

const makeUser = (): User => ({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User);
const makeMeal = (): WeeklyMeal => ({ id: 'meal-1', name: 'Pizza' } as unknown as WeeklyMeal);
const makeGroup = (): Group => ({ id: 'group-1', name: 'Coloc' } as Group);
const makeVote = (): MealVote => ({
  id: 'vote-1', meal: makeMeal(), user: makeUser(), group: makeGroup(), dayOfWeek: 1, weekNumber: 22, year: 2026,
} as unknown as MealVote);

describe('MealVotesService', () => {
  let service: MealVotesService;
  let voteRepo: ReturnType<typeof mockVoteRepo>;
  let mealRepo: ReturnType<typeof mockMealRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let groupRepo: ReturnType<typeof mockGroupRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealVotesService,
        { provide: getRepositoryToken(MealVote), useFactory: mockVoteRepo },
        { provide: getRepositoryToken(WeeklyMeal), useFactory: mockMealRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(Group), useFactory: mockGroupRepo },
      ],
    }).compile();

    service = module.get<MealVotesService>(MealVotesService);
    voteRepo = module.get(getRepositoryToken(MealVote));
    mealRepo = module.get(getRepositoryToken(WeeklyMeal));
    userRepo = module.get(getRepositoryToken(User));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  // ── vote ───────────────────────────────────────────────────────────────────

  describe('vote()', () => {
    it('throws NotFoundException si le repas est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(null);
      await expect(service.vote('user-1', 'meal-x', 1, 'group-1', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException si l\'utilisateur est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(makeMeal());
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.vote('user-x', 'meal-1', 1, 'group-1', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException si le groupe est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(makeMeal());
      userRepo.findOne.mockResolvedValue(makeUser());
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.vote('user-1', 'meal-1', 1, 'group-x', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('supprime les votes existants du jour et crée un nouveau vote', async () => {
      mealRepo.findOne.mockResolvedValue(makeMeal());
      userRepo.findOne.mockResolvedValue(makeUser());
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const qb = makeMockQb([]);
      voteRepo.createQueryBuilder.mockReturnValue(qb);
      const vote = makeVote();
      voteRepo.create.mockReturnValue(vote);
      voteRepo.save.mockResolvedValue(vote);
      voteRepo.findOne.mockResolvedValue(vote);

      const result = await service.vote('user-1', 'meal-1', 1, 'group-1', 22, 2026);

      expect(voteRepo.save).toHaveBeenCalled();
      expect(result).toBe(vote);
    });

    it('supprime les votes existants avant d\'en créer un nouveau', async () => {
      mealRepo.findOne.mockResolvedValue(makeMeal());
      userRepo.findOne.mockResolvedValue(makeUser());
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const existingVote = makeVote();
      const qb = makeMockQb([existingVote]);
      voteRepo.createQueryBuilder.mockReturnValue(qb);
      voteRepo.remove.mockResolvedValue(undefined);
      const newVote = makeVote();
      voteRepo.create.mockReturnValue(newVote);
      voteRepo.save.mockResolvedValue(newVote);
      voteRepo.findOne.mockResolvedValue(newVote);

      await service.vote('user-1', 'meal-1', 1, 'group-1', 22, 2026);

      expect(voteRepo.remove).toHaveBeenCalledWith([existingVote]);
    });
  });

  // ── getVotesForDay ─────────────────────────────────────────────────────────

  it('getVotesForDay() retourne les votes du jour', async () => {
    voteRepo.find.mockResolvedValue([makeVote()]);
    const result = await service.getVotesForDay('group-1', 2026, 22, 1);
    expect(voteRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ dayOfWeek: 1, weekNumber: 22 }),
    }));
    expect(result).toHaveLength(1);
  });

  // ── getVotesForWeek ────────────────────────────────────────────────────────

  it('getVotesForWeek() retourne les votes de la semaine', async () => {
    voteRepo.find.mockResolvedValue([makeVote()]);
    const result = await service.getVotesForWeek('group-1', 2026, 22);
    expect(result).toHaveLength(1);
  });

  // ── removeVote ─────────────────────────────────────────────────────────────

  describe('removeVote()', () => {
    it('throws NotFoundException si le vote est introuvable', async () => {
      voteRepo.findOne.mockResolvedValue(null);
      await expect(service.removeVote('vote-x')).rejects.toThrow(NotFoundException);
    });

    it('supprime le vote', async () => {
      const vote = makeVote();
      voteRepo.findOne.mockResolvedValue(vote);
      voteRepo.remove.mockResolvedValue(undefined);
      await service.removeVote('vote-1');
      expect(voteRepo.remove).toHaveBeenCalledWith(vote);
    });
  });

  // ── getUserVoteForDay ──────────────────────────────────────────────────────

  it('getUserVoteForDay() retourne le vote de l\'utilisateur pour le jour', async () => {
    const vote = makeVote();
    voteRepo.findOne.mockResolvedValue(vote);
    const result = await service.getUserVoteForDay('user-1', 'group-1', 2026, 22, 1);
    expect(result).toBe(vote);
  });
});
