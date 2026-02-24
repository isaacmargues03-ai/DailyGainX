'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    const isAuthPage = pathname === '/login' || pathname === '/register';

    useEffect(() => {
        // Wait until the auth state is resolved
        if (isUserLoading) {
            return;
        }

        // If the user is not logged in and not on an auth page, redirect to login
        if (!user && !isAuthPage) {
            router.push('/login');
        }

        // If the user is logged in and tries to access an auth page, redirect to profile
        if (user && isAuthPage) {
            router.push('/profile');
        }

    }, [user, isUserLoading, isAuthPage, router]);


    if (isUserLoading && !isAuthPage) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p>Carregando aplicativo...</p>
            </div>
        );
    }
    
    if (isAuthPage) {
        return <>{children}</>;
    }
    
    // Only render the shell for authenticated users on non-auth pages
    if (!isUserLoading && user) {
        return (
            <>
                <div className="pb-16">{children}</div>
                <BottomNav />
            </>
        );
    }

    // While redirecting or if in a state that shouldn't render, return null or a loader
    return null;
}

    