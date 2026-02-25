import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Endpoint para receber notificações da PixUp.
 * Configure esta URL no painel da PixUp: https://seu-dominio.com/api/webhook/pixup
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('Webhook PixUp recebido:', payload);

        // A PixUp envia o status e o external_id que definimos (userId:transactionId)
        const { status, external_id, transactionId, amount } = payload;

        if (status !== 'PAID' && status !== 'COMPLETED' && status !== 'CONCLUDED') {
            return NextResponse.json({ message: 'Status não é de pagamento concluído' }, { status: 200 });
        }

        if (!external_id) {
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        // Recuperamos userId e o ID da transação do nosso lado
        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        
        // 1. Referência do documento de transação
        const transactionRef = doc(firestore, 'users', userId, 'accounts', userId, 'depositTransactions', depositId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        if (transactionDoc.data().status === 'Completed') {
            return NextResponse.json({ message: 'Transação já processada anteriormente' }, { status: 200 });
        }

        // 2. Processar o crédito real
        const batch = writeBatch(firestore);
        const accountRef = doc(firestore, 'users', userId, 'accounts', userId);
        const userRef = doc(firestore, 'users', userId);

        // Atualizar saldo (valor real do PixUp)
        // Nota: O valor do PixUp geralmente vem em BRL, precisamos converter para USDT se necessário
        // Se o valor enviado no QR for o valor em BRL, aqui creditamos o equivalente em USDT.
        const usdtAmount = parseFloat(amount) / 5.0; // Usando a taxa de 5.0 como base

        batch.update(accountRef, { balance: increment(usdtAmount) });
        batch.update(transactionRef, { status: 'Completed', updatedAt: new Date().toISOString() });

        // 3. Lógica de indicação (Primeiro Depósito)
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
        console.log(`Sucesso: Depósito de ${usdtAmount} USDT creditado para o usuário ${userId}`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('Erro ao processar Webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
