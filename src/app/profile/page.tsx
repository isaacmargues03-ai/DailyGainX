'use client'; // Needs to be a client component to use hooks

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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


// Helper component for menu items
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

export default function ProfilePage() {
  const { balance } = useAppContext();
  const { auth, user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

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

  const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const fallback = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex-1">
            <div className="container mx-auto max-w-lg py-6 px-4">
                
                {/* User Info Header */}
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

                {/* Balance and Actions Card */}
                <Card className="mb-8 shadow-sm">
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">{balance.toFixed(2)} USDT</p>
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

                {/* Menu List */}
                <div className="space-y-3">
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="/history" icon={<History className="h-5 w-5"/>} text="Histórico" />
                    <MenuItem href="/referrals" icon={<Gift className="h-5 w-5"/>} text="Indicações" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Feedback" />
                    <MenuItem href="#" icon={<Send className="h-5 w-5"/>} text="Comunidade do Telegram" />
                </div>

                <div className="mt-8">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair da conta
                    </Button>
                </div>
                
                {/* Footer */}
                <footer className="mt-12 text-center text-xs text-muted-foreground/80">
                    <p>EMPRESA DESDE 2016</p>
                    <p>Na Tailândia</p>
                </footer>
            </div>
        </main>
    </div>
  );
}
