'use server';

import QRCode from 'qrcode';

interface QrCodeResponse {
    qrCodeImageUrl: string;
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
 * Gera um QR Code Pix com telemetria avançada para diagnóstico de erros 401 e IP.
 * Utiliza credenciais verificadas via painel PixUp.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // 0. DIAGNÓSTICO DE IP (Confirme se este IP está na Whitelist da PixUp)
    try {
        const ipResponse = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const currentIp = await ipResponse.text();
        console.log('>>> [IP CHECK] IP ATUAL DO SERVIDOR:', currentIp.trim());
        console.log('>>> [IP CHECK] IP NA WHITELIST (PAINEL): 34.30.115.137');
    } catch (e) {
        console.warn('>>> [IP CHECK] Falha ao determinar IP externo.');
    }

    // CREDENCIAIS VERIFICADAS (Extraídas do seu painel)
    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 1. OBTENÇÃO DO TOKEN (OAuth2 Client Credentials)
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
            const errorText = await tokenResponse.text();
            console.error('>>> [AUTH ERROR] 401 Unauthorized:', tokenResponse.status, errorText);
            throw new Error(`Erro 401: Credenciais ou IP rejeitados pela PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            throw new Error('Token de acesso não recebido.');
        }

        // 2. PREPARAÇÃO DOS DADOS (Sanitização)
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');
        const body = {
             amount: Number(amount),
             external_id: String(externalId),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: payerEmail || "cliente@exemplo.com"
             }
        };

        // 3. GERAÇÃO DO QRCODE
        const qrResponse = await fetch(pixUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // O espaço após Bearer é obrigatório
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrResponse.ok) {
            const errorBody = await qrResponse.text();
            console.error('>>> [PIX ERROR] Falha na geração:', qrResponse.status, errorBody);
            throw new Error(`Erro ${qrResponse.status}: A API recusou a geração. Verifique o IP na Whitelist.`);
        }

        const data = await qrResponse.json();
        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [CRITICAL]:', error.message);
        throw new Error(error.message || 'Erro ao processar Pix.');
    }
}