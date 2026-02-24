'use client';

import { Header } from '@/components/header';
import { ActiveInvestmentCard } from '@/components/active-investment-card';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function InvestmentsPage() {
  const { activeInvestments } = useAppContext();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 sm:p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Meus Investimentos</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o andamento dos seus investimentos ativos.</p>
          </div>
          
          {activeInvestments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeInvestments.map((investment) => (
                <ActiveInvestmentCard key={investment.id} investment={investment} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed shadow-sm p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold tracking-tight">Nenhum investimento ativo</h3>
                        <p className="text-muted-foreground">
                            Você ainda não realizou nenhum investimento. Explore nossos produtos para começar.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/products">Ver Produtos</Link>
                    </Button>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
