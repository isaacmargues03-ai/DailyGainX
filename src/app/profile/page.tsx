import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LogOut } from 'lucide-react';

const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');

export default function ProfilePage() {
  const user = {
    name: 'Usuário Teste',
    email: 'usuario@gmail.com',
    username: 'usuario_teste'
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-background text-foreground">
            <div className="container mx-auto max-w-md py-8 px-4 text-center">
                <header className="flex flex-col items-center text-center gap-y-6 mb-8">
                    <div className="relative">
                        {mainProfilePic && 
                            <Avatar className="w-36 h-36 border-4 border-primary/50 shadow-lg">
                                <AvatarImage src={mainProfilePic.imageUrl} data-ai-hint={mainProfilePic.imageHint}/>
                                <AvatarFallback className="text-6xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        }
                    </div>
                    <div className="flex flex-col items-center gap-y-1">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <p className="text-lg text-muted-foreground">@{user.username}</p>
                        <p className="text-md text-muted-foreground mt-1">{user.email}</p>
                    </div>
                </header>
                
                <Button variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </Button>
            </div>
        </main>
    </div>
  );
}
