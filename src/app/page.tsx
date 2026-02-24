import { Header } from '@/components/header';
import { InvestmentCard } from '@/components/investment-card';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Painel de Controle</h1>
            <InvestmentCard />
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Landmark className="text-primary"/>
                    Depositar Fundos
                </CardTitle>
                <CardDescription>Depósito mínimo de 20 USDT.</CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="amount">Valor (USDT)</Label>
                      <Input id="amount" placeholder="Ex: 50" type="number" min="20" />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Confirmar Depósito</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
