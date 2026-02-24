import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Header } from '@/components/header';

const userProfileImage = PlaceHolderImages.find(p => p.id === 'user-profile');

export default function ProfilePage() {
  const user = {
    name: 'Usuário Teste',
    email: 'usuario@gmail.com',
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background">
            <div className="container mx-auto max-w-2xl py-12 px-4">
                <div className="mb-8">
                    <Button asChild variant="ghost">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar ao Painel
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            {userProfileImage && <AvatarImage src={userProfileImage.imageUrl} alt={user.name} data-ai-hint={userProfileImage.imageHint} />}
                            <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{user.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Nome Completo</span>
                                <p className="font-semibold">{user.name}</p>
                            </div>
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-muted-foreground">Endereço de E-mail</span>
                                <p className="font-semibold">{user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}
