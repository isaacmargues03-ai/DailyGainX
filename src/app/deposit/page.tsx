'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

/**
 * Página de Depósito simplificada para fluxo manual.
 * Conforme solicitado, removi o input de valor e o botão de geração automática.
 * Agora foca nas instruções de suporte e links diretos para atendimento.
 */
export default function DepositPage() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="flex items-center justify-between p-4 border-b">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-lg font-bold uppercase tracking-widest text-center flex-1 pr-9">DEPÓSITO</h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
                <div className="w-full max-w-md space-y-12">
                    {/* Seção de Instruções: Transformada em fluxo principal */}
                    <div className="space-y-8">
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Manual de Procedimento</p>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Instruções de Saque</h2>
                        </div>
                        
                        <div className="bg-muted/30 p-8 rounded-[2rem] border-2 border-dashed border-primary/20">
                            <ul className="space-y-6 text-sm font-bold uppercase tracking-tight">
                                <li className="flex items-center gap-5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] text-white shrink-0 shadow-lg">1</span>
                                    Chama um dos suportes
                                </li>
                                <li className="flex items-center gap-5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] text-white shrink-0 shadow-lg">2</span>
                                    Recarregar por lá
                                </li>
                                <li className="flex items-center gap-5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] text-white shrink-0 shadow-lg">3</span>
                                    Resgatar token
                                </li>
                                <li className="flex items-center gap-5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] text-white shrink-0 shadow-lg">4</span>
                                    Compra a máquina
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Botões de Suporte em Destaque */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            asChild 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-16 rounded-2xl shadow-xl gap-2 text-xs uppercase"
                        >
                            <Link href="https://t.me/SuportedailygainX" target="_blank">
                                <Send className="h-4 w-4" />
                                SUPORTE 1
                            </Link>
                        </Button>
                        <Button 
                            asChild 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-16 rounded-2xl shadow-xl gap-2 text-xs uppercase"
                        >
                            <Link href="http://t.me/Aduacm" target="_blank">
                                <Send className="h-4 w-4" />
                                SUPORTE 2
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
