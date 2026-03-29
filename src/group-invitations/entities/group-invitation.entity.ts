import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE', eager: true })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  invitedUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  invitedBy: User;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';

  @CreateDateColumn()
  createdAt: Date;
}
