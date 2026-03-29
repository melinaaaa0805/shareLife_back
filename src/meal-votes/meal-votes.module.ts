import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealVotesService } from './meal-votes.service';
import { MealVotesController } from './meal-votes.controller';
import { MealVote } from './entities/meal-vote.entity';
import { WeeklyMeal } from '../meals/entities/weekly-meal.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealVote, WeeklyMeal, User, Group])],
  controllers: [MealVotesController],
  providers: [MealVotesService],
})
export class MealVotesModule {}
