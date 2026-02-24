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
