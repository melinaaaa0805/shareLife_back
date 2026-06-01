import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimersController } from './timers.controller';
import { TimersService } from './timers.service';
import { TaskTimer } from './entities/task-timer.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTimer, Task])],
  controllers: [TimersController],
  providers: [TimersService],
  exports: [TimersService],
})
export class TimersModule {}
