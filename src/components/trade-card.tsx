"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { TradeChart } from './trade-chart';

export function TradeCard() {
    const [message, setMessage] = useState<string | null>(null);

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
                <div className="h-64 w-full">
                    <TradeChart />
                </div>
                {message && <p className="text-sm text-center text-muted-foreground mt-4">{message}</p>}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-primary-foreground" onClick={() => handleTrade('buy')}>
                    Comprar
                </Button>
                <Button size="lg" className="bg-red-500 hover:bg-red-600 text-primary-foreground" onClick={() => handleTrade('sell')}>
                    Vender
                </Button>
            </CardFooter>
        </Card>
    );
}
