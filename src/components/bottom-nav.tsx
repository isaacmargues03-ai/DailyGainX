'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const userProfileImage = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');

export function BottomNav() {
  const pathname = usePathname();
  const user = { name: 'Usuário Teste' };

  const navItems = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/search', icon: Search, label: 'Pesquisar' },
    { href: '/add', icon: PlusSquare, label: 'Adicionar' },
    { href: '/reels', icon: Clapperboard, label: 'Reels' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="mx-auto flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex h-full w-1/5 items-center justify-center" aria-label={item.label}>
              <item.icon
                className={cn('h-7 w-7', isActive ? 'text-foreground' : 'text-muted-foreground')}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive && item.icon === Home ? 'currentColor' : 'none'}
              />
            </Link>
          );
        })}
        <Link href="/profile" className="flex h-full w-1/5 items-center justify-center" aria-label="Perfil">
          <div className={cn('rounded-full p-0.5', pathname === '/profile' ? 'bg-foreground' : 'bg-transparent')}>
            {userProfileImage && (
              <Avatar className="h-7 w-7">
                <AvatarImage src={userProfileImage.imageUrl} data-ai-hint={userProfileImage.imageHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}
