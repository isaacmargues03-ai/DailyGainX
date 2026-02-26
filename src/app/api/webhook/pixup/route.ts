import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';

/**
 * Endpoint de Webhook para Produção - Fluxo de Validação Manual.
 * Quando um pagamento é aprovado, o status muda para 'validated'.
 * O usuário deve clicar em "Resgatar Saldo" no histórico para creditar.
 */
export async function POST(request: Request) {
    const clientId = "Aducmartins_4621537998005562";
    const clientSecret = "c473cdb25c796b619fb302ed9a0a8ce039c1287499348ce477c5195851b143e9";

    try {
        const payload = await request.json();
        console.log('WEBHOOK PIXUP RECEBIDO:', JSON.stringify(payload));

        const { status, external_id, amount, transactionId } = payload;

        // Status que indicam que o dinheiro foi recebido pela PixUp
        const validStatuses = [
            'PAID', 'COMPLETED', 'CONCLUDED', 'CONCLUIDO', 
            'APROVADO', 'Aprovado', 'aprovado'
        ];
        
        const statusString = String(status || '').trim();
        const isPaid = validStatuses.includes(statusString);
        
        if (!isPaid) {
            return NextResponse.json({ message: 'Aguardando pagamento' }, { status: 200 });
        }

        if (!external_id) {
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        const transactionRef = doc(firestore, 'users', userId, 'accounts', userId, 'depositTransactions', depositId);
        const userRef = doc(firestore, 'users', userId);

        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            return NextResponse.json({ error: 'Transação inexistente' }, { status: 404 });
        }

        // Idempotência
        if (transactionDoc.data().status === 'claimed' || transactionDoc.data().status === 'validated') {
            return NextResponse.json({ message: 'Transação já processada' }, { status: 200 });
        }

        const batch = writeBatch(firestore);

        // Muda status para 'validated' para habilitar o botão de Resgate na tela do usuário
        batch.update(transactionRef, { 
            status: 'validated', 
            updatedAt: new Date().toISOString(),
            pixUpId: transactionId || payload.id || 'N/A'
        });

        // Lógica de Primeira Indicação (mantida para marcar o depósito)
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data().hasMadeFirstDeposit) {
            batch.update(userRef, { hasMadeFirstDeposit: true });
        }

        await batch.commit();
        console.log(`WEBHOOK SUCESSO: Transação ${depositId} validada para resgate.`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
