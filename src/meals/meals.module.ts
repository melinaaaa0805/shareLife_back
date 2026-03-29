import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { WeeklyMeal } from './entities/weekly-meal.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyMeal, Group, User, ShoppingList])],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
