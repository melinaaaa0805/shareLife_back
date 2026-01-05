import { Module } from '@nestjs/common';
import { TaskAssignmentService } from './task-assignment.service';
import { TaskAssignmentController } from './task-assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([TaskAssignment, User]), // ← repo dispo ici
    UsersModule
    ],
  providers: [TaskAssignmentService],
  controllers: [TaskAssignmentController],
  exports: [TaskAssignmentService],
})
export class TaskAssignmentModule {}
