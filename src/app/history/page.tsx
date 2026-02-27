'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, ArrowLeft, Send, CheckCircle2, Loader2, Info, User, Key, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function TransactionItem({ 
  transaction, 
  onClaim,
  onViewDetails
}: { 
  transaction: Transaction; 
  onClaim: (tx: Transaction) => void;
  onViewDetails: (tx: Transaction) => void;
}) {
  const isDeposit = transaction.type === 'deposit';
  const isPending = transaction.status === 'Pending' || transaction.status === 'PENDING';
  const isValidated = transaction.status === 'validated';
  const isClaimed = transaction.status === 'claimed' || transaction.status === 'Completed';
  
  const telegramBotUrl = `https://t.me/DailyGainX_Bot?start=${transaction.id}`;

  return (
    <div 
        className="flex flex-col p-4 border-b last:border-b-0 gap-2 hover:bg-muted/30 transition-colors cursor-pointer" 
        onClick={() => onViewDetails(transaction)}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border", 
                    isDeposit ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                )}>
                    {isDeposit ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                </div>
                <div>
                    <p className="font-bold text-sm">{isDeposit ? 'Depósito' : 'Saque'}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{transaction.timestamp}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-sm font-black", isDeposit ? 'text-green-600' : 'text-red-600')}>
                    {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
                </p>
                <div className="flex items-center justify-end">
                    <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter",
                        isPending && "bg-yellow-100 text-yellow-700",
                        isValidated && "bg-blue-100 text-blue-700",
                        isClaimed && "bg-green-100 text-green-700",
                    )}>
                        {transaction.status === 'validated' ? 'Validado' : 
                         isClaimed ? 'Concluído' : 
                         transaction.status === 'Pending' ? 'Pendente' :
                         transaction.status}
                    </span>
                </div>
            </div>
        </div>

        {/* Ações Rápidas Inline */}
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {isPending && isDeposit && (
                <Button variant="outline" size="sm" className="w-full h-7 text-[10px] font-bold uppercase gap-2 border-primary/20 text-primary" asChild>
                    <Link href={telegramBotUrl} target="_blank">
                        <Send className="h-3 w-3" /> Validar no Telegram
                    </Link>
                </Button>
            )}
            
            {isValidated && (
                <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full h-7 text-[10px] font-bold uppercase gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => onClaim(transaction)}
                >
                    <CheckCircle2 className="h-3 w-3" /> Resgatar Saldo
                </Button>
            )}
        </div>
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
                tx.update(transactionRef, { status: 'claimed', claimedAt: new Date().toISOString() });

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
            toast({ title: "Saldo Resgatado!", description: `${transaction.amount.toFixed(2)} USDT adicionados.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Falha", description: error.message });
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Header />
            <main className="flex-1 p-4">
                <div className="container mx-auto max-w-lg">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" size="sm" asChild className="pl-0">
                            <Link href="/profile" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest">
                                <ArrowLeft className="h-3 w-3" /> Voltar
                            </Link>
                        </Button>
                    </div>

                    <Card className="border-none shadow-none rounded-none bg-transparent">
                        <CardHeader className="p-0 pb-4 border-b">
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">Histórico</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">Extrato detalhado de USDT</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             {transactions.length > 0 ? (
                                <div className="divide-y">
                                    {transactions.map((tx) => (
                                        <TransactionItem 
                                            key={tx.id} 
                                            transaction={tx} 
                                            onClaim={handleClaim}
                                            onViewDetails={setSelectedTx}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-20">
                                    <HistoryIcon className="h-10 w-10 mx-auto mb-2 opacity-10" />
                                    <p className="font-bold text-xs uppercase tracking-widest">Nenhuma transação</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {claimingId && (
                        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                        <DialogContent className="max-w-[320px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                            <div className="p-4 bg-primary text-primary-foreground">
                                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                    <Info className="h-4 w-4" /> Detalhes
                                </h3>
                            </div>
                            {selectedTx && (
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Operação</span>
                                        <span className="font-black uppercase">{selectedTx.type === 'deposit' ? 'Depósito' : 'Saque'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Status</span>
                                        <Badge variant={(selectedTx.status === 'claimed' || selectedTx.status === 'Completed') ? "default" : "secondary"} className="font-black text-[9px] uppercase">
                                            {selectedTx.status === 'claimed' || selectedTx.status === 'Completed' ? 'Concluído' : selectedTx.status === 'Pending' ? 'Pendente' : selectedTx.status === 'validated' ? 'Validado' : selectedTx.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Valor</span>
                                        <span className={cn("text-lg font-black tracking-tighter", selectedTx.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                                            {selectedTx.amount.toFixed(2)} USDT
                                        </span>
                                    </div>
                                    
                                    {selectedTx.type === 'withdrawal' && (
                                        <div className="pt-3 border-t space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <User className="h-2.5 w-2.5" /> Beneficiário
                                                </div>
                                                <p className="text-xs font-bold truncate">{selectedTx.fullName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <Key className="h-2.5 w-2.5" /> Chave Pix
                                                </div>
                                                <p className="text-xs font-mono bg-muted p-1.5 rounded-md break-all">{selectedTx.pixKey || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t space-y-1">
                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                                            <Calendar className="h-2.5 w-2.5" /> Data
                                        </div>
                                        <p className="text-xs font-medium">{selectedTx.timestamp}</p>
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
