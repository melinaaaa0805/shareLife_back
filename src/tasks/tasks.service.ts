import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import { Frequency } from './enums/frequency.enum';

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

    const tasksToSave = [];

    // Convertir la date string en Date JS pour manipuler les jours
    const startDate = createTaskDto.date
      ? new Date(createTaskDto.date)
      : new Date();

    function formatDate(d: Date) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    if (createTaskDto.frequency === Frequency.DAILY) {
      for (let i = 0; i < 7; i++) {
        const taskDate = new Date(startDate);
        const dayOffset = i - ((startDate.getDay() + 6) % 7); // 0 = lundi
        taskDate.setDate(startDate.getDate() + dayOffset);

        const task = this.taskRepository.create({
          title: createTaskDto.title,
          description: createTaskDto.description ?? undefined,
          frequency: createTaskDto.frequency,
          weekNumber: createTaskDto.weekNumber,
          year: createTaskDto.year,
          dayOfWeek: i,
          duration: createTaskDto.duration ?? null,
          date: formatDate(taskDate), // 👈 en string YYYY-MM-DD
          weight: createTaskDto.weight ?? 1,
          isTemplate: false,
          group,
          createdBy: user,
        });

        tasksToSave.push(task);
      }
    } else {
      const task = this.taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description ?? undefined,
        frequency: createTaskDto.frequency,
        weekNumber: createTaskDto.weekNumber,
        year: createTaskDto.year,
        dayOfWeek: createTaskDto.dayOfWeek,
        duration: createTaskDto.duration ?? null,
        date: createTaskDto.date ?? formatDate(new Date()), // 👈 en string
        weight: createTaskDto.weight ?? 1,
        isTemplate: false,
        group,
        createdBy: user,
      });

      tasksToSave.push(task);
    }

    return this.taskRepository.save(tasksToSave);
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
    const res = this.taskRepository.find({
      where: {
        group: { id: groupId },
        isTemplate: true,
      },
    });
    return res;
  }

  async findByDateAndIdGroup(day: string, groupId: string) {
    return this.taskRepository.find({
      where: {
        group: { id: groupId },
        date: day,
        isTemplate: false,
      },
      relations: ['group', 'createdBy', 'assignments'],
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
