'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Gem, User, LogOut } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAppContext } from '@/context/AppContext';

const userProfileImage = PlaceHolderImages.find(p => p.id === 'user-profile');

export function Header() {
  const { balance } = useAppContext();
  const user = {
    name: 'Usuário Teste',
    email: 'usuario@gmail.com',
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">DailyGainX</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="text-right">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="font-bold text-lg">{balance.toFixed(2)} USDT</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {userProfileImage && <AvatarImage src={userProfileImage.imageUrl} alt={user.name} data-ai-hint={userProfileImage.imageHint} />}
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
