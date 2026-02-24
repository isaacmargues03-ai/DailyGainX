'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc, updateDoc, query, where, collection, getDocs, writeBatch } from 'firebase/firestore';


const PixLogo = () => (
    <svg aria-hidden="true" width="89" height="34" viewBox="0 0 89 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1.66699L8.70879 5.83366L4.27212 14.417L5.99945 15.3337L8.70879 11.167L15.3321 8.00033V25.5837L8.70879 28.8337L17 1.66699Z" fill="#32BCAD"/>
        <path d="M17 1.66699L25.2912 5.83366L29.7279 14.417L28.0006 15.3337L25.2912 11.167L18.6679 8.00033V25.5837L25.2912 28.8337L17 1.66699Z" fill="#32BCAD"/>
        <path d="M8.70879 5.83366L5.99945 11.167V22.417L8.70879 27.5003L15.3321 30.667L15.3321 2.83366L8.70879 5.83366Z" fill="#32BCAD"/>
        <path d="M25.2912 5.83366L28.0006 11.167V22.417L25.2912 27.5003L18.6679 30.667L18.6679 2.83366L25.2912 5.83366Z" fill="#32BCAD"/>
        <path d="M31.3346 30.8337V2.50033H42.1321C45.1096 2.50033 47.2796 3.25033 48.6446 4.66699C49.9096 6.08366 50.5421 8.02533 50.5421 10.5003C50.5421 12.9753 49.9096 14.892 48.6446 16.2503C47.2796 17.7087 45.1096 18.417 42.1321 18.417H34.0012V30.8337H31.3346ZM41.7796 4.54199H34.0012V16.3753H41.7796C43.9046 16.3753 45.4188 15.8337 46.3238 14.7503C47.2288 13.667 47.6812 12.2087 47.6812 10.5003C47.6812 8.79199 47.2288 7.33366 46.3238 6.25033C45.4188 5.16699 43.9046 4.54199 41.7796 4.54199Z" fill="#32BCAD"/>
        <path d="M62.6685 30.8337L54.4594 2.50033H57.4369L61.4394 16.6253L65.3419 2.50033H68.3194L58.6272 30.8337H62.6685Z" fill="#32BCAD"/>
        <path d="M75.1685 2.50033V30.8337H72.5018V2.50033H75.1685Z" fill="#32BCAD"/>
        <path d="M88.5018 2.50033L77.7043 30.8337H74.8055L70.5282 16.6253L66.2509 30.8337H63.3522L73.0443 2.50033H76.0218L80.0243 16.6253L84.2835 2.50033H88.5018Z" fill="#32BCAD"/>
    </svg>
);


const CONVERSION_RATE = 5.1723;

