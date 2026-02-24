"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DollarSign } from 'lucide-react';
import { TradeChart } from './trade-chart';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";

export function TradeCard() {
    const { balance, openPosition, marketData, lastPrice } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
    const [tradeAmount, setTradeAmount] = useState('1.00');

    const secondLastPrice = marketData.length > 1 ? marketData[marketData.length - 2].price : lastPrice;
    const priceChange = lastPrice - secondLastPrice;
    const priceChangePercentage = secondLastPrice !== 0 ? (priceChange / secondLastPrice) * 100 : 0;
    const isPositive = priceChange >= 0;

    const handleOpenDialog = (direction: 'buy' | 'sell') => {
        setTradeDirection(direction);
        setIsDialogOpen(true);
    };

    const handleConfirmTrade = () => {
        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount < 1) {
            toast({
                variant: 'destructive',
                title: 'Valor Inválido',
                description: 'A quantidade para operar deve ser de no mínimo 1 USDT.',
            });
            return;
        }

        if (balance < amount) {
            toast({
                variant: 'destructive',
                title: 'Saldo Insuficiente',
                description: `Você não tem saldo suficiente para abrir esta operação.`,
            });
            return;
        }

        openPosition({
            type: tradeDirection,
            amount: amount,
        });

        toast({
            title: 'Operação Aberta!',
            description: 'Sua operação foi aberta e pode ser acompanhada no histórico.',
        });

        setIsDialogOpen(false);
        router.push('/operations');
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="text-primary"/>
                        USD/BRL
                    </CardTitle>
                    <CardDescription>O gráfico atualiza em tempo real. Faça sua previsão.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 text-center">
                        <p className={cn("text-4xl font-bold tracking-tighter", isPositive ? 'text-green-500' : 'text-red-500')}>{lastPrice.toFixed(4)}</p>
                        <p className={cn("text-sm font-medium", isPositive ? 'text-green-500' : 'text-red-500')}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(4)} ({priceChangePercentage.toFixed(2)}%)
                        </p>
                    </div>
                    <div className="h-64 w-full">
                        <TradeChart data={marketData} isPositive={isPositive} />
                    </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-4">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6" onClick={() => handleOpenDialog('buy')}>
                        Comprar
                    </Button>
                    <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-6" onClick={() => handleOpenDialog('sell')}>
                        Vender
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Operação</DialogTitle>
                        <DialogDescription>
                            Digite a quantidade que deseja operar e clique em confirmar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount-dialog" className="text-right">
                                Quantidade
                            </Label>
                            <Input
                                id="amount-dialog"
                                type="number"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                className="col-span-3"
                                placeholder="Mínimo 1.00"
                                min="1"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleConfirmTrade}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
