import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, increment, writeBatch } from 'firebase/firestore';

/**
 * Endpoint oficial para receber notificações da PixUp em tempo real.
 * URL para cadastrar no painel da PixUp: https://dailygainx.netlify.app/api/webhook/pixup
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('--- Notificação PixUp Recebida ---');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const { status, external_id, amount } = payload;

        // Validar se o pagamento foi concluído com sucesso
        const isPaid = status === 'PAID' || status === 'COMPLETED' || status === 'CONCLUDED' || status === 'paid';
        
        if (!isPaid) {
            console.log(`Pagamento ainda não concluído (Status atual: ${status})`);
            return NextResponse.json({ message: 'Aguardando status final' }, { status: 200 });
        }

        if (!external_id) {
            console.error('Erro: external_id ausente no payload da PixUp.');
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        // Recuperar userId e depositId salvos no formato userId:depositId
        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            console.error('Erro: formato de external_id inválido:', external_id);
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        
        // 1. Localizar a transação no Firestore
        const transactionRef = doc(firestore, 'users', userId, 'accounts', userId, 'depositTransactions', depositId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
            console.error(`Erro: Transação ${depositId} não encontrada para o usuário ${userId}`);
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        const txData = transactionDoc.data();
        if (txData.status === 'Completed') {
            console.log('Aviso: Esta transação já foi processada anteriormente.');
            return NextResponse.json({ message: 'Já processado' }, { status: 200 });
        }

        // 2. Processar o crédito (USDT)
        // Regra de Conversão: R$ 1,00 BRL = 100 USDT. 
        const usdtToCredit = parseFloat(amount) * 100;

        const batch = writeBatch(firestore);
        const accountRef = doc(firestore, 'users', userId, 'accounts', userId);
        const userRef = doc(firestore, 'users', userId);

        // Atualiza saldo da conta principal usando increment
        batch.update(accountRef, { balance: increment(usdtToCredit) });
        
        // Atualiza status da transação para Concluído
        batch.update(transactionRef, { 
            status: 'Completed', 
            updatedAt: new Date().toISOString(),
            confirmedAmount: usdtToCredit
        });

        // 3. Lógica de Recompensa de Indicação (1 USDT no primeiro depósito)
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
        console.log(`SUCESSO: ${usdtToCredit} USDT creditados para o usuário ${userId}`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO CRÍTICO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Erro Interno' }, { status: 500 });
    }
}