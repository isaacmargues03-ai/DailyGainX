'use server';

import sdk from '@api/pixup';
import QRCode from 'qrcode';
import type { CreateQrcodeBodyParam } from '@api/pixup/types';

interface QrCodeResponse {
    qrCodeImageUrl: string;
    pixCopyPaste: string;
}

interface GeneratePixOptions {
    amount: number;
    payerName?: string;
    payerEmail?: string;
}

// This function is intended to be run on the server.
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, payerName, payerEmail } = options;

    // Suas credenciais reais da PixUp.
    const clientId = "Aducmartins_0130127902781660";
    const clientSecret = "c473cdb25c796b619fb302ed9a0a8ce039c1287499348ce477c5195851b143e9";

    if (clientId === "SEU_CLIENT_ID_AQUI" || clientSecret === "SEU_CLIENT_SECRET_AQUI") {
        throw new Error('As credenciais da API PixUp não foram configuradas. Por favor, peça ao assistente para editar o arquivo `src/app/actions/pix.ts` com suas credenciais.');
    }

    try {
        // 1. Get Access Token
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenResponse = await fetch('https://api.pixupbr.com/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.error('Erro ao obter token de acesso da PixUp:', errorBody);
            throw new Error(`Falha ao autenticar com a PixUp.`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 2. Configure SDK and create QR Code
        sdk.auth(accessToken);

        const body: CreateQrcodeBodyParam = { amount };
        if (payerName || payerEmail) {
            body.payer = {};
            if (payerName) body.payer.name = payerName;
            if (payerEmail) body.payer.email = payerEmail;
        }

        const { data: qrCodeData } = await sdk.createQrcode(body);

        if (!qrCodeData.qrcode) {
            throw new Error('A resposta da API não continha a chave Pix copia e cola.');
        }

        // 3. Generate QR Code image from the "copia e cola" string
        const qrCodeImageUrl = await QRCode.toDataURL(qrCodeData.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: qrCodeData.qrcode
        };

    } catch (error) {
        console.error('Erro ao gerar QR Code do Pix:', error);
        if (error instanceof Error) {
            // Re-throwing a simpler error message for the client
            throw new Error(error.message || `Não foi possível gerar o QR Code do Pix. Tente novamente mais tarde.`);
        }
        throw new Error('Ocorreu um erro desconhecido ao gerar o QR Code do Pix.');
    }
}
