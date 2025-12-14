import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class TaskAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, { eager: true })
  task: Task;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'DONE';

  @Column({ nullable: true })
  completedAt: Date;
}
