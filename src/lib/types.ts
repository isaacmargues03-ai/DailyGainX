export type Operation = {
  id: string;
  type: 'buy' | 'sell';
  outcome: 'win' | 'loss';
  amount: number;
  timestamp: string;
  price: number;
};
