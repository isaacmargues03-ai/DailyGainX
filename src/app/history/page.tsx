'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isDeposit = transaction.type === 'deposit';
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
        <div className="flex items-center gap-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", isDeposit ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}>
                {isDeposit ? (
                    <ArrowDownToLine className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                    <ArrowUpFromLine className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
            </div>
            <div>
                <p className="font-semibold capitalize">{isDeposit ? 'Depósito' : 'Retirada'}</p>
                <p className="text-sm text-muted-foreground">{transaction.timestamp}</p>
                {transaction.externalId && (
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-xs">ID: {transaction.externalId}</p>
                )}
            </div>
        </div>
        <div className="text-right">
            <p className={cn("font-bold", isDeposit ? 'text-green-600' : 'text-red-600')}>
                {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
            </p>
            <p className="text-sm text-muted-foreground">{transaction.status}</p>
        </div>
    </div>
  );
}


export default function HistoryPage() {
    const { transactions } = useAppContext();

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Header />
            <main className="flex-1 p-4 sm:p-6">
                <div className="container mx-auto max-w-2xl">
                    <div className="mb-4">
                        <Button variant="ghost" asChild className="pl-0">
                            <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para o Perfil
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HistoryIcon className="h-6 w-6"/>
                                Histórico de Transações
                            </CardTitle>
                            <CardDescription>
                                Seus depósitos e saques mais recentes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             {transactions.length > 0 ? (
                                <div>
                                    {transactions.map((tx) => (
                                        <TransactionItem key={tx.id} transaction={tx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <p>Nenhuma transação encontrada.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
