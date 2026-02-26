
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
  Settings,
  Plus,
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
import { cn } from '@/lib/utils';

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
    return query(collection(firestore, 'tokens_resgate'), orderBy('criadoEm', 'desc'), limit(20));
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
        createdBy: user?.uid,
        status: 'active'
      });

      toast({ title: 'Token Gerado!', description: `Código ${newTokenCode} criado com sucesso.` });
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
                    <Avatar className="w-16 h-16 border-2 border-primary shadow-sm">
                        <AvatarImage src={user?.photoURL || mainProfilePic?.imageUrl} data-ai-hint={mainProfilePic?.imageHint}/>
                        <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{displayName}</h1>
                            {isAdmin && <Badge className="bg-purple-600 text-white border-none px-2 py-0.5 text-[10px] font-black uppercase">Admin</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        {isProfileLoading ? (
                            <Skeleton className="h-5 w-32 mt-2" />
                        ) : (
                            userProfile?.referralCode && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-muted/60 px-2 py-1 rounded border">
                                        ID: {userProfile.referralCode}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(userProfile.referralCode, 'Código')}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Card de Saldo */}
                <Card className="mb-8 border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                    <CardHeader className="pb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Saldo Total</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black mb-6 tracking-tight">
                            {isBalanceLoading ? <Skeleton className="h-10 w-40" /> : `${balance.toFixed(2)} USDT`}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" size="lg" className="rounded-xl h-12 font-bold" asChild>
                                <Link href="/withdraw"><ArrowUpFromLine className="mr-2 h-5 w-5" />Saque</Link>
                            </Button>
                            <Button size="lg" className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20" asChild>
                                <Link href="/deposit"><ArrowDownToLine className="mr-2 h-5 w-5" />Depósito</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Menu Admin - EXCLUSIVO isaacmargues03@gmail.com */}
                {isAdmin && (
                  <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-black text-purple-600 flex items-center gap-2 uppercase tracking-[0.15em]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Painel Administrativo
                      </h3>
                    </div>
                    
                    <Button 
                      onClick={() => setIsAdminDialogOpen(true)} 
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-xl shadow-lg shadow-purple-200 gap-3"
                    >
                      <Plus className="h-6 w-6" />
                      GERAR NOVO TOKEN
                    </Button>
                    
                    <ActionMenuItem 
                        variant="admin"
                        onClick={() => setIsAdminDialogOpen(true)} 
                        icon={<Eye className="h-5 w-5"/>} 
                        text="Ver Status dos Códigos" 
                    />
                  </div>
                )}

                {/* Menu Geral */}
                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-muted-foreground px-1 uppercase tracking-[0.15em]">Serviços</h3>
                    <ActionMenuItem 
                        onClick={() => setIsTokenDialogOpen(true)} 
                        icon={<Ticket className="h-5 w-5"/>} 
                        text="Resgatar Token" 
                    />
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Histórico de Transações" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indique e Ganhe" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Suporte & Feedback" />
                    <MenuItem href="https://t.me/DailyGainX_Comunidade" icon={<Send className="h-5 w-5"/>} text="Canal do Telegram" />
                </div>

                <div className="mt-10">
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl h-12" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Sair da plataforma
                    </Button>
                </div>
            </div>
        </main>

        {/* Modal: Resgatar Token (Usuário) */}
        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Resgatar Token</DialogTitle>
              <DialogDescription>Digite o código DGX-XXXXXX recebido para creditar seu saldo.</DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Input 
                placeholder="EX: DGX-H72K9L" 
                value={tokenInput} 
                onChange={(e) => setTokenInput(e.target.value)} 
                disabled={isRedeeming} 
                className="uppercase font-mono text-center text-2xl h-16 rounded-xl border-2 focus:border-primary transition-all" 
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button onClick={handleRedeemToken} disabled={isRedeeming || !tokenInput.trim()} className="w-full h-14 rounded-xl text-lg font-bold">
                {isRedeeming ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmar e Resgatar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Painel Administrativo (Exclusivo Admin) */}
        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden">
            <div className="bg-purple-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8" />
                  Painel Administrativo
                </DialogTitle>
                <DialogDescription className="text-purple-100">Crie códigos de saldo ou monitore os resgates.</DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Seção de Criação */}
              <div className="space-y-4">
                <Label className="text-purple-600 font-black uppercase text-[10px] tracking-widest">Gerar Novo Token</Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input 
                      type="number" 
                      value={adminTokenValue} 
                      onChange={(e) => setAdminTokenValue(e.target.value)} 
                      disabled={isGenerating} 
                      placeholder="Valor USDT"
                      className="h-14 rounded-xl text-xl font-bold pr-16 border-purple-100 focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-purple-300">USDT</span>
                  </div>
                  <Button onClick={handleAdminGenerateToken} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700 h-14 px-6 rounded-xl shadow-lg shadow-purple-200">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5 mr-2" />} 
                    Gerar
                  </Button>
                </div>
              </div>

              {/* Lista de Monitoramento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                    <Eye className="h-3.5 w-3.5" /> Monitor de Resgates
                  </Label>
                  {isTokensLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                
                <ScrollArea className="h-[320px] rounded-xl border-2 border-dashed bg-muted/20 p-2">
                  <div className="space-y-2">
                    {allTokens?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <Ticket className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase">Nenhum token encontrado</p>
                      </div>
                    ) : (
                      allTokens?.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-card rounded-xl border-2 border-white shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-base">{t.token}</span>
                            <span className="text-[11px] font-bold text-muted-foreground">{t.valor.toFixed(2)} USDT</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={t.usado ? "secondary" : "outline"} className={cn(
                              "px-3 py-1 rounded-full border-none font-black text-[9px] uppercase",
                              t.usado ? "bg-gray-200 text-gray-500" : "bg-green-100 text-green-700"
                            )}>
                              {t.usado ? "Resgatado" : "Disponível"}
                            </Badge>
                            {!t.usado && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-purple-50 text-purple-600" onClick={() => copyToClipboard(t.token, 'Token')}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/10">
              <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)} className="w-full h-12 rounded-xl font-bold">Fechar Painel</Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
