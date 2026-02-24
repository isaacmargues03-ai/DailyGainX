import { Header } from '@/components/header';

export default function ConversasPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <h1 className="text-3xl font-bold">Conversas</h1>
        <p className="text-muted-foreground">Suas conversas aparecerão aqui.</p>
      </main>
    </div>
  );
}
