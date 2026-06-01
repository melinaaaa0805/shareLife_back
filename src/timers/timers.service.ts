import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { TaskTimer } from './entities/task-timer.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TimersService {
  constructor(
    @InjectRepository(TaskTimer)
    private readonly timerRepo: Repository<TaskTimer>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async start(taskId: string, user: User): Promise<object> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Tâche non trouvée');

    // Check no running timer already exists
    const running = await this.timerRepo.findOne({
      where: { task: { id: taskId }, user: { id: user.id }, endedAt: IsNull() },
    });
    if (running) throw new BadRequestException('Un timer est déjà en cours pour cette tâche');

    const timer = this.timerRepo.create({
      task,
      user,
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
    });
    const saved = await this.timerRepo.save(timer);
    return this.format(saved);
  }

  async stop(taskId: string, user: User): Promise<object> {
    const running = await this.timerRepo.findOne({
      where: { task: { id: taskId }, user: { id: user.id }, endedAt: IsNull() },
    });
    if (!running) throw new NotFoundException('Aucun timer en cours pour cette tâche');

    const now = new Date();
    running.endedAt = now;
    running.durationSeconds = Math.round(
      (now.getTime() - running.startedAt.getTime()) / 1000,
    );
    const saved = await this.timerRepo.save(running);
    return this.format(saved);
  }

  async getForTask(taskId: string, userId: string): Promise<object> {
    const timers = await this.timerRepo.find({
      where: { task: { id: taskId }, user: { id: userId } },
      order: { startedAt: 'ASC' },
    });

    const running = timers.find((t) => t.endedAt === null) ?? null;
    const totalSeconds = timers
      .filter((t) => t.durationSeconds !== null)
      .reduce((s, t) => s + (t.durationSeconds ?? 0), 0);

    return {
      taskId,
      isRunning: !!running,
      runningTimerId: running?.id ?? null,
      runningStartedAt: running?.startedAt ?? null,
      totalSeconds,
      sessions: timers.length,
    };
  }

  private format(t: TaskTimer): object {
    return {
      id: t.id,
      taskId: (t.task as any)?.id,
      startedAt: t.startedAt,
      endedAt: t.endedAt,
      durationSeconds: t.durationSeconds,
      isRunning: t.endedAt === null,
    };
  }
}
