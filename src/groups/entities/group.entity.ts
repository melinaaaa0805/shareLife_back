import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupMember } from '../../group-member/entities/group-member.entity';
import { ShoppingList } from '../../shopping-list/entities/shopping-list.entity';
import { Task } from '../../tasks/entities/task.entity';

export type GroupMode = 'FREE' | 'FUNNY' | 'SMART';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', default: 'FREE' })
  mode: GroupMode;

  @Column({ nullable: true, type: 'int' })
  weeklyAdminWeek: number | null;

  @Column({ nullable: true, type: 'int' })
  weeklyAdminYear: number | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'weeklyAdminId' })
  weeklyAdmin: User | null;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  owner: User;

  @OneToMany(() => GroupMember, (gm) => gm.group, { eager: true })
  members: GroupMember[];

  @OneToMany(() => ShoppingList, (list) => list.group)
  shoppingLists: ShoppingList[];

  @OneToMany(() => Task, (task) => task.group, { eager: true })
  task: Task[];
}
