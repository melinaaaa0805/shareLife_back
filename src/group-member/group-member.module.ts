import { Module } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { GroupMemberController } from './group-member.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMember } from './entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMember, Group, User]),
  ],
  controllers: [GroupMemberController],
  providers: [GroupMemberService],
    exports: [GroupMemberService], // 👈 utile si utilisé ailleurs

})
export class GroupMemberModule {}
