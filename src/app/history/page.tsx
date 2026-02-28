
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, CheckCircle2, Loader2, Info, User, Key, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

/**
 * Item de transação ultra-minimalista.
 * Exibe apenas o tipo da operação e o valor.
 */
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
        className="flex flex-col py-6 border-b last:border-b-0 gap-1 cursor-pointer hover:bg-muted/5 transition-colors" 
        onClick={() => onViewDetails(transaction)}
    >
        <div className="flex items-center justify-between">
            <p className="font-black text-sm tracking-tight">{isDeposit ? 'DEPÓSITO' : 'SAQUE'}</p>
            <p className={cn("text-lg font-black tracking-tighter", isDeposit ? 'text-green-600' : 'text-red-600')}>
                {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
            </p>
        </div>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{transaction.timestamp}</p>
    </div>
  );
}

export default function HistoryPage() {
    const { transactions } = useAppContext();
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const handleClaim = async (transaction: Transaction) => {
        if (!user || !firestore || claimingId) return;
        setClaimingId(transaction.id);
        setSelectedTx(null); // Fecha o modal ao iniciar
        
        try {
            await runTransaction(firestore, async (tx) => {
                const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
                const transactionRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', transaction.id);
                const userRef = doc(firestore, 'users', user.uid);

                const [userDoc] = await Promise.all([tx.get(userRef)]);
                const userData = userDoc.data();
                
                let referralDoc = null;
                if (userData && !userData.hasMadeFirstDeposit && userData.referralId) {
                    const referralRef = doc(firestore, 'referrals', userData.referralId);
                    referralDoc = await tx.get(referralRef);
                }

                tx.update(accountRef, { balance: increment(transaction.amount) });
                tx.update(transactionRef, { status: 'CONCLUÍDO', claimedAt: new Date().toISOString() });

                if (userData && !userData.hasMadeFirstDeposit) {
                    tx.update(userRef, { hasMadeFirstDeposit: true });
                    if (referralDoc && referralDoc.exists()) {
                        const referrerId = referralDoc.data().referrerId;
                        tx.update(referralDoc.ref, { status: 'rewarded' });
                        const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                        tx.update(referrerAccountRef, { balance: increment(1) });
                    }
                }
            });
            toast({ title: "SALDO RESGATADO!", description: `${transaction.amount.toFixed(2)} USDT ADICIONADOS.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "FALHA", description: error.message.toUpperCase() });
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 p-6">
                <div className="container mx-auto max-w-lg">
                    <div className="flex items-center justify-between mb-8">
                        <Button variant="ghost" size="sm" asChild className="pl-0 hover:bg-transparent">
                            <Link href="/profile" className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground font-black uppercase tracking-widest transition-all">
                                <ArrowLeft className="h-4 w-4" /> Voltar
                            </Link>
                        </Button>
                    </div>

                    <div className="space-y-8">
                        <div className="pb-6 border-b-2 border-black">
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Histórico</h2>
                        </div>

                        <div className="space-y-2">
                             {transactions.length > 0 ? (
                                <div className="divide-y divide-muted/30">
                                    {transactions.map((tx) => (
                                        <TransactionItem 
                                            key={tx.id} 
                                            transaction={tx} 
                                            onViewDetails={setSelectedTx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Sem transações registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {claimingId && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Processando...</p>
                            </div>
                        </div>
                    )}

                    <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                        <DialogContent className="max-w-[340px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-background">
                            <div className="p-6 bg-black text-white">
                                <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em]">
                                    <Info className="h-4 w-4" /> Detalhes
                                </h3>
                            </div>
                            {selectedTx && (
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Operação</span>
                                        <span className="font-black uppercase">{selectedTx.type === 'deposit' ? 'DEPÓSITO' : 'SAQUE'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Status</span>
                                        <Badge variant={(selectedTx.status === 'claimed' || selectedTx.status === 'Completed' || selectedTx.status === 'CONCLUÍDO') ? "default" : "secondary"} className="font-black text-[9px] uppercase px-3 rounded-full">
                                            {(selectedTx.status === 'claimed' || selectedTx.status === 'Completed' || selectedTx.status === 'CONCLUÍDO') ? 'CONCLUÍDO' : 
                                             (selectedTx.status === 'Pending' || selectedTx.status === 'PENDENTE') ? 'PENDENTE' : 
                                             (selectedTx.status === 'validated' || selectedTx.status === 'VALIDADO') ? 'VALIDADO' : 
                                             selectedTx.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Valor</span>
                                        <span className={cn("text-xl font-black tracking-tighter", selectedTx.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                                            {selectedTx.amount.toFixed(2)} USDT
                                        </span>
                                    </div>
                                    
                                    {/* Ações disponíveis dentro do detalhe */}
                                    <div className="pt-4 space-y-3">
                                        {(selectedTx.status === 'Pending' || selectedTx.status === 'PENDENTE') && selectedTx.type === 'deposit' && (
                                            <Button variant="outline" className="w-full h-10 text-[10px] font-black uppercase gap-2 border-primary/40 text-primary hover:bg-primary/5" asChild>
                                                <Link href={`https://t.me/DailyGainX_Bot?start=${selectedTx.id}`} target="_blank">
                                                    <Send className="h-3 w-3" /> Validar no Telegram
                                                </Link>
                                            </Button>
                                        )}
                                        
                                        {(selectedTx.status === 'validated' || selectedTx.status === 'VALIDADO') && (
                                            <Button 
                                                variant="default" 
                                                className="w-full h-12 text-[10px] font-black uppercase gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg"
                                                onClick={() => handleClaim(selectedTx)}
                                            >
                                                <CheckCircle2 className="h-3 w-3" /> Resgatar Saldo
                                            </Button>
                                        )}
                                    </div>

                                    {selectedTx.type === 'withdrawal' && (
                                        <div className="pt-6 border-t border-muted/50 space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <User className="h-3 w-3" /> Beneficiário
                                                </div>
                                                <p className="text-xs font-black uppercase">{selectedTx.fullName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <Key className="h-3 w-3" /> Chave Pix
                                                </div>
                                                <p className="text-xs font-mono bg-muted/50 p-2 rounded-lg break-all font-bold">{selectedTx.pixKey || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-muted/50 space-y-1">
                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                            <Calendar className="h-3 w-3" /> Data
                                        </div>
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
