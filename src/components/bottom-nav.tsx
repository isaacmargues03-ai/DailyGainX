'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CandlestickChart, Zap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Painel', icon: LayoutDashboard },
    { href: '/investir', label: 'Investir', icon: CandlestickChart },
    { href: '/minhas-maquinas', label: 'Máquinas', icon: Zap },
    { href: '/profile', label: 'Perfil', icon: User },
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
              pathname === item.href ? 'text-primary' : ''
            )}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
