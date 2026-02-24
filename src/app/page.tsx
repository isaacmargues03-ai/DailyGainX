import { Header } from '@/components/header';
import { InvestmentCard } from '@/components/investment-card';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Painel de Controle</h1>
          <InvestmentCard />
        </div>
      </main>
    </div>
  );
}
