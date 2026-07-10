import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoresService } from './scores.service';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { Reward } from './entities/reward.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { RewardAssignee } from './enums/reward-assignee.enum';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

// ── Query builder mock ────────────────────────────────────────────────────────
const makeMockQb = (rows: object[] = []) => ({
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rows),
});

const mockAssignmentRepo = () => ({
  createQueryBuilder: jest.fn(),
});

const mockRewardRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockGroupRepo = () => ({
  findOne: jest.fn(),
});

const makeGroup = (): Group => ({ id: 'group-1', name: 'Coloc' } as Group);
const makeUser = (): User =>
  ({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User);

const makeReward = (assignedTo = RewardAssignee.WINNER): Reward =>
  ({
    id: 'reward-1',
    title: 'Choix du film',
    description: null,
    assignedTo,
    isActive: true,
    group: makeGroup(),
    createdBy: makeUser(),
    createdAt: new Date(),
  } as Reward);

describe('ScoresService', () => {
  let service: ScoresService;
  let assignmentRepo: ReturnType<typeof mockAssignmentRepo>;
  let rewardRepo: ReturnType<typeof mockRewardRepo>;
  let groupRepo: ReturnType<typeof mockGroupRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoresService,
        { provide: getRepositoryToken(TaskAssignment), useFactory: mockAssignmentRepo },
        { provide: getRepositoryToken(Reward), useFactory: mockRewardRepo },
        { provide: getRepositoryToken(Group), useFactory: mockGroupRepo },
      ],
    }).compile();

    service = module.get<ScoresService>(ScoresService);
    assignmentRepo = module.get(getRepositoryToken(TaskAssignment));
    rewardRepo = module.get(getRepositoryToken(Reward));
    groupRepo = module.get(getRepositoryToken(Group));
  });

  afterEach(() => jest.clearAllMocks());

  // ── getLeaderboard ─────────────────────────────────────────────────────────

  describe('getLeaderboard()', () => {
    it('throws NotFoundException quand le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      const q: LeaderboardQueryDto = { period: 'weekly', week: 22, year: 2026 };
      await expect(service.getLeaderboard('group-x', q)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException si period=weekly sans week', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const q = { period: 'weekly', year: 2026 } as LeaderboardQueryDto;
      await expect(service.getLeaderboard('group-1', q)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException si period=monthly sans month', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const q = { period: 'monthly', year: 2026 } as LeaderboardQueryDto;
      await expect(service.getLeaderboard('group-1', q)).rejects.toThrow(BadRequestException);
    });

    it('retourne un leaderboard vide quand aucune tâche terminée', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      rewardRepo.find.mockResolvedValue([]);
      const qb = makeMockQb([]);
      assignmentRepo.createQueryBuilder.mockReturnValue(qb);

      const q: LeaderboardQueryDto = { period: 'weekly', week: 22, year: 2026 };
      const result = await service.getLeaderboard('group-1', q);

      expect(result.entries).toHaveLength(0);
      expect(result.winnerReward).toBeNull();
      expect(result.loserReward).toBeNull();
      expect(result.period).toBe('weekly');
    });

    it('calcule le classement et le rang correctement (période hebdomadaire)', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      rewardRepo.find.mockResolvedValue([makeReward(RewardAssignee.WINNER)]);
      const rows = [
        { userId: 'user-1', firstName: 'Alice', email: 'alice@test.com', weight: '3', duration: '60' },
        { userId: 'user-2', firstName: 'Bob',   email: 'bob@test.com',   weight: '1', duration: '30' },
        { userId: 'user-1', firstName: 'Alice', email: 'alice@test.com', weight: '2', duration: null },
      ];
      const qb = makeMockQb(rows);
      assignmentRepo.createQueryBuilder.mockReturnValue(qb);

      const q: LeaderboardQueryDto = { period: 'weekly', week: 22, year: 2026 };
      const result = await service.getLeaderboard('group-1', q);

      expect(result.entries[0].userId).toBe('user-1');
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[1].userId).toBe('user-2');
      expect(result.entries[1].rank).toBe(2);
      expect(result.winnerReward).not.toBeNull();
    });

    it('filtre par mois pour la période mensuelle', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      rewardRepo.find.mockResolvedValue([]);
      const qb = makeMockQb([]);
      assignmentRepo.createQueryBuilder.mockReturnValue(qb);

      const q: LeaderboardQueryDto = { period: 'monthly', month: 6, year: 2026 };
      await service.getLeaderboard('group-1', q);

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('MONTH'),
        expect.objectContaining({ month: 6 }),
      );
    });
  });

  // ── findRewards ────────────────────────────────────────────────────────────

  describe('findRewards()', () => {
    it('retourne la liste des récompenses formatées', async () => {
      rewardRepo.find.mockResolvedValue([makeReward()]);

      const result = await service.findRewards('group-1') as any[];

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'reward-1', title: 'Choix du film', isActive: true });
    });
  });

  // ── createReward ───────────────────────────────────────────────────────────

  describe('createReward()', () => {
    it('throws NotFoundException quand le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createReward('group-x', { title: 'Test', assignedTo: RewardAssignee.WINNER }, makeUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée et retourne la récompense', async () => {
      const reward = makeReward();
      groupRepo.findOne.mockResolvedValue(makeGroup());
      rewardRepo.create.mockReturnValue(reward);
      rewardRepo.save.mockResolvedValue(reward);

      const result = await service.createReward(
        'group-1',
        { title: 'Choix du film', assignedTo: RewardAssignee.WINNER },
        makeUser(),
      ) as any;

      expect(rewardRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('title', 'Choix du film');
    });
  });

  // ── patchReward ────────────────────────────────────────────────────────────

  describe('patchReward()', () => {
    it('throws NotFoundException quand la récompense est introuvable', async () => {
      rewardRepo.findOne.mockResolvedValue(null);
      await expect(service.patchReward('reward-x', { isActive: false })).rejects.toThrow(NotFoundException);
    });

    it('met à jour isActive et retourne la récompense', async () => {
      const reward = makeReward();
      rewardRepo.findOne.mockResolvedValue(reward);
      rewardRepo.save.mockImplementation(async (r: Reward) => r);

      const result = await service.patchReward('reward-1', { isActive: false }) as any;

      expect(result.isActive).toBe(false);
    });
  });

  // ── deleteReward ───────────────────────────────────────────────────────────

  describe('deleteReward()', () => {
    it('throws NotFoundException quand la récompense est introuvable', async () => {
      rewardRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteReward('reward-x')).rejects.toThrow(NotFoundException);
    });

    it('supprime la récompense', async () => {
      rewardRepo.findOne.mockResolvedValue(makeReward());
      rewardRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.deleteReward('reward-1')).resolves.toBeUndefined();
      expect(rewardRepo.delete).toHaveBeenCalledWith('reward-1');
    });
  });
});
