import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Group } from '../groups/entities/group.entity';
import { getISOWeekAndYear } from '../common/date.utils';
@Injectable()
export class TaskAssignmentService {
  constructor(
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
  ) {}

  async getUnassignedTasks(groupId: string) {
    return this.taskRepo
      .createQueryBuilder('task')
      .leftJoin('task.assignments', 'assignment')
      .leftJoin('task.group', 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('task.isTemplate = false')
      .andWhere('assignment.id IS NULL')
      .getMany();
  }

  async create(id: string, user: User): Promise<TaskAssignment> {
    const task = await this.taskRepo.findOne({
      where: { id: id },
      relations: ['assignments', 'group'],
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }
    if (task.assignments && task.assignments.length > 0) {
      throw new BadRequestException('La tâche est déjà assignée');
    }

    // Vérification du mode FUNNY : seul l'admin de la semaine peut s'assigner
    if (task.group) {
      const group = await this.groupRepo.findOne({
        where: { id: task.group.id },
        relations: ['weeklyAdmin'],
      });
      if (group?.mode === 'FUNNY') {
        const { week, year } = getISOWeekAndYear(new Date());
        const isAdmin =
          group.weeklyAdmin?.id === user.id &&
          group.weeklyAdminWeek === week &&
          group.weeklyAdminYear === year;
        if (!isAdmin) {
          throw new ForbiddenException(
            'Seul le chef de la semaine peut attribuer des tâches en mode Drôle',
          );
        }
      }
    }

    const assignment = this.assignmentRepo.create({
      task,
      user,
      status: 'PENDING',
    });

    return this.assignmentRepo.save(assignment);
  }

  async assignToUser(taskId: string, targetUserId: string, requesterId: string): Promise<TaskAssignment> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignments', 'group'],
    });
    if (!task) throw new NotFoundException('Tâche non trouvée');

    const isAdultChild = task.taskType === 'ADULT_CHILD';
    const maxAssignments = isAdultChild ? 2 : 1;
    if (task.assignments && task.assignments.length >= maxAssignments) {
      throw new BadRequestException('La tâche a déjà atteint le nombre maximum d\'assignations');
    }
    // Empêcher le même utilisateur d'être assigné deux fois
    if (task.assignments?.some((a) => (a.user as any)?.id === targetUserId)) {
      throw new BadRequestException('Cet utilisateur est déjà assigné à cette tâche');
    }

    // Vérifier mode FUNNY : seul l'admin peut assigner
    if (task.group) {
      const group = await this.groupRepo.findOne({
        where: { id: task.group.id },
        relations: ['weeklyAdmin'],
      });
      if (group?.mode === 'FUNNY') {
        const { week, year } = getISOWeekAndYear(new Date());
        const isAdmin =
          group.weeklyAdmin?.id === requesterId &&
          group.weeklyAdminWeek === week &&
          group.weeklyAdminYear === year;
        if (!isAdmin) {
          throw new ForbiddenException('Seul le chef de la semaine peut attribuer des tâches');
        }
      }
    }

    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Utilisateur cible non trouvé');

    const assignment = this.assignmentRepo.create({ task, user: targetUser, status: 'PENDING' });
    return this.assignmentRepo.save(assignment);
  }

  async markDone(taskId: string, userId: string): Promise<TaskAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { task: { id: taskId }, user: { id: userId } },
    });
    if (!assignment) {
      throw new NotFoundException('Assignation non trouvée');
    }
    assignment.status = 'DONE';
    assignment.completedAt = new Date();
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
