import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Endpoint de Webhook para Produção - Fluxo de Validação.
 * Apenas valida a transação. O resgate e a recompensa de indicação
 * ocorrem quando o usuário clica em "Resgatar Saldo" no histórico.
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('WEBHOOK PIXUP RECEBIDO:', JSON.stringify(payload));

        const { status, external_id, transactionId } = payload;

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

        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            return NextResponse.json({ error: 'Transação inexistente' }, { status: 404 });
        }

        // Idempotência
        if (transactionDoc.data().status === 'claimed' || transactionDoc.data().status === 'validated') {
            return NextResponse.json({ message: 'Transação já processada' }, { status: 200 });
        }

        // Muda status para 'validated' para habilitar o botão de Resgate na tela do usuário
        await updateDoc(transactionRef, { 
            status: 'validated', 
            updatedAt: new Date().toISOString(),
            pixUpId: transactionId || payload.id || 'N/A'
        });

        console.log(`WEBHOOK SUCESSO: Transação ${depositId} validada.`);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
