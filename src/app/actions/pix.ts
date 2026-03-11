
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
 * Ajustado conforme especificações técnicas de produção solicitadas.
 */
export async function generatePixQrCode(options: GeneratePixOptions): Promise<QrCodeResponse> {
    const { amount, externalId, postbackUrl, payerName, payerDocument } = options;

    // Credenciais de Produção fornecidas
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
            // Se a resposta não for OK, tentamos capturar o corpo do erro para o log detalhado
            const errorBody = await qrResponse.json().catch(() => ({ message: 'Corpo de erro não decodificável' }));
            const errorInfo = {
                status: qrResponse.status,
                data: errorBody
            };
            // Lança um erro customizado que será capturado pelo catch abaixo
            const customError = new Error('Erro na API PixUp (QRCode)');
            (customError as any).response = errorInfo;
            throw customError;
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
        // Log detalhado: Exibe o motivo real no terminal
        console.error('ERRO COMPLETO DA PIXUP:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Erro crítico ao processar transação Pix.');
    }
}
