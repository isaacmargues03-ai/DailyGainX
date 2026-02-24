import { Header } from '@/components/header';

export default function InvestirPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <h1 className="text-3xl font-bold">Investir</h1>
        <p className="text-muted-foreground">Aqui você poderá ver as opções de investimento.</p>
      </main>
    </div>
  );
}
