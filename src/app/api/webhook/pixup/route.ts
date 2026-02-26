import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, writeBatch, increment } from 'firebase/firestore';

/**
 * Endpoint de Webhook para Produção - Fluxo de Validação Manual.
 * Quando um pagamento é aprovado, o status muda para 'validated'.
 * O usuário deve clicar em "Resgatar Saldo" no histórico para creditar.
 */
export async function POST(request: Request) {
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

        // Lógica de Indicação (Recompensa de 1 USDT no primeiro depósito)
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data().hasMadeFirstDeposit) {
            batch.update(userRef, { hasMadeFirstDeposit: true });
            
            const userData = userDoc.data();
            // Se o usuário foi indicado por alguém (possui referralId)
            if (userData.referralId) {
                const referralRef = doc(firestore, 'referrals', userData.referralId);
                const referralDoc = await getDoc(referralRef);
                
                if (referralDoc.exists()) {
                    const referralData = referralDoc.data();
                    const referrerId = referralData.referrerId;
                    
                    // 1. Marca a indicação como recompensada
                    batch.update(referralRef, { status: 'rewarded' });
                    
                    // 2. Credita 1 USDT na conta do padrinho (quem indicou)
                    const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                    batch.update(referrerAccountRef, {
                        balance: increment(1)
                    });
                }
            }
        }

        await batch.commit();
        console.log(`WEBHOOK SUCESSO: Transação ${depositId} validada.`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
