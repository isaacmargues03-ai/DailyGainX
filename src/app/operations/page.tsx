'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';
import { Operation } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
    const { operations } = useAppContext();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-background p-4">
                <div className="container mx-auto">
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
                                            <TableHead>Preço</TableHead>
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
