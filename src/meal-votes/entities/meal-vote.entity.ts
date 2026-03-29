import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { WeeklyMeal } from '../../meals/entities/weekly-meal.entity';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class MealVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyMeal, (meal) => meal.votes, { onDelete: 'CASCADE' })
  meal: WeeklyMeal;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @Column()
  dayOfWeek: number; // 0 = lundi, 6 = dimanche

  @Column()
  weekNumber: number;

  @Column()
  year: number;

  @CreateDateColumn()
  createdAt: Date;
}
