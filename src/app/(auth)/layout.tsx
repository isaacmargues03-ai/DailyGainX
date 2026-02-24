import { Gem } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticação - DailyGainX',
  description: 'Login ou cadastre-se para acessar a plataforma.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-sm">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Gem className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">DailyGainX</h1>
            </div>
            {children}
        </div>
    </div>
  );
}
