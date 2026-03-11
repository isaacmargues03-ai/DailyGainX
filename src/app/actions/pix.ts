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
 * Gera um QR Code Pix utilizando chamadas REST diretas para a PixUp.
 * Implementação robusta com as novas credenciais hardcoded e diagnóstico de 401.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // CREDENCIAIS (Conforme fornecido pelo usuário)
    const clientId = 'Aducmartins_4621537998005562'.trim();
    // O usuário forneceu uma chave de 128 caracteres (provavelmente duplicada)
    const rawSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    // Diagnóstico de chave duplicada (SHA-256 tem 64 chars)
    let clientSecret = rawSecret;
    if (rawSecret.length === 128) {
        const firstHalf = rawSecret.substring(0, 64);
        const secondHalf = rawSecret.substring(64);
        if (firstHalf === secondHalf) {
            console.log('DIAGNÓSTICO: Chave duplicada detectada. Usando versão de 64 caracteres.');
            clientSecret = firstHalf;
        }
    }

    // Endpoints de Produção
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 1. Obter Token de Acesso (OAuth2)
        // Tentativa 1: Basic Auth (Padrão)
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        console.log('Solicitando token PixUp...');
        let tokenResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            cache: 'no-store'
        });

        // Tentativa 2: Se falhar com 401, tenta Body Auth
        if (tokenResponse.status === 401) {
            console.warn('Falha 401 com Basic Auth. Tentando autenticação via corpo...');
            const authBody = new URLSearchParams();
            authBody.append('grant_type', 'client_credentials');
            authBody.append('client_id', clientId);
            authBody.append('client_secret', clientSecret);

            tokenResponse = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: authBody.toString(),
                cache: 'no-store'
            });
        }

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('ERRO PIXUP AUTENTICAÇÃO:', errorText);
            throw new Error(`Erro de autorização (401). Verifique se a chave nova foi ativada corretamente no painel da PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            throw new Error('Token de acesso não recebido da PixUp.');
        }

        // 2. Preparação de Dados
        const amountAsNumber = Number(amount);
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');

        const body = {
             amount: amountAsNumber,
             external_id: String(externalId),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: payerEmail || "cliente@exemplo.com"
             }
        };

        // 3. Gerar QRCode
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
            const errorBody = await qrResponse.json().catch(() => ({ message: 'Erro na API de QRCode' }));
            console.error('ERRO PIXUP GERAÇÃO:', errorBody);
            throw new Error(errorBody.message || 'Erro ao gerar QRCode na PixUp.');
        }

        const data = await qrResponse.json();

        if (!data || !data.qrcode || !data.transactionId) {
            throw new Error('Resposta incompleta da API da PixUp.');
        }

        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('ERRO CRÍTICO NO PROCESSO PIX:', error.message);
        throw new Error(error.message || 'Erro ao processar Pix.');
    }
}
