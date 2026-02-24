import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const products = [
  {
    id: 'nathan-morris',
    name: 'Nathan Morris',
    term: 180,
    prevProfit: '501',
    annualReturn: '1.015,92',
  },
  {
    id: 'luciana-costa',
    name: 'Luciana Costa',
    term: 7,
    prevProfit: '13,65',
    annualReturn: '711,75',
  },
  {
    id: 'isabella-silva',
    name: 'Isabella Silva',
    term: 15,
    prevProfit: '26,41',
    annualReturn: '642,64',
  },
  {
    id: 'alexander-greene',
    name: 'Alexander Greene',
    term: 3,
    prevProfit: '6,92',
    annualReturn: '841,93',
  },
];

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Produtos</h1>
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => {
              const image = PlaceHolderImages.find((p) => p.id === product.id);
              if (!image) return null;
              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  term={product.term}
                  prevProfit={product.prevProfit}
                  annualReturn={product.annualReturn}
                  imageUrl={image.imageUrl}
                  imageHint={image.imageHint}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
