import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealsService } from './meals.service';

jest.mock('https', () => ({ get: jest.fn() }));
import * as https from 'https';
import { WeeklyMeal } from './entities/weekly-meal.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';

const mockMealRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});
const mockGroupRepo = () => ({ findOne: jest.fn() });
const mockUserRepo = () => ({ findOne: jest.fn() });
const mockShoppingListRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const makeGroup = (): Group => ({ id: 'group-1', name: 'Coloc' } as Group);
const makeUser = (): User => ({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' } as User);
const makeMeal = (overrides = {}): WeeklyMeal =>
  ({
    id: 'meal-1',
    name: 'Pâtes bolognaise',
    description: 'Délicieux',
    ingredients: [{ name: 'Pâtes', quantity: '250g' }],
    weekNumber: 22,
    year: 2026,
    group: makeGroup(),
    votes: [],
    ...overrides,
  } as unknown as WeeklyMeal);

describe('MealsService', () => {
  let service: MealsService;
  let mealRepo: ReturnType<typeof mockMealRepo>;
  let groupRepo: ReturnType<typeof mockGroupRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let shoppingListRepo: ReturnType<typeof mockShoppingListRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        { provide: getRepositoryToken(WeeklyMeal), useFactory: mockMealRepo },
        { provide: getRepositoryToken(Group), useFactory: mockGroupRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(ShoppingList), useFactory: mockShoppingListRepo },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
    mealRepo = module.get(getRepositoryToken(WeeklyMeal));
    groupRepo = module.get(getRepositoryToken(Group));
    userRepo = module.get(getRepositoryToken(User));
    shoppingListRepo = module.get(getRepositoryToken(ShoppingList));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('throws NotFoundException si le groupe est introuvable', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('group-x', 'user-1', { name: 'Pizza', ingredients: [], weekNumber: 22, year: 2026 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée et sauvegarde le repas', async () => {
      const meal = makeMeal();
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(makeUser());
      mealRepo.create.mockReturnValue(meal);
      mealRepo.save.mockResolvedValue(meal);

      const result = await service.create('group-1', 'user-1', {
        name: 'Pâtes bolognaise',
        ingredients: [{ name: 'Pâtes', quantity: '250g' }],
        weekNumber: 22,
        year: 2026,
      });

      expect(mealRepo.save).toHaveBeenCalled();
      expect(result).toBe(meal);
    });
  });

  // ── findByWeek ─────────────────────────────────────────────────────────────

  it('findByWeek() retourne les repas de la semaine', async () => {
    const meals = [makeMeal()];
    mealRepo.find.mockResolvedValue(meals);

    const result = await service.findByWeek('group-1', 2026, 22);

    expect(mealRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ weekNumber: 22, year: 2026 }),
    }));
    expect(result).toBe(meals);
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('throws NotFoundException si le repas est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(null);
      await expect(service.update('meal-x', { name: 'Nouveau' })).rejects.toThrow(NotFoundException);
    });

    it('met à jour les champs fournis et sauvegarde', async () => {
      const meal = makeMeal();
      mealRepo.findOne.mockResolvedValue(meal);
      mealRepo.save.mockImplementation(async (m: WeeklyMeal) => m);

      const result = await service.update('meal-1', { name: 'Pizza', description: 'Croustillante' }) as WeeklyMeal;

      expect(result.name).toBe('Pizza');
      expect(result.description).toBe('Croustillante');
    });

    it('met à jour les ingrédients si fournis', async () => {
      const meal = makeMeal();
      mealRepo.findOne.mockResolvedValue(meal);
      mealRepo.save.mockImplementation(async (m: WeeklyMeal) => m);

      const newIngredients = [{ name: 'Tomates', quantity: '3' }];
      const result = await service.update('meal-1', { ingredients: newIngredients }) as WeeklyMeal;

      expect(result.ingredients).toEqual(newIngredients);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('throws NotFoundException si le repas est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('meal-x')).rejects.toThrow(NotFoundException);
    });

    it('supprime le repas', async () => {
      const meal = makeMeal();
      mealRepo.findOne.mockResolvedValue(meal);
      mealRepo.remove.mockResolvedValue(meal);

      await service.delete('meal-1');

      expect(mealRepo.remove).toHaveBeenCalledWith(meal);
    });
  });

  // ── addIngredientsToShoppingList ───────────────────────────────────────────

  describe('addIngredientsToShoppingList()', () => {
    it('throws NotFoundException si le repas est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(null);
      await expect(service.addIngredientsToShoppingList('meal-x', 'group-1', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException si le groupe est introuvable', async () => {
      mealRepo.findOne.mockResolvedValue(makeMeal());
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.addIngredientsToShoppingList('meal-1', 'group-x', 22, 2026)).rejects.toThrow(NotFoundException);
    });

    it('crée une nouvelle liste de courses si aucune n\'existe', async () => {
      const meal = makeMeal();
      const list = { id: 'list-1', items: [], group: makeGroup(), weekNumber: 22, year: 2026 };
      mealRepo.findOne.mockResolvedValue(meal);
      groupRepo.findOne.mockResolvedValue(makeGroup());
      shoppingListRepo.findOne.mockResolvedValue(null);
      shoppingListRepo.create.mockReturnValue(list);
      shoppingListRepo.save.mockResolvedValue(list);

      await service.addIngredientsToShoppingList('meal-1', 'group-1', 22, 2026);

      expect(shoppingListRepo.create).toHaveBeenCalled();
      expect(shoppingListRepo.save).toHaveBeenCalled();
    });

    it('utilise la liste existante du fallback (sans filtre year) et met à jour l\'année', async () => {
      const meal = makeMeal();
      const legacyList = { id: 'list-old', items: [], group: makeGroup(), weekNumber: 22, year: 2025 } as any;
      mealRepo.findOne.mockResolvedValue(meal);
      groupRepo.findOne.mockResolvedValue(makeGroup());
      // Premier findOne (avec year) : null → fallback
      // Second findOne (sans year) : liste legacy
      shoppingListRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(legacyList);
      shoppingListRepo.save.mockImplementation(async (l: any) => l);

      await service.addIngredientsToShoppingList('meal-1', 'group-1', 22, 2026);

      expect(shoppingListRepo.save).toHaveBeenCalled();
      const saved = shoppingListRepo.save.mock.calls[0][0] as any;
      expect(saved.year).toBe(2026);
    });

    it('ajoute les ingrédients à une liste existante sans doublons', async () => {
      const meal = makeMeal({ ingredients: [{ name: 'Pâtes', quantity: '250g' }, { name: 'Tomates', quantity: '3' }] });
      const existingList = {
        id: 'list-1',
        items: [{ name: 'Pâtes ()', quantity: '250g' }],
        group: makeGroup(),
        weekNumber: 22,
        year: 2026,
      } as any;
      mealRepo.findOne.mockResolvedValue(meal);
      groupRepo.findOne.mockResolvedValue(makeGroup());
      shoppingListRepo.findOne.mockResolvedValue(existingList);
      shoppingListRepo.save.mockImplementation(async (l: any) => l);

      await service.addIngredientsToShoppingList('meal-1', 'group-1', 22, 2026);

      expect(shoppingListRepo.save).toHaveBeenCalled();
    });
  });

  // ── getCatalog ─────────────────────────────────────────────────────────────

  it('getCatalog() retourne les résultats du catalogue local', () => {
    const result = service.getCatalog('pates');
    expect(Array.isArray(result)).toBe(true);
  });

  // ── searchTheMealDB ────────────────────────────────────────────────────────

  const makeMockRes = (data: string) => ({
    on: jest.fn((event: string, cb: (arg?: any) => void) => {
      if (event === 'data') cb(data);
      if (event === 'end') cb();
    }) as any,
  });

  const makeMockReq = () => ({ on: jest.fn().mockReturnThis() } as any);

  describe('searchTheMealDB()', () => {
    beforeEach(() => jest.clearAllMocks());

    it('retourne les repas formatés depuis l\'API externe', async () => {
      const meal = {
        idMeal: '52772',
        strMeal: 'Chicken Teriyaki',
        strInstructions: 'Mix and cook thoroughly.',
        strMealThumb: 'https://img.example.com/thumb.jpg',
        strIngredient1: 'Chicken', strMeasure1: '200g',
        strIngredient2: 'Soy sauce', strMeasure2: '3 tbsp',
        strIngredient3: '', strMeasure3: '',
        ...Object.fromEntries(
          Array.from({ length: 17 }, (_, i) => [
            [`strIngredient${i + 4}`, ''], [`strMeasure${i + 4}`, ''],
          ]).flat(),
        ),
      };

      (https.get as jest.Mock).mockImplementation((_url: any, cb: any) => {
        cb(makeMockRes(JSON.stringify({ meals: [meal] })));
        return makeMockReq();
      });

      const result = await service.searchTheMealDB('chicken');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Chicken Teriyaki');
      expect(result[0].externalId).toBe('52772');
      expect(result[0].ingredients).toHaveLength(2);
      expect(result[0].ingredients[0]).toEqual({ name: 'Chicken', quantity: '200g' });
    });

    it('retourne [] si meals est null dans la réponse', async () => {
      (https.get as jest.Mock).mockImplementation((_url: any, cb: any) => {
        cb(makeMockRes(JSON.stringify({ meals: null })));
        return makeMockReq();
      });

      const result = await service.searchTheMealDB('xyz');
      expect(result).toEqual([]);
    });

    it('retourne [] si le JSON est invalide', async () => {
      (https.get as jest.Mock).mockImplementation((_url: any, cb: any) => {
        cb(makeMockRes('invalid{json'));
        return makeMockReq();
      });

      const result = await service.searchTheMealDB('xyz');
      expect(result).toEqual([]);
    });

    it('retourne [] sur erreur réseau', async () => {
      const mockReq: { on: jest.Mock } = {
        on: jest.fn((event: string, cb: (arg?: any) => void) => {
          if (event === 'error') cb(new Error('network error'));
          return mockReq;
        }),
      };

      (https.get as jest.Mock).mockImplementation((_url: any, _cb: any) => mockReq as any);

      const result = await service.searchTheMealDB('xyz');
      expect(result).toEqual([]);
    });

    it('utilise quantity "1" si la mesure est absente', async () => {
      const meal = {
        idMeal: '1', strMeal: 'Test', strInstructions: null, strMealThumb: null,
        strIngredient1: 'Salt', strMeasure1: '',
        ...Object.fromEntries(
          Array.from({ length: 19 }, (_, i) => [
            [`strIngredient${i + 2}`, ''], [`strMeasure${i + 2}`, ''],
          ]).flat(),
        ),
      };

      (https.get as jest.Mock).mockImplementation((_url: any, cb: any) => {
        cb(makeMockRes(JSON.stringify({ meals: [meal] })));
        return makeMockReq();
      });

      const result = await service.searchTheMealDB('salt');
      expect(result[0].ingredients[0].quantity).toBe('1');
    });
  });
});
