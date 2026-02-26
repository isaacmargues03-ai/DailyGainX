'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine, History as HistoryIcon, ArrowLeft, Send, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function TransactionItem({ 
  transaction, 
  onClaim 
}: { 
  transaction: Transaction; 
  onClaim: (tx: Transaction) => void 
}) {
  const isDeposit = transaction.type === 'deposit';
  const isPending = transaction.status === 'Pending';
  const isValidated = transaction.status === 'validated';
  const isClaimed = transaction.status === 'claimed';
  
  const telegramBotUrl = `https://t.me/DailyGainX_Bot?start=${transaction.id}`;

  return (
    <div className="flex flex-col p-4 border-b last:border-b-0 gap-3">
        <div className="flex items-center justify-between">
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
                </div>
            </div>
            <div className="text-right">
                <p className={cn("font-bold", isDeposit ? 'text-green-600' : 'text-red-600')}>
                    {isDeposit ? '+' : '-'}{transaction.amount.toFixed(2)} USDT
                </p>
                <div className="flex items-center justify-end gap-1">
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                        isPending && "bg-yellow-100 text-yellow-700",
                        isValidated && "bg-blue-100 text-blue-700",
                        isClaimed && "bg-green-100 text-green-700",
                        transaction.status === 'Completed' && "bg-green-100 text-green-700",
                        transaction.status === 'Failed' && "bg-red-100 text-red-700"
                    )}>
                        {transaction.status === 'validated' ? 'Validado' : 
                         transaction.status === 'claimed' ? 'Resgatado' : 
                         transaction.status}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {isPending && (
                <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2" asChild>
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
                    className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 animate-pulse"
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

    const handleClaim = async (transaction: Transaction) => {
        if (!user || !firestore || claimingId) return;

        if (transaction.amount <= 0) {
            toast({ variant: "destructive", title: "Erro", description: "Valor de transação inválido." });
            return;
        }

        setClaimingId(transaction.id);
        
        try {
            await runTransaction(firestore, async (tx) => {
                const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
                const transactionRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', transaction.id);
                const userRef = doc(firestore, 'users', user.uid);

                // --- TODAS AS LEITURAS DEVEM OCORRER ANTES DAS ESCRITAS ---
                const userDoc = await tx.get(userRef);
                const userData = userDoc.data();
                
                let referralDoc = null;
                if (userData && !userData.hasMadeFirstDeposit && userData.referralId) {
                    const referralRef = doc(firestore, 'referrals', userData.referralId);
                    referralDoc = await tx.get(referralRef);
                }
                // ----------------------------------------------------------

                // 1. Soma o valor ao Saldo real do usuário
                tx.update(accountRef, {
                    balance: increment(transaction.amount)
                });

                // 2. Atualiza o status para 'claimed'
                tx.update(transactionRef, {
                    status: 'claimed',
                    claimedAt: new Date().toISOString()
                });

                // 3. Lógica de Indicação no primeiro depósito
                if (userData && !userData.hasMadeFirstDeposit) {
                    tx.update(userRef, { hasMadeFirstDeposit: true });
                    
                    if (referralDoc && referralDoc.exists()) {
                        const referralData = referralDoc.data();
                        const referrerId = referralData.referrerId;
                        
                        // Marca indicação como recompensada
                        tx.update(referralDoc.ref, { status: 'rewarded' });
                        
                        // Credita 1 USDT na conta do padrinho
                        const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                        tx.update(referrerAccountRef, {
                            balance: increment(1)
                        });
                    }
                }
            });

            toast({
                title: "Saldo Resgatado!",
                description: `${transaction.amount.toFixed(2)} USDT foram adicionados à sua conta.`,
            });

        } catch (error: any) {
            console.error("Erro ao resgatar saldo:", error);
            toast({
                variant: "destructive",
                title: "Falha no Resgate",
                description: error.message || "Ocorreu um erro ao processar seu resgate.",
            });
        } finally {
            setClaimingId(null);
        }
    };

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
                                Seus depósitos e saques. Transações validadas podem ser resgatadas manualmente para o seu saldo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             {transactions.length > 0 ? (
                                <div className="divide-y">
                                    {transactions.map((tx) => (
                                        <TransactionItem 
                                            key={tx.id} 
                                            transaction={tx} 
                                            onClaim={handleClaim}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <p>Nenhuma transação encontrada.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {claimingId && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="font-medium">Processando seu resgate...</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
