'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, DollarSign } from 'lucide-react';
import type { ActiveInvestment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function formatTimeLeft(milliseconds: number): string {
    if (milliseconds <= 0) {
        return "Pronto para resgate";
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (days === 0 && minutes > 0) result += `${minutes}m`;
    
    return result.trim() || "Menos de um minuto";
}

export function ActiveInvestmentCard({ investment }: { investment: ActiveInvestment }) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const startDate = investment.investmentTimestamp;
  const endDate = startDate + investment.period * 24 * 60 * 60 * 1000;

  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const totalDuration = endDate - startDate;
      const elapsed = now - startDate;
      const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(currentProgress);
      setTimeLeft(endDate - now);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const handleClaim = () => {
      if (timeLeft > 0) {
          toast({
              variant: 'destructive',
              title: 'Aguarde',
              description: 'O período de investimento ainda não terminou.',
          });
          return;
      }
      // Future: Call claimInvestment(investment.id) from context
      toast({
          title: 'Resgate Solicitado',
          description: 'Esta funcionalidade será implementada em breve.',
      });
  };

  const canClaim = timeLeft <= 0;

  return (
    <Card className="w-full overflow-hidden shadow-lg rounded-xl">
      <div className="relative h-40 w-full">
        <Image src={investment.imageUrl} alt={investment.companyName} fill className="object-cover" data-ai-hint={investment.imageHint} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-xl font-bold text-white">{investment.companyName}</h3>
            <p className="text-sm text-white/90">Instrutor: {investment.instructorName}</p>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span><Clock className="inline-block mr-1 h-3 w-3" />{formatTimeLeft(timeLeft)}</span>
                <span><Calendar className="inline-block mr-1 h-3 w-3" />{investment.period} dias</span>
            </div>
        </div>

        <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Investido:</div>
            <div className="font-semibold text-right">{investment.investedAmount.toFixed(2)} USDT</div>
            <div className="text-muted-foreground">Retorno Estimado:</div>
            <div className="font-semibold text-right text-green-500">+{investment.profit.toFixed(2)} USDT</div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" onClick={handleClaim} disabled={!canClaim}>
          {canClaim ? 'Resgatar' : 'Em Andamento'}
        </Button>
      </CardFooter>
    </Card>
  );
}
