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
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // 0. DIAGNÓSTICO DE IP (Exibe no terminal do servidor o IP que a PixUp está vendo)
    try {
        const ipResponse = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const currentIp = await ipResponse.text();
        console.log('>>> [DIAGNÓSTICO] IP ATUAL DO SERVIDOR:', currentIp.trim());
    } catch (e) {
        console.warn('>>> [DIAGNÓSTICO] Não foi possível determinar o IP externo.');
    }

    // CREDENCIAIS (Atualizadas conforme solicitação do usuário)
    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 1. OBTENÇÃO DO TOKEN
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        console.log('>>> [AUTH] Solicitando token com novo Client ID...');
        
        let tokenResponse = await fetch(authUrl, {
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
            console.error('>>> [AUTH ERROR] Falha na autenticação (401):', tokenResponse.status, errorText);
            throw new Error(`Erro 401: Credenciais rejeitadas ou IP não autorizado pela PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            console.error('>>> [AUTH ERROR] Resposta sem access_token:', tokenData);
            throw new Error('Token de acesso não recebido.');
        }

        console.log('>>> [AUTH SUCCESS] Token recebido com sucesso.');

        // 2. PREPARAÇÃO DOS DADOS (Sanitização rigorosa)
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
        console.log('>>> [PIX] Solicitando geração de QR Code...');
        const qrResponse = await fetch(pixUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Espaço obrigatório após Bearer
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrResponse.ok) {
            const errorBody = await qrResponse.text();
            console.error('>>> [PIX ERROR] Falha na geração do QR Code:', qrResponse.status, errorBody);
            throw new Error(`Erro ${qrResponse.status}: A API recusou a geração. Verifique se o IP está na Whitelist.`);
        }

        const data = await qrResponse.json();
        console.log('>>> [PIX SUCCESS] QR Code gerado. ID Transação:', data.transactionId);

        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [CRITICAL ERROR]:', error.message);
        throw new Error(error.message || 'Erro ao processar Pix.');
    }
}