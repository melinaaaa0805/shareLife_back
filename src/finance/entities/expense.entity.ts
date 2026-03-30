import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';
import { ExpenseParticipant } from './expense-participant.entity';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { SplitMode } from '../enums/split-mode.enum';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Column({ type: 'varchar', default: SplitMode.EQUAL })
  splitMode: SplitMode;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'paidById' })
  paidBy: User | null;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @OneToMany(() => ExpenseParticipant, (ep) => ep.expense, {
    eager: true,
    cascade: true,
  })
  participants: ExpenseParticipant[];

  @CreateDateColumn()
  createdAt: Date;
}
