
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

  // Email exclusivo de administrador conforme solicitado
  const isAdmin = user?.email === 'isaacmargues03@gmail.com';

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{referralCode: string}>(userDocRef);

  // Consulta para admin ver os tokens recentes na coleção
  const tokensQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(collection(firestore, 'tokens_resgate'), orderBy('criadoEm', 'desc'), limit(15));
  }, [isAdmin, firestore]);

  const { data: allTokens, isLoading: isTokensLoading } = useCollection<{token: string, valor: number, usado: boolean}>(tokensQuery);

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

  // Lógica exclusiva do Admin para criar novos tokens
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

      toast({ title: 'Token Gerado!', description: `Código ${newTokenCode} criado com sucesso.` });
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
          throw new Error('Código de token inválido.');
        }

        const tokenData = tokenDoc.data();
        if (tokenData.usado === true) {
          throw new Error('Este código já foi resgatado.');
        }

        const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);
        const accountDoc = await transaction.get(accountRef);

        if (!accountDoc.exists()) {
          throw new Error('Sua conta não foi encontrada.');
        }

        const amount = tokenData.valor || 0;
        transaction.update(accountRef, {
          balance: (accountDoc.data().balance || 0) + amount
        });

        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid
        });

        return amount;
      });

      toast({ title: 'Sucesso!', description: 'Saldo resgatado com sucesso!' });
      setIsTokenDialogOpen(false);
      setTokenInput('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Falha no Resgate', description: error.message });
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
                
                {/* Cabeçalho do Perfil */}
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
                                        Indicação: {userProfile.referralCode}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(userProfile.referralCode, 'Código')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Card de Saldo */}
                <Card className="mb-8 shadow-sm">
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-4">
                            {isBalanceLoading ? <Skeleton className="h-8 w-32" /> : `${balance.toFixed(2)} USDT`}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" size="lg" asChild>
                                <Link href="/withdraw"><ArrowUpFromLine className="mr-2 h-4 w-4" />Saque</Link>
                            </Button>
                            <Button size="lg" asChild>
                                <Link href="/deposit"><ArrowDownToLine className="mr-2 h-4 w-4" />Depósito</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Menu Admin - Visível apenas para isaacmargues03@gmail.com */}
                {isAdmin && (
                  <div className="mb-8 space-y-3">
                    <h3 className="text-xs font-bold text-purple-600 px-1 flex items-center gap-2 uppercase tracking-wider">
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

                {/* Menu Geral */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">Serviços</h3>
                    <ActionMenuItem 
                        onClick={() => setIsTokenDialogOpen(true)} 
                        icon={<Ticket className="h-5 w-5"/>} 
                        text="Resgatar Token" 
                    />
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Extrato" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indique e Ganhe" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Suporte & Feedback" />
                    <MenuItem href="https://t.me/DailyGainX_Comunidade" icon={<Send className="h-5 w-5"/>} text="Canal do Telegram" />
                </div>

                <div className="mt-8">
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Sair da plataforma
                    </Button>
                </div>
            </div>
        </main>

        {/* Modal: Resgatar Token (Usuário) */}
        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Resgatar Token</DialogTitle>
              <DialogDescription>Digite o código DGX-XXXXXX para adicionar saldo.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Ex: DGX-H72K9L" 
                value={tokenInput} 
                onChange={(e) => setTokenInput(e.target.value)} 
                disabled={isRedeeming} 
                className="uppercase font-mono text-center text-lg h-12" 
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button onClick={handleRedeemToken} disabled={isRedeeming || !tokenInput.trim()} className="w-full h-12">
                {isRedeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar e Resgatar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Painel Administrativo (Exclusivo Admin) */}
        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-purple-600">Painel de Gerenciamento de Tokens</DialogTitle>
              <DialogDescription>Gere novos códigos para bonificações manuais.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Seção de Criação */}
              <div className="space-y-4 border p-4 rounded-lg bg-purple-50/30">
                <Label className="text-purple-700 font-bold">Gerar Novo Código</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input 
                      type="number" 
                      value={adminTokenValue} 
                      onChange={(e) => setAdminTokenValue(e.target.value)} 
                      disabled={isGenerating} 
                      placeholder="Valor em USDT"
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">USDT</span>
                  </div>
                  <Button onClick={handleAdminGenerateToken} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} 
                    Criar Token
                  </Button>
                </div>
              </div>

              {/* Lista de Monitoramento */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                  <Eye className="h-3 w-3" /> Monitoramento em Tempo Real
                </Label>
                <ScrollArea className="h-[300px] border rounded-md p-2 bg-muted/20">
                  {isTokensLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p className="text-xs">Sincronizando banco de dados...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allTokens?.length === 0 ? (
                        <p className="text-center text-xs py-10 text-muted-foreground">Nenhum token gerado recentemente.</p>
                      ) : (
                        allTokens?.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-card rounded border shadow-sm">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-sm">{t.token}</span>
                              <span className="text-[10px] text-muted-foreground">{t.valor.toFixed(2)} USDT</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={t.usado ? "secondary" : "outline"} className={t.usado ? "bg-gray-100" : "bg-green-50 text-green-700 border-green-200"}>
                                {t.usado ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {t.usado ? "Usado" : "Livre"}
                              </Badge>
                              {!t.usado && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(t.token, 'Token')}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)} className="w-full">Fechar Painel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
