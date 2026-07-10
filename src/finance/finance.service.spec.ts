import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseParticipant } from './entities/expense-participant.entity';
import { Reimbursement } from './entities/reimbursement.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpenseCategory } from './enums/expense-category.enum';
import { SplitMode } from './enums/split-mode.enum';
import { NotificationsService } from '../notifications/notifications.service';

const mockNotificationsService = {
  sendToUsers: jest.fn().mockResolvedValue(undefined),
  sendToUser: jest.fn().mockResolvedValue(undefined),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}): User =>
  ({ id: 'user-1', email: 'alice@test.com', firstName: 'Alice', ...overrides } as User);

const makeGroup = (overrides = {}): Group =>
  ({
    id: 'group-1',
    name: 'Coloc',
    owner: makeUser({ id: 'user-1' }),
    members: [
      { user: makeUser({ id: 'user-2', email: 'bob@test.com', firstName: 'Bob' }) },
    ],
    ...overrides,
  } as unknown as Group);

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('FinanceService', () => {
  let service: FinanceService;
  let expenseRepo: ReturnType<typeof mockRepo>;
  let participantRepo: ReturnType<typeof mockRepo>;
  let reimbursementRepo: ReturnType<typeof mockRepo>;
  let groupRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(Expense), useFactory: mockRepo },
        { provide: getRepositoryToken(ExpenseParticipant), useFactory: mockRepo },
        { provide: getRepositoryToken(Reimbursement), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    expenseRepo = module.get(getRepositoryToken(Expense));
    participantRepo = module.get(getRepositoryToken(ExpenseParticipant));
    reimbursementRepo = module.get(getRepositoryToken(Reimbursement));
    groupRepo = module.get(getRepositoryToken(Group));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ── createExpense ──────────────────────────────────────────────────────────

  describe('createExpense()', () => {
    const paidBy = makeUser({ id: 'user-1' });
    const dto = {
      title: 'Courses Lidl',
      amount: 30,
      category: ExpenseCategory.FOOD,
      splitMode: SplitMode.EQUAL,
      date: '2026-05-20',
      participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
    };

    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.createExpense('group-x', dto, paidBy)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when a participant is not a member', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const badDto = {
        ...dto,
        participants: [{ userId: 'user-1' }, { userId: 'user-99' }],
      };
      await expect(service.createExpense('group-1', badDto, paidBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for CUSTOM split where shares do not sum to amount', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      const badDto = {
        ...dto,
        splitMode: SplitMode.CUSTOM,
        participants: [
          { userId: 'user-1', share: 10 },
          { userId: 'user-2', share: 5 },
        ],
      };
      await expect(service.createExpense('group-1', badDto, paidBy)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('saves expense with EQUAL split — shares sum to total amount', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne
        .mockResolvedValueOnce(makeUser({ id: 'user-1' }))
        .mockResolvedValueOnce(makeUser({ id: 'user-2' }));
      const participant1 = { id: 'ep-1', share: 15 };
      const participant2 = { id: 'ep-2', share: 15 };
      participantRepo.create
        .mockReturnValueOnce(participant1)
        .mockReturnValueOnce(participant2);
      const savedExpense = { id: 'exp-1', amount: 30 };
      expenseRepo.create.mockReturnValue(savedExpense);
      expenseRepo.save.mockResolvedValue(savedExpense);

      const result = await service.createExpense('group-1', dto, paidBy);

      expect(expenseRepo.save).toHaveBeenCalled();
      expect(result).toBe(savedExpense);
    });

    it('accepts CUSTOM split when shares sum correctly', async () => {
      const group = makeGroup();
      groupRepo.findOne.mockResolvedValue(group);
      userRepo.findOne
        .mockResolvedValueOnce(makeUser({ id: 'user-1' }))
        .mockResolvedValueOnce(makeUser({ id: 'user-2' }));
      participantRepo.create
        .mockReturnValueOnce({ id: 'ep-1', share: 20 })
        .mockReturnValueOnce({ id: 'ep-2', share: 10 });
      const savedExpense = { id: 'exp-2', amount: 30 };
      expenseRepo.create.mockReturnValue(savedExpense);
      expenseRepo.save.mockResolvedValue(savedExpense);

      const customDto = {
        ...dto,
        splitMode: SplitMode.CUSTOM,
        participants: [
          { userId: 'user-1', share: 20 },
          { userId: 'user-2', share: 10 },
        ],
      };

      const result = await service.createExpense('group-1', customDto, paidBy);
      expect(result).toBe(savedExpense);
    });
  });

  // ── deleteExpense ──────────────────────────────────────────────────────────

  describe('deleteExpense()', () => {
    it('throws NotFoundException when expense does not exist', async () => {
      expenseRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteExpense('exp-x')).rejects.toThrow(NotFoundException);
    });

    it('deletes expense when found', async () => {
      expenseRepo.findOne.mockResolvedValue({ id: 'exp-1' });
      expenseRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.deleteExpense('exp-1')).resolves.toBeUndefined();
      expect(expenseRepo.delete).toHaveBeenCalledWith('exp-1');
    });
  });

  // ── getBalances (debt simplification) ──────────────────────────────────────

  describe('getBalances()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(service.getBalances('group-x')).rejects.toThrow(NotFoundException);
    });

    it('returns zero balances when no expenses or reimbursements', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      expenseRepo.find.mockResolvedValue([]);
      reimbursementRepo.find.mockResolvedValue([]);

      const result = await service.getBalances('group-1');

      expect(result.simplifiedDebts).toHaveLength(0);
      expect(result.balances.every((b) => b.netBalance === 0)).toBe(true);
    });

    it('simplifies debt: A paid 30 split equally between A and B — B owes A 15', async () => {
      const userA = makeUser({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' });
      const userB = makeUser({ id: 'user-2', firstName: 'Bob', email: 'bob@test.com' });
      const group = makeGroup({ owner: userA, members: [{ user: userB }] });
      groupRepo.findOne.mockResolvedValue(group);

      const expense = {
        id: 'exp-1',
        amount: '30',
        paidBy: userA,
        participants: [
          { user: userA, share: '15' },
          { user: userB, share: '15' },
        ],
      };
      expenseRepo.find.mockResolvedValue([expense]);
      reimbursementRepo.find.mockResolvedValue([]);

      const result = await service.getBalances('group-1');

      expect(result.simplifiedDebts).toHaveLength(1);
      const debt = result.simplifiedDebts[0];
      expect(debt.fromUserId).toBe('user-2');
      expect(debt.toUserId).toBe('user-1');
      expect(debt.amount).toBe(15);
    });

    it('factors reimbursement into net balances', async () => {
      const userA = makeUser({ id: 'user-1', firstName: 'Alice', email: 'alice@test.com' });
      const userB = makeUser({ id: 'user-2', firstName: 'Bob', email: 'bob@test.com' });
      const group = makeGroup({ owner: userA, members: [{ user: userB }] });
      groupRepo.findOne.mockResolvedValue(group);

      // No expenses — only a reimbursement of 10 from Bob to Alice
      expenseRepo.find.mockResolvedValue([]);
      const reimbursement = { id: 'r-1', amount: '10', fromUser: userB, toUser: userA };
      reimbursementRepo.find.mockResolvedValue([reimbursement]);

      const result = await service.getBalances('group-1');

      // toUser net increases, fromUser net decreases
      const aliceBalance = result.balances.find((b) => b.userId === 'user-1');
      const bobBalance = result.balances.find((b) => b.userId === 'user-2');
      expect(aliceBalance?.netBalance).toBe(10);
      expect(bobBalance?.netBalance).toBe(-10);
    });
  });

  // ── createReimbursement ────────────────────────────────────────────────────

  describe('createReimbursement()', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createReimbursement('group-x', { toUserId: 'user-2', amount: 10 }, makeUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when toUser does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createReimbursement('group-1', { toUserId: 'user-x', amount: 10 }, makeUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates and returns reimbursement', async () => {
      const toUser = makeUser({ id: 'user-2', firstName: 'Bob', email: 'bob@test.com' });
      const fromUser = makeUser();
      groupRepo.findOne.mockResolvedValue(makeGroup());
      userRepo.findOne.mockResolvedValue(toUser);
      const saved = {
        id: 'r-1',
        amount: 10,
        note: null,
        createdAt: new Date(),
        fromUser,
        toUser,
      };
      reimbursementRepo.create.mockReturnValue(saved);
      reimbursementRepo.save.mockResolvedValue(saved);

      const result = await service.createReimbursement(
        'group-1',
        { toUserId: 'user-2', amount: 10 },
        fromUser,
      );

      expect(reimbursementRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({ amount: 10 });
    });
  });
});
