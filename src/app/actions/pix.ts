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
 * Gera um código Pix Copia e Cola com telemetria avançada para suporte técnico.
 * Agora ajustado para enviar o valor em centavos conforme solicitado.
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

    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 2. AUTENTICAÇÃO OAUTH2
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
            console.error('>>> [PIXUP AUTH ERROR]:', errorBody);
            throw new Error(`Erro de Autenticação (401). Verifique o IP Whitelist.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 3. PREPARAÇÃO DO PAYLOAD (Sanitização rigorosa)
        // Convertendo para centavos conforme solicitado.
        const amountCents = Math.round(Number(amount) * 100);
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');
        
        const body = {
             amount: amountCents, 
             external_id: String(externalId).substring(0, 50),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payerQuestion: "Deposito DailyGainX",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: (payerEmail || "suporte@dailygainx.com").trim()
             }
        };

        console.log('>>> [PIX REQUEST PAYLOAD]:', JSON.stringify(body, null, 2));

        // 4. CHAMADA DA API DE QRCODE
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
            let errorJson = {};
            try {
                errorJson = JSON.parse(errorBody);
            } catch (e) {}

            // LOG CRÍTICO PARA O SUPORTE: Exibe exatamente o erro retornado pela PixUp
            console.error('ERRO DETALHADO DA PIXUP:', JSON.stringify(errorJson, null, 2));
            
            let errorMessage = `Erro ${qrResponse.status} na API PixUp.`;
            if ((errorJson as any).message) errorMessage = (errorJson as any).message;

            throw new Error(errorMessage);
        }

        const data = await qrResponse.json();
        console.log('>>> [PIX SUCCESS]:', data.transactionId);

        return {
            pixCopyPaste: data.qrcode || data.emv || "",
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [ACTION ERROR]:', error.message);
        throw new Error(error.message || 'Erro ao processar Pix.');
    }
}