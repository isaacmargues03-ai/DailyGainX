'use server';

import QRCode from 'qrcode';
import sdk from '@api/pixup';

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
 * Gera um QR Code Pix utilizando o SDK oficial da PixUp.
 * O campo 'payer' é obrigatório pela API e agora é enviado seguindo o esquema rigoroso.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerEmail } = options;

    // Credenciais de Produção Oficiais
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
            const errorJson = await tokenResponse.json();
            throw new Error(`Auth Error: ${errorJson.error_description || errorJson.message}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // 2. Configurar o SDK com o token obtido
        sdk.auth(accessToken);
        sdk.server('https://api.pixupbr.com/');

        // 3. Preparar o corpo da requisição conforme exigido pela PixUp
        // O objeto 'payer' é MANDATÓRIO para evitar o erro 400.
        const body = {
             amount: Number(amount.toFixed(2)),
             external_id: String(externalId),
             postbackUrl: postbackUrl || "",
             payer: {
                name: (payerName || "Cliente DailyGainX").substring(0, 100).trim(),
                document: "12345678909", // CPF válido exigido pela API
                email: (payerEmail || "contato@dailygainx.com").substring(0, 100).trim()
             }
        };

        // Chamada via SDK para garantir compatibilidade total
        const { data } = await sdk.createQrcode(body);

        if (!data || !data.qrcode || !data.transactionId) {
            throw new Error('A API retornou uma resposta incompleta.');
        }

        // Converter string Pix para Imagem (Base64)
        const qrCodeImageUrl = await QRCode.toDataURL(data.qrcode);

        return {
            qrCodeImageUrl,
            pixCopyPaste: data.qrcode,
            transactionId: data.transactionId,
        };

    } catch (error: any) {
        console.error('ERRO DETALHADO PIXUP:', error);
        // Tenta extrair a mensagem de erro específica da API se disponível
        const message = error.resData?.message || error.message || 'Erro ao gerar Pix.';
        throw new Error(message);
    }
}
