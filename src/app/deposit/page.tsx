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
    <svg aria-hidden="true" width="80" height="28" viewBox="0 0 115 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M57.6519 12.9398V9.16309H67.5841V11.2067H61.9427V12.9398H66.0152V14.89H61.9427V19.3467H67.5841V21.3904H61.9427V24.5H59.799V9.16309H57.6519Z" />
        <path d="M76.9939 9.16309L72.2471 21.7305L69.9482 21.6837L71.4938 17.84H68.6213L66.7061 22.4284H64.4072L69.154 9.16309H71.5875L73.1331 13.5701H75.5599L76.9939 9.16309ZM70.0419 15.7933H74.1144L72.5688 11.5952L72.0859 10.3667L71.603 11.5952L70.0419 15.7933Z" />
        <path d="M84.7734 9.16309V24.5H82.6262V9.16309H84.7734Z" />
        <path d="M100.841 9.16309L93.7431 24.5H91.3164L88.0242 16.5184L84.732 24.5H82.1441L86.8909 9.16309H89.4788L92.5113 16.5184L95.7566 9.16309H97.749L100.841 9.16309Z" />
        <path d="M114.932 9.16309V24.5H112.784V9.16309H114.932Z" />
        <path d="M13.9998 3.33301L7.35781 7.08401L3.41681 13.455L4.83281 14.545L7.35781 10.868L12.5838 7.91601V20.084L7.35781 23.132L13.9998 3.33301Z" />
        <path d="M13.9998 3.33301L20.6418 7.08401L24.5828 13.455L23.1668 14.545L20.6418 10.868L15.4158 7.91601V20.084L20.6418 23.132L13.9998 3.33301Z" />
        <path d="M7.35815 7.08401L4.83315 10.868V17.132L7.35815 20.868L12.5842 23.916V4.08401L7.35815 7.08401Z" />
        <path d="M20.6421 7.08401L23.1671 10.868V17.132L20.6421 20.868L15.4161 23.916V4.08401L20.6421 7.08401Z" />
        <path d="M28.0004 24.5V3H36.9427C39.4677 3 41.1661 3.73333 42.0379 5.2C42.9259 6.66667 43.37 8.63333 43.37 11.1C43.37 13.5667 42.9259 15.5333 42.0379 17C41.1661 18.4667 39.4677 19.2 36.9427 19.2H30.1476V24.5H28.0004ZM36.5731 5.04667H30.1476V17.1533H36.5731C38.3038 17.1533 39.4677 16.6333 40.0647 15.6C40.6618 14.5667 40.9602 13.0667 40.9602 11.1C40.9602 9.13333 40.6618 7.63333 40.0647 6.6C39.4677 5.56667 38.3038 5.04667 36.5731 5.04667Z" />
        <path d="M53.1166 22.4284L47.0984 9.16309H49.5318L52.5642 16.5184L55.5967 9.16309H57.8956L51.8774 22.4284H53.1166Z" />
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
                    const userData = userDoc.data();
                    // Make sure user data exists before proceeding
                    if (userDoc.exists() && userData && userData.hasMadeFirstDeposit === false) {
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

            <main className="flex-1 p-4 sm:p-6 space-y-6">
                <div>
                    <Label className="text-sm font-normal text-muted-foreground">Meios de pagamento</Label>
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
            </main>
        </div>
    );
}
