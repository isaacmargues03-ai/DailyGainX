'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const userProfileImage = PlaceHolderImages.find(p => p.id === 'instagram-profile-pic');

export function BottomNav() {
  const pathname = usePathname();
  const user = { name: 'Usuário Teste' };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="mx-auto flex h-14 items-center justify-center px-2">
        <Link href="/profile" className="flex h-full items-center justify-center p-2" aria-label="Perfil">
          <div className={cn('rounded-full p-0.5', pathname === '/profile' ? 'bg-foreground' : 'bg-transparent')}>
            {userProfileImage ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfileImage.imageUrl} data-ai-hint={userProfileImage.imageHint} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
                <User className={cn('h-8 w-8', pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground')} />
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}
