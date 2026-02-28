'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function TransactionItem({ 
  transaction, 
  onViewDetails
}: { 
  transaction: Transaction; 
  onViewDetails: (tx: Transaction) => void;
}) {
  // Apenas saques chegam aqui agora, mas mantemos a segurança
  const isWithdrawal = transaction.type === 'withdrawal';
  if (!isWithdrawal) return null;
  
  return (
    <div 
        className="flex flex-col py-6 border-b border-black/5 last:border-b-0 cursor-pointer hover:bg-muted/5 transition-colors" 
        onClick={() => onViewDetails(transaction)}
    >
        <div className="flex items-center justify-between">
            <p className="font-black text-lg tracking-tighter uppercase">SAQUE</p>
            <p className="text-lg font-black tracking-tighter text-red-600">
                -{transaction.amount.toFixed(2)} USDT
            </p>
        </div>
    </div>
  );
}

export default function HistoryPage() {
    const { transactions } = useAppContext();
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Filtra para mostrar apenas SAQUES (withdrawals)
    const withdrawalTransactions = transactions.filter(tx => tx.type === 'withdrawal');

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 p-6">
                <div className="container mx-auto max-w-lg">
                    <div className="flex items-center justify-start mb-8">
                        <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent">
                            <Link href="/profile" className="flex items-center gap-2 text-[11px] text-muted-foreground font-black uppercase tracking-widest transition-all">
                                <ArrowLeft className="h-4 w-4" /> Voltar
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div className="pb-4 border-b-2 border-black">
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Histórico</h2>
                        </div>

                        <div className="space-y-0">
                             {withdrawalTransactions.length > 0 ? (
                                <div className="divide-y divide-black/5">
                                    {withdrawalTransactions.map((tx) => (
                                        <TransactionItem 
                                            key={tx.id} 
                                            transaction={tx} 
                                            onViewDetails={setSelectedTx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-40">
                                    <p className="text-sm font-black uppercase tracking-[0.5em] text-black/20">Vazio</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                        <DialogContent className="max-w-[340px] border-4 border-black rounded-none shadow-none p-0 overflow-hidden bg-background">
                            <div className="p-6 bg-black text-white">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em]">Detalhes</h3>
                            </div>
                            {selectedTx && (
                                <div className="p-8 space-y-6 text-black">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-black uppercase tracking-widest text-[10px]">Operação</span>
                                        <span className="font-black uppercase">SAQUE</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-black uppercase tracking-widest text-[10px]">Valor</span>
                                        <span className="text-xl font-black tracking-tighter text-red-600">
                                            {selectedTx.amount.toFixed(2)} USDT
                                        </span>
                                    </div>
                                    
                                    <div className="pt-6 border-t-2 border-black space-y-1">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Data</div>
                                        <p className="text-xs font-bold uppercase">{selectedTx.timestamp}</p>
                                    </div>

                                    <div className="pt-4 border-t-2 border-black/5 space-y-1">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Status</div>
                                        <p className="text-xs font-bold uppercase text-primary">PENDENTE</p>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
}