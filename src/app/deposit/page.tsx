'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Loader2, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { generatePixQrCode } from '@/app/actions/pix';
import { doc, collection, setDoc } from 'firebase/firestore';

const BRL_MULTIPLIER_TO_USDT = 0.2; // R$ 25 = 5 USDT
const MIN_DEPOSIT_BRL = 25;

export default function DepositPage() {
    const [brlAmount, setBrlAmount] = useState('');
    const [pixCopyPaste, setPixCopyPaste] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    const handleGeneratePix = async () => {
        const amountInBrl = parseFloat(brlAmount);
        if (isNaN(amountInBrl) || amountInBrl < MIN_DEPOSIT_BRL) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: `Depósito mínimo: R$ ${MIN_DEPOSIT_BRL.toFixed(2)}.`,
            });
            return;
        }

        if (!user) return;

        setIsLoading(true);
        try {
            const depositRef = doc(collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions'));
            const depositId = depositRef.id;

            const response = await generatePixQrCode({ 
                amount: amountInBrl,
                payerName: user.displayName || 'Cliente DailyGainX',
                payerEmail: user.email || undefined,
                payerDocument: "12345678909", 
                externalId: depositId
            });

            await setDoc(depositRef, {
                id: depositId,
                userId: user.uid,
                accountId: user.uid,
                amount: amountInBrl * BRL_MULTIPLIER_TO_USDT, 
                status: 'PENDENTE',
                method: 'Pix',
                type: 'deposit',
                externalId: response.transactionId,
                pixCopyPaste: response.pixCopyPaste,
                timestamp: new Date().toLocaleString('pt-BR'),
                depositDate: new Date().toISOString()
            });

            setPixCopyPaste(response.pixCopyPaste);
            setIsGenerated(true);

            toast({
                title: 'Pix Gerado!',
                description: 'Copie o código para pagar.',
            });

        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro na API',
                description: error.message || 'Falha ao gerar Pix.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!pixCopyPaste) return;
        navigator.clipboard.writeText(pixCopyPaste);
        toast({
            title: 'Copiado!',
            description: `Código Pix copiado com sucesso.`,
        });
    };
    
    const resetDepositFlow = () => {
        setIsGenerated(false);
        setPixCopyPaste('');
        setBrlAmount('');
    };

    if (isGenerated) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-background">
                <header className="flex items-center justify-between p-4 border-b">
                    <Button variant="ghost" size="icon" onClick={resetDepositFlow}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold uppercase tracking-widest">Copia e Cola</h1>
                    <div className="w-9 h-9" />
                </header>
                <main className="flex-1 p-6 flex flex-col items-center justify-center space-y-8">
                    <div className="w-full max-w-md space-y-8 text-center">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">Valor Total</p>
                            <p className="text-5xl font-black">R$ {parseFloat(brlAmount).toFixed(2)}</p>
                        </div>
                        
                        <div className="space-y-4 pt-4 text-left">
                            <div className="space-y-3">
                                <div className="flex flex-col gap-3">
                                    <Input
                                        readOnly
                                        value={pixCopyPaste}
                                        className="text-[10px] break-all bg-muted border-none h-auto py-4 font-mono leading-relaxed rounded-xl text-center"
                                    />
                                    <Button variant="default" className="h-14 font-black uppercase text-lg rounded-2xl shadow-lg" onClick={copyToClipboard}>
                                        <Copy className="h-5 w-5 mr-2" />
                                        Copiar Código
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-8 space-y-4 text-center">
                                <div className="text-[10px] space-y-2 text-muted-foreground uppercase font-bold tracking-tight opacity-70">
                                    <p>1. Clique no botão de copiar acima</p>
                                    <p>2. Abra o app do seu Banco</p>
                                    <p>3. Escolha Pix &gt; Copia e Cola</p>
                                    <p>4. Cole o código e finalize o pagamento</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full h-14 font-black uppercase text-xs tracking-widest rounded-2xl border-2 mt-4" 
                                    asChild
                                >
                                    <Link href="https://t.me/SuportedailygainX" target="_blank">
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Comprovante
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-bold uppercase tracking-widest">Depósito</h1>
                <div className="w-9 h-9" />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-md space-y-10">
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            id="brlAmount"
                            type="number"
                            placeholder="Mínimo 25"
                            value={brlAmount}
                            onChange={(e) => setBrlAmount(e.target.value)}
                            className="h-24 text-6xl text-center border-none bg-muted/20 rounded-3xl font-black focus-visible:ring-0"
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleGeneratePix} 
                    className="w-full h-24 text-xl font-black rounded-3xl shadow-2xl uppercase tracking-tighter gap-3" 
                    disabled={!brlAmount || parseFloat(brlAmount) < MIN_DEPOSIT_BRL || isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </>
                    ) : (
                        <>
                            <ArrowRight className="h-8 w-8" />
                        </>
                    )}
                </Button>
              </div>
            </main>
        </div>
    );
}
