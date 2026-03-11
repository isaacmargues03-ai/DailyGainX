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
 * Gera um código Pix Copia e Cola com tratamento rigoroso de dados.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // DIAGNÓSTICO DE IP
    try {
        const ipResponse = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const currentIp = await ipResponse.text();
        console.log('>>> [DIAGNOSTICO] IP DE SAÍDA:', currentIp.trim());
    } catch (e) {
        console.warn('>>> [DIAGNOSTICO] Falha ao determinar IP.');
    }

    // CREDENCIAIS HARDCODED PARA DIAGNÓSTICO
    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 1. AUTENTICAÇÃO
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
            console.error('>>> [AUTH ERROR] Detalhes:', tokenResponse.status, errorBody);
            throw new Error(`Erro 401: Verifique se o IP está na Whitelist da PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. SANITIZAÇÃO DE DADOS (ERRO 400 FIX)
        // Convertendo para centavos conforme solicitado
        const amountCents = Math.round(Number(amount) * 100);
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');
        
        const body = {
             amount: amountCents, // Enviando como centavos (Ex: 2500)
             external_id: String(externalId).substring(0, 50),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payerQuestion: "Depósito DailyGainX",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: (payerEmail || "suporte@dailygainx.com").trim()
             }
        };

        console.log('>>> [PIX REQUEST] Payload:', JSON.stringify(body));

        // 3. GERAÇÃO DO PIX
        const qrResponse = await fetch(pixUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Espaço garantido
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrResponse.ok) {
            const errorBody = await qrResponse.text();
            console.error('>>> [PIX ERROR 400] Resposta completa da API:', errorBody);
            
            let errorMessage = `Erro ${qrResponse.status} na API PixUp.`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {}

            throw new Error(errorMessage);
        }

        const data = await qrResponse.json();
        console.log('>>> [PIX SUCCESS] Código gerado com sucesso.');

        return {
            pixCopyPaste: data.qrcode || data.emv || "",
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [CRITICAL ERROR]:', error.message);
        throw new Error(error.message || 'Erro inesperado ao processar Pix.');
    }
}
