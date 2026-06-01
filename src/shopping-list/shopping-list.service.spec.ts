import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListService } from './shopping-list.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ShoppingList } from './entities/shopping-list.entity';

describe('ShoppingListService', () => {
  let service: ShoppingListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListService,
        {
          provide: getRepositoryToken(ShoppingList),
          useValue: { findOne: jest.fn(), save: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ShoppingListService>(ShoppingListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
