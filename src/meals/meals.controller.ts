import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MealsService } from './meals.service';
import { MealIngredient } from './entities/weekly-meal.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.mealsService.searchTheMealDB(q);
  }

  @Get('catalog')
  catalog(@Query('q') q: string) {
    return this.mealsService.getCatalog(q);
  }

  @Get(':groupId/:year/:week')
  findByWeek(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('week') week: string,
  ) {
    return this.mealsService.findByWeek(groupId, +year, +week);
  }

  @Post(':groupId')
  create(
    @Param('groupId') groupId: string,
    @Request() req: any,
    @Body()
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
    return this.mealsService.create(groupId, req.user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: { name?: string; description?: string; ingredients?: MealIngredient[] },
  ) {
    return this.mealsService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.mealsService.delete(id);
  }

  @Post(':mealId/add-to-shopping')
  addToShoppingList(
    @Param('mealId') mealId: string,
    @Body() body: { groupId: string; weekNumber: number },
  ) {
    return this.mealsService.addIngredientsToShoppingList(
      mealId,
      body.groupId,
      body.weekNumber,
    );
  }
}
