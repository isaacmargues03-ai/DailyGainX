'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, ArrowLeft, Send, CheckCircle2, Loader2, Info, User, Key, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { doc, runTransaction, increment, collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
        className="flex flex-col p-4 border-b last:border-b-0 gap-3 hover:bg-muted/30 transition-colors cursor-pointer" 
        onClick={() => onViewDetails(transaction)}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm", 
                    isDeposit ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
                )}>
                    {isDeposit ? (
                        <ArrowDownToLine className="h-5 w-5" />
                    ) : (
                        <ArrowUpFromLine className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <p className="font-bold text-sm tracking-tight">{isDeposit ? 'Depósito' : 'Saque'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{transaction.timestamp}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn("text-base font-black tracking-tighter", isDeposit ? 'text-green-600' : 'text-red-600')}>
                    {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
                </p>
                <div className="flex items-center justify-end">
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                        isPending && "bg-yellow-100 text-yellow-700",
                        isValidated && "bg-blue-100 text-blue-700",
                        isClaimed && "bg-green-100 text-green-700",
                        transaction.status === 'Failed' && "bg-red-100 text-red-700"
                    )}>
                        {transaction.status === 'validated' ? 'Validado' : 
                         isClaimed ? 'Concluído' : 
                         transaction.status === 'Pending' ? 'Pendente' :
                         transaction.status}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {isPending && isDeposit && (
                <Button variant="outline" size="sm" className="w-full h-8 text-[11px] font-bold uppercase gap-2 border-primary/30 text-primary" asChild>
                    <Link href={telegramBotUrl} target="_blank">
                        <Send className="h-3.5 w-3.5" />
                        Validar no Telegram
                    </Link>
                </Button>
            )}
            
            {isValidated && (
                <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full h-8 text-[11px] font-bold uppercase gap-2 bg-blue-600 hover:bg-blue-700 shadow-md animate-pulse"
                    onClick={() => onClaim(transaction)}
                >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resgatar Saldo
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
    const [isCleaning, setIsCleaning] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const isAdmin = user?.email === 'isaacmargues03@gmail.com';

    const handleClearHistory = async () => {
        if (!user || !firestore || !isAdmin) return;
        
        if (!confirm("Deseja realmente apagar TODO o seu histórico de transações?")) return;

        setIsCleaning(true);
        try {
            const txCollectionRef = collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions');
            const snapshot = await getDocs(txCollectionRef);
            
            const batch = writeBatch(firestore);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            toast({ title: "Histórico Limpo!", description: "Todas as suas transações foram removidas." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao limpar", description: error.message });
        } finally {
            setIsCleaning(false);
        }
    };

    const handleClaim = async (transaction: Transaction) => {
        if (!user || !firestore || claimingId) return;

        setClaimingId(transaction.id);
        
        try {
            await runTransaction(firestore, async (tx) => {
                const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
                const transactionRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', transaction.id);
                const userRef = doc(firestore, 'users', user.uid);

                const [userDoc] = await Promise.all([
                    tx.get(userRef),
                ]);

                const userData = userDoc.data();
                
                let referralDoc = null;
                if (userData && !userData.hasMadeFirstDeposit && userData.referralId) {
                    const referralRef = doc(firestore, 'referrals', userData.referralId);
                    referralDoc = await tx.get(referralRef);
                }

                tx.update(accountRef, {
                    balance: increment(transaction.amount)
                });

                tx.update(transactionRef, {
                    status: 'claimed',
                    claimedAt: new Date().toISOString()
                });

                if (userData && !userData.hasMadeFirstDeposit) {
                    tx.update(userRef, { hasMadeFirstDeposit: true });
                    
                    if (referralDoc && referralDoc.exists()) {
                        const referralData = referralDoc.data();
                        const referrerId = referralData.referrerId;
                        
                        tx.update(referralDoc.ref, { status: 'rewarded' });
                        
                        const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                        tx.update(referrerAccountRef, {
                            balance: increment(1)
                        });
                    }
                }
            });

            toast({
                title: "Saldo Resgatado!",
                description: `${transaction.amount.toFixed(2)} USDT adicionados à conta.`,
            });

        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Falha no Resgate",
                description: error.message || "Erro ao processar resgate.",
            });
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/20">
            <Header />
            <main className="flex-1 p-4 sm:p-6">
                <div className="container mx-auto max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
                            <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Perfil
                            </Link>
                        </Button>
                        
                        {isAdmin && transactions.length > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 gap-2"
                                onClick={handleClearHistory}
                                disabled={isCleaning}
                            >
                                {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Limpar Tudo
                            </Button>
                        )}
                    </div>

                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-6 border-b">
                            <CardTitle className="flex items-center gap-3 text-xl font-black">
                                <HistoryIcon className="h-6 w-6 text-primary"/>
                                Extrato de Conta
                            </CardTitle>
                            <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">
                                Transações em USDT
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             {transactions.length > 0 ? (
                                <div className="divide-y divide-muted/50">
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
                                <div className="text-center text-muted-foreground p-16 space-y-4">
                                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center opacity-50">
                                        <HistoryIcon className="h-8 w-8" />
                                    </div>
                                    <p className="font-bold text-sm">Nenhuma transação registrada.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {(claimingId || isCleaning) && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-2xl border">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="font-black text-sm uppercase tracking-widest">Processando...</p>
                            </div>
                        </div>
                    )}

                    <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                        <DialogContent className="rounded-3xl max-w-xs border-none shadow-2xl overflow-hidden p-0">
                            <DialogHeader className="p-6 bg-primary text-primary-foreground">
                                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                                    <Info className="h-5 w-5" />
                                    DETALHES
                                </DialogTitle>
                            </DialogHeader>
                            {selectedTx && (
                                <div className="p-6 space-y-5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Tipo</span>
                                        <span className="font-black text-primary uppercase">{selectedTx.type === 'deposit' ? 'Depósito' : 'Saque'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Status</span>
                                        <Badge className={cn(
                                            "rounded-full font-black text-[10px] tracking-widest uppercase",
                                            (selectedTx.status === 'claimed' || selectedTx.status === 'Completed') ? "bg-green-600" : "bg-muted text-muted-foreground"
                                        )}>
                                            {selectedTx.status === 'claimed' || selectedTx.status === 'Completed' ? 'Concluído' : selectedTx.status === 'Pending' ? 'Pendente' : selectedTx.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Valor</span>
                                        <span className={cn("text-xl font-black tracking-tighter", selectedTx.type === 'deposit' ? "text-green-600" : "text-red-600")}>
                                            {selectedTx.amount.toFixed(2)} USDT
                                        </span>
                                    </div>
                                    
                                    {selectedTx.type === 'withdrawal' && (
                                        <div className="pt-4 border-t space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <User className="h-3 w-3" /> Beneficiário
                                                </div>
                                                <p className="text-sm font-bold truncate">{selectedTx.fullName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                    <Key className="h-3 w-3" /> Chave Pix
                                                </div>
                                                <p className="text-sm font-mono bg-muted p-2 rounded-lg break-all">{selectedTx.pixKey || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                            <Calendar className="h-3 w-3" /> Data e Hora
                                        </div>
                                        <p className="text-sm font-medium">{selectedTx.timestamp}</p>
                                    </div>

                                    {selectedTx.type === 'deposit' && (selectedTx.status === 'Pending' || selectedTx.status === 'PENDING') && (
                                        <Button className="w-full mt-4 h-12 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg" asChild>
                                            <Link href={`https://t.me/DailyGainX_Bot?start=${selectedTx.id}`} target="_blank">
                                                Validar no Telegram
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
}
