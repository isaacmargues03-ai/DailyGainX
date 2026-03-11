
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collectionGroup, query, where, getDocs, updateDoc } from 'firebase/firestore';

/**
 * Endpoint de Webhook para Produção - Fluxo de Validação.
 * Utiliza collectionGroup para encontrar a transação pelo external_id (depositId).
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

        const { firestore } = initializeFirebase();
        
        // Buscamos a transação em todas as subcoleções 'depositTransactions'
        const transactionsRef = collectionGroup(firestore, 'depositTransactions');
        const q = query(transactionsRef, where('id', '==', external_id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error(`WEBHOOK ERRO: Transação ${external_id} não encontrada no banco.`);
            return NextResponse.json({ error: 'Transação inexistente' }, { status: 404 });
        }

        const transactionDoc = querySnapshot.docs[0];
        const transactionData = transactionDoc.data();

        // Idempotência
        if (transactionData.status === 'claimed' || transactionData.status === 'validated') {
            return NextResponse.json({ message: 'Transação já processada' }, { status: 200 });
        }

        // Muda status para 'validated' para habilitar o botão de Resgate na tela do usuário
        await updateDoc(transactionDoc.ref, { 
            status: 'validated', 
            updatedAt: new Date().toISOString(),
            pixUpId: transactionId || payload.id || 'N/A'
        });

        console.log(`WEBHOOK SUCESSO: Transação ${external_id} validada.`);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
