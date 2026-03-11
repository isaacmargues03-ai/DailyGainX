
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { useFirebase } from '@/firebase';
import { ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { doc, setDoc, increment, updateDoc } from 'firebase/firestore';

const PixIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12.0002 1.33301L5.35822 5.08401L1.41722 11.455L2.83322 12.545L5.35822 8.86801L10.5842 5.91601V18.084L5.35822 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M12.0002 1.33301L18.6422 5.08401L22.5832 11.455L21.1672 12.545L18.6422 8.86801L13.4162 5.91601V18.084L18.6422 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M5.35815 5.08401L2.83315 8.86801V15.132L5.35815 18.868L10.5842 21.916V2.08401L5.35815 5.08401Z" fill="currentColor"/>
        <path d="M18.6421 5.08401L21.1671 8.86801V15.132L18.6421 18.868L13.4161 21.916V2.08401L18.6421 5.08401Z" fill="currentColor"/>
    </svg>
);

const WITHDRAW_FEE_PERCENT = 0.03; // Taxa de 3%

export default function WithdrawPage() {
    const [amount, setAmount] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { toast } = useToast();
    const { user, firestore } = useFirebase();
    const { balance, isBalanceLoading, activeInvestments } = useAppContext();

    const withdrawAmount = parseFloat(amount) || 0;
    const feeAmount = withdrawAmount * WITHDRAW_FEE_PERCENT;
    const netAmount = Math.max(0, withdrawAmount - feeAmount);

    const isAdmin = user?.email === 'isaacmargues03@gmail.com' || user?.uid === 'skTsvEKxywUKcBKPHzG9h7WkK7K2';

    const handleWithdraw = async () => {
        if (!isAdmin && activeInvestments.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Saque bloqueado',
                description: 'Você precisa realizar pelo menos um investimento antes de sacar.',
            });
            return;
        }
        
        if (!pixKey || !fullName) {
            toast({
                variant: 'destructive',
                title: 'Campos necessários',
                description: 'Por favor, insira seu nome completo e sua chave Pix.',
            });
            return;
        }

        if (isNaN(withdrawAmount) || withdrawAmount < 5) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: 'O valor mínimo para saque é de 5 USDT.',
            });
            return;
        }

        if (withdrawAmount > balance) {
            toast({
                variant: 'destructive',
                title: 'Saldo insuficiente',
                description: 'Você não tem saldo suficiente para esta retirada.',
            });
            return;
        }

        if (!user || !firestore) return;

        setIsSubmitting(true);
        try {
            const txId = `WD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const chineseChars = "支付取款交易成功金";
            let randomChinese = "";
            for(let i=0; i<6; i++) randomChinese += chineseChars.charAt(Math.floor(Math.random() * chineseChars.length));
            const chineseCode = `取款-${randomChinese}-${Math.floor(1000 + Math.random() * 9000)}`;

            const txRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', txId);
            const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);

            await setDoc(txRef, {
                id: txId,
                userId: user.uid,
                type: 'withdrawal',
                amount: withdrawAmount, 
                feeAmount: feeAmount,    
                netAmount: netAmount,    
                method: 'Pix',
                status: 'Pending',
                fullName,
                pixKey,
                withdrawCode: txId,
                chineseCode: chineseCode,
                timestamp: new Date().toLocaleString('pt-BR'),
                depositDate: new Date().toISOString()
            });

            await updateDoc(accountRef, {
                balance: increment(-withdrawAmount)
            });

            toast({
                title: 'Saque Solicitado!',
                description: 'Sua solicitação está em processamento.',
            });

            setAmount('');
            setPixKey('');
            setFullName('');
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao processar saque.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = isBalanceLoading || isSubmitting || !amount || !pixKey || !fullName || withdrawAmount <= 0 || withdrawAmount > balance || withdrawAmount < 5;

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="flex items-center justify-between p-4 border-b bg-background">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Saque</h1>
                <div className="w-9 h-9" />
            </header>
            <main className="flex-1 p-4 sm:p-6">
                <div className="container mx-auto max-md">
                    <Card className="border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PixIcon />
                                Saque via Pix
                            </CardTitle>
                            <CardDescription>
                                Insira os detalhes para solicitar sua retirada.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="full-name">Nome completo</Label>
                                <Input
                                    id="full-name"
                                    placeholder="Seu nome completo"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={isSubmitting}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pix-key">Sua Chave CPF</Label>
                                <Input
                                    id="pix-key"
                                    placeholder={'000.000.000-00'}
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    disabled={isSubmitting}
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor do Saque (USDT)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="Mínimo 5 USDT"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={isSubmitting}
                                        className="h-14 text-lg font-bold rounded-xl"
                                    />
                                    <div className="flex flex-col gap-1 px-1 mt-1">
                                        <p className="text-xs text-muted-foreground font-medium">Saldo disponível: {balance.toFixed(2)} USDT</p>
                                        <p className="text-xs text-primary font-bold">Taxa de saque: 3%</p>
                                    </div>
                                </div>

                                {withdrawAmount > 0 && (
                                    <div className="bg-muted/50 rounded-2xl p-4 space-y-3 border border-border/50">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Taxa de Saque (3%)</span>
                                            <span className="font-medium text-destructive">-{feeAmount.toFixed(2)} USDT</span>
                                        </div>
                                        <div className="border-t border-dashed pt-3 flex justify-between items-center">
                                            <span className="font-bold text-sm uppercase tracking-tight">Valor a Receber</span>
                                            <span className="text-xl font-black text-primary">{netAmount.toFixed(2)} USDT</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-[10px] text-muted-foreground pt-1">
                                            <Info className="h-3 w-3 mt-0.5 shrink-0" />
                                            <p>O valor líquido será enviado para sua chave Pix após a aprovação.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleWithdraw} 
                                className="w-full h-14 text-xl font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-tighter" 
                                disabled={isButtonDisabled}
                            >
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : 'Solicitar Saque'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
