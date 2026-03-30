import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('group/:groupId/apply-template')
  applyTemplate(
    @Param('groupId') groupId: string,
    @Body() body: { weekNumber: number; year: number },
    @CurrentUser() user: User,
  ) {
    return this.tasksService.applyWeekTemplate(groupId, body.weekNumber, body.year, user);
  }

  @Post('group/:groupId')
  create(
    @Param('groupId') groupId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(createTaskDto, groupId, user);
  }

  // Route query-based AVANT les routes paramétrées pour éviter les conflits
  @Get('by-week')
  async getWeekTasks(
    @Query('groupId') groupId: string,
    @Query('week') week: number,
    @Query('year') year: number,
  ) {
    if (!groupId || !week || !year) {
      throw new BadRequestException('groupId, week et year sont requis');
    }
    return this.tasksService.findWeekTasks(groupId, week, year);
  }

  @Get('week/:groupId/:year/:weekNumber')
  async getTasksByWeek(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('weekNumber') weekNumber: string,
  ) {
    return this.tasksService.findAllByGroupAndWeek(groupId, Number(weekNumber), Number(year));
  }

  @Get(':groupId/template')
  async getTasksTemplate(@Param('groupId') groupId: string) {
    return this.tasksService.findTemplate(groupId);
  }

  @Delete('week/:groupId/:year/:weekNumber')
  deleteWeek(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('weekNumber') weekNumber: string,
  ) {
    return this.tasksService.deleteWeek(groupId, Number(weekNumber), Number(year));
  }

  @Get(':date/:groupId')
  async getTasksForDay(
    @Param('date') date: string,
    @Param('groupId') groupId: string,
  ) {
    return this.tasksService.findByDateAndIdGroup(date, groupId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
