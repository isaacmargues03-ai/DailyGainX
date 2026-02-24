import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  name: string;
  term: number;
  prevProfit: string;
  annualReturn: string;
  imageUrl: string;
  imageHint: string;
}

export function ProductCard({ name, term, prevProfit, annualReturn, imageUrl, imageHint }: ProductCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={imageUrl} alt={name} data-ai-hint={imageHint} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{name}</p>
                <p className="text-sm text-muted-foreground">Prazo {term} dias</p>
              </div>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 shrink-0">Subscrever</Button>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xl font-bold text-green-500">+{prevProfit}%</p>
              <p className="text-xs text-muted-foreground">Taxa de lucro anterior</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">+{annualReturn}%</p>
              <p className="text-xs text-muted-foreground">Taxa de retorno anual</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
