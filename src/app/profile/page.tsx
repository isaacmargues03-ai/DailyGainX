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
  WalletCards,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, runTransaction, setDoc, serverTimestamp, collection, query, orderBy, limit, increment, getDoc, getDocs, where, updateDoc, collectionGroup } from 'firebase/firestore';
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
import { Transaction } from '@/lib/types';

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
  const [isWithdrawAdminOpen, setIsWithdrawAdminOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [adminTokenValue, setAdminTokenValue] = useState('100.00');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingWithdrawId, setProcessingWithdrawId] = useState<string | null>(null);

  // Verificação de administrador consistente
  const isAdmin = !isUserLoading && user && (user.email === ADMIN_EMAIL || user.uid === ADMIN_UID);

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<{referralCode: string, referralId?: string, hasMadeFirstDeposit?: boolean}>(userDocRef);

  const accountDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'accounts', user.uid);
  }, [user, firestore]);

  const tokensQuery = useMemoFirebase(() => {
    // Só cria a query se for Admin, evitando erros de permissão durante o carregamento
    if (!isAdmin || !firestore) return null;
    return query(collection(firestore, 'tokens_resgate'), orderBy('dataCriacao', 'desc'), limit(20));
  }, [isAdmin, firestore]);

  const { data: allTokens } = useCollection<{token: string, valor: number, usado: boolean, transactionId?: string}>(tokensQuery);

  const withdrawsQuery = useMemoFirebase(() => {
    // Só cria a query se for Admin, evitando erros de permissão durante o carregamento
    if (!isAdmin || !firestore) return null;
    return query(
        collectionGroup(firestore, 'depositTransactions'), 
        where('type', '==', 'withdrawal'),
        orderBy('depositDate', 'desc'),
        limit(50)
    );
  }, [isAdmin, firestore]);

  const { data: adminWithdraws } = useCollection<Transaction>(withdrawsQuery);

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

  const updateWithdrawStatus = async (tx: Transaction, newStatus: 'PAGO' | 'RECUSADO') => {
    if (!firestore || !tx.userId) return;
    setProcessingWithdrawId(tx.id);
    try {
        const txRef = doc(firestore, 'users', tx.userId, 'accounts', tx.userId, 'depositTransactions', tx.id);
        await updateDoc(txRef, { status: newStatus });
        toast({ title: `Saque ${newStatus}`, description: `O status da transação foi atualizado para ${newStatus}.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
        setProcessingWithdrawId(null);
    }
  };

  const handleRedeemToken = async () => {
    const tokenClean = tokenInput.trim().toUpperCase();
    if (!tokenClean || !user || !firestore || !accountDocRef || isRedeeming) return;

    setIsRedeeming(true);

    try {
      let linkedHistoryTxRef = null;
      const tokenRef = doc(firestore, 'tokens_resgate', tokenClean);
      const tokenSnap = await getDoc(tokenRef);

      if (tokenSnap.exists()) {
        const tData = tokenSnap.data();
        if (tData.transactionId && tData.transactionId !== "Manual-Site") {
          const directRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', tData.transactionId);
          const directSnap = await getDoc(directRef);
          
          if (directSnap.exists()) {
            linkedHistoryTxRef = directRef;
          } else {
            const q = query(
              collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions'),
              where('externalId', '==', tData.transactionId),
              limit(1)
            );
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              linkedHistoryTxRef = qSnap.docs[0].ref;
            }
          }
        }
      }

      await runTransaction(firestore, async (transaction) => {
        const tokenRef = doc(firestore, 'tokens_resgate', tokenClean);
        const userRef = doc(firestore, 'users', user.uid);
        const accountRef = accountDocRef;

        const [tokenDoc, userDoc, accountDoc] = await Promise.all([
          transaction.get(tokenRef),
          transaction.get(userRef),
          transaction.get(accountRef)
        ]);

        if (!tokenDoc.exists()) throw new Error('Código inválido ou inexistente.');
        
        const tokenData = tokenDoc.data();
        if (tokenData.usado) throw new Error('Este código já foi utilizado.');

        const userData = userDoc.data();

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

        transaction.update(tokenRef, {
          usado: true,
          usedAt: new Date().toISOString(),
          usedBy: user.uid
        });

        if (linkedHistoryTxRef) {
          transaction.update(linkedHistoryTxRef, {
            status: 'claimed',
            claimedAt: new Date().toISOString()
          });
        }

        if (userData && !userData.hasMadeFirstDeposit) {
            transaction.update(userRef, { hasMadeFirstDeposit: true });
            
            if (userData.referralId) {
                const referralRef = doc(firestore, 'referrals', userData.referralId);
                const referralDoc = await transaction.get(referralRef);
                if (referralDoc.exists()) {
                    const referrerId = referralDoc.data().referrerId;
                    transaction.update(referralRef, { status: 'rewarded' });
                    const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                    transaction.update(referrerAccountRef, { balance: increment(1) });
                }
            }
        }
      });

      toast({ title: 'Sucesso!', description: 'Saldo creditado!' });
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

  if (isUserLoading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Carregando Perfil...</p>
        </div>
    );
  }

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
                    <Button 
                      onClick={() => setIsWithdrawAdminOpen(true)} 
                      variant="outline"
                      className="w-full h-14 border-purple-600 text-purple-600 font-black text-lg rounded-xl gap-3"
                    >
                      <WalletCards className="h-6 w-6" />
                      GERENCIAR SAQUES
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
                    <MenuItem href="http://t.me/Suporte_dailyGainX" icon={<Send className="h-5 w-5"/>} text="Suporte Oficial Telegram" />
                </div>

                <div className="mt-10">
                    <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive rounded-xl h-12" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />Sair
                    </Button>
                </div>
            </div>
        </main>

        {/* DIALOG RESGATAR TOKEN */}
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

        {/* DIALOG ADMIN GERAR TOKEN */}
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
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG ADMIN GERENCIAR SAQUES */}
        <Dialog open={isWithdrawAdminOpen} onOpenChange={setIsWithdrawAdminOpen}>
          <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-purple-600 text-white">
              <DialogTitle className="text-2xl font-black flex items-center gap-2 uppercase tracking-tighter">
                <WalletCards className="h-7 w-7" /> Solicitações de Saque
              </DialogTitle>
              <DialogDescription className="text-white/80">Conferir e processar os pedidos de retirada dos usuários.</DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {adminWithdraws?.map((tx) => (
                    <Card key={tx.id} className="p-4 space-y-3 border-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">{tx.fullName || 'Usuário Desconhecido'}</p>
                          <p className="text-[10px] text-muted-foreground font-bold">{tx.timestamp}</p>
                        </div>
                        <Badge variant={tx.status === 'PAGO' ? 'default' : tx.status === 'RECUSADO' ? 'destructive' : 'outline'}>
                          {tx.status || 'PENDENTE'}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded text-[11px] space-y-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-muted-foreground uppercase">Chave Pix:</span>
                            <span className="font-black">{tx.pixKey}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-muted-foreground uppercase">Valor:</span>
                            <span className="font-black text-red-600">{tx.amount.toFixed(2)} USDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-muted-foreground uppercase">Código WD:</span>
                            <span className="font-black flex items-center gap-1">
                                {tx.withdrawCode || tx.id}
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(tx.withdrawCode || tx.id, 'Código')}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </span>
                        </div>
                      </div>

                      {(!tx.status || (tx.status !== 'PAGO' && tx.status !== 'RECUSADO')) && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-50 h-10 font-bold uppercase text-xs gap-2"
                            onClick={() => updateWithdrawStatus(tx, 'RECUSADO')}
                            disabled={processingWithdrawId === tx.id}
                          >
                            <XCircle className="h-4 w-4" /> Recusar
                          </Button>
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white h-10 font-bold uppercase text-xs gap-2"
                            onClick={() => updateWithdrawStatus(tx, 'PAGO')}
                            disabled={processingWithdrawId === tx.id}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Pago
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                  {(!adminWithdraws || adminWithdraws.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                        <WalletCards className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">Nenhuma solicitação encontrada</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}