
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, increment, writeBatch } from 'firebase/firestore';

/**
 * Endpoint de Webhook para Produção.
 * Recebe notificações da PixUp e atualiza o saldo do usuário automaticamente.
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('WEBHOOK RECEBIDO:', JSON.stringify(payload));

        const { status, external_id, amount, transactionId } = payload;

        // Lista de status considerados como aprovados pela PixUp
        const validStatuses = [
            'PAID', 'COMPLETED', 'CONCLUDED', 'CONCLUIDO', 
            'APROVADO', 'Aprovado', 'aprovado', 'paid', 'concluido'
        ];
        
        const statusString = String(status || '').trim();
        const isPaid = validStatuses.includes(statusString);
        
        if (!isPaid) {
            console.log(`Status ignorado: ${statusString}`);
            return NextResponse.json({ message: 'Aguardando pagamento' }, { status: 200 });
        }

        if (!external_id) {
            console.error('external_id ausente no payload.');
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        // Recuperar IDs do external_id (userId:depositId)
        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            console.error('external_id inválido:', external_id);
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        
        // Referências no Firestore
        const transactionRef = doc(firestore, 'users', userId, 'accounts', userId, 'depositTransactions', depositId);
        const accountRef = doc(firestore, 'users', userId, 'accounts', userId);
        const userRef = doc(firestore, 'users', userId);

        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            console.error(`Transação ${depositId} não encontrada.`);
            return NextResponse.json({ error: 'Transação inexistente' }, { status: 404 });
        }

        // Evitar processamento duplo (Idempotência)
        if (transactionDoc.data().status === 'Completed') {
            console.log('Transação já concluída anteriormente.');
            return NextResponse.json({ message: 'OK' }, { status: 200 });
        }

        // Regra de Conversão: R$ 0,01 = 1 USDT (R$ 1,00 = 100 USDT)
        // Multiplicamos por 100 para converter o valor em BRL para USDT conforme solicitado.
        const usdtToCredit = parseFloat(amount) * 100;

        const batch = writeBatch(firestore);

        // 1. Incrementar saldo da conta usando FieldValue.increment (increment() no SDK web)
        batch.update(accountRef, { balance: increment(usdtToCredit) });
        
        // 2. Finalizar status da transação no histórico
        batch.update(transactionRef, { 
            status: 'Completed', 
            updatedAt: new Date().toISOString(),
            confirmedAmount: usdtToCredit,
            pixUpId: transactionId || payload.id || 'N/A'
        });

        // 3. Recompensa de Indicação (1 USDT no primeiro depósito)
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data().hasMadeFirstDeposit) {
            batch.update(userRef, { hasMadeFirstDeposit: true });
            
            const referralId = userDoc.data().referralId;
            if (referralId) {
                const referralRef = doc(firestore, 'referrals', referralId);
                const referralDoc = await getDoc(referralRef);
                
                if (referralDoc.exists() && referralDoc.data().status === 'pending') {
                    const referrerId = referralDoc.data().referrerId;
                    const referrerAccountRef = doc(firestore, 'users', referrerId, 'accounts', referrerId);
                    
                    batch.update(referralRef, { status: 'rewarded' });
                    batch.update(referrerAccountRef, { balance: increment(1) });
                }
            }
        }

        await batch.commit();
        console.log(`SUCESSO: ${usdtToCredit} USDT creditados para o usuário ${userId}`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO NO PROCESSAMENTO DO WEBHOOK:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
