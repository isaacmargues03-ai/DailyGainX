import { Header } from '@/components/header';
import { ImageCarousel } from '@/components/image-carousel';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Nossos patrocinios</h1>
            </div>
            <ImageCarousel />
        </div>
      </main>
    </div>
  );
}
