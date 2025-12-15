import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

   @Post(':id')
  async addMemberToGroup(
    @Body() body: { email: string },@Param('id') id: string
  ) {
    const { email } = body;
    return this.groupMemberService.addMemberByEmail(email, id);
  }

  @Get()
  findAll() {
    return this.groupMemberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupMemberService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupMemberDto: UpdateGroupMemberDto) {
    return this.groupMemberService.update(+id, updateGroupMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupMemberService.remove(+id);
  }
}
