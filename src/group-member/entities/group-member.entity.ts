import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Group, { eager: true })
  group: Group;

  @Column({ default: 'MEMBER' })
  role: 'ADMIN' | 'MEMBER';

  @CreateDateColumn()
  joinedAt: Date;
}
