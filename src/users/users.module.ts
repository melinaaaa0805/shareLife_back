import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, User, Task, ShoppingList]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
