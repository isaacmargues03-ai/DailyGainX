
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
 * Ajustado com as novas credenciais e regras de sanitização de produção.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument } = options;

    // Credenciais de Produção Atualizadas
    const clientId = "Aducmartins_4621537998005562";
    const clientSecret = "6e7d949e6f87eaad1674807375749a9f21f6cf73769cfed1409bdfc0f7474fcd";
    const apiUrl = "https://api.pixupbr.com/v2";

    try {
        // 1. Obter Token de Acesso (OAuth2)
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenResponse = await fetch(`${apiUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            cache: 'no-store'
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('FALHA NA AUTENTICAÇÃO PIXUP:', errorText);
            throw new Error(`Erro de autenticação com o provedor de pagamento: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 1) Conversão de Valor: Garante que o amount seja enviado como Number
        const amountAsNumber = Number(amount);

        // 2) Sanitização de Dados: CPF apenas com números
        const documentCleaned = String(payerDocument || "12345678909").replace(/\D/g, '');

        const body = {
             amount: amountAsNumber,
             external_id: String(externalId),
             postbackUrl: postbackUrl || "https://dailygainx.netlify.app/api/webhook/pixup",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: documentCleaned
             }
        };

        // 3) Headers de Autenticação: Authorization: Bearer [TOKEN]
        const qrResponse = await fetch(`${apiUrl}/pix/qrcode`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrResponse.ok) {
            const errorBody = await qrResponse.json().catch(() => ({ message: 'Corpo de erro não decodificável' }));
            console.error('ERRO COMPLETO DA PIXUP:', errorBody);
            throw new Error(errorBody.message || 'Erro na API PixUp (QRCode)');
        }

        const data = await qrResponse.json();

        if (!data || !data.qrcode || !data.transactionId) {
            throw new Error('Resposta incompleta da API da PixUp.');
        }

        // Converter string Pix para Imagem (Base64)
        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('ERRO NA GERAÇÃO DO PIX:', error.message);
        throw new Error(error.message || 'Erro crítico ao processar transação Pix.');
    }
}
