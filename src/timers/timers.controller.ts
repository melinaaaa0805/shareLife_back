import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TimersService } from './timers.service';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Timers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('timers')
export class TimersController {
  constructor(private readonly timersService: TimersService) {}

  @Post('task/:taskId/start')
  start(@Param('taskId') taskId: string, @CurrentUser() user: User) {
    return this.timersService.start(taskId, user);
  }

  @Post('task/:taskId/stop')
  stop(@Param('taskId') taskId: string, @CurrentUser() user: User) {
    return this.timersService.stop(taskId, user);
  }

  @Get('task/:taskId')
  getForTask(@Param('taskId') taskId: string, @CurrentUser() user: User) {
    return this.timersService.getForTask(taskId, user.id);
  }
}
