'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const factoryImages = PlaceHolderImages.filter(p => p.imageHint.includes('factory'));

export function ImageCarousel() {
  if (factoryImages.length === 0) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full max-w-xl mx-auto"
    >
      <CarouselContent>
        {factoryImages.map((image) => (
          <CarouselItem key={image.id}>
            <div className="p-1">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                  />
                </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}
