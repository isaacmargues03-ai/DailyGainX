'use server';

interface QrCodeResponse {
    pixCopyPaste: string;
    transactionId: string;
}

interface GeneratePixOptions {
    amount: number;
    payerName?: string;
    payerEmail?: string;
    payerDocument?: string; 
    externalId: string; 
    postbackUrl?: string; 
}

/**
 * Gera um código Pix Copia e Cola com tratamento rigoroso de dados e telemetria total.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // 1. DIAGNÓSTICO DE IP (Saber por qual IP o servidor está saindo)
    try {
        const ipResponse = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const currentIp = await ipResponse.text();
        console.log('>>> [DIAGNOSTICO] IP DE SAÍDA ATUAL:', currentIp.trim());
    } catch (e) {
        console.warn('>>> [DIAGNOSTICO] Falha ao determinar IP de saída.');
    }

    // 2. CREDENCIAIS ATUALIZADAS (Conforme painel do usuário)
    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 3. AUTENTICAÇÃO OAUTH2
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const tokenResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            cache: 'no-store'
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.log('ERRO DETALHADO DA PIXUP (AUTH):', errorBody);
            throw new Error(`Erro de Autenticação (401). Verifique se o IP está na Whitelist.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log('>>> [PIXUP AUTH] Token obtido com sucesso.');

        // 4. SANITIZAÇÃO DE DADOS PARA EVITAR ERRO 400
        // Algumas APIs da PixUp pedem centavos (Inteiro), outras pedem Decimal. 
        // Testando centavos conforme solicitado.
        const amountCents = Math.round(Number(amount) * 100);
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');
        
        const body = {
             amount: amountCents, // Valor em centavos (Ex: 2500 para R$ 25,00)
             external_id: String(externalId).substring(0, 50),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payerQuestion: "Depósito DailyGainX",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: (payerEmail || "suporte@dailygainx.com").trim()
             }
        };

        console.log('>>> [PIX REQUEST] Enviando Payload:', JSON.stringify(body));

        // 5. GERAÇÃO DO PIX COPIA E COLA
        const qrResponse = await fetch(pixUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrResponse.ok) {
            const errorBody = await qrResponse.text();
            // LOG SOLICITADO PELO USUÁRIO PARA DIAGNÓSTICO
            console.log('ERRO DETALHADO DA PIXUP:', errorBody);
            
            let errorMessage = `Erro ${qrResponse.status} na API PixUp.`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {}

            throw new Error(errorMessage);
        }

        const data = await qrResponse.json();
        console.log('>>> [PIX SUCCESS] Transação criada:', data.transactionId);

        return {
            // O código Copia e Cola costuma vir no campo 'qrcode' ou 'emv'
            pixCopyPaste: data.qrcode || data.emv || "",
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [CRITICAL ERROR]:', error.message);
        throw new Error(error.message || 'Erro inesperado ao processar Pix.');
    }
}
