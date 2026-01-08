import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly groupService: GroupsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, groupId: string, user: User) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description ?? undefined,
      frequency: createTaskDto.frequency,
      weekNumber: createTaskDto.weekNumber,
      year: createTaskDto.year,
      dayOfWeek: createTaskDto.dayOfWeek,
      duration: createTaskDto.duration ?? null,
      date: createTaskDto.date ?? null,
      weight: createTaskDto.weight ?? 1,
      isTemplate: false,

      // 🔧 Fix relations
      group: group, // ← on assigne l'entité group trouvée au dessus
      createdBy: user, // ← user vient du controller via req.user
    });

    return this.taskRepository.save(task);
  }
  async findAllByGroupAndWeek(
    groupId: string,
    weekNumber: number,
    year: number,
  ) {
    return this.taskRepository.find({
      where: {
        group: { id: groupId },
        weekNumber,
        year,
        isTemplate: false,
      },
      relations: ['group', 'createdBy'],
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findTemplate(groupId: string) {
    return this.taskRepository.find({
      where: {
        group: { id: groupId },
        isTemplate: true,
      },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findAll(filters?: { groupId?: string; date?: string }) {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.group', 'group')
      .leftJoinAndSelect('task.createdBy', 'createdBy');

    if (filters?.groupId) {
      query.andWhere('task.groupId = :groupId', { groupId: filters.groupId });
    }
    if (filters?.date) {
      query.andWhere('DATE(task.date) = :date', { date: filters.date });
    }

    return query.orderBy('task.date', 'ASC').getMany();
  }

  async findWeekTasks(
    groupId: string,
    week: number,
    year: number,
  ): Promise<Task[]> {
    return this.taskRepository.find({
      where: { group: { id: groupId }, weekNumber: week, year },
      relations: ['group', 'createdBy'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  update(id: number) {
    return `This action updates a #${id} task`;
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
