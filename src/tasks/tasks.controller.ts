import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
  @Post('group/:groupId')
  create(
    @Param('groupId') groupId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.tasksService.create(createTaskDto, groupId, user);
  }

  @Get('week/:groupId/:year/:weekNumber')
  async getTasksByWeek(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('weekNumber') weekNumber: string,
  ) {
    return this.tasksService.findAllByGroupAndWeek(
      groupId,
      Number(weekNumber),
      Number(year),
    );
  }
  @Get(':groupId/template')
  async getTasksTemplate(@Param('groupId') groupId: string) {
    return this.tasksService.findTemplate(groupId);
  }
  @Get(':groupId/:date')
  async getTasksForDay(
    @Param('groupId') groupId: string,
    @Param('date') date: string,
  ) {
    return this.tasksService.findByDateAndIdGroup(groupId, date);
  }
  @Get('/week')
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.tasksService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
