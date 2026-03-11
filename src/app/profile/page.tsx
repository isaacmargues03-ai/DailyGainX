'use client';

import { useState, useMemo } from 'react';
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
  Plus,
  Users,
  PlusCircle,
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

const ADMIN_EMAIL = 'isaacmargues03@gmail.com';
const ADMIN_UID = 'skTsvEKxywUKcBKPHzG9h7WkK7K2';

export default function ProfilePage() {
  const { balance, isBalanceLoading } = useAppContext();
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [adminTokenValue, setAdminTokenValue] = useState('100.00');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = useMemo(() => {
    if (isUserLoading || !user) return false;
    return user.email === ADMIN_EMAIL || user.uid === ADMIN_UID;
  }, [user, isUserLoading]);

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const accountDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'accounts', user.uid);
  }, [user, firestore]);

  const tokensQuery = useMemoFirebase(() => {
    if (!isAdmin || !firestore || isUserLoading) return null;
    return query(collection(firestore, 'tokens_resgate'), orderBy('dataCriacao', 'desc'), limit(20));
  }, [isAdmin, firestore, isUserLoading]);

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
    if (!tokenClean || !user || !firestore || !accountDocRef || isRedeeming) return;

    setIsRedeeming(true);

    try {
      const tokenRef = doc(firestore, 'tokens_resgate', tokenClean);
      
      await runTransaction(firestore, async (transaction) => {
        // --- 1. TODAS AS LEITURAS DEVEM OCORRER PRIMEIRO (REGRAS DO FIRESTORE) ---
        
        // Lê o Token
        const tDoc = await transaction.get(tokenRef);
        if (!tDoc.exists()) throw new Error('Código inválido ou inexistente.');
        const tokenData = tDoc.data();
        if (tokenData.usado) throw new Error('Este código já foi utilizado.');

        // Lê o Perfil do Usuário
        const userRef = doc(firestore, 'users', user.uid);
        const uDoc = await transaction.get(userRef);
        if (!uDoc.exists()) throw new Error('Perfil de usuário não encontrado.');
        const userData = uDoc.data();

        // Lê a Conta do Usuário
        const aDoc = await transaction.get(accountDocRef);
        if (!aDoc.exists()) throw new Error('Conta financeira não encontrada.');
        const currentBalance = aDoc.data().balance || 0;

        // Lê o Documento de Indicação (se for o primeiro depósito/resgate)
        let rDoc = null;
        if (!userData.hasMadeFirstDeposit && userData.referralId) {
            rDoc = await transaction.get(doc(firestore, 'referrals', userData.referralId));
        }

        // Lê o Documento de Transação vinculado
        let linkedHistoryTxRef = null;
        if (tokenData.transactionId && tokenData.transactionId !== "Manual-Site") {
            const txRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', tokenData.transactionId);
            const txSnap = await transaction.get(txRef);
            if (txSnap.exists()) {
                linkedHistoryTxRef = txRef;
            }
        }

        // --- 2. TODAS AS ESCRITAS APÓS AS LEITURAS ---
        
        // Atualiza saldo do usuário
        transaction.update(accountDocRef, { balance: currentBalance + tokenData.valor });

        // Marca token como usado
        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid
        });

        // Atualiza histórico se existir
        if (linkedHistoryTxRef) {
          transaction.update(linkedHistoryTxRef, {
            status: 'claimed',
            claimedAt: new Date().toISOString()
          });
        }

        // Processa bônus de indicação
        if (!userData.hasMadeFirstDeposit) {
            transaction.update(userRef, { hasMadeFirstDeposit: true });
            
            if (rDoc && rDoc.exists()) {
                const referralData = rDoc.data();
                const referrerId = referralData.referrerId;
                
                // Se o bônus ainda não foi pago (idempotência básica)
                if (referralData.status !== 'rewarded') {
                    transaction.update(rDoc.ref, { status: 'rewarded' });
                    
                    // Dá o bônus de 1 USDT para o padrinho (incremento seguro)
                    const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                    transaction.set(referrerAccountRef, { balance: increment(1) }, { merge: true });
                }
            }
        }
      });

      toast({ title: 'Sucesso!', description: 'Saldo creditado e bônus de indicação processado!' });
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

  if (isUserLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Carregando Perfil...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 text-foreground">
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
                  <div className="space-y-3 mb-8">
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
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Histórico de Saques" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indique e Ganhe" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Feedback" />
                    <MenuItem href="https://t.me/SuportedailygainX" icon={<Send className="h-5 w-5"/>} text="Suporte 1" />
                    <MenuItem href="http://t.me/Aduacm" icon={<Send className="h-5 w-5"/>} text="Suporte 2" />
                </div>

                <div className="mt-10">
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive rounded-xl h-12" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Sair
                    </Button>
                </div>
            </div>
        </main>

        <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
          <DialogContent className="rounded-2xl bg-background border-2">
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
          <DialogContent className="sm:max-w-md rounded-2xl bg-background border-2">
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
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
