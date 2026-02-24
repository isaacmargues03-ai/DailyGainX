'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Operation, OpenPosition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

// A card for a single open position
function OpenPositionCard({ position }: { position: OpenPosition }) {
    const { marketData, closePosition } = useAppContext();
    const [pnl, setPnl] = useState(0);
    const [pnlColor, setPnlColor] = useState('text-muted-foreground');

    useEffect(() => {
        const calculatePnl = () => {
            const currentPrice = marketData[marketData.length - 1]?.price;
            if (!currentPrice || !position) return;
            
            const leverage = 10;
            let currentPnl;

            if (position.type === 'buy') {
                currentPnl = ((currentPrice - position.entryPrice) / position.entryPrice) * position.amount * leverage;
            } else { // 'sell'
                currentPnl = ((position.entryPrice - currentPrice) / position.entryPrice) * position.amount * leverage;
            }

            const cappedPnl = Math.max(currentPnl, -position.amount);
            setPnl(cappedPnl);
            setPnlColor(cappedPnl >= 0 ? 'text-green-500' : 'text-red-500');
        };

        const interval = setInterval(calculatePnl, 1000); // Update every second
        calculatePnl(); // Initial calculation

        return () => clearInterval(interval);

    }, [marketData, position, closePosition]);

    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                        {position.type === 'buy' ? 
                            <TrendingUp className="h-10 w-10 text-green-500" /> : 
                            <TrendingDown className="h-10 w-10 text-red-500" />
                        }
                        <div>
                            <p className="font-semibold text-base capitalize">{position.type === 'buy' ? 'Compra' : 'Venda'} @ {position.entryPrice.toFixed(4)}</p>
                            <p className="text-sm text-muted-foreground">Investido: {position.amount.toFixed(2)} USDT</p>
                        </div>
                    </div>
                     <Button variant="destructive" size="sm" onClick={() => closePosition(position.id)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Fechar
                    </Button>
                </div>
                <div className="text-center bg-muted/50 rounded-md p-3">
                     <p className="text-xs text-muted-foreground">Resultado Atual (P/L)</p>
                     <p className={cn("text-2xl font-bold", pnlColor)}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
                     </p>
                </div>
                 <p className="text-xs text-muted-foreground text-center mt-2">ID: {position.id}</p>
            </CardContent>
        </Card>
    );
}


export default function OperationsPage() {
    const { operations, openPositions } = useAppContext();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-background p-4">
                <div className="container mx-auto">
                    {/* Open Positions Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Operações Abertas</h2>
                        {openPositions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {openPositions.map((pos) => (
                                    <OpenPositionCard key={pos.id} position={pos} />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-6 text-center text-muted-foreground">
                                    <p>Nenhuma operação aberta no momento.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Closed Operations History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Operações</CardTitle>
                            <CardDescription>
                                Aqui estão todas as suas operações de mercado recentes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {operations.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Preço Entrada</TableHead>
                                            <TableHead>Resultado</TableHead>
                                            <TableHead className="text-right">Valor (USDT)</TableHead>
                                            <TableHead>Data</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {operations.map((op: Operation) => (
                                            <TableRow key={op.id}>
                                                <TableCell className="font-medium capitalize">{op.type === 'buy' ? 'Compra' : 'Venda'}</TableCell>
                                                <TableCell>{op.price.toFixed(4)}</TableCell>
                                                <TableCell
                                                    className={cn(
                                                        'font-semibold',
                                                        op.outcome === 'win' ? 'text-green-500' : 'text-red-500'
                                                    )}
                                                >
                                                    {op.outcome === 'win' ? 'Ganho' : 'Perda'}
                                                </TableCell>
                                                <TableCell
                                                    className={cn(
                                                        'text-right font-medium',
                                                        op.outcome === 'win' ? 'text-green-500' : 'text-red-500'
                                                    )}
                                                >
                                                    {op.outcome === 'win' ? '+' : '-'}{op.amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell>{op.timestamp}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Nenhuma operação realizada ainda.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
