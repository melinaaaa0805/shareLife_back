import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MealVote } from './entities/meal-vote.entity';
import { WeeklyMeal } from '../meals/entities/weekly-meal.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class MealVotesService {
  constructor(
    @InjectRepository(MealVote)
    private voteRepo: Repository<MealVote>,
    @InjectRepository(WeeklyMeal)
    private mealRepo: Repository<WeeklyMeal>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
  ) {}

  async vote(
    userId: string,
    mealId: string,
    dayOfWeek: number,
    groupId: string,
    weekNumber: number,
    year: number,
  ) {
    const meal = await this.mealRepo.findOne({ where: { id: mealId } });
    if (!meal) throw new NotFoundException('Repas non trouvé');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    // Supprimer tous les votes existants de cet user ce jour (évite les doublons)
    const existingVotes = await this.voteRepo
      .createQueryBuilder('vote')
      .where('vote.userId = :userId', { userId })
      .andWhere('vote.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('vote.weekNumber = :weekNumber', { weekNumber })
      .andWhere('vote.year = :year', { year })
      .andWhere('vote.groupId = :groupId', { groupId })
      .getMany();
    if (existingVotes.length > 0) {
      await this.voteRepo.remove(existingVotes);
    }

    const vote = this.voteRepo.create({
      meal,
      user,
      group,
      dayOfWeek,
      weekNumber,
      year,
    });
    const saved = await this.voteRepo.save(vote);

    // Recharger avec les relations pour que le front reçoive meal + user
    return this.voteRepo.findOne({
      where: { id: saved.id },
      relations: ['meal', 'user'],
    });
  }

  async getVotesForDay(
    groupId: string,
    year: number,
    weekNumber: number,
    dayOfWeek: number,
  ) {
    return this.voteRepo.find({
      where: { group: { id: groupId }, year, weekNumber, dayOfWeek },
      relations: ['meal', 'user'],
    });
  }

  async getVotesForWeek(groupId: string, year: number, weekNumber: number) {
    return this.voteRepo.find({
      where: { group: { id: groupId }, year, weekNumber },
      relations: ['meal', 'user'],
    });
  }

  async removeVote(id: string) {
    const vote = await this.voteRepo.findOne({ where: { id } });
    if (!vote) throw new NotFoundException('Vote non trouvé');
    return this.voteRepo.remove(vote);
  }

  async getUserVoteForDay(
    userId: string,
    groupId: string,
    year: number,
    weekNumber: number,
    dayOfWeek: number,
  ) {
    return this.voteRepo.findOne({
      where: {
        user: { id: userId },
        group: { id: groupId },
        year,
        weekNumber,
        dayOfWeek,
      },
      relations: ['meal'],
    });
  }
}
