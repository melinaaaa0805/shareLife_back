import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Request } from 'express';
import { CreateGroupDto } from './dto/create-group.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtUser } from '../auth/jwt-user.type';

@UseGuards(AuthGuard('jwt'))
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly usersService: UsersService, // injecter le service users
  ) {}

  @Post()
  async create(@Body() dto: CreateGroupDto, @Req() req: Request) {
    // Type assertion pour dire à TypeScript que req.user est bien ton User JWT
    const jwtUser = req.user as { id: string } | undefined;

    if (!jwtUser?.id) {
      throw new NotFoundException('Utilisateur non authentifié');
    }

    const user: User = await this.usersService.findOne(jwtUser.id);
    return this.groupsService.createGroup(dto, user);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.updateGroup(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.groupsService.deleteGroup(id);
  }

  @Get('me')
  getMyGroups(@Req() req: Request & { user: JwtUser }) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.groupsService.getGroupsForUser(req.user.email);
  }
  @Get(':id')
  async getGroup(@Param('id') id: string) {
    return this.groupsService.getGroupById(id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.removeMember(groupId, userId);
  }
}
