import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, increment, writeBatch } from 'firebase/firestore';

/**
 * Endpoint oficial para receber notificações da PixUp em tempo real.
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('--- Notificação PixUp Recebida ---', JSON.stringify(payload));

        const { status, external_id, amount, transactionId } = payload;

        // Validar status (A PixUp envia 'Aprovado' no dashboard e via API)
        const validStatuses = [
            'PAID', 'COMPLETED', 'CONCLUDED', 'CONCLUIDO', 
            'APROVADO', 'Aprovado', 'aprovado', 'paid', 'concluido'
        ];
        
        const statusString = String(status || '').trim();
        const isPaid = validStatuses.includes(statusString);
        
        if (!isPaid) {
            console.log(`Pagamento ignorado. Status: ${statusString}`);
            return NextResponse.json({ message: 'Aguardando status de aprovação' }, { status: 200 });
        }

        if (!external_id) {
            console.error('Erro: external_id ausente no payload.');
            return NextResponse.json({ error: 'external_id ausente' }, { status: 400 });
        }

        // Recuperar userId e depositId (formato userId:depositId)
        const [userId, depositId] = external_id.split(':');

        if (!userId || !depositId) {
            console.error('Erro: formato de external_id inválido:', external_id);
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
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        if (transactionDoc.data().status === 'Completed') {
            return NextResponse.json({ message: 'Já processado' }, { status: 200 });
        }

        // Regra de Conversão: R$ 1,00 BRL = 100 USDT (Multiplicador 100x)
        const usdtToCredit = parseFloat(amount) * 100;

        const batch = writeBatch(firestore);

        // 1. Atualiza saldo da conta principal
        batch.update(accountRef, { balance: increment(usdtToCredit) });
        
        // 2. Atualiza status da transação para Concluído
        batch.update(transactionRef, { 
            status: 'Completed', 
            updatedAt: new Date().toISOString(),
            confirmedAmount: usdtToCredit,
            pixUpTransactionId: transactionId || payload.id || 'N/A'
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
                }
            }
        }

        await batch.commit();
        console.log(`SUCESSO: ${usdtToCredit} USDT creditados para ${userId}`);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('ERRO CRÍTICO NO WEBHOOK:', error);
        return NextResponse.json({ error: 'Erro Interno' }, { status: 500 });
    }
}
