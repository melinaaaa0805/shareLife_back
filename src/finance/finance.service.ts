import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseParticipant } from './entities/expense-participant.entity';
import { Reimbursement } from './entities/reimbursement.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { CreateExpenseDto, ParticipantShareDto } from './dto/create-expense.dto';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { BalanceResponse, DebtEdge, MemberBalance } from './dto/balance-response.dto';
import { SplitMode } from './enums/split-mode.enum';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseParticipant)
    private readonly participantRepo: Repository<ExpenseParticipant>,
    @InjectRepository(Reimbursement)
    private readonly reimbursementRepo: Repository<Reimbursement>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createExpense(
    groupId: string,
    dto: CreateExpenseDto,
    paidBy: User,
  ): Promise<Expense> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    // Collect all member IDs (owner + members)
    const memberIds = new Set<string>();
    memberIds.add(group.owner.id);
    for (const gm of group.members) {
      memberIds.add(gm.user.id);
    }

    for (const p of dto.participants) {
      if (!memberIds.has(p.userId)) {
        throw new BadRequestException(
          `L'utilisateur ${p.userId} n'est pas membre du groupe`,
        );
      }
    }

    const shares = this.computeShares(
      dto.amount,
      dto.participants,
      dto.splitMode,
      paidBy.id,
    );

    const participants: ExpenseParticipant[] = [];
    for (const p of dto.participants) {
      const user = await this.userRepo.findOne({ where: { id: p.userId } });
      if (!user) continue;
      const ep = this.participantRepo.create({
        user,
        share: shares.get(p.userId) ?? 0,
      });
      participants.push(ep);
    }

    const expense = this.expenseRepo.create({
      title: dto.title,
      amount: dto.amount,
      category: dto.category,
      splitMode: dto.splitMode,
      date: dto.date,
      paidBy,
      group,
      participants,
    });

    return this.expenseRepo.save(expense);
  }

  async findExpenses(groupId: string): Promise<object[]> {
    const expenses = await this.expenseRepo.find({
      where: { group: { id: groupId } },
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return expenses.map((e) => this.formatExpense(e));
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const expense = await this.expenseRepo.findOne({
      where: { id: expenseId },
    });
    if (!expense) throw new NotFoundException('Dépense non trouvée');
    await this.expenseRepo.delete(expenseId);
  }

  async createReimbursement(
    groupId: string,
    dto: CreateReimbursementDto,
    fromUser: User,
  ): Promise<object> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const toUser = await this.userRepo.findOne({ where: { id: dto.toUserId } });
    if (!toUser) throw new NotFoundException('Utilisateur destinataire non trouvé');

    const reimbursement = this.reimbursementRepo.create({
      group,
      fromUser,
      toUser,
      amount: dto.amount,
      note: dto.note ?? null,
    });

    const saved = await this.reimbursementRepo.save(reimbursement);
    return this.formatReimbursement(saved);
  }

  async findReimbursements(groupId: string): Promise<object[]> {
    const reimbursements = await this.reimbursementRepo.find({
      where: { group: { id: groupId } },
      order: { createdAt: 'DESC' },
    });
    return reimbursements.map((r) => this.formatReimbursement(r));
  }

  async getBalances(groupId: string): Promise<BalanceResponse> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    // Map userId → user info
    const usersMap = new Map<string, { firstName: string; email: string }>();
    usersMap.set(group.owner.id, {
      firstName: group.owner.firstName,
      email: group.owner.email,
    });
    for (const gm of group.members) {
      usersMap.set(gm.user.id, {
        firstName: gm.user.firstName,
        email: gm.user.email,
      });
    }

    // Initialize net balances for all members
    const net = new Map<string, number>();
    for (const uid of usersMap.keys()) {
      net.set(uid, 0);
    }

    const paid = new Map<string, number>();
    const owed = new Map<string, number>();
    for (const uid of usersMap.keys()) {
      paid.set(uid, 0);
      owed.set(uid, 0);
    }

    // Process expenses
    const expenses = await this.expenseRepo.find({
      where: { group: { id: groupId } },
    });

    for (const expense of expenses) {
      const amount = parseFloat(String(expense.amount));
      if (expense.paidBy && net.has(expense.paidBy.id)) {
        net.set(expense.paidBy.id, (net.get(expense.paidBy.id) ?? 0) + amount);
        paid.set(expense.paidBy.id, (paid.get(expense.paidBy.id) ?? 0) + amount);
      }
      for (const participant of expense.participants) {
        const share = parseFloat(String(participant.share));
        const uid = participant.user.id;
        if (net.has(uid)) {
          net.set(uid, (net.get(uid) ?? 0) - share);
          owed.set(uid, (owed.get(uid) ?? 0) + share);
        }
      }
    }

    // Process reimbursements
    const reimbursements = await this.reimbursementRepo.find({
      where: { group: { id: groupId } },
    });

    for (const r of reimbursements) {
      const amount = parseFloat(String(r.amount));
      if (r.toUser && net.has(r.toUser.id)) {
        net.set(r.toUser.id, (net.get(r.toUser.id) ?? 0) + amount);
      }
      if (r.fromUser && net.has(r.fromUser.id)) {
        net.set(r.fromUser.id, (net.get(r.fromUser.id) ?? 0) - amount);
      }
    }

    const balances: MemberBalance[] = [];
    for (const [userId, netBalance] of net.entries()) {
      const info = usersMap.get(userId)!;
      balances.push({
        userId,
        firstName: info.firstName,
        email: info.email,
        totalPaid: Math.round((paid.get(userId) ?? 0) * 100) / 100,
        totalOwed: Math.round((owed.get(userId) ?? 0) * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100,
      });
    }

    const simplifiedDebts = this.simplifyDebts(net, usersMap);

    return { balances, simplifiedDebts };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private computeShares(
    amount: number,
    participants: ParticipantShareDto[],
    splitMode: SplitMode,
    paidByUserId: string,
  ): Map<string, number> {
    const shares = new Map<string, number>();

    if (splitMode === SplitMode.CUSTOM) {
      let sum = 0;
      for (const p of participants) {
        const s = p.share ?? 0;
        shares.set(p.userId, s);
        sum += s;
      }
      if (Math.abs(sum - amount) > 0.01) {
        throw new BadRequestException(
          `La somme des parts (${sum}) ne correspond pas au montant total (${amount})`,
        );
      }
    } else {
      // EQUAL split with rounding correction
      const n = participants.length;
      const base = Math.floor((amount / n) * 100) / 100;
      const remainder = Math.round((amount - base * n) * 100) / 100;
      for (const p of participants) {
        shares.set(p.userId, base);
      }
      // Add remainder to paidBy participant, or first participant if paidBy not in list
      const correctionTarget = participants.find((p) => p.userId === paidByUserId)
        ?? participants[0];
      shares.set(
        correctionTarget.userId,
        Math.round((shares.get(correctionTarget.userId)! + remainder) * 100) / 100,
      );
    }

    return shares;
  }

  private simplifyDebts(
    net: Map<string, number>,
    usersMap: Map<string, { firstName: string; email: string }>,
  ): DebtEdge[] {
    const creditors: { userId: string; balance: number }[] = [];
    const debtors: { userId: string; balance: number }[] = [];

    for (const [userId, balance] of net.entries()) {
      const rounded = Math.round(balance * 100) / 100;
      if (rounded > 0.01) creditors.push({ userId, balance: rounded });
      else if (rounded < -0.01) debtors.push({ userId, balance: rounded });
    }

    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance);

    const result: DebtEdge[] = [];
    let ci = 0;
    let di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const creditor = creditors[ci];
      const debtor = debtors[di];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      const rounded = Math.round(amount * 100) / 100;

      if (rounded > 0.01) {
        result.push({
          fromUserId: debtor.userId,
          fromFirstName: usersMap.get(debtor.userId)?.firstName ?? '',
          toUserId: creditor.userId,
          toFirstName: usersMap.get(creditor.userId)?.firstName ?? '',
          amount: rounded,
        });
      }

      creditor.balance = Math.round((creditor.balance - amount) * 100) / 100;
      debtor.balance = Math.round((debtor.balance + amount) * 100) / 100;

      if (creditor.balance < 0.01) ci++;
      if (Math.abs(debtor.balance) < 0.01) di++;
    }

    return result;
  }

  private formatExpense(e: Expense) {
    return {
      id: e.id,
      title: e.title,
      amount: parseFloat(String(e.amount)),
      category: e.category,
      splitMode: e.splitMode,
      date: e.date,
      createdAt: e.createdAt,
      paidBy: e.paidBy
        ? { id: e.paidBy.id, firstName: e.paidBy.firstName, email: e.paidBy.email }
        : null,
      participants: e.participants.map((p) => ({
        userId: p.user.id,
        firstName: p.user.firstName,
        email: p.user.email,
        share: parseFloat(String(p.share)),
      })),
    };
  }

  private formatReimbursement(r: Reimbursement) {
    return {
      id: r.id,
      amount: parseFloat(String(r.amount)),
      note: r.note,
      createdAt: r.createdAt,
      fromUser: r.fromUser
        ? { id: r.fromUser.id, firstName: r.fromUser.firstName, email: r.fromUser.email }
        : null,
      toUser: r.toUser
        ? { id: r.toUser.id, firstName: r.toUser.firstName, email: r.toUser.email }
        : null,
    };
  }
}
