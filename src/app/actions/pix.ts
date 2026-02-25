'use server';

import QRCode from 'qrcode';
import type { CreateQrcodeBodyParam } from '@api/pixup/types';

interface QrCodeResponse {
    qrCodeImageUrl: string;
    pixCopyPaste: string;
    transactionId: string;
}

interface GeneratePixOptions {
    amount: number;
    payerName?: string;
    payerEmail?: string;
    externalId: string; // ID único para rastrear no webhook (userId:transactionId)
    postbackUrl?: string; // URL do nosso webhook
}

export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, payerName, payerEmail, externalId, postbackUrl } = options;

    // Credenciais oficiais de Produção
    const clientId = "Aducmartins_4621537998005562";
    const clientSecret = "c473cdb25c796b619fb302ed9a0a8ce039c1287499348ce477c5195851b143e9";
    const apiUrl = "https://api.pixupbr.com/v2";

    try {
        // 1. Obter Token de Acesso
        const credentials = btoa(`${clientId}:${clientSecret}`);
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
            const errorJson = await tokenResponse.json();
            throw new Error(`Falha na autenticação PixUp: ${errorJson.error_description || errorJson.message}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 2. Criar QR Code com a PixUp
        const body: CreateQrcodeBodyParam = {
             amount,
             external_id: externalId,
             postbackUrl: postbackUrl,
             payer: {
                 name: payerName || 'Cliente DailyGainX',
                 document: '00000000000', // Documento genérico se não coletado
                 email: payerEmail
             }
        };

        const qrCodeApiResponse = await fetch(`${apiUrl}/pix/qrcode`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        if (!qrCodeApiResponse.ok) {
            const errorText = await qrCodeApiResponse.text();
            throw new Error(`Erro na API PixUp: ${errorText}`);
        }

        const qrCodeData = await qrCodeApiResponse.json();

        if (!qrCodeData.qrcode || !qrCodeData.transactionId) {
            throw new Error('Resposta inválida da PixUp (campos faltando).');
        }

        // Converter a string do Pix para imagem QR Code
        const qrCodeImageUrl = await QRCode.toDataURL(qrCodeData.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: qrCodeData.qrcode,
            transactionId: qrCodeData.transactionId,
        };

    } catch (error: any) {
        console.error('Erro detalhado na geração do Pix:', error);
        throw new Error(error.message || 'Erro ao gerar Pix.');
    }
}
