'use client';

import type { Operation, OpenPosition, ActiveInvestment, Transaction } from '@/lib/types';
import type { Product } from '@/lib/products';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
  const { toast } = useToast();

  const accountDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid, 'accounts', user.uid);
  }, [user, firestore]);

  const { data: userAccount, isLoading: isBalanceLoading } = useDoc<{balance: number}>(accountDocRef);

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

  const openPosition = useCallback((position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => {
    if (isBalanceLoading) return;
    const newPosition: OpenPosition = {
      ...position,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR'),
      entryPrice: lastPrice,
    };
    setOpenPositions(prev => [newPosition, ...prev]);
    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(-position.amount) })
        .catch(error => {
            console.error(`Firestore update failed for openPosition at ${accountDocRef.path}:`, error);
            const permissionError = new FirestorePermissionError({ path: accountDocRef.path, operation: 'update', requestResourceData: { balance: `decrement by ${position.amount}` } });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Falha ao Abrir Operação', description: 'Não foi possível atualizar seu saldo.' });
        });
    }
  }, [isBalanceLoading, lastPrice, accountDocRef, toast]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short'}),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    if (accountDocRef) {
        let amount = 0;
        if (newTransaction.type === 'deposit' && newTransaction.status === 'Completed') {
            amount = newTransaction.amount;
        } else if (newTransaction.type === 'withdrawal' && transaction.status !== 'Failed') {
            amount = -newTransaction.amount;
        }
        
        if (amount !== 0) {
            updateDoc(accountDocRef, { balance: increment(amount) })
            .catch(error => {
                console.error(`Firestore update failed for addTransaction at ${accountDocRef.path}:`, error);
                const permissionError = new FirestorePermissionError({ path: accountDocRef.path, operation: 'update', requestResourceData: { balance: `increment by ${amount}` } });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Falha ao Atualizar Saldo', description: 'Não foi possível registrar sua transação no servidor.' });
            });
        }
    }
  }, [accountDocRef, toast]);

  const closePosition = useCallback((positionId: string) => {
    const position = openPositions.find(p => p.id === positionId);
    if (!position || isBalanceLoading) return;

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

    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(amountToReturn) })
        .catch(error => {
            console.error(`Firestore update failed for closePosition at ${accountDocRef.path}:`, error);
            const permissionError = new FirestorePermissionError({ path: accountDocRef.path, operation: 'update', requestResourceData: { balance: `increment by ${amountToReturn}` } });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Falha ao Fechar Operação', description: 'Não foi possível creditar o resultado da operação ao seu saldo.' });
        });
    }

    addOperation({
      type: position.type,
      price: position.entryPrice,
      outcome: cappedPnl >= 0 ? 'win' : 'loss',
      amount: Math.abs(cappedPnl),
    });

    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
  }, [openPositions, isBalanceLoading, accountDocRef, addOperation, toast]);
  
  const addInvestment = useCallback((product: Product, image: { imageUrl: string, imageHint: string }): boolean => {
    if (isBalanceLoading) return false;
    if (balance < product.minInvestment) {
      return false;
    }
    if (accountDocRef) {
        updateDoc(accountDocRef, { balance: increment(-product.minInvestment) })
        .catch(error => {
            console.error(`Firestore update failed for addInvestment at ${accountDocRef.path}:`, error);
            const permissionError = new FirestorePermissionError({ path: accountDocRef.path, operation: 'update', requestResourceData: { balance: `decrement by ${product.minInvestment}` } });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Falha no Investimento', description: 'Não foi possível debitar o valor do seu saldo.' });
        });
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
  }, [isBalanceLoading, balance, accountDocRef, toast]);

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
      transactions,
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
      transactions,
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
