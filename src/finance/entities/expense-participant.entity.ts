import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ExpenseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Expense', (e: any) => e.participants, { onDelete: 'CASCADE' })
  expense: any;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  share: number;
}
