import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  weight: number;

  @Column({ default: 'ONCE' })
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';

  @Column({ nullable: true })
  dueDate: Date;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
