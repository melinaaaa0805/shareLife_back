import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Expense } from './entities/expense.entity';
import { ExpenseParticipant } from './entities/expense-participant.entity';
import { Reimbursement } from './entities/reimbursement.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      ExpenseParticipant,
      Reimbursement,
      Group,
      User,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
