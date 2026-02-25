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
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: string;
  status: 'Completed' | 'Pending' | 'Failed';
  method: 'Pix';
  externalId?: string;
};
