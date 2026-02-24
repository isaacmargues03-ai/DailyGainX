export type Product = {
  id: string;
  instructorName: string;
  companyName: string;
  period: number;
  minInvestment: number;
  profit: number;
};

export const products: Product[] = [
  {
    id: 'petrobras-company',
    instructorName: 'Maurício Instrutor',
    companyName: 'Petrobras',
    period: 6,
    minInvestment: 5,
    profit: 4,
  },
  {
    id: 'vale-company',
    instructorName: 'Ricardo Almeida',
    companyName: 'Vale',
    period: 25,
    minInvestment: 10,
    profit: 8,
  },
  {
    id: 'itau-company',
    instructorName: 'Sofia Lima',
    companyName: 'Itaú Unibanco',
    period: 30,
    minInvestment: 20,
    profit: 15,
  },
  {
    id: 'ambev-company',
    instructorName: 'Beatriz Santos',
    companyName: 'Ambev',
    period: 35,
    minInvestment: 30,
    profit: 25,
  },
  {
    id: 'magalu-company',
    instructorName: 'Carlos Ferreira',
    companyName: 'Magazine Luiza',
    period: 40,
    minInvestment: 40,
    profit: 30,
  },
  {
    id: 'renner-company',
    instructorName: 'Lucas Andrade',
    companyName: 'Renner',
    period: 45,
    minInvestment: 50,
    profit: 40,
  },
  {
    id: 'nubank-company',
    instructorName: 'Gabriela Costa',
    companyName: 'Nubank',
    period: 50,
    minInvestment: 60,
    profit: 55,
  },
  {
    id: 'xp-company',
    instructorName: 'Rafael Martins',
    companyName: 'XP Inc.',
    period: 60,
    minInvestment: 100,
    profit: 90,
  },
];
