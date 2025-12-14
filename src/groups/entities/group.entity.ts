import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from '../../group-member/entities/group-member.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relation vers l'utilisateur propriétaire
  @ManyToOne(() => User, user => user.ownedGroups, { eager: true })
  owner: User;

  // Relation vers les membres du groupe
  @OneToMany(() => GroupMember, member => member.group, { cascade: true })
  members: GroupMember[];
}
