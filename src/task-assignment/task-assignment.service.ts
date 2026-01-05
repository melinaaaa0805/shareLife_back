import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task-assignment.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
@Injectable()
export class TaskAssignmentService {
    constructor(
        @InjectRepository(TaskAssignment)
    private readonly assignmentRepo: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
      ) {}
  create(createTaskAssignmentDto: CreateTaskAssignmentDto) {
    return 'This action adds a new taskAssignment';
  }

  findAll() {
    return `This action returns all taskAssignment`;
  }

  findOne(idUser: number) {
    return `This action returns a #${idUser} taskAssignment`;
  }

  update(id: number, updateTaskAssignmentDto: UpdateTaskAssignmentDto) {
    return `This action updates a #${id} taskAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskAssignment`;
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

    // On retourne juste les tâches, mais tu peux aussi retourner l'assignment si tu veux le status
    return assignments.map(a => ({
      id: a.task.id,
      title: a.task.title,
      description: a.task.description,
      weight: a.task.weight,
      frequency: a.task.frequency,
      dueDate: a.task.dueDate,
      time: a.task.time,
      status: a.status,
      completedAt: a.completedAt,
      group: a.task.group,
      createdBy: a.user,
    }));
  }
  
}
