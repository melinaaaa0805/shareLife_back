import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { Repository } from 'typeorm';
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

  async assignTaskToMe(taskId: string, user: User): Promise<TaskAssignment> {
    // 1️⃣ Vérifier que la tâche existe
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['group'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2️⃣ Vérifier si un assignment existe déjà pour cette tâche
    let assignment = await this.assignmentRepo.findOne({
      where: { task: { id: task.id } },
      relations: ['user'],
    });

    // 3️⃣ Si pas d'assignation, on la crée
    if (!assignment) {
      assignment = this.assignmentRepo.create({
        task,
        user,
        status: 'PENDING',
      });
    }
    // 4️⃣ Si assignation existe mais sans user, on l'assigne à l'utilisateur
    else if (!assignment.user) {
      assignment.user = user;
      assignment.status = 'PENDING';
    }
    // 5️⃣ Si assignation existe déjà avec un user, on empêche la réassignation
    else {
      throw new NotFoundException('Task already assigned');
    }

    // 6️⃣ Sauvegarde
    return this.assignmentRepo.save(assignment);
  }

  async getUnassignedTasks(groupId: string) {
    const tasks = await this.taskRepo.find({
      where: {
        assignments: [], // pas de relation assignée
        group: { id: groupId },
      },
      relations: ['assignments', 'group'],
    });

    console.log('assigments test : ', tasks);

    return tasks;
  }

  async create(id: string, user: User): Promise<TaskAssignment> {
    const task = await this.taskRepo.findOne({
      where: { id: id },
      relations: ['taskAssignment'],
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }
    if (task.assignments) {
      throw new BadRequestException('La tâche est déjà assignée');
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

    // On cherche toutes les assignations de tâches pour ce user
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
