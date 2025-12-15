export class GroupMemberResponseDto {
  id: string;
  email: string;
  firstName: string;
}

export class GroupResponseDto {
  id: string;
  name: string;
  createdAt: Date;
  owner: {
    id: string;
    email: string;
    firstName: string;
  };
  members: GroupMemberResponseDto[];
}
