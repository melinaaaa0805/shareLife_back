import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyMeal, MealIngredient } from './entities/weekly-meal.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';
import { searchCatalog } from './meals.seeds';
import * as https from 'https';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(WeeklyMeal)
    private mealRepo: Repository<WeeklyMeal>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ShoppingList)
    private shoppingListRepo: Repository<ShoppingList>,
  ) {}

  async create(
    groupId: string,
    userId: string,
    body: {
      name: string;
      description?: string;
      imageUrl?: string;
      externalId?: string;
      ingredients: MealIngredient[];
      weekNumber: number;
      year: number;
    },
  ) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    const user = await this.userRepo.findOne({ where: { id: userId } });

    const meal = this.mealRepo.create({
      ...body,
      group,
      proposedBy: user,
    });
    return this.mealRepo.save(meal);
  }

  async findByWeek(groupId: string, year: number, weekNumber: number) {
    const meals = await this.mealRepo.find({
      where: { group: { id: groupId }, year, weekNumber },
      relations: ['votes', 'votes.user'],
      order: { createdAt: 'ASC' },
    });
    return meals;
  }

  async update(
    id: string,
    body: { name?: string; description?: string; ingredients?: MealIngredient[] },
  ) {
    const meal = await this.mealRepo.findOne({ where: { id } });
    if (!meal) throw new NotFoundException('Repas non trouvé');
    if (body.name !== undefined) meal.name = body.name;
    if (body.description !== undefined) meal.description = body.description;
    if (body.ingredients !== undefined) meal.ingredients = body.ingredients;
    return this.mealRepo.save(meal);
  }

  async delete(id: string) {
    const meal = await this.mealRepo.findOne({ where: { id } });
    if (!meal) throw new NotFoundException('Repas non trouvé');
    return this.mealRepo.remove(meal);
  }

  async addIngredientsToShoppingList(
    mealId: string,
    groupId: string,
    weekNumber: number,
  ) {
    const meal = await this.mealRepo.findOne({ where: { id: mealId } });
    if (!meal) throw new NotFoundException('Repas non trouvé');
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    let list = await this.shoppingListRepo.findOne({
      where: { group: { id: groupId }, weekNumber },
    });

    const newItems = meal.ingredients.map((ing) => ({
      name: ing.unit ? `${ing.name} (${ing.unit})` : ing.name,
      quantity: ing.quantity || '1',
    }));

    if (list) {
      const existingNames = new Set(list.items.map((i) => i.name.toLowerCase()));
      const toAdd = newItems.filter(
        (i) => !existingNames.has(i.name.toLowerCase()),
      );
      list.items = [...list.items, ...toAdd];
      return this.shoppingListRepo.save(list);
    } else {
      const newList = this.shoppingListRepo.create({
        group,
        weekNumber,
        items: newItems,
      });
      return this.shoppingListRepo.save(newList);
    }
  }

  getCatalog(query?: string) {
    return searchCatalog(query || '');
  }

  searchTheMealDB(query: string): Promise<any[]> {
    return new Promise((resolve) => {
      const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
      https
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const meals = parsed.meals || [];
              const results = meals.slice(0, 10).map((m: any) => {
                const ingredients: MealIngredient[] = [];
                for (let i = 1; i <= 20; i++) {
                  const name = m[`strIngredient${i}`];
                  const measure = m[`strMeasure${i}`];
                  if (name && name.trim()) {
                    ingredients.push({
                      name: name.trim(),
                      quantity: measure ? measure.trim() : '1',
                    });
                  }
                }
                return {
                  externalId: m.idMeal,
                  name: m.strMeal,
                  description: m.strInstructions
                    ? m.strInstructions.substring(0, 200)
                    : null,
                  imageUrl: m.strMealThumb,
                  ingredients,
                };
              });
              resolve(results);
            } catch {
              resolve([]);
            }
          });
        })
        .on('error', () => resolve([]));
    });
  }
}
