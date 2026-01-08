// shopping-list.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from './entities/shopping-list.entity';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private shoppingListRepo: Repository<ShoppingList>,
  ) {}

  create(
    group: Group,
    weekNumber: number,
    items: { name: string; quantity: string }[],
  ) {
    const shoppingList = this.shoppingListRepo.create({
      group,
      weekNumber,
      items,
    });
    return this.shoppingListRepo.save(shoppingList);
  }

  findAllByGroup(groupId: string) {
    return this.shoppingListRepo.find({
      where: { group: { id: groupId } },
      order: { weekNumber: 'ASC' },
    });
  }

  findById(id: string) {
    return this.shoppingListRepo.findOne({ where: { id } });
  }

  async update(id: string, items: { name: string; quantity: string }[]) {
    const list = await this.shoppingListRepo.findOne({ where: { id } });
    if (!list) return null;
    list.items = items;
    return this.shoppingListRepo.save(list);
  }

  delete(id: string) {
    return this.shoppingListRepo.delete(id);
  }
}
