
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';

/**
 * Endpoint oficial para receber notificações da PixUp.
 * Configure esta URL no painel da PixUp (Postback): https://seu-dominio.com/api/webhook/pixup
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('--- Webhook PixUp Recebido ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const { status, external_id, amount } = payload;

        // Validar se o pagamento foi concluído
        if (status !== 'PAID' && status !== 'COMPLETED' && status !== 'CONCLUDED') {
            console.log(`Pagamento ignorado (Status: ${status})`);
            return NextResponse.json({ message: 'Status não conclusivo' }, { status: 200 });
        }

        if (!external_id) {
            console.error('Erro: external_id ausente no payload.');
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        // Recuperar userId e depositId (salvos no formato userId:depositId)
        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            console.error('Erro: formato de external_id inválido:', external_id);
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        
        // 1. Verificar a transação no Firestore
        const transactionRef = doc(firestore, 'users', userId, 'accounts', userId, 'depositTransactions', depositId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            console.error(`Erro: Transação ${depositId} não encontrada para o usuário ${userId}`);
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        if (transactionDoc.data().status === 'Completed') {
            console.log('Aviso: Transação já foi processada anteriormente.');
            return NextResponse.json({ message: 'Já processado' }, { status: 200 });
        }

        // 2. Processar o crédito real (USDT)
        const batch = writeBatch(firestore);
        const accountRef = doc(firestore, 'users', userId, 'accounts', userId);
        const userRef = doc(firestore, 'users', userId);

        // Conversão de Teste solicitada: R$ 0.01 = 1 USDT
        // Se amount vier em BRL, multiplicamos por 100 para converter R$ 0.01 em 1 USDT.
        // Se for 1 Real (mínimo PixUp), vira 100 USDT.
        const usdtAmount = parseFloat(amount) * 100;

        batch.update(accountRef, { balance: increment(usdtAmount) });
        batch.update(transactionRef, { 
            status: 'Completed', 
            updatedAt: new Date().toISOString(),
            amount: usdtAmount // Atualiza o valor final em USDT na transação
        });

        // 3. Lógica de Indicação (Bônus de 1 USDT no primeiro depósito)
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
                    console.log(`Bônus de indicação creditado para o padrinho: ${referrerId}`);
                }
            }
        }

        await batch.commit();
        console.log(`SUCESSO: ${usdtAmount} USDT creditados para o usuário ${userId}`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO CRÍTICO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Erro Interno', details: error.message }, { status: 500 });
    }
}
