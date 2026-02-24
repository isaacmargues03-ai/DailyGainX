'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft, CheckCircle, Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, query, where, collection, getDocs, writeBatch } from 'firebase/firestore';


const Pix1Icon = () => (
    <svg width="60" height="24" viewBox="0 0 70 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M13.9998 3.33301L7.35781 7.08401L3.41681 13.455L4.83281 14.545L7.35781 10.868L12.5838 7.91601V20.084L7.35781 23.132L13.9998 3.33301Z" fill="#00C896"/>
        <path d="M13.9998 3.33301L20.6418 7.08401L24.5828 13.455L23.1668 14.545L20.6418 10.868L15.4158 7.91601V20.084L20.6418 23.132L13.9998 3.33301Z" fill="#00C896"/>
        <path d="M7.35815 7.08401L4.83315 10.868V17.132L7.35815 20.868L12.5842 23.916V4.08401L7.35815 7.08401Z" fill="#00C896"/>
        <path d="M20.6421 7.08401L23.1671 10.868V17.132L20.6421 20.868L15.4161 23.916V4.08401L20.6421 7.08401Z" fill="#00C896"/>
        <path d="M37.3604 19.34V8.4H32.2404V19.34H37.3604ZM32.2404 22.4H37.3604V24.5H29.1804V5.5H40.4204V8.4H40.4004V5.5H40.4204V3H29.1804V24.5H29.2004V22.4H32.2404Z" fill="#6C727A"/>
        <path d="M47.7811 11.22L45.4211 14.18L43.0611 11.22H40.0011L44.3611 16.9V24.5H46.5011V16.9L50.8611 11.22H47.7811Z" fill="#6C727A"/>
        <path d="M57.6402 11.2H54.0802V24.5H51.9402V11.2H48.3802V9.1H57.6402V11.2Z" fill="#6C727A"/>
        <path d="M60.0004 9.1H62.1404V22.4H67.6204V24.5H60.0004V9.1Z" fill="#6C727A"/>
    </svg>
);


const CONVERSION_RATE = 5.1723;

export default function DepositPage() {
    const [brlAmount, setBrlAmount] = useState('');
    const [usdtAmount, setUsdtAmount] = useState(0);
    const [qrCode, setQrCode] = useState('');
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
    };
    
    const handleConfirmPayment = () => {
        if (usdtAmount <= 0) return;
    
        // Referral reward logic
        if (user) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef)
                .then((userDoc) => {
                    if (userDoc.exists() && userDoc.data().hasMadeFirstDeposit === false) {
                        // This is the first deposit, check for a referral record
                        const referralsQuery = query(collection(firestore, 'referrals'), where('referredId', '==', user.uid), where('status', '==', 'pending'));
                        getDocs(referralsQuery).then(referralSnapshot => {
                            if (!referralSnapshot.empty) {
                                // Found the referral record
                                const referralDoc = referralSnapshot.docs[0];
                                
                                // Use a batch to update both user and referral docs
                                const batch = writeBatch(firestore);
                                
                                // 1. Update user's first deposit status
                                batch.update(userDocRef, { hasMadeFirstDeposit: true });
                                
                                // 2. Update the referral status to 'rewarded'
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
                              // Not a referred user or already rewarded, just update deposit status
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
    
        // Proceed with the deposit transaction
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
    };

    if (qrCode) {
        return (
             <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                    <Button variant="ghost" size="icon" onClick={() => setQrCode('')}>
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
                                    Escaneie o QR Code abaixo para pagar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <Image 
                                        src={qrCode} 
                                        alt="Pix QR Code" 
                                        width={256} 
                                        height={256} 
                                        className="rounded-lg border bg-white"
                                        data-ai-hint="qr code"
                                    />
                                    <p className="text-sm text-muted-foreground">Valor: <span className="font-bold text-foreground">{usdtAmount.toFixed(2)} USDT</span></p>
                                    <div className="w-full space-y-2">
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
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                </Button>
            </header>

            <main className="flex-1 p-4 sm:p-6 space-y-6">
                <div>
                    <Label className="text-sm font-normal text-muted-foreground">Meios de pagamento</Label>
                    <div className="mt-2 flex items-center justify-between rounded-lg border-2 border-green-500 bg-card p-4">
                        <Pix1Icon />
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
            </main>
            
            <footer className="p-4 border-t bg-background">
                <Button 
                    onClick={handleGenerateQrCode} 
                    className="w-full h-12 text-lg" 
                    disabled={!brlAmount || parseFloat(brlAmount) < 10}
                >
                    Depósito
                </Button>
            </footer>
        </div>
    );
}
