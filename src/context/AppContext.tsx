'use client';

import type { Operation, OpenPosition, ActiveInvestment, Transaction } from '@/lib/types';
import type { Product } from '@/lib/products';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';


const generateData = (count: number, initialValue: number) => {
    let value = initialValue;
    const data = [];
    for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - (count - i));
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const { user, firestore } = useFirebase();

  const accountDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'accounts', user.uid);
  }, [user, firestore]);

  const { data: userAccount, isLoading: isAccountLoading } = useDoc<{balance: number}>(accountDocRef);

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

  const addOperation = (operation: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOperation: Operation = {
      ...operation,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
    };
    setOperations(prev => [newOperation, ...prev]);
  };

  const openPosition = (position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => {
    if (isAccountLoading) return;
    const newPosition: OpenPosition = {
      ...position,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      entryPrice: lastPrice,
    };
    setOpenPositions(prev => [newPosition, ...prev]);
    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(-position.amount) });
    }
  };

  const closePosition = (positionId: string) => {
    const position = openPositions.find(p => p.id === positionId);
    if (!position || isAccountLoading) return;

    // Rigged outcome logic, adjusted to be less suspicious
    const winChance = 0.35; // 35% chance to win
    const isWin = Math.random() < winChance;

    let pnl: number;

    if (isWin) {
      // If it's a win, the gain is variable (e.g., 10% to 45% of the invested amount)
      const winPercentage = 0.10 + Math.random() * 0.35; // 0.10 to 0.45
      pnl = position.amount * winPercentage;
    } else {
      // If it's a loss, the loss is also variable to feel more natural (e.g., 10% to 70%)
      const lossPercentage = 0.10 + Math.random() * 0.60; // 0.10 to 0.70
      pnl = -position.amount * lossPercentage;
    }
    
    const cappedPnl = Math.max(pnl, -position.amount); // Ensure loss doesn't exceed invested amount
    const amountToReturn = position.amount + cappedPnl;

    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(amountToReturn) });
    }

    addOperation({
      type: position.type,
      price: position.entryPrice,
      outcome: cappedPnl >= 0 ? 'win' : 'loss',
      amount: Math.abs(cappedPnl),
    });

    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
  };
  
  const addInvestment = (product: Product, image: { imageUrl: string, imageHint: string }): boolean => {
    if (isAccountLoading) return false;
    if (balance < product.minInvestment) {
      return false;
    }
    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(-product.minInvestment) });
    }
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
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    if (accountDocRef) {
        if (newTransaction.type === 'deposit' && newTransaction.status === 'Completed') {
            updateDoc(accountDocRef, { balance: increment(newTransaction.amount) });
        } else if (newTransaction.type === 'withdrawal' && transaction.status !== 'Failed') {
            updateDoc(accountDocRef, { balance: increment(-newTransaction.amount) });
        }
    }
  };


  return (
    <AppContext.Provider value={{ 
        balance, 
        isBalanceLoading: isAccountLoading,
        operations, 
        addOperation, 
        openPositions, 
        openPosition, 
        closePosition, 
        marketData, 
        lastPrice,
        activeInvestments,
        addInvestment,
        transactions,
        addTransaction
    }}>
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
