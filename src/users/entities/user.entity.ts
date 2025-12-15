import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { GroupMember } from '../../group-member/entities/group-member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

@Column({ nullable: true })
  lastName: string;

   @Column({ default: 'MEMBER' }) // tu peux mettre MEMBER par défaut
  role: string;


  // Groupes que l'utilisateur possède
  @OneToMany(() => Group, group => group.owner)
  ownedGroups: Group[];

  // Groupes dont l'utilisateur est membre
  @OneToMany(() => GroupMember, member => member.user)
  groupMemberships: GroupMember[];
}
