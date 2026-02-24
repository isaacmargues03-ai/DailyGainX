'use client';

import { Header } from '@/components/header';
import { ActiveInvestmentCard } from '@/components/active-investment-card';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InvestmentsPage() {
  const { activeInvestments } = useAppContext();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Meus Investimentos</h1>
          <p className="text-muted-foreground mb-6">Acompanhe o andamento dos seus investimentos ativos.</p>
          
          {activeInvestments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeInvestments.map((investment) => (
                <ActiveInvestmentCard key={investment.id} investment={investment} />
              ))}
            </div>
          ) : (
            <Card className="mt-8">
                <CardContent className="p-8 text-center flex flex-col items-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum investimento ativo</h3>
                    <p className="text-muted-foreground mb-6">Você ainda não realizou nenhum investimento. Explore nossos produtos para começar.</p>
                    <Button asChild>
                        <Link href="/products">Ver Produtos</Link>
                    </Button>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
