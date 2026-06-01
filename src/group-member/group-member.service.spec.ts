import { Test, TestingModule } from '@nestjs/testing';
import { GroupMemberService } from './group-member.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupMember } from './entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

const mockRepo = () => ({ findOne: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn(), find: jest.fn() });

describe('GroupMemberService', () => {
  let service: GroupMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupMemberService,
        { provide: getRepositoryToken(GroupMember), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<GroupMemberService>(GroupMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
