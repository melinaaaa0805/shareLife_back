import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskAssignmentModule } from './task-assignment/task-assignment.module';
import { GroupMemberModule } from './group-member/group-member.module';
import { ShoppingListModule } from './shopping-list/shopping-list.module';
import { MealsModule } from './meals/meals.module';
import { MealVotesModule } from './meal-votes/meal-votes.module';
import { GroupInvitationsModule } from './group-invitations/group-invitations.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    AuthModule,
    UsersModule,
    GroupsModule,
    TasksModule,
    TaskAssignmentModule,
    GroupMemberModule,
    ShoppingListModule,
    MealsModule,
    MealVotesModule,
    GroupInvitationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
