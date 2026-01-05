import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskAssignmentService } from './task-assignment.service';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';

@Controller('task-assignment')
export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) {}

  @Post()
  create(@Body() createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return this.taskAssignmentService.create(createTaskAssignmentDto);
  }

  @Get()
  findAll() {
    return this.taskAssignmentService.findAll();
  }

  @Get('/users/:id')
  findByUser(@Param('id') id: string) {
    return this.taskAssignmentService.findByUser(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskAssignmentDto: UpdateTaskAssignmentDto) {
    return this.taskAssignmentService.update(+id, updateTaskAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskAssignmentService.remove(+id);
  }
}
