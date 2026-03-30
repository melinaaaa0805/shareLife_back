export interface MemberBalance {
  userId: string;
  firstName: string;
  email: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface DebtEdge {
  fromUserId: string;
  fromFirstName: string;
  toUserId: string;
  toFirstName: string;
  amount: number;
}

export interface BalanceResponse {
  balances: MemberBalance[];
  simplifiedDebts: DebtEdge[];
}