export default function DepositPage() {
    const [brlAmount, setBrlAmount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState(0);
    const [qrCode, setQrCode] = useState('');
    const [pixCopyPaste, setPixCopyPaste] = useState('');
    const { toast } = useToast();
    const { addTransaction } = useAppContext();
    const { user, firestore } = useFirebase();

    useEffect(() => {
        const amountInBrl = parseFloat(brlAmount);
        if (!isNaN(amountInBrl) && amountInBrl > 0) {
            setUsdtAmount(amountInBrl / CONVERSION_RATE);
        } else {
            setUsdtAmount(0);
        }
    }, [brlAmount]);

    const handleGenerateQrCode = () => {
        const amountInBrl = parseFloat(brlAmount);
        if (isNaN(amountInBrl) || amountInBrl < 10) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: 'Por favor, insira um valor de depósito válido (mínimo R$ 10).',
            });
            return;
        }

        const qrCodeUrl = `https://placehold.co/256x256/EAF2F8/17202A/png?text=PIX+QR+CODE%0A${usdtAmount.toFixed(2)}+USDT`;
        setQrCode(qrCodeUrl);
        setPixCopyPaste('00020126360014br.gov.bcb.pix0114' + Math.random().toString(36).substring(2, 15) + '5204000053039865802BR5913' + 'DailyGainX' + '6009SAO PAULO62070503***6304' + Math.random().toString(16).slice(2, 6).toUpperCase());
    };

    const copyPixKeyToClipboard = () => {
        if (!pixCopyPaste) return;
        navigator.clipboard.writeText(pixCopyPaste);
        toast({
            title: 'Copiado!',
            description: 'A chave Pix "Copia e Cola" foi copiada para a sua área de transferência.',
        });
    };
    
    const handleConfirmPayment = () => {
        if (usdtAmount <= 0) return;
    
        // Referral reward logic
        if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef)
                .then((userDoc) => {
                    // Make sure user data exists before proceeding
                    if (userDoc.exists()) {
                      const userData = userDoc.data();
                      if (userData && userData.hasMadeFirstDeposit === false) {
                        // This is the first deposit, check for a referral record
                        const referralsQuery = query(collection(firestore, 'referrals'), where('referredId', '==', user.uid), where('status', '==', 'pending'));
                        getDocs(referralsQuery).then(referralSnapshot => {
                            if (!referralSnapshot.empty) {
                                // Found the referral record
                                const referralDoc = referralSnapshot.docs[0];
                                
                                const batch = writeBatch(firestore);
                                
                                batch.update(userDocRef, { hasMadeFirstDeposit: true });
                                
                                batch.update(referralDoc.ref, { status: 'rewarded' });
                                
                                batch.commit().then(() => {
                                    toast({
                                        title: 'Indicação Recompensada!',
                                        description: 'Graças a você, a pessoa que te indicou ganhou 1 USDT de bônus!',
                                    });
                                }).catch(error => {
                                    console.error("Failed to update referral status:", error);
                                });
                            } else {
                              updateDoc(userDocRef, { hasMadeFirstDeposit: true }).catch(e => console.error("Failed to update user deposit status:", e));
                            }
                        }).catch(error => {
                            console.error("Error checking for referral:", error);
                        });
                      }
                    }
                })
                .catch((error) => {
                    console.error("Error fetching user data for referral check:", error);
                });
        }
    
        addTransaction({
            type: 'deposit',
            amount: usdtAmount,
            method: 'Pix',
            status: 'Completed'
        });
        toast({
            title: 'Depósito Confirmado!',
            description: `${usdtAmount.toFixed(2)} USDT adicionados ao seu saldo.`,
        });
        setBrlAmount('');
        setQrCode('');
        setPixCopyPaste('');
    };

    if (qrCode) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                    <Button variant="ghost" size="icon" onClick={() => { setQrCode(''); setPixCopyPaste(''); }}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">Depósito</h1>
                    <div className="w-9 h-9" />
                </header>
                <main className="flex-1 p-4 sm:p-6">
                    <div className="container mx-auto max-w-md">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Pagamento via Pix
                                </CardTitle>
                                <CardDescription>
                                    Escaneie o QR Code ou copie a chave abaixo para pagar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <Image 
                                        src={qrCode} 
                                        alt="Pix QR Code" 
                                        width={256} 
                                        height={256} 
                                        className="rounded-lg border bg-white"
                                        data-ai-hint="qr code"
                                    />
                                    <p className="text-sm text-muted-foreground">Valor: <span className="font-bold text-foreground">{usdtAmount.toFixed(2)} USDT</span></p>
                                    <div className="w-full space-y-4 pt-4 text-left">
                                        <div className="space-y-2">
                                            <Label htmlFor="beneficiary">Beneficiário</Label>
                                            <Input
                                                id="beneficiary"
                                                readOnly
                                                value="DailyGainX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pix-copy-paste">Pix Copia e Cola</Label>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    id="pix-copy-paste"
                                                    readOnly
                                                    value={pixCopyPaste}
                                                    className="text-sm truncate"
                                                />
                                                <Button variant="outline" size="icon" onClick={copyPixKeyToClipboard}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button onClick={handleConfirmPayment} className="w-full">
                                            Pagamento Concluído
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
                    <Label className="text-sm font-normal text-muted-foreground">PIX elegível</Label>
                    <div className="mt-2 flex items-center justify-between rounded-lg border-2 border-green-500 bg-card p-4">
                        <PixLogo />
                        <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="font-semibold">Pagar</h2>
                    <div className="relative">
                        <Input
                            id="brlAmount"
                            type="number"
                            placeholder="Limite 10 ~ 10000"
                            value={brlAmount}
                            onChange={(e) => setBrlAmount(e.target.value)}
                            className="h-14 text-lg pl-4 pr-12 bg-muted border-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">R$</span>
                    </div>
                    <p className="text-sm text-orange-500 text-center">(1 USDT ≈ {CONVERSION_RATE} R$)</p>
                    <div className="relative">
                        <Input
                            id="usdtAmount"
                            value={usdtAmount > 0 ? usdtAmount.toFixed(4) : ''}
                            readOnly
                            className="h-14 text-lg pl-4 pr-16 bg-muted border-none"
                            placeholder="Receberei"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">USDT</span>
                    </div>
                </div>

                <div className="space-y-4 text-sm text-muted-foreground">
                    <p><span className="font-semibold">A.</span> Sem taxas.</p>
                    <p><span className="font-semibold">B.</span> Você pode digitalizar o código Pix QR e depositar, por favor, termine o pagamento em <span className="font-semibold text-orange-500">30 minutos.</span></p>
                    <p className="text-orange-500 font-semibold">Por favor, reinicie o depósito após o fim do código, por favor, não salve a captura de tela e pague depois!</p>
                </div>
                
                <div className="pt-4">
                    <Button 
                        onClick={handleGenerateQrCode} 
                        className="w-full h-12 text-lg" 
                        disabled={!brlAmount || parseFloat(brlAmount) < 10}
                    >
                        Depósito
                    </Button>
                </div>
              </div>
            </main>
        </div>
    );
}
