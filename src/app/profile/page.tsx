import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Plus, Grid3x3, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Header } from '@/components/header';

const mainProfilePic = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');
const ravennaPic = PlaceHolderImages.find(p => p.id === 'ravenna');
const alicePic = PlaceHolderImages.find(p => p.id === 'alice');
const mariPic = PlaceHolderImages.find(p => p.id === 'mari');
const thaylonPic = PlaceHolderImages.find(p => p.id === 'thaylon');
const storyF1 = PlaceHolderImages.find(p => p.id === 'story-f1');
const storyFlamengo = PlaceHolderImages.find(p => p.id === 'story-flamengo');

const suggestedUsers = [
  { name: 'Ravenna de Jes...', subtitle: 'Seguido(a) por ofc_silva.00', image: ravennaPic },
  { name: 'Alice', subtitle: 'Sugestões para você', image: alicePic },
  { name: 'mari', subtitle: 'Sugestões para você', image: mariPic },
  { name: 'Thaylon', subtitle: 'Sugestões para você', image: thaylonPic },
];

const stories = [
    { name: 'Novo', image: null },
    { name: 'Viagens', image: storyF1 },
    { name: 'Amigos', image: storyFlamengo },
]


export default function ProfilePage() {
  const user = {
    name: 'Usuário Teste',
    email: 'usuario@gmail.com',
    username: 'usuario_teste'
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 bg-background text-foreground">
            <div className="container mx-auto max-w-4xl py-8 px-4 md:px-16">
            <header className="flex items-center mb-10 gap-x-10 md:gap-x-20">
                <div className="relative flex-shrink-0">
                    <div className="relative">
                        {mainProfilePic && 
                            <Avatar className="w-24 h-24 md:w-36 md:h-36 border-2 border-border">
                                <AvatarImage src={mainProfilePic.imageUrl} data-ai-hint={mainProfilePic.imageHint}/>
                                <AvatarFallback className="text-5xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        }
                        <button className="absolute bottom-1 right-1 bg-primary rounded-full p-1 border-2 border-background">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-xl flex items-center gap-2">
                        {user.username}
                        <ChevronDown size={20} className="text-muted-foreground" />
                    </h1>
                </div>
                <div className="flex gap-6 md:gap-10 mb-4 text-sm md:text-base">
                    <p><span className="font-bold">0</span> posts</p>
                    <p><span className="font-bold">42</span> seguidores</p>
                    <p><span className="font-bold">142</span> seguindo</p>
                </div>
                <div className='text-sm'>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-muted-foreground">Adicionar bio...</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                </div>
            </header>

            <div className="md:hidden mb-8">
                <Card className="bg-card border-border p-3">
                    <p className="font-bold">Seu painel</p>
                    <p className="text-sm text-muted-foreground">129 visualizações nos últimos 30 dias.</p>
                </Card>
            </div>

            <div className="flex gap-2 mb-8">
                <Button variant="secondary" className="flex-1 h-8 text-sm">Editar perfil</Button>
                <Button variant="secondary" className="flex-1 h-8 text-sm">Compartilhar perfil</Button>
            </div>
            
            <div className="hidden md:block mb-8">
                <Card className="bg-card border-border p-3">
                    <p className="font-bold">Seu painel</p>
                    <p className="text-sm text-muted-foreground">129 visualizações nos últimos 30 dias.</p>
                </Card>
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-sm">Encontrar pessoas</h2>
                <Link href="#" className="text-sm text-primary font-semibold">Ver tudo</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {suggestedUsers.map((user, index) => (
                    <Card key={index} className="bg-card border-border p-4 flex flex-col items-center text-center relative">
                    <button className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
                        <X size={16} />
                    </button>
                    {user.image && 
                        <Avatar className="w-20 h-20 md:w-24 md:h-24 mb-4">
                        <AvatarImage src={user.image.imageUrl} data-ai-hint={user.image.imageHint} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    }
                    <p className="font-bold text-sm w-full truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground w-full truncate mb-3">{user.subtitle}</p>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-sm">Seguir</Button>
                    </Card>
                ))}
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8 mb-8">
                {stories.map((story, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                    <button className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                    {story.image ? (
                        <Image src={story.image.imageUrl} alt={story.name} width={72} height={72} className="rounded-full object-cover w-full h-full" data-ai-hint={story.image.imageHint}/>
                    ) : (
                        <Plus size={24} />
                    )}
                    </button>
                    <p className="text-xs text-center w-16 md:w-20 truncate">{story.name}</p>
                </div>
                ))}
            </div>

            <Separator className="bg-border my-4" />
            
            <div className='flex justify-center'>
                <button className='border-t border-foreground flex items-center gap-2 py-2 text-sm'>
                    <Grid3x3 size={12} />
                    POSTS
                </button>
            </div>
            </div>
        </main>
    </div>
  );
}
