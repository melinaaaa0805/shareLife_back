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
          date: formatDate(taskDate),
          weight: createTaskDto.weight ?? 1,
          taskType: createTaskDto.taskType ?? 'FAMILY',
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
        date: createTaskDto.date ?? formatDate(new Date()),
        weight: createTaskDto.weight ?? 1,
        taskType: createTaskDto.taskType ?? 'FAMILY',
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
    const tasks = await this.taskRepository.find({
      where: {
        group: { id: groupId },
        weekNumber,
        year,
        isTemplate: false,
      },
      relations: ['createdBy', 'assignments', 'assignments.user'],
      order: { dayOfWeek: 'ASC' },
    });

    return tasks.map((task) => {
      const assignments = task.assignments ?? [];
      const primaryAssignment = assignments[0] ?? null;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        frequency: task.frequency,
        weekNumber: task.weekNumber,
        year: task.year,
        dayOfWeek: task.dayOfWeek,
        weight: task.weight,
        duration: task.duration,
        date: task.date,
        taskType: task.taskType,
        done: primaryAssignment?.status === 'DONE',
        assignedUser: primaryAssignment?.user
          ? { id: primaryAssignment.user.id, firstName: primaryAssignment.user.firstName, email: primaryAssignment.user.email }
          : null,
        taskAssignment: primaryAssignment
          ? { status: primaryAssignment.status, user: primaryAssignment.user ? { id: primaryAssignment.user.id, firstName: primaryAssignment.user.firstName } : null }
          : null,
        coAssignment: assignments[1]
          ? { status: assignments[1].status, user: assignments[1].user ? { id: assignments[1].user.id, firstName: assignments[1].user.firstName } : null }
          : null,
      };
    });
  }

  async findTemplate(groupId: string) {
    return this.taskRepository.find({
      where: { group: { id: groupId }, isTemplate: true },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async applyWeekTemplate(groupId: string, weekNumber: number, year: number, user: User) {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe introuvable');

    const templates = await this.taskRepository.find({
      where: { group: { id: groupId }, isTemplate: true },
    });

    function getDateForDayOfWeek(year: number, week: number, day: number): string {
      const jan4 = new Date(year, 0, 4);
      const dayDiff = (jan4.getDay() + 6) % 7;
      const week1Monday = new Date(year, 0, 4 - dayDiff);
      const d = new Date(week1Monday);
      d.setDate(week1Monday.getDate() + (week - 1) * 7 + day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }

    const tasksToSave = templates.map((tpl) => {
      // Pour les tâches DAILY, on crée 7 occurrences
      return this.taskRepository.create({
        title: tpl.title,
        description: tpl.description,
        frequency: tpl.frequency,
        weekNumber,
        year,
        dayOfWeek: tpl.dayOfWeek ?? 0,
        duration: tpl.duration,
        weight: tpl.weight ?? 1,
        isTemplate: false,
        group,
        createdBy: user,
        date: getDateForDayOfWeek(year, weekNumber, tpl.dayOfWeek ?? 0),
      });
    });

    // Pour DAILY, dupliquer sur tous les jours de la semaine
    const expanded: (typeof tasksToSave[0])[] = [];
    for (const task of tasksToSave) {
      if (task.frequency === 'DAILY') {
        for (let d = 0; d < 7; d++) {
          expanded.push(this.taskRepository.create({
            ...task,
            dayOfWeek: d,
            date: getDateForDayOfWeek(year, weekNumber, d),
          }));
        }
      } else {
        expanded.push(task);
      }
    }

    return this.taskRepository.save(expanded);
  }

  async findByDateAndIdGroup(day: string, groupId: string) {
    const tasks = await this.taskRepository.find({
      where: {
        group: { id: groupId },
        date: day,
        isTemplate: false,
      },
      relations: ['createdBy', 'assignments', 'assignments.user'],
      order: { dayOfWeek: 'ASC' },
    });

    return tasks.map((task) => {
      const assignments = task.assignments ?? [];
      const assignment = assignments[0] ?? null;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        duration: task.duration,
        weight: task.weight,
        taskType: task.taskType,
        taskAssignment: assignment
          ? {
              user: assignment.user
                ? { id: assignment.user.id, firstName: assignment.user.firstName }
                : null,
              status: assignment.status,
            }
          : null,
        coAssignment: assignments[1]
          ? {
              user: assignments[1].user
                ? { id: assignments[1].user.id, firstName: assignments[1].user.firstName }
                : null,
              status: assignments[1].status,
            }
          : null,
      };
    });
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

  async deleteWeek(groupId: string, weekNumber: number, year: number): Promise<{ deleted: number }> {
    const tasks = await this.taskRepository.find({
      where: { group: { id: groupId }, weekNumber, year, isTemplate: false },
      relations: ['assignments'],
    });

    // Supprimer les assignations en cascade puis les tâches
    for (const task of tasks) {
      if (task.assignments?.length) {
        await this.taskRepository.manager.delete(
          'task_assignment',
          task.assignments.map((a) => a.id),
        );
      }
    }

    if (tasks.length > 0) {
      await this.taskRepository.delete(tasks.map((t) => t.id));
    }

    return { deleted: tasks.length };
  }

  async remove(id: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });
    if (!task) return;
    if (task.assignments?.length) {
      await this.taskRepository.manager.delete(
        'task_assignment',
        task.assignments.map((a) => a.id),
      );
    }
    await this.taskRepository.delete(id);
  }
}
