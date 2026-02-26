
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Briefcase,
  ChevronRight,
  Gift,
  History,
  LogOut,
  MessageSquare,
  Send,
  Copy,
  Ticket,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MenuItem({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link href={href} className="block bg-card rounded-lg shadow-sm hover:bg-muted/80 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="text-primary">{icon}</div>
          <span className="font-medium">{text}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}

function ActionMenuItem({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left block bg-card rounded-lg shadow-sm hover:bg-muted/80 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="text-primary">{icon}</div>
          <span className="font-medium">{text}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </button>
  );
}

export default function ProfilePage() {
  const { balance, isBalanceLoading } = useAppContext();
  const { auth, user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{referralCode: string}>(userDocRef);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = () => {
    if (userProfile?.referralCode) {
      navigator.clipboard.writeText(userProfile.referralCode);
      toast({
        title: 'Copiado!',
        description: 'Seu código de indicação foi copiado para a área de transferência.',
      });
    }
  };

  const handleRedeemToken = async () => {
    const tokenClean = tokenInput.trim().toUpperCase();
    if (!tokenClean || !user || isRedeeming) return;

    setIsRedeeming(true);

    try {
      await runTransaction(firestore, async (transaction) => {
        // Busca o token na coleção tokens_resgate
        const tokenRef = doc(firestore, 'tokens_resgate', tokenClean);
        const tokenDoc = await transaction.get(tokenRef);

        if (!tokenDoc.exists()) {
          throw new Error('Token inválido ou inexistente.');
        }

        const tokenData = tokenDoc.data();
        
        // Verifica se o token já foi usado (campo 'usado' alinhado com o bot)
        if (tokenData.usado === true) {
          throw new Error('Este token já foi utilizado ou está expirado.');
        }

        // Busca a conta do usuário para atualizar o saldo
        const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error('Conta do usuário não encontrada.');
        }

        // 1. Credita o saldo (campo 'valor' alinhado com o bot)
        const amount = tokenData.valor || 0;
        transaction.update(accountRef, {
          balance: (accountDoc.data().balance || 0) + amount
        });

        // 2. Marca o token como usado
        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid
        });

        return amount;
      });

      toast({
        title: 'Sucesso!',
        description: 'Token resgatado com sucesso! O valor foi adicionado ao seu saldo.',
      });
      setIsTokenDialogOpen(false);
      setTokenInput('');
    } catch (error: any) {
      console.error('Erro ao resgatar token:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no Resgate',
        description: error.message || 'Ocorreu um erro ao processar o token.',
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const fallback = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex-1">
            <div className="container mx-auto max-lg py-6 px-4">
                
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                        <AvatarImage src={user?.photoURL || mainProfilePic?.imageUrl} data-ai-hint={mainProfilePic?.imageHint}/>
                        <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-bold">{displayName}</h1>
                        <p className="text-sm text-muted-foreground">@{user?.email}</p>
                        {isProfileLoading ? (
                            <Skeleton className="h-5 w-32 mt-2" />
                        ) : (
                            userProfile?.referralCode && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                        Cód. Indicação: {userProfile.referralCode}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                <Card className="mb-8 shadow-sm">
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-4">
                            {isBalanceLoading ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                `${balance.toFixed(2)} USDT`
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/withdraw">
                                    <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                    Retirada
                                </Link>
                            </Button>
                            <Button size="lg" asChild>
                                <Link href="/deposit">
                                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                                    Depósito
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <ActionMenuItem 
                        onClick={() => setIsTokenDialogOpen(true)} 
                        icon={<Ticket className="h-5 w-5"/>} 
                        text="Resgatar Token" 
                    />
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Histórico" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indicações" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Feedback" />
                    <MenuItem href="https://t.me/DailyGainX_Comunidade" icon={<Send className="h-5 w-5"/>} text="Comunidade do Telegram" />
                </div>

                <div className="mt-8">
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair da conta
                    </Button>
                </div>
                
                <footer className="mt-12 text-center text-xs text-muted-foreground/80">
                    <p>EMPRESA ATIVA DESDE 2016</p>
                    <p>Sede na Tailândia</p>
                </footer>
            </div>
        </main>

        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Resgatar Token</DialogTitle>
              <DialogDescription>
                Insira o código do token (ex: DGX-ABC123) recebido no bot para creditar o saldo em sua conta.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="token-code">Código do Token</Label>
                <Input
                  id="token-code"
                  placeholder="DGX-XXXXXX"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  disabled={isRedeeming}
                  className="uppercase font-mono"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTokenDialogOpen(false)} disabled={isRedeeming} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleRedeemToken} disabled={isRedeeming || !tokenInput.trim()} className="flex-1">
                {isRedeeming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  'Confirmar Resgate'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
