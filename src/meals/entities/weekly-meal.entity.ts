import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { MealVote } from '../../meal-votes/entities/meal-vote.entity';

export interface MealIngredient {
  name: string;
  quantity: string;
  unit?: string;
}

@Entity()
export class WeeklyMeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'text' })
  imageUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  externalId: string | null; // TheMealDB ID

  @Column('json', { default: [] })
  ingredients: MealIngredient[];

  @Column()
  weekNumber: number;

  @Column()
  year: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  proposedBy: User | null;

  @OneToMany(() => MealVote, (vote) => vote.meal, { cascade: true })
  votes: MealVote[];

  @CreateDateColumn()
  createdAt: Date;
}
