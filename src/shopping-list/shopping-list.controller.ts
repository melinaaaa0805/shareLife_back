import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShoppingListService } from './shopping-list.service';
import { Group } from '../groups/entities/group.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@UseGuards(AuthGuard('jwt'))
@Controller('shopping-lists')
export class ShoppingListController {
  constructor(
    private readonly shoppingListService: ShoppingListService,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
  ) {}

  @Post(':groupId')
  async create(
    @Param('groupId') groupId: string,
    @Body()
    body: { weekNumber: number; year?: number; items: { name: string; quantity: string }[] },
  ) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    const year = body.year ?? new Date().getFullYear();
    return this.shoppingListService.create(group, body.weekNumber, year, body.items);
  }

  @Get(':groupId')
  findAllByGroup(@Param('groupId') groupId: string) {
    return this.shoppingListService.findAllByGroup(groupId);
  }

  @Get('item/:id')
  findById(@Param('id') id: string) {
    return this.shoppingListService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { items: { name: string; quantity: string }[] },
  ) {
    return this.shoppingListService.update(id, body.items);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shoppingListService.delete(id);
  }
}
