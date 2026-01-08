import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Post(':id')
  async addMemberToGroup(
    @Body() body: { email: string },
    @Param('id') groupId: string,
  ) {
    const { email } = body;
    return this.groupMemberService.addMemberByEmail(email, groupId);
  }

  @Get()
  findAll() {
    return this.groupMemberService.findAll();
  }

  @Get(':groupId')
  async getUsers(@Param('groupId') groupId: string): Promise<User[]> {
    return this.groupMemberService.getUsersByGroup(groupId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupMemberService.remove(+id);
  }
}
