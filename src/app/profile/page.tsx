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
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, runTransaction, setDoc, serverTimestamp, collection, query, orderBy, limit, increment } from 'firebase/firestore';
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

  const { data: userProfile } = useDoc<{referralCode: string, referralId?: string, hasMadeFirstDeposit?: boolean}>(userDocRef);

  const tokensQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore) return null;
    return query(collection(firestore, 'tokens_resgate'), orderBy('dataCriacao', 'desc'), limit(20));
  }, [isAdmin, firestore]);

  const { data: allTokens } = useCollection<{token: string, valor: number, usado: boolean, transactionId?: string}>(tokensQuery);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: `${label} copiado.` });
  };

  const handleAdminGenerateToken = async () => {
    const value = parseFloat(adminTokenValue);
    if (isNaN(value) || value <= 0) {
      toast({ variant: 'destructive', title: 'Valor Inválido', description: 'Por favor, insira um valor válido em USDT.' });
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
        dataCriacao: serverTimestamp(),
        geradoPor: user?.email,
        transactionId: "Manual-Site",
      });

      toast({ title: 'Token Gerado!', description: `Código ${newTokenCode} de ${value} USDT criado.` });
      setAdminTokenValue('100.00');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
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
        const userRef = doc(firestore, 'users', user.uid);
        const accountRef = doc(firestore, 'users', user.uid, 'accounts', user.uid);

        // --- TODAS AS LEITURAS DEVEM OCORRER ANTES DAS ESCRITAS ---
        const [tokenDoc, userDoc, accountDoc] = await Promise.all([
          transaction.get(tokenRef),
          transaction.get(userRef),
          transaction.get(accountRef)
        ]);

        if (!tokenDoc.exists()) throw new Error('Código inválido ou inexistente.');
        
        const tokenData = tokenDoc.data();
        if (tokenData.usado) throw new Error('Este código já foi utilizado.');

        const userData = userDoc.data();

        // Tenta encontrar a transação de histórico vinculada
        let historyTxDoc = null;
        if (tokenData.transactionId && tokenData.transactionId !== "Manual-Site") {
            const historyTxRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', tokenData.transactionId);
            historyTxDoc = await transaction.get(historyTxRef);
        }

        let referralDoc = null;
        if (userData && !userData.hasMadeFirstDeposit && userData.referralId) {
            const referralRef = doc(firestore, 'referrals', userData.referralId);
            referralDoc = await transaction.get(referralRef);
        }
        // ----------------------------------------------------------

        // 1. Atualização de Saldo
        if (!accountDoc.exists()) {
          transaction.set(accountRef, {
            id: user.uid,
            userId: user.uid,
            balance: tokenData.valor,
            currency: 'USDT'
          });
        } else {
          transaction.update(accountRef, {
            balance: (accountDoc.data().balance || 0) + tokenData.valor
          });
        }

        // 2. Marca Token como usado
        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid
        });

        // 3. ATUALIZA STATUS NO HISTÓRICO (Muito importante)
        if (historyTxDoc && historyTxDoc.exists()) {
            transaction.update(historyTxDoc.ref, {
                status: 'claimed',
                claimedAt: new Date().toISOString()
            });
        }

        // 4. Recompensa de indicação no primeiro resgate de token
        if (userData && !userData.hasMadeFirstDeposit) {
            transaction.update(userRef, { hasMadeFirstDeposit: true });
            
            if (referralDoc && referralDoc.exists()) {
                const referralData = referralDoc.data();
                const referrerId = referralData.referrerId;
                
                transaction.update(referralDoc.ref, { status: 'rewarded' });
                
                const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                transaction.update(referrerAccountRef, {
                    balance: increment(1)
                });
            }
        }

        return tokenData.valor;
      });

      toast({ title: 'Sucesso!', description: 'Saldo creditado em sua conta!' });
      setIsTokenDialogOpen(false);
      setTokenInput('');
    } catch (error: any) {
      console.error("Erro no resgate:", error);
      toast({ variant: 'destructive', title: 'Falha no Resgate', description: error.message });
    } finally {
      setIsRedeeming(false);
    }
  };

  const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex-1">
            <div className="container mx-auto max-lg py-6 px-4">
                
                <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16 border-2 border-primary shadow-sm">
                        <AvatarImage src={user?.photoURL || mainProfilePic?.imageUrl} />
                        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold">{displayName}</h1>
                            {isAdmin && <Badge className="bg-purple-600">Admin</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        {userProfile?.referralCode && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">ID: {userProfile.referralCode}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(userProfile.referralCode, 'Código')}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-md bg-gradient-to-br from-card to-muted/30">
                    <div className="p-6">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Saldo Total</p>
                        <div className="text-4xl font-black my-2">
                            {isBalanceLoading ? <Skeleton className="h-10 w-40" /> : `${balance.toFixed(2)} USDT`}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <Button variant="outline" className="rounded-xl h-12 font-bold" asChild>
                                <Link href="/withdraw"><ArrowUpFromLine className="mr-2 h-4 w-4" />Saque</Link>
                            </Button>
                            <Button className="rounded-xl h-12 font-bold shadow-lg" asChild>
                                <Link href="/deposit"><ArrowDownToLine className="mr-2 h-4 w-4" />Depósito</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                {isAdmin && (
                  <div className="mb-8">
                    <Button 
                      onClick={() => setIsAdminDialogOpen(true)} 
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-xl shadow-lg gap-3"
                    >
                      <Plus className="h-6 w-6" />
                      GERAR NOVO TOKEN
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                    <h3 className="text-[11px] font-black text-muted-foreground px-1 uppercase tracking-widest">Serviços</h3>
                    <ActionMenuItem onClick={() => setIsTokenDialogOpen(true)} icon={<Ticket className="h-5 w-5"/>} text="Resgatar Token" />
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Histórico de Transações" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indique e Ganhe" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Feedback" />
                    <MenuItem href="http://t.me/Suporte_dailyGainX" icon={<Send className="h-5 w-5"/>} text="Suporte Oficial Telegram" />
                </div>

                <div className="mt-10">
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive rounded-xl h-12" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Sair
                    </Button>
                </div>
            </div>
        </main>

        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Resgatar Token</DialogTitle>
              <DialogDescription>Digite o código DGX-XXXXXX para creditar seu saldo.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input placeholder="EX: DGX-H72K9L" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} disabled={isRedeeming} className="uppercase font-mono text-center text-xl h-14 rounded-xl" />
            </div>
            <DialogFooter>
              <Button onClick={handleRedeemToken} disabled={isRedeeming || !tokenInput.trim()} className="w-full h-12 rounded-xl">
                {isRedeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Resgate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-purple-600 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" /> Gerar Código
              </DialogTitle>
              <DialogDescription>Crie um token de saldo para enviar manualmente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Valor em USDT</Label>
                <Input type="number" value={adminTokenValue} onChange={(e) => setAdminTokenValue(e.target.value)} className="h-12 rounded-xl font-bold text-lg" placeholder="100.00" />
              </div>
              <Button onClick={handleAdminGenerateToken} disabled={isGenerating} className="w-full bg-purple-600 h-14 rounded-xl font-bold">
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <PlusCircle className="h-5 w-5 mr-2" />} 
                GERAR AGORA
              </Button>
              <div className="pt-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Últimos Tokens Gerados</Label>
                <ScrollArea className="h-[200px] mt-2 border rounded-xl p-2 bg-muted/20">
                  <div className="space-y-2">
                    {allTokens?.map(t => (
                      <div key={t.token} className="flex items-center justify-between p-3 bg-card rounded-lg border text-sm">
                        <div>
                          <p className="font-mono font-bold text-primary">{t.token}</p>
                          <p className="text-[10px] text-muted-foreground">{t.valor} USDT</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(t.token, 'Código')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Badge variant={t.usado ? "secondary" : "default"}>{t.usado ? "Usado" : "Disponível"}</Badge>
                        </div>
                      </div>
                    ))}
                    {(!allTokens || allTokens.length === 0) && (
                        <p className="text-center text-xs text-muted-foreground py-10">Nenhum token gerado ainda.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
