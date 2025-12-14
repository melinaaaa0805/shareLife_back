import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, group => group.members, { onDelete: 'CASCADE' })
  group: Group;

  @ManyToOne(() => User, user => user.groupMemberships, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  joinedAt: Date;
}
