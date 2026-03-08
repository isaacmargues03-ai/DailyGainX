
'use client';

import type { Operation, OpenPosition, ActiveInvestment, Transaction } from '@/lib/types';
import type { Product } from '@/lib/products';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, query, collection, orderBy, limit, setDoc, getDocs, writeBatch, runTransaction, where } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const generateData = (count: number, initialValue: number) => {
    let value = initialValue;
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({ 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            price: parseFloat(value.toFixed(4)) 
        });
    }
    return data;
};

interface AppContextType {
  balance: number;
  isBalanceLoading: boolean;
  operations: Operation[];
  addOperation: (operation: Omit<Operation, 'id' | 'timestamp'>) => void;
  openPositions: OpenPosition[];
  openPosition: (position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => void;
  closePosition: (positionId: string) => void;
  marketData: { time: string; price: number; }[];
  lastPrice: number;
  activeInvestments: ActiveInvestment[];
  addInvestment: (product: Product, image: { imageUrl: string, imageHint: string }) => boolean;
  claimInvestment: (investmentId: string) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  clearHistory: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [marketData, setMarketData] = useState<{ time: string; price: number; }[]>([]);
  
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const accountDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'accounts', user.uid);
  }, [user, firestore]);

  const { data: userAccount, isLoading: isBalanceLoading } = useDoc<{balance: number}>(accountDocRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions'),
        orderBy('depositDate', 'desc'),
        limit(50)
    );
  }, [user, firestore]);

  const { data: firestoreTransactions } = useCollection<Transaction>(transactionsQuery);

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'users', user.uid, 'investments'),
        where('status', '==', 'active')
    );
  }, [user, firestore]);

  const { data: firestoreInvestments } = useCollection<ActiveInvestment>(investmentsQuery);

  const balance = userAccount?.balance ?? 0;
  const lastPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 5.4321;

  useEffect(() => {
    setMarketData(generateData(60, 5.4321));
    
    const interval = setInterval(() => {
        setMarketData(prevData => {
            if (prevData.length === 0) return prevData;
            const newData = [...prevData.slice(1)];
            const lastPoint = newData[newData.length - 1];
            const newValue = lastPoint.price + (Math.random() - 0.5) * 0.01;
            newData.push({ 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                price: parseFloat(newValue.toFixed(4)) 
            });
            return newData;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addOperation = useCallback((operation: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOperation: Operation = {
      ...operation,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
    };
    setOperations(prev => [newOperation, ...prev]);
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
      if (!user || !firestore || !accountDocRef) return;

      const txId = new Date().getTime().toString();
      const txRef = doc(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions', txId);

      if (transaction.type === 'withdrawal') {
          setDoc(txRef, {
              ...transaction,
              id: txId,
              status: 'PENDENTE',
              timestamp: new Date().toLocaleString('pt-BR'),
              depositDate: new Date().toISOString(),
          });

          updateDoc(accountDocRef, { balance: increment(-transaction.amount) })
            .catch(() => toast({ variant: 'destructive', title: 'Erro', description: 'Falha no saque.' }));
      }
  }, [user, firestore, accountDocRef, toast]);

  const clearHistory = useCallback(async () => {
    if (!user || !firestore) return;
    try {
      const q = query(collection(firestore, 'users', user.uid, 'accounts', user.uid, 'depositTransactions'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Erro ao zerar histórico:", error);
      throw error;
    }
  }, [user, firestore]);

  const openPosition = useCallback((position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => {
    if (isBalanceLoading || !accountDocRef) return;
    const newPosition: OpenPosition = {
      ...position,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      entryPrice: lastPrice,
    };
    setOpenPositions(prev => [newPosition, ...prev]);
    updateDoc(accountDocRef, { balance: increment(-position.amount) });
  }, [isBalanceLoading, lastPrice, accountDocRef]);

  const closePosition = useCallback((positionId: string) => {
    const position = openPositions.find(p => p.id === positionId);
    if (!position || isBalanceLoading || !accountDocRef) return;

    const winChance = 0.35;
    const isWin = Math.random() < winChance;

    let pnl: number;
    if (isWin) {
      const winPercentage = 0.10 + Math.random() * 0.35;
      pnl = position.amount * winPercentage;
    } else {
      const lossPercentage = 0.10 + Math.random() * 0.60;
      pnl = -position.amount * lossPercentage;
    }
    
    const cappedPnl = Math.max(pnl, -position.amount);
    const amountToReturn = position.amount + cappedPnl;

    updateDoc(accountDocRef, { balance: increment(amountToReturn) });

    addOperation({
      type: position.type,
      price: position.entryPrice,
      outcome: cappedPnl >= 0 ? 'win' : 'loss',
      amount: Math.abs(cappedPnl),
    });

    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
  }, [openPositions, isBalanceLoading, accountDocRef, addOperation]);
  
  const addInvestment = useCallback((product: Product, image: { imageUrl: string, imageHint: string }): boolean => {
    if (isBalanceLoading || !accountDocRef || balance < product.minInvestment || !user) return false;
    
    const investmentId = new Date().getTime().toString();
    const investmentRef = doc(firestore, 'users', user.uid, 'investments', investmentId);

    updateDoc(accountDocRef, { balance: increment(-product.minInvestment) });

    setDoc(investmentRef, {
      id: investmentId,
      productId: product.id,
      companyName: product.companyName,
      instructorName: product.instructorName,
      period: product.period,
      investedAmount: product.minInvestment,
      profit: product.profit,
      imageUrl: image.imageUrl,
      imageHint: image.imageHint,
      investmentTimestamp: Date.now(),
      status: 'active'
    });

    return true;
  }, [isBalanceLoading, balance, accountDocRef, user, firestore]);

  const claimInvestment = useCallback(async (investmentId: string) => {
    if (!user || !firestore || !accountDocRef) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const investmentRef = doc(firestore, 'users', user.uid, 'investments', investmentId);
        const invDoc = await transaction.get(investmentRef);
        
        if (!invDoc.exists()) throw new Error("Investimento não encontrado.");
        const data = invDoc.data() as ActiveInvestment;
        
        if (data.status === 'claimed') throw new Error("Já resgatado.");

        const totalReturn = data.investedAmount + data.profit;
        
        transaction.update(investmentRef, { status: 'claimed' });
        transaction.set(accountDocRef, { balance: increment(totalReturn) }, { merge: true });
      });

      toast({ title: "Sucesso!", description: "Rendimento resgatado com sucesso!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro no resgate", description: e.message });
    }
  }, [user, firestore, accountDocRef, toast]);

  const value = useMemo(() => ({ 
      balance, 
      isBalanceLoading,
      operations, 
      addOperation, 
      openPositions, 
      openPosition, 
      closePosition, 
      marketData, 
      lastPrice,
      activeInvestments: (firestoreInvestments || []) as ActiveInvestment[],
      addInvestment,
      claimInvestment,
      transactions: (firestoreTransactions || []) as Transaction[],
      addTransaction,
      clearHistory
  }), [
      balance, 
      isBalanceLoading,
      operations, 
      addOperation, 
      openPositions, 
      openPosition, 
      closePosition, 
      marketData, 
      lastPrice,
      firestoreInvestments,
      addInvestment,
      claimInvestment,
      firestoreTransactions,
      addTransaction,
      clearHistory
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
