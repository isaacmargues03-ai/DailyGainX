'use server';

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
    const clientId = "Aducmartins_4621537998005562";
    const clientSecret = "c473cdb25c796b619fb302ed9a0a8ce039c1287499348ce477c5195851b143e9";

    if (clientId === "SEU_CLIENT_ID_AQUI" || clientSecret === "SEU_CLIENT_SECRET_AQUI") {
        throw new Error('As credenciais da API PixUp não foram configuradas. Por favor, peça ao assistente para editar o arquivo `src/app/actions/pix.ts` com suas credenciais.');
    }

    try {
        // 1. Get Access Token
        const credentials = btoa(`${clientId}:${clientSecret}`);
        const tokenResponse = await fetch('https://api.pixupbr.com/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
            cache: 'no-store'
        });

        if (!tokenResponse.ok) {
            let errorDetails = 'A API não retornou um corpo de erro válido.';
            try {
                // Try to parse the error as JSON, which is common for APIs
                const errorJson = await tokenResponse.json();
                // Use a detailed message if available, otherwise stringify the object
                errorDetails = errorJson.error_description || errorJson.message || JSON.stringify(errorJson);
            } catch (e) {
                // If parsing fails, it's likely not JSON, so use the raw text body
                const rawText = await tokenResponse.text();
                errorDetails = rawText || errorDetails;
            }
            console.error('Erro ao obter token de acesso da PixUp:', errorDetails);
            // Throw a new error with the detailed message
            throw new Error(`Falha na autenticação: ${errorDetails}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 2. Create QR Code via direct fetch
        // A API da PixUp requer o campo 'payer.document' se o objeto 'payer' for enviado.
        // Para simplificar e evitar o erro, enviaremos apenas o campo 'amount', que é o único obrigatório.
        const body: CreateQrcodeBodyParam = { amount };

        const qrCodeApiResponse = await fetch('https://api.pixupbr.com/v2/pix/qrcode', {
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
            console.error("PixUp QR Code API Error:", errorText);
            throw new Error(`A API PixUp retornou um erro ao gerar o QR Code: ${errorText}`);
        }

        const qrCodeData = await qrCodeApiResponse.json();

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
        console.error('Erro no fluxo de geração de Pix:', error);
        
        // Re-throw the original error to be caught by the client-side component.
        // This ensures the detailed error message from the try block is shown in the toast.
        if (error instanceof Error) {
            throw error;
        }

        // Fallback for any non-Error objects that might be thrown.
        throw new Error('Ocorreu um erro desconhecido ao gerar o QR Code do Pix.');
    }
}
