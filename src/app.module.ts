import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { TasksModule } from './tasks/tasks.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TaskAssignmentModule } from './task-assignment/task-assignment.module';
import { GroupMemberModule } from './group-member/group-member.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UsersModule,
    GroupsModule,
    TasksModule,
    AssignmentsModule,
    TaskAssignmentModule,
    GroupMemberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
