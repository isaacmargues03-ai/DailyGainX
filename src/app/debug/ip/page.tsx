export const dynamic = 'force-dynamic';

export default async function DebugIpPage() {
    let ip = 'N/A';
    try {
        const response = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const text = await response.text();
        ip = text.trim();
    } catch (e) {
        ip = 'Erro ao buscar IP';
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white p-10 font-mono">
            <div className="text-center space-y-6">
                <h1 className="text-xl uppercase tracking-widest text-muted-foreground font-bold">Endereço de IP Externo (Servidor)</h1>
                <div className="text-4xl sm:text-6xl font-black bg-white text-black p-8 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                    {ip}
                </div>
                <div className="space-y-2">
                    <p className="text-sm opacity-70">Copie este IP e adicione na Whitelist da PixUp.</p>
                    <p className="text-[10px] uppercase tracking-tighter opacity-30">Ambiente de Produção DailyGainX</p>
                </div>
                <div className="pt-8">
                    <a href="/login" className="text-xs border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
                        Voltar para o Início
                    </a>
                </div>
            </div>
        </div>
    );
}
