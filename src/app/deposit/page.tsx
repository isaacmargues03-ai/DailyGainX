'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const PixIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12.0002 1.33301L5.35822 5.08401L1.41722 11.455L2.83322 12.545L5.35822 8.86801L10.5842 5.91601V18.084L5.35822 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M12.0002 1.33301L18.6422 5.08401L22.5832 11.455L21.1672 12.545L18.6422 8.86801L13.4162 5.91601V18.084L18.6422 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M5.35815 5.08401L2.83315 8.86801V15.132L5.35815 18.868L10.5842 21.916V2.08401L5.35815 5.08401Z" fill="currentColor"/>
        <path d="M18.6421 5.08401L21.1671 8.86801V15.132L18.6421 18.868L13.4161 21.916V2.08401L18.6421 5.08401Z" fill="currentColor"/>
    </svg>
);


export default function DepositPage() {
    const [amount, setAmount] = useState('');
    const [qrCode, setQrCode] = useState('');
    const { toast } = useToast();
    const { setBalance } = useAppContext();

    const handleGenerateQrCode = () => {
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: 'Por favor, insira um valor de depósito válido.',
            });
            return;
        }

        const qrCodeUrl = `https://placehold.co/256x256/EAF2F8/17202A/png?text=PIX+QR+CODE%0A${depositAmount.toFixed(2)}+USDT`;
        setQrCode(qrCodeUrl);

        toast({
            title: 'QR Code Gerado!',
            description: 'Escaneie o código com seu app de pagamentos.',
        });
    };
    
    const handleConfirmPayment = () => {
        const depositAmount = parseFloat(amount);
        if (!isNaN(depositAmount) && depositAmount > 0) {
            setBalance(prev => prev + depositAmount);
            toast({
                title: 'Depósito Confirmado!',
                description: `${depositAmount.toFixed(2)} USDT adicionados ao seu saldo.`,
            });
            setAmount('');
            setQrCode('');
        }
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Header />
            <main className="flex-1 p-4 sm:p-6">
                <div className="container mx-auto max-w-md">
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
                                <PixIcon />
                                Depósito via Pix
                            </CardTitle>
                            <CardDescription>
                                {qrCode ? 'Escaneie o QR Code abaixo para pagar.' : 'Insira o valor que deseja depositar para gerar o QR Code.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {qrCode ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Image 
                                        src={qrCode} 
                                        alt="Pix QR Code" 
                                        width={256} 
                                        height={256} 
                                        className="rounded-lg border bg-white"
                                        data-ai-hint="qr code"
                                    />
                                    <p className="text-sm text-muted-foreground">Valor: <span className="font-bold text-foreground">{parseFloat(amount).toFixed(2)} USDT</span></p>
                                    <div className="w-full space-y-2">
                                        <Button onClick={handleConfirmPayment} className="w-full">
                                            Já paguei
                                        </Button>
                                        <Button variant="outline" onClick={() => setQrCode('')} className="w-full">
                                            Depositar outro valor
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor do Depósito (USDT)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="Ex: 50.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="text-lg"
                                    />
                                </div>
                            )}
                        </CardContent>
                        {!qrCode && (
                            <CardFooter>
                                <Button onClick={handleGenerateQrCode} className="w-full" disabled={!amount || parseFloat(amount) <= 0}>
                                    Gerar QR Code de Pagamento
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
