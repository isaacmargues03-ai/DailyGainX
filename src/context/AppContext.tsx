'use client';

import type { Operation, OpenPosition, ActiveInvestment, Transaction } from '@/lib/types';
import type { Product } from '@/lib/products';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, query, collection, orderBy, limit } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const generateData = (count: number, initialValue: number) => {
    let value = initialValue;
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(value.toFixed(4)) });
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
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>([]);
  
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

  const balance = userAccount?.balance ?? 0;

  const initialData = useMemo(() => generateData(60, 5.4321), []);
  const [marketData, setMarketData] = useState(initialData);

  const lastPrice = marketData.length > 0 ? marketData[marketData.length - 1].price : 0;

  useEffect(() => {
      const interval = setInterval(() => {
          setMarketData(prevData => {
              if (prevData.length === 0) return prevData;
              const newData = [...prevData.slice(1)];
              const lastPoint = newData[newData.length - 1];
              const newValue = lastPoint.price + (Math.random() - 0.5) * 0.01;
              newData.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price: parseFloat(newValue.toFixed(4)) });
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
      // Implementação para saques. Depósitos agora são tratados via Webhook + Firestore listener
      if (transaction.type === 'withdrawal' && accountDocRef) {
          updateDoc(accountDocRef, { balance: increment(-transaction.amount) })
            .catch(() => toast({ variant: 'destructive', title: 'Erro', description: 'Falha no saque.' }));
      }
  }, [accountDocRef, toast]);

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
    if (isBalanceLoading || !accountDocRef || balance < product.minInvestment) return false;
    
    updateDoc(accountDocRef, { balance: increment(-product.minInvestment) });

    const newInvestment: ActiveInvestment = {
      id: new Date().getTime().toString(),
      productId: product.id,
      companyName: product.companyName,
      instructorName: product.instructorName,
      period: product.period,
      investedAmount: product.minInvestment,
      profit: product.profit,
      imageUrl: image.imageUrl,
      imageHint: image.imageHint,
      investmentTimestamp: Date.now(),
    };
    setActiveInvestments(prev => [newInvestment, ...prev]);
    return true;
  }, [isBalanceLoading, balance, accountDocRef]);

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
      activeInvestments,
      addInvestment,
      transactions: (firestoreTransactions || []) as Transaction[],
      addTransaction
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
      activeInvestments,
      addInvestment,
      firestoreTransactions,
      addTransaction
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
