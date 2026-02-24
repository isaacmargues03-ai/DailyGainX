import { Header } from '@/components/header';
import { TradeCard } from '@/components/trade-card';

export default function TradePage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Mercado</h1>
            <TradeCard />
        </div>
      </main>
    </div>
  );
}
