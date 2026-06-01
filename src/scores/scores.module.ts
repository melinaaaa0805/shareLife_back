import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { Reward } from './entities/reward.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, TaskAssignment, Group])],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
