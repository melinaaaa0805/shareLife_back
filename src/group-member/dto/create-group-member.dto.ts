import { IsEmail, IsUUID } from 'class-validator';

export class CreateGroupMemberDto {
     @IsEmail()
  email: string;

  @IsUUID()
  groupId: string;
}
