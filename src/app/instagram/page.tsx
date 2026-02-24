import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  ChevronDown,
  Home,
  Search,
  Video,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
  X,
  Plus,
  Grid3x3,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { InstagramLogo } from '@/components/instagram-logo';


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
    { name: 'MEU F1', image: storyF1 },
    { name: 'MEU TIME Fla...', image: storyFlamengo },
]


export default function InstagramProfilePage() {
  return (
    <div className="bg-[#121212] text-white min-h-screen flex">
      <aside className="fixed top-0 left-0 h-full w-[72px] flex flex-col items-center py-5 border-r border-neutral-800">
        <div className='px-3 mb-5'>
          <Link href="/instagram" className='block'>
            <InstagramLogo className="h-8 w-8" />
          </Link>
        </div>
        <nav className="flex flex-col justify-between h-full w-full px-3">
            <div className='flex flex-col gap-2'>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <Home className="h-6 w-6" />
              </Link>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <Search className="h-6 w-6" />
              </Link>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <Video className="h-6 w-6" />
              </Link>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <MessageCircle className="h-6 w-6" />
              </Link>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <Heart className="h-6 w-6" />
              </Link>
              <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800">
                <PlusSquare className="h-6 w-6" />
              </Link>
            </div>
            <div className='flex flex-col gap-4'>
                <Link href="/instagram" className="self-center">
                    {mainProfilePic && 
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={mainProfilePic.imageUrl} data-ai-hint={mainProfilePic.imageHint} />
                        <AvatarFallback>M</AvatarFallback>
                        </Avatar>
                    }
                </Link>
                <Link href="#" className="p-3 rounded-lg hover:bg-neutral-800 self-center">
                    <Menu className="h-6 w-6" />
                </Link>
            </div>
        </nav>
      </aside>

      <main className="ml-[72px] flex-1">
        <div className="max-w-4xl mx-auto py-8 px-4 md:px-16">
          <header className="flex items-center mb-10 gap-x-10 md:gap-x-20">
            <div className="relative flex-shrink-0">
                <div className="relative">
                    {mainProfilePic && 
                        <Avatar className="w-24 h-24 md:w-36 md:h-36 border-2 border-neutral-700">
                            <AvatarImage src={mainProfilePic.imageUrl} data-ai-hint={mainProfilePic.imageHint}/>
                            <AvatarFallback className="text-5xl">M</AvatarFallback>
                        </Avatar>
                    }
                    <div className="absolute -top-2 -right-12 bg-[#222] border border-neutral-700 rounded-2xl text-xs px-2 py-1 shadow-lg hidden md:block">
                        Pergunte algo aos amigos.
                    </div>
                    <button className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 border-2 border-[#121212]">
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-xl flex items-center gap-2">
                    marquezin_zin
                    <ChevronDown size={20} className="text-neutral-400" />
                </h1>
              </div>
              <div className="flex gap-6 md:gap-10 mb-4 text-sm md:text-base">
                <p><span className="font-bold">0</span> posts</p>
                <p><span className="font-bold">42</span> seguidores</p>
                <p><span className="font-bold">142</span> seguindo</p>
              </div>
              <div className='text-sm'>
                <p className="font-bold">marques</p>
                <p className="text-neutral-400">@FLAMENGO - Adicionar interesses</p>
                <p className="text-sm text-neutral-400">@marquezin_zin</p>
              </div>
            </div>
          </header>

          <div className="md:hidden mb-8">
              <Card className="bg-[#1e1e1e] border-neutral-800 p-3">
                <p className="font-bold">Seu painel</p>
                <p className="text-sm text-neutral-400">129 visualizações nos últimos 30 dias.</p>
              </Card>
          </div>

          <div className="flex gap-2 mb-8">
            <Button variant="secondary" className="bg-[#333] hover:bg-[#444] text-white flex-1 h-8 text-sm">Editar perfil</Button>
            <Button variant="secondary" className="bg-[#333] hover:bg-[#444] text-white flex-1 h-8 text-sm">Compartilhar perfil</Button>
          </div>
          
          <div className="hidden md:block mb-8">
              <Card className="bg-[#1e1e1e] border-neutral-800 p-3">
                <p className="font-bold">Seu painel</p>
                <p className="text-sm text-neutral-400">129 visualizações nos últimos 30 dias.</p>
              </Card>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-sm">Encontrar pessoas</h2>
              <Link href="#" className="text-sm text-blue-400 font-semibold">Ver tudo</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {suggestedUsers.map((user, index) => (
                <Card key={index} className="bg-[#1e1e1e] border-neutral-800 p-4 flex flex-col items-center text-center relative">
                  <button className="absolute top-2 right-2 text-neutral-500 hover:text-white">
                    <X size={16} />
                  </button>
                  {user.image && 
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 mb-4">
                      <AvatarImage src={user.image.imageUrl} data-ai-hint={user.image.imageHint} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  }
                  <p className="font-bold text-sm w-full truncate">{user.name}</p>
                  <p className="text-xs text-neutral-400 w-full truncate mb-3">{user.subtitle}</p>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm">Seguir</Button>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8 mb-8">
            {stories.map((story, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#333] flex items-center justify-center border-2 border-neutral-700">
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

          <Separator className="bg-neutral-800 my-4" />
          
          <div className='flex justify-center'>
            <button className='border-t border-white flex items-center gap-2 py-2 text-sm'>
                <Grid3x3 size={12} />
                POSTS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
