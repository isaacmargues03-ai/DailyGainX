import { Header } from '@/components/header';
import { ProductCard } from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { products } from '@/lib/products';

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Nossos Produtos</h1>
          <p className="text-muted-foreground mb-6">Invista em produtos de empresas renomadas e acompanhe seus rendimentos.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => {
              const image = PlaceHolderImages.find((p) => p.id === product.id);
              if (!image) return null;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
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
