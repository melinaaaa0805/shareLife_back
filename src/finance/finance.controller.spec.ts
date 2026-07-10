import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { ExpenseCategory } from './enums/expense-category.enum';
import { SplitMode } from './enums/split-mode.enum';

const mockFinanceService = {
  createExpense: jest.fn(),
  findExpenses: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  createReimbursement: jest.fn(),
  getBalances: jest.fn(),
};

const mockUser: User = {
  id: 'user-1',
  email: 'alice@test.com',
  firstName: 'Alice',
} as User;

describe('FinanceController', () => {
  let controller: FinanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [{ provide: FinanceService, useValue: mockFinanceService }],
    }).compile();

    controller = module.get<FinanceController>(FinanceController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createExpense', () => {
    it('delegue au service avec groupId, dto et user', async () => {
      const dto: CreateExpenseDto = {
        title: 'Courses',
        amount: 50,
        category: ExpenseCategory.FOOD,
        splitMode: SplitMode.EQUAL,
        date: '2026-06-01',
        participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
      };
      const expected = { id: 'exp-1', ...dto };
      mockFinanceService.createExpense.mockResolvedValue(expected);

      const result = await controller.createExpense('group-1', dto, mockUser);

      expect(mockFinanceService.createExpense).toHaveBeenCalledWith('group-1', dto, mockUser);
      expect(result).toEqual(expected);
    });
  });

  describe('findExpenses', () => {
    it('delegue au service avec le groupId', async () => {
      const expenses = [{ id: 'exp-1', title: 'Courses' }];
      mockFinanceService.findExpenses.mockResolvedValue(expenses);

      const result = await controller.findExpenses('group-1');

      expect(mockFinanceService.findExpenses).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(expenses);
    });
  });

  describe('updateExpense', () => {
    it('delegue au service avec expenseId, dto et userId', async () => {
      const dto: UpdateExpenseDto = { title: 'Courses modifiees' };
      const updated = { id: 'exp-1', title: 'Courses modifiees' };
      mockFinanceService.updateExpense.mockResolvedValue(updated);

      const result = await controller.updateExpense('exp-1', dto, mockUser);

      expect(mockFinanceService.updateExpense).toHaveBeenCalledWith('exp-1', dto, mockUser.id);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteExpense', () => {
    it('delegue au service avec expenseId', async () => {
      mockFinanceService.deleteExpense.mockResolvedValue(undefined);

      await controller.deleteExpense('exp-1');

      expect(mockFinanceService.deleteExpense).toHaveBeenCalledWith('exp-1');
    });
  });

  describe('createReimbursement', () => {
    it('delegue au service avec groupId, dto et user', async () => {
      const dto: CreateReimbursementDto = {
        toUserId: 'user-2',
        amount: 25,
        note: 'Remboursement courses',
      };
      const expected = { id: 'reimb-1', ...dto };
      mockFinanceService.createReimbursement.mockResolvedValue(expected);

      const result = await controller.createReimbursement('group-1', dto, mockUser);

      expect(mockFinanceService.createReimbursement).toHaveBeenCalledWith('group-1', dto, mockUser);
      expect(result).toEqual(expected);
    });
  });

  describe('getBalances', () => {
    it('delegue au service avec le groupId', async () => {
      const balances = [{ userId: 'user-1', balance: 25 }];
      mockFinanceService.getBalances.mockResolvedValue(balances);

      const result = await controller.getBalances('group-1');

      expect(mockFinanceService.getBalances).toHaveBeenCalledWith('group-1');
      expect(result).toEqual(balances);
    });
  });
});
