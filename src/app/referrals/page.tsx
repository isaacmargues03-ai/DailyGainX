'use client';

import { useState } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReferralsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading } = useDoc<{referralCode: string}>(userDocRef);

  const copyToClipboard = () => {
    if (userProfile?.referralCode) {
      navigator.clipboard.writeText(userProfile.referralCode);
      toast({
        title: 'Copiado!',
        description: 'Seu código de indicação foi copiado para a área de transferência.',
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Indique e Ganhe</h1>
            <p className="text-muted-foreground mt-2">Convide seus amigos e ganhe 1 USDT para cada amigo que fizer o primeiro depósito.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                Seu Código de Indicação
              </CardTitle>
              <CardDescription>
                Compartilhe este código com seus amigos. Eles devem inseri-lo durante o cadastro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex space-x-2">
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-10" />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={userProfile?.referralCode || 'Nenhum código encontrado'}
                    className="text-lg font-mono tracking-widest"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!userProfile?.referralCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="text-sm text-muted-foreground p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2">Como funciona:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Seu amigo se cadastra usando seu código.</li>
                  <li>Ele faz o primeiro depósito de qualquer valor.</li>
                  <li>Você recebe 1 USDT de bônus no seu saldo.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
