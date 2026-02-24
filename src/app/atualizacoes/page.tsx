import { Header } from '@/components/header';

export default function AtualizacoesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <h1 className="text-3xl font-bold">Atualizações</h1>
        <p className="text-muted-foreground">As atualizações de status aparecerão aqui.</p>
      </main>
    </div>
  );
}
