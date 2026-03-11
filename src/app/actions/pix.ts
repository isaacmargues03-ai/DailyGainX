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
 * Gera um QR Code Pix com tratamento rigoroso de dados para evitar Erro 400.
 * Utiliza credenciais verificadas e sanitização de campos obrigatórios.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument, payerEmail } = options;

    // 0. DIAGNÓSTICO DE IP (Logado no servidor para conferência com a Whitelist)
    try {
        const ipResponse = await fetch('https://ifconfig.me/ip', { cache: 'no-store' });
        const currentIp = await ipResponse.text();
        console.log('>>> [DIAGNOSTICO] IP DE SAÍDA DO SERVIDOR:', currentIp.trim());
    } catch (e) {
        console.warn('>>> [DIAGNOSTICO] Falha ao determinar IP externo.');
    }

    // CREDENCIAIS DE PRODUÇÃO (Hardcoded para garantir persistência após reinicialização)
    const clientId = 'Aducmartins_8700269788095411'.trim();
    const clientSecret = '6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd'.trim();
    
    const authUrl = "https://api.pixupbr.com/v2/oauth/token";
    const pixUrl = "https://api.pixupbr.com/v2/pix/qrcode";

    try {
        // 1. OBTENÇÃO DO TOKEN (OAuth2 Client Credentials)
        console.log('>>> [AUTH] Iniciando autenticação OAuth2...');
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
            console.error('>>> [AUTH ERROR] Detalhes do erro 401:', tokenResponse.status, errorBody);
            throw new Error(`Erro de Autenticação (401): Verifique se o IP ${clientId} está na Whitelist.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            throw new Error('Token de acesso não recebido.');
        }
        console.log('>>> [AUTH] Token obtido com sucesso.');

        // 2. SANITIZAÇÃO RIGOROSA DOS DADOS (Padrão PixUp)
        // O valor deve ser float (ex: 25.0), o CPF apenas números
        const amountFloat = parseFloat(Number(amount).toFixed(2));
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');
        
        const body = {
             amount: amountFloat,
             external_id: String(externalId).substring(0, 50), // Garante limite de caracteres
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned,
                email: (payerEmail || "suporte@dailygainx.com").trim()
             }
        };

        console.log('>>> [PIX REQUEST] Enviando dados sanitizados:', JSON.stringify(body));

        // 3. GERAÇÃO DO QRCODE
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
            let errorMessage = `Erro ${qrResponse.status} na API PixUp.`;
            
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
                console.error('>>> [PIX ERROR 400] JSON COMPLETO DA RESPOSTA:', JSON.stringify(errorJson, null, 2));
            } catch (e) {
                console.error('>>> [PIX ERROR] Resposta bruta não-JSON:', errorBody);
            }

            throw new Error(errorMessage);
        }

        const data = await qrResponse.json();
        console.log('>>> [PIX SUCCESS] QR Code gerado com ID:', data.transactionId);

        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('>>> [CRITICAL ERROR]:', error.message);
        throw new Error(error.message || 'Erro inesperado ao processar Pix.');
    }
}