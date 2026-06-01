import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { UsersService } from '../users/users.service';

describe('GroupsController', () => {
  let controller: GroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        { provide: GroupsService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
