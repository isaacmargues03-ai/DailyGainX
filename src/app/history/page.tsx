'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
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
  const isDeposit = transaction.type === 'deposit';
  
  return (
    <div 
        className="flex flex-col py-8 border-b-2 border-black last:border-b-0 cursor-pointer hover:bg-muted/5 transition-colors" 
        onClick={() => onViewDetails(transaction)}
    >
        <div className="flex items-center justify-between">
            <p className="font-black text-xl tracking-tighter uppercase">{isDeposit ? 'DEPÓSITO' : 'SAQUE'}</p>
            <p className={cn("text-xl font-black tracking-tighter", isDeposit ? 'text-green-600' : 'text-red-600')}>
                {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
            </p>
        </div>
    </div>
  );
}

export default function HistoryPage() {
    const { transactions, clearHistory } = useAppContext();
    const { toast } = useToast();
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isClearing, setIsClearing] = useState(false);

    const handleClear = async () => {
        setIsClearing(true);
        try {
            await clearHistory();
            toast({ title: "HISTÓRICO ZERADO" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "ERRO AO ZERAR" });
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 p-6">
                <div className="container mx-auto max-w-lg">
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent">
                            <Link href="/profile" className="flex items-center gap-2 text-[11px] text-muted-foreground font-black uppercase tracking-widest transition-all">
                                <ArrowLeft className="h-4 w-4" /> Voltar
                            </Link>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClear} 
                            disabled={isClearing || transactions.length === 0}
                            className="text-[11px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-transparent"
                        >
                            {isClearing ? 'Zerando...' : 'Zerar Histórico'}
                        </Button>
                    </div>

                    <div className="space-y-8">
                        <div className="pb-6 border-b-4 border-black">
                            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">Histórico</h2>
                        </div>

                        <div className="space-y-0">
                             {transactions.length > 0 ? (
                                <div className="divide-y divide-black">
                                    {transactions.map((tx) => (
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
                                        <span className="font-black uppercase">{selectedTx.type === 'deposit' ? 'DEPÓSITO' : 'SAQUE'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-black uppercase tracking-widest text-[10px]">Valor</span>
                                        <span className={cn("text-xl font-black tracking-tighter", selectedTx.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                                            {selectedTx.amount.toFixed(2)} USDT
                                        </span>
                                    </div>
                                    
                                    <div className="pt-6 border-t-2 border-black space-y-1">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Data</div>
                                        <p className="text-xs font-bold uppercase">{selectedTx.timestamp}</p>
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
