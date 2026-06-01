import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('group/:groupId/expenses')
  createExpense(
    @Param('groupId') groupId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: User,
  ) {
    return this.financeService.createExpense(groupId, dto, user);
  }

  @Get('group/:groupId/expenses')
  findExpenses(@Param('groupId') groupId: string) {
    return this.financeService.findExpenses(groupId);
  }

  @Patch('expenses/:expenseId')
  updateExpense(
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: User,
  ) {
    return this.financeService.updateExpense(expenseId, dto, user.id);
  }

  @Delete('expenses/:expenseId')
  deleteExpense(@Param('expenseId') expenseId: string) {
    return this.financeService.deleteExpense(expenseId);
  }

  @Post('group/:groupId/reimbursements')
  createReimbursement(
    @Param('groupId') groupId: string,
    @Body() dto: CreateReimbursementDto,
    @CurrentUser() user: User,
  ) {
    return this.financeService.createReimbursement(groupId, dto, user);
  }

  @Get('group/:groupId/reimbursements')
  findReimbursements(@Param('groupId') groupId: string) {
    return this.financeService.findReimbursements(groupId);
  }

  @Get('group/:groupId/balances')
  getBalances(@Param('groupId') groupId: string) {
    return this.financeService.getBalances(groupId);
  }
}
