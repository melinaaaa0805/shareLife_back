import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { TaskTimer } from '../timers/entities/task-timer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskAssignment, TaskTimer])],
  controllers: [GamificationController],
  providers: [GamificationService],
})
export class GamificationModule {}
