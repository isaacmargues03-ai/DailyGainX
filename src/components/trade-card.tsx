"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        value += (Math.random() - 0.5) * 0.01;
        data.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(value.toFixed(4)) });
    }
    return data;
};

const WIN_PROBABILITY = 0.2; // 20% chance to win
const MAX_WIN_AMOUNT = 1.5;
const MIN_WIN_AMOUNT = 0.1;
const MIN_LOSS_AMOUNT = 3.0;
const MAX_LOSS_AMOUNT = 8.0;

export function TradeCard() {
    const { balance, setBalance, addOperation } = useAppContext();
    const { toast } = useToast();
    const [message, setMessage] = useState<string | null>(null);
    const [isTrading, setIsTrading] = useState(false);

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

        setIsTrading(true);
        setMessage(`Ordem de ${direction === 'buy' ? 'compra' : 'venda'} enviada. Aguardando resultado...`);

        setTimeout(() => {
            const isWin = Math.random() < WIN_PROBABILITY;
            let amountChanged: number;
            const outcome = isWin ? 'win' : 'loss';

            if (isWin) {
                amountChanged = MIN_WIN_AMOUNT + Math.random() * (MAX_WIN_AMOUNT - MIN_WIN_AMOUNT);
            } else {
                amountChanged = -(MIN_LOSS_AMOUNT + Math.random() * (MAX_LOSS_AMOUNT - MIN_LOSS_AMOUNT));
            }

            if (balance + amountChanged < 0) {
                toast({
                    variant: 'destructive',
                    title: 'Operação Falhou',
                    description: `Você não tem saldo para cobrir a perda de ${Math.abs(amountChanged).toFixed(2)} USDT.`,
                });
                setMessage('Falha na operação por saldo insuficiente para cobrir possível perda.');
                setIsTrading(false);
                setTimeout(() => setMessage(null), 5000);
                return;
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
                {message && <p className="text-sm text-center text-muted-foreground mt-4">{message}</p>}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleTrade('buy')} disabled={isTrading}>
                    {isTrading ? 'Aguarde...' : 'Comprar'}
                </Button>
                <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleTrade('sell')} disabled={isTrading}>
                     {isTrading ? 'Aguarde...' : 'Vender'}
                </Button>
            </CardFooter>
        </Card>
    );
}
