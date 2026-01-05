import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Group) private readonly groupRepository: Repository<Group>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const group = await this.groupRepository.findOne({ where: { id: dto.groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      weight: dto.weight ?? 1,
      frequency: dto.frequency ?? 'ONCE',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      time: dto.time ?? null,
      group,
      createdBy: user,
    });

    return this.taskRepository.save(task);
  }

  findAll() {
    return `This action returns all tasks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
  async getUnassignedTasks() {
  const tasks = await this.taskRepository
    .createQueryBuilder('task')
    .leftJoin('task.taskAssignments', 'assignment')
    .where('assignment.id IS NULL')
    .getMany();

  return tasks;
}

}
