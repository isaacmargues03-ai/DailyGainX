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
  History,
  MessageSquare,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';


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
  const user = {
    name: 'Usuário Teste',
    username: 'usuario_teste'
  };

  const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex-1">
            <div className="container mx-auto max-w-lg py-6 px-4">
                
                {/* User Info Header */}
                <div className="flex items-center gap-4 mb-6">
                    {mainProfilePic && 
                        <Avatar className="w-16 h-16 border-2 border-primary">
                            <AvatarImage src={mainProfilePic.imageUrl} data-ai-hint={mainProfilePic.imageHint}/>
                            <AvatarFallback className="text-2xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    }
                    <div>
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
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
                            <Button variant="outline" size="lg">
                                <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                Retirada
                            </Button>
                            <Button size="lg">
                                <ArrowDownToLine className="mr-2 h-4 w-4" />
                                Depósito
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Menu List */}
                <div className="space-y-3">
                    <MenuItem href="/investments" icon={<Briefcase className="h-5 w-5"/>} text="Meus Investimentos" />
                    <MenuItem href="#" icon={<History className="h-5 w-5"/>} text="Histórico" />
                    <MenuItem href="/feedback" icon={<MessageSquare className="h-5 w-5"/>} text="Feedback" />
                    <MenuItem href="#" icon={<Send className="h-5 w-5"/>} text="Comunidade do Telegram" />
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
