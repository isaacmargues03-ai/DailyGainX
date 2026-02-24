'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, DollarSign, Home, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const userProfileImage = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');

export function BottomNav() {
  const pathname = usePathname();
  const user = { name: 'Usuário Teste' };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="mx-auto grid h-16 grid-cols-4 items-center justify-items-center px-2">
        <Link href="/" className="flex h-full items-center justify-center p-2" aria-label="Início">
            <Home className={cn('h-8 w-8', pathname === '/' ? 'text-primary' : 'text-muted-foreground')} />
        </Link>
        <Link href="/trade" className="flex h-full items-center justify-center p-2" aria-label="Mercado">
            <DollarSign className={cn('h-8 w-8', pathname === '/trade' ? 'text-primary' : 'text-muted-foreground')} />
        </Link>
        <Link href="/products" className="flex h-full items-center justify-center p-2" aria-label="Produtos">
            <Layers className={cn('h-8 w-8', pathname === '/products' ? 'text-primary' : 'text-muted-foreground')} />
        </Link>
        <Link href="/profile" className="flex h-full items-center justify-center p-2" aria-label="Perfil">
          <div className={cn('rounded-full p-0.5', pathname === '/profile' ? 'bg-primary' : 'bg-transparent')}>
            {userProfileImage ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfileImage.imageUrl} data-ai-hint={userProfileImage.imageHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
                <User className={cn('h-8 w-8', pathname === '/profile' ? 'text-primary' : 'text-muted-foreground')} />
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}
