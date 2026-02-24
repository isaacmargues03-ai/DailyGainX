'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, User, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Based on docs/backend.json UserProfile entity
interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
  referralCode: string;
  referralCodeUsed?: string;
  hasMadeFirstDeposit: boolean;
}

export default function ReferralsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const referralsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.referralCode) return null;
    return query(
      collection(firestore, 'users'),
      where('referralCodeUsed', '==', userProfile.referralCode)
    );
  }, [firestore, userProfile?.referralCode]);

  const { data: referredUsers, isLoading: isReferralsLoading } = useCollection<UserProfile>(referralsQuery);


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
        <div className="container mx-auto max-w-2xl space-y-8">
          <div className="text-center">
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
              {isProfileLoading ? (
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

          <Card>
            <CardHeader>
              <CardTitle>Amigos Convidados</CardTitle>
              <CardDescription>
                Acompanhe quem usou seu código e se você já ganhou sua recompensa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isReferralsLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              ) : referredUsers && referredUsers.length > 0 ? (
                <ul className="space-y-4">
                  {referredUsers.map((referredUser) => (
                    <li key={referredUser.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={referredUser.profilePictureUrl} />
                          <AvatarFallback>{referredUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{referredUser.name}</p>
                          <p className="text-sm text-muted-foreground">{referredUser.email}</p>
                        </div>
                      </div>
                      {referredUser.hasMadeFirstDeposit ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Recompensa Paga
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Aguardando depósito
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-semibold">Você ainda não convidou ninguém.</p>
                  <p className="text-sm">Compartilhe seu código para começar a ganhar!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
