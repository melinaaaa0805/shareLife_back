import { Controller, Get, Body, Param, UseGuards, Post, Patch } from '@nestjs/common';
import { TaskAssignmentService } from './task-assignment.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';
import { TaskAssignment } from './entities/task-assignment.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('task-assignment')
export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) {}

  @Post(':idTask')
  create(
    @Param('idTask') idTask: string,
    @CurrentUser() user: User,
  ): Promise<TaskAssignment> {
    return this.taskAssignmentService.create(idTask, user);
  }
  @Post(':taskId/assign-to/:userId')
  assignTo(
    @Param('taskId') taskId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.taskAssignmentService.assignToUser(taskId, targetUserId, (user as any).id);
  }

  @Patch(':taskId/done')
  markDone(
    @Param('taskId') taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.taskAssignmentService.markDone(taskId, (user as any).id);
  }

  @Get('/users/:id')
  findByUser(@Param('id') id: string) {
    return this.taskAssignmentService.findByUser(id);
  }

  @Get('/unassigned/:idGroup')
  findUnassignedTasks(@Param('idGroup') idGroup: string): Promise<Task[]> {
    return this.taskAssignmentService.getUnassignedTasks(idGroup);
  }
}
