import { Test, TestingModule } from '@nestjs/testing';
import { TaskAssignmentController } from './task-assignment.controller';
import { TaskAssignmentService } from './task-assignment.service';

describe('TaskAssignmentController', () => {
  let controller: TaskAssignmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskAssignmentController],
      providers: [TaskAssignmentService],
    }).compile();

    controller = module.get<TaskAssignmentController>(TaskAssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
