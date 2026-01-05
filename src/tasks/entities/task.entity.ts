
import { IsNotEmpty, IsString } from 'class-validator';
import { Group } from '../../groups/entities/group.entity';
import { TaskAssignment } from '../../task-assignment/entities/task-assignment.entity';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ default: 1 })
  weight: number;

  @Column({ type: 'varchar', default: 'ONCE' })
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  time: string | null;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
  // Dans task.entity.ts
@OneToMany(() => TaskAssignment, a => a.task)
taskAssignments: TaskAssignment[];

}
