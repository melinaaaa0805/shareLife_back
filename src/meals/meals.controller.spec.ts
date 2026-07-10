import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { User } from '../users/entities/user.entity';

const mockMealsService = {
  searchTheMealDB: jest.fn(),
  getCatalog: jest.fn(),
  addIngredientsToShoppingList: jest.fn(),
  findByWeek: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockUser: User = { id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User;

describe('MealsController', () => {
  let controller: MealsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealsController],
      providers: [{ provide: MealsService, useValue: mockMealsService }],
    }).compile();

    controller = module.get<MealsController>(MealsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search()', () => {
    it('retourne [] si query est absente ou trop courte', () => {
      expect(controller.search('')).toEqual([]);
      expect(controller.search('a')).toEqual([]);
      expect(mockMealsService.searchTheMealDB).not.toHaveBeenCalled();
    });

    it('délègue à searchTheMealDB si query >= 2 caractères', () => {
      mockMealsService.searchTheMealDB.mockResolvedValue([{ name: 'Pizza' }]);
      controller.search('pi');
      expect(mockMealsService.searchTheMealDB).toHaveBeenCalledWith('pi');
    });
  });

  it('catalog() délègue au service', () => {
    mockMealsService.getCatalog.mockReturnValue([]);
    controller.catalog('riz');
    expect(mockMealsService.getCatalog).toHaveBeenCalledWith('riz');
  });

  it('addToShoppingList() délègue au service', async () => {
    mockMealsService.addIngredientsToShoppingList.mockResolvedValue({});
    await controller.addToShoppingList('meal-1', { groupId: 'group-1', weekNumber: 22, year: 2026 });
    expect(mockMealsService.addIngredientsToShoppingList).toHaveBeenCalledWith('meal-1', 'group-1', 22, 2026);
  });

  it('findByWeek() convertit les params en entiers et délègue', async () => {
    mockMealsService.findByWeek.mockResolvedValue([]);
    await controller.findByWeek('group-1', '2026', '22');
    expect(mockMealsService.findByWeek).toHaveBeenCalledWith('group-1', 2026, 22);
  });

  it('create() passe groupId, user.id et body au service', async () => {
    const body = { name: 'Pizza', ingredients: [], weekNumber: 22, year: 2026 };
    mockMealsService.create.mockResolvedValue({ id: 'meal-1', ...body });
    await controller.create('group-1', mockUser, body);
    expect(mockMealsService.create).toHaveBeenCalledWith('group-1', mockUser.id, body);
  });

  it('update() délègue au service', async () => {
    mockMealsService.update.mockResolvedValue({});
    await controller.update('meal-1', { name: 'Pasta' });
    expect(mockMealsService.update).toHaveBeenCalledWith('meal-1', { name: 'Pasta' });
  });

  it('delete() délègue au service', async () => {
    mockMealsService.delete.mockResolvedValue(undefined);
    await controller.delete('meal-1');
    expect(mockMealsService.delete).toHaveBeenCalledWith('meal-1');
  });
});
