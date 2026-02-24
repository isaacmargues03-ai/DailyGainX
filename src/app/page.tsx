import { Header } from '@/components/header';
import { ImageCarousel } from '@/components/image-carousel';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const petrobrasLogoImage = PlaceHolderImages.find(p => p.id === 'petrobras-logo');


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
            {petrobrasLogoImage && (
              <div className="mt-8 flex justify-center">
                <Image
                  src={petrobrasLogoImage.imageUrl}
                  alt={petrobrasLogoImage.description}
                  width={347}
                  height={54}
                  className="h-auto w-auto"
                  data-ai-hint={petrobrasLogoImage.imageHint}
                />
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
