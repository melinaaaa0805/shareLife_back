import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupInvitationsService } from './group-invitations.service';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('group-invitations')
export class GroupInvitationsController {
  constructor(private readonly service: GroupInvitationsService) {}

  /** Envoyer une invitation (admin du groupe) */
  @Post(':groupId')
  send(
    @Param('groupId') groupId: string,
    @Body() body: { email: string },
    @CurrentUser() user: User,
  ) {
    return this.service.sendInvitation(groupId, (user as any).id, body.email);
  }

  /** Mes invitations en attente */
  @Get('mine')
  getMine(@CurrentUser() user: User) {
    return this.service.getMyInvitations((user as any).id);
  }

  /** Accepter une invitation */
  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.respondToInvitation(id, (user as any).id, true);
  }

  /** Refuser une invitation */
  @Patch(':id/decline')
  decline(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.respondToInvitation(id, (user as any).id, false);
  }
}
