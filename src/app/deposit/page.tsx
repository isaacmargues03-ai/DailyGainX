'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Copy, Loader2, Send, Info, QrCode } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import { generatePixQrCode } from '@/app/actions/pix';
import { doc, collection, setDoc } from 'firebase/firestore';

const PixLogo = () => (
    <svg aria-hidden="true" width="89" height="34" viewBox="0 0 89 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1.66699L8.70879 5.83366L4.27212 14.417L5.99945 15.3337L8.70879 11.167L15.3321 8.00033V25.5837L8.70879 28.8337L17 1.66699Z" fill="#32BCAD"/>
        <path d="M17 1.66699L25.2912 5.83366L29.7279 14.417L28.0006 15.3337L25.2912 11.167L18.6679 8.00033V25.5837L25.2912 28.8337L17 1.66699Z" fill="#32BCAD"/>
        <path d="M8.70879 5.83366L5.99945 11.167V22.417L8.70879 27.5003L15.3321 30.667L15.3321 2.83366L8.70879 5.83366Z" fill="#32BCAD"/>
        <path d="M25.2912 5.83366L28.0006 11.167V22.417L25.2912 27.5003L18.6679 30.667L18.6679 2.83366L25.2912 5.83366Z" fill="#32BCAD"/>
        <path d="M31.3346 30.8337V2.50033H42.1321C45.1096 2.50033 47.2796 3.25033 48.6446 4.66699C49.9096 6.08366 50.5421 8.02533 50.5421 10.5003C50.5421 12.9753 49.9096 14.892 48.6446 16.2503C47.2796 17.7087 45.1096 18.417 42.1321 18.417H34.0012V30.8337H31.3346ZM41.7796 4.54199H34.0012V16.3753H41.7796C43.9046 16.3753 45.4188 15.8337 46.3238 14.7503C47.2288 13.667 47.6812 12.2087 47.6812 10.5003C47.2288 13.667 47.6812 12.2087 47.6812 10.5003C47.6812 8.79199 47.2288 7.33366 46.3238 6.25033C45.4188 5.16699 43.9046 4.54199 41.7796 4.54199Z" fill="#32BCAD"/>
        <path d="M62.6685 30.8337L54.4594 2.50033H57.4369L61.4394 16.6253L65.3419 2.50033H68.3194L58.6272 30.8337H62.6685Z" fill="#32BCAD"/>
        <path d="M75.1685 2.50033V30.8337H72.5018V2.50033H75.1685Z" fill="#32BCAD"/>
        <path d="M88.5018 2.50033L77.7043 30.8337H74.8055L70.5282 16.6253L66.2509 30.8337H63.3522L73.0443 2.50033H76.0218L80.0243 16.6253L84.2835 2.50033H88.5018Z" fill="#32BCAD"/>
    </svg>
);

const BRL_MULTIPLIER_TO_USDT = 0.2; // R$ 25 = 5 USDT (1/5)
const MIN_DEPOSIT_BRL = 25;

