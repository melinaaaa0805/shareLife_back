import { Module } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { GroupMemberController } from './group-member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from './entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupMember,
      Group,
      User,
      Task,
      TaskAssignment,
      ShoppingList,
    ]),
  ],
  controllers: [GroupMemberController],
  providers: [GroupMemberService],
  exports: [GroupMemberService],
})
export class GroupMemberModule {}
