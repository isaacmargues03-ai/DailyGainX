"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { TradeChart } from './trade-chart';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";

const generateData = (count: number, initialValue: number) => {
    let value = initialValue;
    const data = [];
    for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - (count - i));
        data.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(value.toFixed(4)) });
    }
    return data;
};

const WIN_PROBABILITY = 0.2; // 20% chance to win
const WIN_MULTIPLIER = 0.15; // 15% gain on the amount traded

export function TradeCard() {
    const { balance, setBalance, addOperation } = useAppContext();
    const { toast } = useToast();
    const [message, setMessage] = useState<string | null>(null);
    const [isTrading, setIsTrading] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('1.00');

    const initialData = useMemo(() => generateData(30, 5.4321), []);
    const [data, setData] = useState(initialData);

    const lastPrice = data.length > 0 ? data[data.length - 1].price : 0;
    const secondLastPrice = data.length > 1 ? data[data.length - 2].price : lastPrice;
    const priceChange = lastPrice - secondLastPrice;
    const priceChangePercentage = secondLastPrice !== 0 ? (priceChange / secondLastPrice) * 100 : 0;
    const isPositive = priceChange >= 0;

    useEffect(() => {
        const interval = setInterval(() => {
            setData(prevData => {
                if (prevData.length === 0) return prevData;
                const newData = [...prevData.slice(1)];
                const lastPoint = newData[newData.length - 1];
                const newValue = lastPoint.price + (Math.random() - 0.5) * 0.01;
                newData.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(newValue.toFixed(4)) });
                return newData;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleTrade = (direction: 'buy' | 'sell') => {
        if (isTrading) return;

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
                description: `Você não tem saldo para cobrir a perda de ${amount.toFixed(2)} USDT.`,
            });
            return;
        }

        setIsTrading(true);
        setMessage(`Ordem de ${direction === 'buy' ? 'compra' : 'venda'} de ${amount.toFixed(2)} USDT enviada. Aguardando resultado...`);

        setTimeout(() => {
            const isWin = Math.random() < WIN_PROBABILITY;
            const outcome = isWin ? 'win' : 'loss';
            let amountChanged: number;

            if (isWin) {
                amountChanged = amount * WIN_MULTIPLIER;
            } else {
                amountChanged = -amount;
            }

            setBalance(prev => prev + amountChanged);
            addOperation({
                type: direction,
                price: lastPrice,
                outcome,
                amount: Math.abs(amountChanged),
            });

            const resultMessage = `Você ${isWin ? 'ganhou' : 'perdeu'} ${Math.abs(amountChanged).toFixed(2)} USDT.`;
            setMessage(resultMessage);
            toast({
                title: 'Operação Concluída',
                description: resultMessage,
                variant: isWin ? 'default' : 'destructive',
            });

            setIsTrading(false);
            setTimeout(() => setMessage(null), 5000);

        }, 3000); // 3 second delay
    }

    return (
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
                    <TradeChart data={data} isPositive={isPositive} />
                </div>
                
                <div className="mt-6 grid w-full max-w-sm items-center gap-2 mx-auto">
                    <Label htmlFor="amount" className="text-base">Quantidade (USDT)</Label>
                    <Input
                        type="number"
                        id="amount"
                        placeholder="Mínimo 1.00"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        disabled={isTrading}
                        className="text-lg p-4 text-center"
                    />
                </div>
                
                {message && <p className="text-sm text-center text-muted-foreground mt-4">{message}</p>}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6" onClick={() => handleTrade('buy')} disabled={isTrading}>
                    {isTrading ? 'Aguarde...' : 'Comprar / Sobe'}
                </Button>
                <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg py-6" onClick={() => handleTrade('sell')} disabled={isTrading}>
                     {isTrading ? 'Aguarde...' : 'Vender / Desce'}
                </Button>
            </CardFooter>
        </Card>
    );
}
