'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const PixIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M12.0002 1.33301L5.35822 5.08401L1.41722 11.455L2.83322 12.545L5.35822 8.86801L10.5842 5.91601V18.084L5.35822 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M12.0002 1.33301L18.6422 5.08401L22.5832 11.455L21.1672 12.545L18.6422 8.86801L13.4162 5.91601V18.084L18.6422 21.132L12.0002 1.33301Z" fill="currentColor"/>
        <path d="M5.35815 5.08401L2.83315 8.86801V15.132L5.35815 18.868L10.5842 21.916V2.08401L5.35815 5.08401Z" fill="currentColor"/>
        <path d="M18.6421 5.08401L21.1671 8.86801V15.132L18.6421 18.868L13.4161 21.916V2.08401L18.6421 5.08401Z" fill="currentColor"/>
    </svg>
);

export default function WithdrawPage() {
    const [amount, setAmount] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [pixKey, setPixKey] = useState('');
    const { toast } = useToast();
    const { balance, addTransaction, activeInvestments } = useAppContext();

    const handleWithdraw = () => {
        const withdrawAmount = parseFloat(amount);

        if (activeInvestments.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Saque bloqueado',
                description: 'Saque só dps do primeiro investimento.',
            });
            return;
        }
        
        if (!pixKey) {
            toast({
                variant: 'destructive',
                title: 'Chave Pix necessária',
                description: 'Por favor, insira sua chave Pix.',
            });
            return;
        }

        if (isNaN(withdrawAmount) || withdrawAmount < 5 || withdrawAmount > 10000) {
            toast({
                variant: 'destructive',
                title: 'Valor inválido',
                description: 'O valor para saque deve ser entre 5 e 10.000 USDT.',
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

        addTransaction({
            type: 'withdrawal',
            amount: withdrawAmount,
            method: 'Pix',
            status: 'Completed'
        });

        toast({
            title: 'Retirada Solicitada!',
            description: `${withdrawAmount.toFixed(2)} USDT serão enviados para a chave Pix informada.`,
        });

        setAmount('');
        setPixKey('');
    };

    const isButtonDisabled = !amount || !pixKey || parseFloat(amount) <= 0 || parseFloat(amount) > balance || activeInvestments.length === 0 || parseFloat(amount) < 5 || parseFloat(amount) > 10000;

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="flex items-center justify-between p-4 border-b bg-background">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Retirada</h1>
                <div className="w-9 h-9" />
            </header>
            <main className="flex-1 p-4 sm:p-6">
                <div className="container mx-auto max-w-md">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PixIcon />
                                Retirada via Pix
                            </CardTitle>
                            <CardDescription>
                                Insira os detalhes abaixo para solicitar sua retirada.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Tipo de Chave Pix</Label>
                                <RadioGroup defaultValue="cpf" value={pixKeyType} onValueChange={setPixKeyType} className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cpf" id="r-cpf" />
                                        <Label htmlFor="r-cpf">CPF</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="phone" id="r-phone" />
                                        <Label htmlFor="r-phone">Telefone</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pix-key">Sua Chave {pixKeyType === 'cpf' ? 'CPF' : 'Telefone'}</Label>
                                <Input
                                    id="pix-key"
                                    placeholder={pixKeyType === 'cpf' ? '000.000.000-00' : '(00) 00000-0000'}
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor da Retirada (USDT)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Mínimo 5 USDT - Máximo 10.000 USDT"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Saldo disponível: {balance.toFixed(2)} USDT</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleWithdraw} 
                                className="w-full" 
                                disabled={isButtonDisabled}
                            >
                                Solicitar Retirada
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
