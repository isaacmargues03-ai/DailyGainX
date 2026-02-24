import { Header } from '@/components/header';
import { ImageCarousel } from '@/components/image-carousel';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const brLogo = PlaceHolderImages.find(p => p.id === 'br-logo');
const upsLogo = PlaceHolderImages.find(p => p.id === 'ups-logo');
const solarPowerLogo = PlaceHolderImages.find(p => p.id === 'solar-power-logo');


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
            <div className="mt-8 flex justify-around items-center gap-4 flex-wrap">
              {brLogo && (
                <Image
                  src={brLogo.imageUrl}
                  alt={brLogo.description}
                  width={200}
                  height={100}
                  className="h-auto w-auto max-h-20 object-contain"
                  data-ai-hint={brLogo.imageHint}
                />
              )}
              {upsLogo && (
                <Image
                  src={upsLogo.imageUrl}
                  alt={upsLogo.description}
                  width={200}
                  height={100}
                  className="h-auto w-auto max-h-20 object-contain"
                  data-ai-hint={upsLogo.imageHint}
                />
              )}
              {solarPowerLogo && (
                <Image
                  src={solarPowerLogo.imageUrl}
                  alt={solarPowerLogo.description}
                  width={200}
                  height={100}
                  className="h-auto w-auto max-h-20 object-contain"
                  data-ai-hint={solarPowerLogo.imageHint}
                />
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

    