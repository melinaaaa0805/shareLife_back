import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskAssignmentModule } from '../task-assignment/task-assignment.module';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [TaskAssignmentModule],
})
export class TasksModule {}
