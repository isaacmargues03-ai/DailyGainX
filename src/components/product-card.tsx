'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { User, Calendar, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from '@/context/AppContext';
import type { Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
  imageUrl: string;
  imageHint: string;
}

export function ProductCard({ product, imageUrl, imageHint }: ProductCardProps) {
  const { instructorName, companyName, period, minInvestment, profit } = product;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addInvestment, balance, isBalanceLoading } = useAppContext();

  const handleInvest = () => {
    if (isBalanceLoading) {
        toast({
            variant: "destructive",
            title: "Aguarde",
            description: "Seu saldo está sendo carregado. Tente novamente em alguns segundos.",
        });
        return;
    }
    if (balance < minInvestment) {
        toast({
            variant: "destructive",
            title: "Saldo Insuficiente",
            description: `Você precisa de pelo menos ${minInvestment} USDT para este investimento.`,
        });
        setIsDialogOpen(false);
        return;
    }

    const success = addInvestment(product, { imageUrl, imageHint });

    if (success) {
        toast({
          title: "Investimento Confirmado!",
          description: `Você investiu na ${companyName}.`,
        });
    }
    setIsDialogOpen(false);
  };
  
  return (
    <>
      <Card className="w-full overflow-hidden shadow-lg rounded-xl">
        <div className="relative h-40 w-full">
          <Image
            src={imageUrl}
            alt={companyName}
            fill
            className="object-cover"
            data-ai-hint={imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-xl font-bold text-white">{companyName}</h3>
            <p className="text-sm text-white/90 flex items-center gap-2 mt-1">
              <User className="h-4 w-4" />
              Instrutor: {instructorName}
            </p>
          </div>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                      <p className="text-muted-foreground">Período</p>
                      <p className="font-semibold">{period} dias</p>
                  </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                      <p className="text-muted-foreground">Mínimo</p>
                      <p className="font-semibold">{minInvestment} USDT</p>
                  </div>
              </div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-sm text-green-700">Retorno estimado em {period} dias</p>
              <p className="text-xl font-bold text-green-600">+{profit} USDT</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" onClick={() => setIsDialogOpen(true)} disabled={isBalanceLoading}>
            {isBalanceLoading ? 'Carregando Saldo...' : 'Investir'}
            </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Investir em {companyName}</DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-2">
                <p>
                  Na {companyName}, estamos comprometidos com a inovação e o crescimento sustentável. Nossa equipe de funcionários apaixonados trabalha todos os dias para entregar os melhores resultados. Estamos sempre em busca de novos talentos para se juntarem à nossa equipe e oferecemos diversas vagas de emprego.
                </p>
                <p>
                  Ao confirmar, você investirá <span className="font-bold">{minInvestment} USDT</span> por <span className="font-bold">{period} dias</span> para um retorno estimado de <span className="font-bold">{profit} USDT</span>.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvest}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
