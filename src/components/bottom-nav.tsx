'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, History, Users, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/conversas', label: 'Conversas', icon: MessageSquare, notification: 8 },
    { href: '/atualizacoes', label: 'Atualizações', icon: History },
    { href: '/comunidades', label: 'Comunidades', icon: Users },
    { href: '/ligacoes', label: 'Ligações', icon: Phone },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/80 backdrop-blur-sm md:hidden">
      <div className="container mx-auto flex h-16 items-center justify-around px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary',
              pathname === item.href ? 'text-accent' : ''
            )}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {item.notification && (
                <span className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {item.notification}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
