"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const machineImage = PlaceHolderImages.find(p => p.id === 'investment-machine');

export function InvestmentCard() {
  const [isInvested, setIsInvested] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate a random pre-existing investment to make the page dynamic
    if (Math.random() > 0.5) {
      setIsInvested(true);
      // Simulate progress between 1 and 4 days (20% to 80%)
      const randomDay = Math.floor(Math.random() * 4) + 1;
      setProgress(randomDay * 20);
    }
  }, []);

  const handleInvestment = () => {
    setIsInvested(true);
    setProgress(0);
    toast({
      title: "Investimento Realizado!",
      description: "Sua máquina Rogério começou a operar.",
    });

    // Animate progress to first day's value for visual feedback
    const timer = setTimeout(() => setProgress(20), 500);
    return () => clearTimeout(timer);
  };

  const handleWithdraw = () => {
    setIsInvested(false);
    setProgress(0);
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
          Rendimento total em 5 dias. Invista 20 USDT e acompanhe seu progresso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {isInvested ? (
          <div>
            <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
             <p className="text-xs text-muted-foreground mt-2">
                {progress < 100 ? `Retorno disponível em ${5 - Math.floor(progress / 20)} dias.` : "Pronto para sacar!"}
            </p>
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
            <Button className="w-full" onClick={handleWithdraw} disabled={progress < 100}>
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
