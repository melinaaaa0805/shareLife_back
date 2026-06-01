import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { Reward } from './entities/reward.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { PatchRewardDto } from './dto/patch-reward.dto';
import { RewardAssignee } from './enums/reward-assignee.enum';

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  email: string;
  score: number;
  rank: number;
}

export interface LeaderboardResult {
  period: 'weekly' | 'monthly';
  week?: number;
  month?: number;
  year: number;
  entries: LeaderboardEntry[];
  winnerReward: object | null;
  loserReward: object | null;
}

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
  ) {}

  // ── Leaderboard ─────────────────────────────────────────────────────────────

  async getLeaderboard(
    groupId: string,
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResult> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    if (query.period === 'weekly' && !query.week) {
      throw new BadRequestException(
        'Le paramètre "week" est requis pour la période hebdomadaire',
      );
    }
    if (query.period === 'monthly' && !query.month) {
      throw new BadRequestException(
        'Le paramètre "month" est requis pour la période mensuelle',
      );
    }

    const qb = this.assignmentRepo
      .createQueryBuilder('ta')
      .innerJoin('ta.task', 't')
      .innerJoin('ta.user', 'u')
      .innerJoin('t.group', 'g')
      .select([
        'u.id        AS "userId"',
        'u.firstName AS "firstName"',
        'u.email     AS "email"',
        't.weight    AS "weight"',
        't.duration  AS "duration"',
      ])
      .where('g.id = :groupId', { groupId })
      .andWhere('ta.status = :status', { status: 'DONE' });

    if (query.period === 'weekly') {
      qb.andWhere('t.weekNumber = :week', { week: query.week })
        .andWhere('t.year = :year', { year: query.year });
    } else {
      qb.andWhere('EXTRACT(MONTH FROM t.date::date) = :month', { month: query.month })
        .andWhere('EXTRACT(YEAR FROM t.date::date) = :year', { year: query.year });
    }

    const rows: {
      userId: string;
      firstName: string;
      email: string;
      weight: string | number;
      duration: string | number | null;
    }[] = await qb.getRawMany();

    // Aggregate scores per user
    const scoreMap = new Map<
      string,
      { firstName: string; email: string; rawScore: number }
    >();

    for (const row of rows) {
      const weight = Number(row.weight) || 1;
      const duration =
        row.duration !== null && row.duration !== undefined
          ? Number(row.duration)
          : 30;
      const rowScore = weight * (1 + Math.min(duration, 120) / 60);

      if (scoreMap.has(row.userId)) {
        scoreMap.get(row.userId)!.rawScore += rowScore;
      } else {
        scoreMap.set(row.userId, {
          firstName: row.firstName,
          email: row.email,
          rawScore: rowScore,
        });
      }
    }

    const sorted = Array.from(scoreMap.entries())
      .map(([userId, data]) => ({
        userId,
        firstName: data.firstName,
        email: data.email,
        score: Math.round(data.rawScore * 10) / 10,
      }))
      .sort((a, b) => b.score - a.score);

    const entries: LeaderboardEntry[] = sorted.map((e, idx) => ({
      ...e,
      rank: idx + 1,
    }));

    // Fetch active rewards
    const rewards = await this.rewardRepo.find({
      where: { group: { id: groupId }, isActive: true },
    });

    const winnerReward =
      rewards.find((r) => r.assignedTo === RewardAssignee.WINNER) ?? null;
    const loserReward =
      rewards.find((r) => r.assignedTo === RewardAssignee.LOSER) ?? null;

    return {
      period: query.period,
      week: query.week,
      month: query.month,
      year: query.year,
      entries,
      winnerReward: winnerReward ? this.formatReward(winnerReward) : null,
      loserReward: loserReward ? this.formatReward(loserReward) : null,
    };
  }

  // ── Rewards CRUD ─────────────────────────────────────────────────────────────

  async findRewards(groupId: string): Promise<object[]> {
    const rewards = await this.rewardRepo.find({
      where: { group: { id: groupId } },
      order: { createdAt: 'DESC' },
    });
    return rewards.map((r) => this.formatReward(r));
  }

  async createReward(
    groupId: string,
    dto: CreateRewardDto,
    user: User,
  ): Promise<object> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const reward = this.rewardRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      assignedTo: dto.assignedTo,
      isActive: true,
      group,
      createdBy: user,
    });

    const saved = await this.rewardRepo.save(reward);
    return this.formatReward(saved);
  }

  async patchReward(rewardId: string, dto: PatchRewardDto): Promise<object> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Récompense non trouvée');
    reward.isActive = dto.isActive;
    return this.formatReward(await this.rewardRepo.save(reward));
  }

  async deleteReward(rewardId: string): Promise<void> {
    const reward = await this.rewardRepo.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Récompense non trouvée');
    await this.rewardRepo.delete(rewardId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private formatReward(r: Reward): object {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      assignedTo: r.assignedTo,
      isActive: r.isActive,
      createdAt: r.createdAt,
      createdBy: r.createdBy
        ? {
            id: r.createdBy.id,
            firstName: r.createdBy.firstName,
            email: r.createdBy.email,
          }
        : null,
    };
  }
}