export default function DepositPage() {
    const [brlAmount, setBrlAmount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState(0);
    const [qrCode, setQrCode] = useState('');
    const [pixCopyPaste, setPixCopyPaste] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    const handleGenerateQrCode = async () => {
        const amountInBrl = parseFloat(brlAmount);
        if (isNaN(amountInBrl) || amountInBrl < MIN_DEPOSIT_BRL) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: `Por favor, insira um valor de depósito válido (mínimo R$ ${MIN_DEPOSIT_BRL.toFixed(2)}).`,
            });
            return;
        }

        if (!user) return;

        setIsLoading(true);
        try {
            const depositRef = doc(collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions'));
            const depositId = depositRef.id;

            const postbackUrl = `https://dailygainx.netlify.app/api/webhook/pixup`;

            const response = await generatePixQrCode({ 
                amount: amountInBrl,
                payerName: user.displayName || 'Cliente DailyGainX',
                payerEmail: user.email || undefined,
                payerDocument: "12345678909", 
                externalId: depositId,
                postbackUrl: postbackUrl
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

            setQrCode(response.qrCodeImageUrl);
            setPixCopyPaste(response.pixCopyPaste);
            setTransactionId(depositId);

            toast({
                title: 'Pagamento Gerado!',
                description: 'Utilize o QR Code ou o código Copia e Cola para pagar.',
            });

        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro na integração',
                description: error.message || 'Não foi possível gerar o Pix.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado!',
            description: `${label} copiado com sucesso.`,
        });
    };
    
    const resetDepositFlow = () => {
        setQrCode('');
        setPixCopyPaste('');
        setBrlAmount('');
        setTransactionId('');
    };

    if (qrCode) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                    <Button variant="ghost" size="icon" onClick={resetDepositFlow}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">Pagamento</h1>
                    <div className="w-9 h-9" />
                </header>
                <main className="flex-1 p-4 sm:p-6">
                    <div className="container mx-auto max-w-md">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pagamento Pix</CardTitle>
                                <CardDescription>
                                    Escolha a forma mais fácil para você finalizar o depósito.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="relative p-2 bg-white rounded-lg border shadow-inner">
                                        <Image 
                                            src={qrCode} 
                                            alt="Pix QR Code" 
                                            width={256} 
                                            height={256} 
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Valor do Pagamento</p>
                                        <p className="text-2xl font-bold">R$ {parseFloat(brlAmount).toFixed(2)}</p>
                                        <p className="text-sm text-primary font-medium">({(parseFloat(brlAmount) * BRL_MULTIPLIER_TO_USDT).toFixed(2)} USDT)</p>
                                    </div>
                                    
                                    <div className="w-full space-y-4 pt-4 text-left">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="pix-copy-paste">Pix Copia e Cola</Label>
                                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Mais Prático</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    id="pix-copy-paste"
                                                    readOnly
                                                    value={pixCopyPaste}
                                                    className="text-sm truncate bg-muted/30 h-12"
                                                />
                                                <Button variant="default" className="h-12 w-12 shrink-0" onClick={() => copyToClipboard(pixCopyPaste, 'Código Pix')}>
                                                    <Copy className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Copie o código acima e cole na opção "Pix Copia e Cola" do seu banco.</p>
                                        </div>

                                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                                            <div className="flex items-center gap-2 font-bold text-primary mb-1">
                                                <Info className="h-4 w-4" />
                                                <span>Passo a passo</span>
                                            </div>
                                            <div className="space-y-2 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                                                <p className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" /> 1. PAGUE PELO APP DO SEU BANCO</p>
                                                <p className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" /> 2. MANDE O PRINT NO SUPORTE</p>
                                                <p className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" /> 3. AGUARDE A VALIDAÇÃO DO SALDO</p>
                                                <p className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-primary" /> 4. RESGATE SEU SALDO NO PERFIL</p>
                                            </div>
                                        </div>

                                        <Button 
                                            variant="default" 
                                            className="w-full gap-2 h-14 font-black uppercase text-lg" 
                                            asChild
                                        >
                                            <Link href="https://t.me/SuportedailygainX" target="_blank">
                                                <Send className="h-5 w-5" />
                                                ENVIAR COMPROVANTE
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
            <header className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Depósito</h1>
                <div className="w-9 h-9" />
            </header>

            <main className="flex-1 p-4 sm:p-6">
              <div className="container mx-auto max-w-md space-y-6">
                <div>
                    <Label className="text-sm font-normal text-muted-foreground">Método de Pagamento</Label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border-2 border-primary bg-primary/5 p-4 shadow-sm">
                        <PixLogo />
                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                            <span>PIX ATIVO</span>
                            <CheckCircle className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-semibold text-lg">Quanto deseja depositar?</h2>
                        <p className="text-xs text-muted-foreground">(R$ 25,00 = 5 USDT)</p>
                    </div>
                    <div className="relative group">
                        <Input
                            id="brlAmount"
                            type="number"
                            placeholder={`Mínimo R$ ${MIN_DEPOSIT_BRL.toFixed(2)}`}
                            value={brlAmount}
                            onChange={(e) => {
                                const val = e.target.value;
                                setBrlAmount(val);
                                const amountInBrl = parseFloat(val);
                                if (!isNaN(amountInBrl) && amountInBrl > 0) {
                                    setUsdtAmount(amountInBrl * BRL_MULTIPLIER_TO_USDT);
                                } else {
                                    setUsdtAmount(0);
                                }
                            }}
                            className="h-16 text-xl pl-6 pr-12 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                    </div>
                    <div className="relative">
                        <Input
                            id="usdtAmount"
                            value={usdtAmount > 0 ? usdtAmount.toFixed(2) : ''}
                            readOnly
                            className="h-16 text-xl pl-6 pr-20 bg-muted/30 border-none rounded-2xl text-primary font-bold"
                            placeholder="Valor em USDT"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/70 font-bold">USDT</span>
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        onClick={handleGenerateQrCode} 
                        className="w-full h-16 text-lg font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-tight gap-2" 
                        disabled={!brlAmount || parseFloat(brlAmount) < MIN_DEPOSIT_BRL || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <QrCode className="h-6 w-6" />
                                Gerar Pix (QR ou Copia e Cola)
                            </>
                        )}
                    </Button>
                </div>
              </div>
            </main>
        </div>
    );
}
