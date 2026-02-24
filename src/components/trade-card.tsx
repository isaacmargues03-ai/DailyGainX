"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { TradeChart } from './trade-chart';
import { cn } from '@/lib/utils';

const generateData = (count: number, initialValue: number) => {
    let value = initialValue;
    const data = [];
    for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - (count - i));
        value += (Math.random() - 0.5) * 0.01;
        data.push({ time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(value.toFixed(4)) });
    }
    return data;
};

export function TradeCard() {
    const [message, setMessage] = useState<string | null>(null);
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
        const action = direction === 'buy' ? 'Compra' : 'Venda';
        setMessage(`Ordem de ${action} enviada.`);
        setTimeout(() => setMessage(null), 4000);
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
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleTrade('buy')}>
                    Comprar
                </Button>
                <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleTrade('sell')}>
                    Vender
                </Button>
            </CardFooter>
        </Card>
    );
}
