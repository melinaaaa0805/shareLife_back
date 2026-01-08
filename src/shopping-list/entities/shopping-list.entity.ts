// shopping-list.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Group } from '../../groups/entities/group.entity';

@Entity()
export class ShoppingList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  weekNumber: number; // numéro de la semaine

  @Column('json', { default: [] })
  items: { name: string; quantity: string }[]; // exemple : [{name: 'Oeufs', quantity: '12'}]

  @ManyToOne(() => Group, (group) => group.shoppingLists)
  group: Group;

  @CreateDateColumn()
  createdAt: Date;
}
