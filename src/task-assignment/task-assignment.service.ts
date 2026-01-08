import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
@Injectable()
export class TaskAssignmentService {
  constructor(
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}
  async getUnassignedTasks(groupId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { user: IsNull(), task: { group: { id: groupId } } },
      relations: ['task'],
    });
    const tasks = assignments.flatMap((a) => a.task);

    return tasks;
  }
  async create(id: string, user: User): Promise<TaskAssignment> {
    const task = await this.taskRepo.findOne({
      where: { id: id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const assignment = this.assignmentRepo.create({
      task,
      user,
      status: 'PENDING',
    });

    return this.assignmentRepo.save(assignment);
  }
  async findByUser(id: string) {
    // On récupère l'user via son email
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // On cherche toutes les assignations de tâches pour cet user
    const assignments = await this.assignmentRepo.find({
      where: { user: { id: user.id } },
      relations: ['task', 'task.group', 'user'],
      order: { completedAt: 'DESC' },
    });

    return assignments.map((a) => ({
      id: a.task.id,
      title: a.task.title,
      description: a.task.description,
      weight: a.task.weight,
      frequency: a.task.frequency,
      weekNumber: a.task.weekNumber,
      year: a.task.year,
      dayOfWeek: a.task.dayOfWeek,
      duration: a.task.duration,
      date: a.task.date,
      status: a.status,
      completedAt: a.completedAt,
      completedAtDate: a.completedAt
        ? a.completedAt.toISOString().split('T')[0]
        : null,
      group: a.task.group,
      createdBy: a.task.createdBy,
    }));
  }
}
