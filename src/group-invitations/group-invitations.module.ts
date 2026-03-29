import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupInvitationsController } from './group-invitations.controller';
import { GroupInvitationsService } from './group-invitations.service';
import { GroupInvitation } from './entities/group-invitation.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupInvitation, Group, GroupMember, User])],
  controllers: [GroupInvitationsController],
  providers: [GroupInvitationsService],
})
export class GroupInvitationsModule {}
