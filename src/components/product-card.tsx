import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { User, Calendar, DollarSign } from 'lucide-react';

interface ProductCardProps {
  instructorName: string;
  companyName: string;
  period: number;
  minInvestment: number;
  profit: number;
  imageUrl: string;
  imageHint: string;
}

export function ProductCard({ instructorName, companyName, period, minInvestment, profit, imageUrl, imageHint }: ProductCardProps) {
  return (
    <Card className="w-full overflow-hidden shadow-lg rounded-xl">
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={companyName}
          fill
          className="object-cover"
          data-ai-hint={imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-bold text-white">{companyName}</h3>
          <p className="text-sm text-white/90 flex items-center gap-2 mt-1">
            <User className="h-4 w-4" />
            Instrutor: {instructorName}
          </p>
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                    <p className="text-muted-foreground">Período</p>
                    <p className="font-semibold">{period} dias</p>
                </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                    <p className="text-muted-foreground">Mínimo</p>
                    <p className="font-semibold">{minInvestment} USDT</p>
                </div>
            </div>
        </div>
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
             <p className="text-sm text-green-700">Retorno estimado em {period} dias</p>
             <p className="text-xl font-bold text-green-600">+{profit} USDT</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">Subscrever</Button>
      </CardFooter>
    </Card>
  );
}
