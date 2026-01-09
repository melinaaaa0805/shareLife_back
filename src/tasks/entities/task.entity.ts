import { Group } from '../../groups/entities/group.entity';
import { TaskAssignment } from '../../task-assignment/entities/task-assignment.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Sans titre' })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', default: 'ONCE' })
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';

  @Column({ default: 1 })
  weekNumber: number;

  @Column({ default: () => 'EXTRACT(YEAR FROM CURRENT_DATE)::int' })
  year: number;

  @Column({ default: 0 })
  dayOfWeek: number; // 0 = lundi, 6 = dimanche

  @Column({ default: 1 })
  weight: number; // 0 = lundi, 6 = dimanche

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @OneToMany(() => TaskAssignment, (ta) => ta.task)
  assignments: TaskAssignment[];

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  createdBy: User;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ default: false })
  isTemplate: boolean; // <-- nouveau champ
}
