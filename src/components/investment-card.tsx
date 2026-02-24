"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const machineImage = PlaceHolderImages.find(p => p.id === 'investment-machine');

export function InvestmentCard() {
  const [isInvested, setIsInvested] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate a random pre-existing investment to make the page dynamic
    if (Math.random() > 0.5) {
      setIsInvested(true);
    }
  }, []);

  const handleInvestment = () => {
    setIsInvested(true);
    toast({
      title: "Investimento Realizado!",
      description: "Sua máquina Rogério começou a operar.",
    });
  };

  const handleWithdraw = () => {
    setIsInvested(false);
    toast({
      title: "Saque Realizado!",
      description: "Os rendimentos foram adicionados ao seu saldo.",
    });
  }

  return (
    <Card className="flex flex-col">
      {machineImage && (
        <div className="relative h-48 w-full">
            <Image
                src={machineImage.imageUrl}
                alt={machineImage.description}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={machineImage.imageHint}
            />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="text-primary" />
            Máquina Rogério
        </CardTitle>
        <CardDescription>
          Rendimento total em 5 dias. Invista 20 USDT para começar a render.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {isInvested ? (
          <div className="text-center p-4 border-2 border-dashed rounded-lg bg-primary/10 border-primary/30">
            <p className="font-semibold text-primary">Sua máquina está operando.</p>
            <p className="text-sm text-muted-foreground mt-1">O retorno será creditado em seu saldo.</p>
          </div>
        ) : (
          <div className="text-center p-4 border-2 border-dashed rounded-lg bg-card/50">
            <p className="text-muted-foreground">Esta máquina está inativa.</p>
            <p className="font-semibold text-lg">Invista 20 USDT para começar.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isInvested ? (
            <Button className="w-full" onClick={handleWithdraw}>
              Sacar Rendimentos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        ) : (
            <Button className="w-full" onClick={handleInvestment}>
              Investir 20 USDT
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
