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
    externalId: string; 
    postbackUrl?: string; 
}

/**
 * Gera um QR Code Pix utilizando chamadas REST diretas para a PixUp.
 * Isso garante que o objeto 'payer' seja enviado corretamente e evita problemas de serialização do SDK.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerEmail } = options;

    // Credenciais de Produção
    const clientId = "Aducmartins_4621537998005562";
    const clientSecret = "c473cdb25c796b619fb302ed9a0a8ce039c1287499348ce477c5195851b143e9";
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
            console.error('Erro de Auth PixUp:', errorText);
            throw new Error(`Falha na autenticação com a PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 2. Preparar o corpo da requisição (O 'payer' é MANDATÓRIO)
        const body = {
             amount: Number(amount.toFixed(2)),
             external_id: String(externalId),
             postbackUrl: postbackUrl || "",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: "12345678909", // CPF genérico para validação da API
                email: (payerEmail || "contato@dailygainx.com").substring(0, 100).trim()
             }
        };

        // 3. Gerar QR Code via POST direto
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
            const errorJson = await qrResponse.json();
            console.error('Erro 400 PixUp:', errorJson);
            throw new Error(errorJson.message || 'Erro ao gerar QR Code (Bad Request).');
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
        console.error('ERRO DETALHADO generatePixQrCode:', error);
        throw new Error(error.message || 'Erro crítico ao processar Pix.');
    }
}
