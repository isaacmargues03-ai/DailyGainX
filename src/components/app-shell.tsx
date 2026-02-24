'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="pb-16">{children}</div>
            <BottomNav />
        </>
    );
}
