
export type Operation = {
  id: string;
  type: 'buy' | 'sell';
  outcome: 'win' | 'loss';
  amount: number;
  timestamp: string;
  price: number;
};

export type OpenPosition = {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  timestamp: string;
};

export type ActiveInvestment = {
  id: string;
  productId: string;
  instructorName: string;
  companyName: string;
  period: number;
  investedAmount: number;
  profit: number;
  imageUrl: string;
  imageHint: string;
  investmentTimestamp: number;
  status?: 'active' | 'claimed';
};

export type Transaction = {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'validated' | 'claimed' | 'PAGO' | 'RECUSADO';
  method: 'Pix';
  externalId?: string;
  pixKey?: string;
  fullName?: string;
  claimedAt?: string;
  depositDate?: string;
  pixCopyPaste?: string;
  withdrawCode?: string;
  chineseCode?: string;
};
