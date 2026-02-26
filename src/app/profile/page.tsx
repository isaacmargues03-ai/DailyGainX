
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
  ShieldCheck,
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, runTransaction, setDoc, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function ActionMenuItem({ icon, text, onClick, variant = "default" }: { icon: React.ReactNode; text: string; onClick: () => void, variant?: "default" | "admin" }) {
  return (
    <button onClick={onClick} className="w-full text-left block bg-card rounded-lg shadow-sm hover:bg-muted/80 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={variant === "admin" ? "text-purple-600" : "text-primary"}>{icon}</div>
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
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [adminTokenValue, setAdminTokenValue] = useState('100.00');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = user?.email === 'isaacmargues03@gmail.com';

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{referralCode: string}>(userDocRef);

  // Consulta para admin ver status dos tokens
  const tokensQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(collection(firestore, 'tokens_resgate'), orderBy('criadoEm', 'desc'), limit(20));
  }, [isAdmin, firestore]);

  const { data: allTokens, isLoading: isTokensLoading } = useCollection<{token: string, valor: number, usado: boolean, usedBy?: string}>(tokensQuery);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleAdminGenerateToken = async () => {
    const value = parseFloat(adminTokenValue);
    if (isNaN(value) || value <= 0) {
      toast({ variant: 'destructive', title: 'Valor inválido', description: 'Insira um valor maior que zero.' });
      return;
    }

    setIsGenerating(true);
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let newTokenCode = "DGX-";
      for (let i = 0; i < 6; i++) {
        newTokenCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await setDoc(doc(firestore, 'tokens_resgate', newTokenCode), {
        token: newTokenCode,
        valor: value,
        usado: false,
        criadoEm: serverTimestamp(),
        createdBy: user?.uid
      });

      toast({ title: 'Token Gerado!', description: `O código ${newTokenCode} foi criado com sucesso.` });
      setAdminTokenValue('100.00');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao gerar', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedeemToken = async () => {
    const tokenClean = tokenInput.trim().toUpperCase();
    if (!tokenClean || !user || isRedeeming) return;

    setIsRedeeming(true);

    try {
      await runTransaction(firestore, async (transaction) => {
        const tokenRef = doc(firestore, 'tokens_resgate', tokenClean);
        const tokenDoc = await transaction.get(tokenRef);

        if (!tokenDoc.exists()) {
          throw new Error('Token inválido ou inexistente.');
        }

        const tokenData = tokenDoc.data();
        if (tokenData.usado === true) {
          throw new Error('Este token já foi utilizado.');
        }

        const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error('Conta do usuário não encontrada.');
        }

        const amount = tokenData.valor || 0;
        transaction.update(accountRef, {
          balance: (accountDoc.data().balance || 0) + amount
        });

        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid,
          userEmail: user.email
        });

        return amount;
      });

      toast({ title: 'Sucesso!', description: 'Saldo creditado com sucesso!' });
      setIsTokenDialogOpen(false);
      setTokenInput('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
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
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{displayName}</h1>
                            {isAdmin && <Badge className="bg-purple-600">ADMIN</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user?.email}</p>
                        {isProfileLoading ? (
                            <Skeleton className="h-5 w-32 mt-2" />
                        ) : (
                            userProfile?.referralCode && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                        Cód. Indicação: {userProfile.referralCode}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(userProfile.referralCode, 'Código')}>
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
                            {isBalanceLoading ? <Skeleton className="h-8 w-32" /> : `${balance.toFixed(2)} USDT`}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/withdraw"><ArrowUpFromLine className="mr-2 h-4 w-4" />Retirada</Link>
                            </Button>
                            <Button size="lg" asChild>
                                <Link href="/deposit"><ArrowDownToLine className="mr-2 h-4 w-4" />Depósito</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {isAdmin && (
                  <div className="mb-8 space-y-3">
                    <h3 className="text-sm font-bold text-purple-600 px-1 flex items-center gap-2 uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" />
                      Painel Administrativo
                    </h3>
                    <ActionMenuItem 
                        variant="admin"
                        onClick={() => setIsAdminDialogOpen(true)} 
                        icon={<PlusCircle className="h-5 w-5"/>} 
                        text="Gerenciar & Criar Tokens" 
                    />
                  </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground px-1 uppercase tracking-wider">Menu do Usuário</h3>
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
                        <LogOut className="mr-2 h-4 w-4" />Sair da conta
                    </Button>
                </div>
            </div>
        </main>

        {/* Dialog de Resgate do Usuário */}
        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Resgatar Token</DialogTitle><DialogDescription>Insira o código DGX-XXXXXX recebido.</DialogDescription></DialogHeader>
            <div className="py-4"><Input placeholder="DGX-XXXXXX" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} disabled={isRedeeming} className="uppercase font-mono" /></div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTokenDialogOpen(false)} disabled={isRedeeming} className="flex-1">Cancelar</Button>
              <Button onClick={handleRedeemToken} disabled={isRedeeming || !tokenInput.trim()} className="flex-1">
                {isRedeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Resgate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Administrativo */}
        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Gerenciador de Tokens</DialogTitle><DialogDescription>Crie novos códigos ou veja quem já resgatou.</DialogDescription></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2 border-b pb-4">
                <Label>Valor do Novo Token (USDT)</Label>
                <div className="flex gap-2">
                  <Input type="number" value={adminTokenValue} onChange={(e) => setAdminTokenValue(e.target.value)} disabled={isGenerating} />
                  <Button onClick={handleAdminGenerateToken} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Gerar
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Eye className="h-4 w-4" /> Tokens Recentes</Label>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {isTokensLoading ? <div className="p-4 text-center">Carregando...</div> : (
                    <div className="space-y-2">
                      {allTokens?.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs border">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-sm">{t.token}</span>
                            <span className="text-muted-foreground">{t.valor} USDT</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={t.usado ? "secondary" : "outline"} className={t.usado ? "" : "bg-green-100 text-green-800"}>
                              {t.usado ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {t.usado ? "Usado" : "Disponível"}
                            </Badge>
                            {!t.usado && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(t.token, 'Token')}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAdminDialogOpen(false)} className="w-full">Fechar Painel</Button></DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
