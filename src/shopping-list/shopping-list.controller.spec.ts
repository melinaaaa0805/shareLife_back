import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from '../groups/entities/group.entity';

describe('ShoppingListController', () => {
  let controller: ShoppingListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingListController],
      providers: [
        { provide: ShoppingListService, useValue: {} },
        { provide: getRepositoryToken(Group), useValue: {} },
      ],
    }).compile();

    controller = module.get<ShoppingListController>(ShoppingListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
