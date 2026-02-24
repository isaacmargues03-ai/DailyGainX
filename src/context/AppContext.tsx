'use client';

import type { Operation, OpenPosition } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

const INITIAL_BALANCE = 150.0;

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
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  operations: Operation[];
  addOperation: (operation: Omit<Operation, 'id' | 'timestamp'>) => void;
  openPositions: OpenPosition[];
  openPosition: (position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => void;
  closePosition: (positionId: string) => void;
  marketData: { time: string; price: number; }[];
  lastPrice: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);

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
      timestamp: new Date().toLocaleString(),
    };
    setOperations(prev => [newOperation, ...prev]);
  };

  const openPosition = (position: Omit<OpenPosition, 'id' | 'timestamp' | 'entryPrice'>) => {
    const newPosition: OpenPosition = {
      ...position,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString(),
      entryPrice: lastPrice,
    };
    setOpenPositions(prev => [newPosition, ...prev]);
    setBalance(prev => prev - position.amount);
  };

  const closePosition = (positionId: string) => {
    const position = openPositions.find(p => p.id === positionId);
    if (!position) return;

    const closingPrice = lastPrice;
    const leverage = 10;
    let pnl: number;

    if (position.type === 'buy') {
      pnl = ((closingPrice - position.entryPrice) / position.entryPrice) * position.amount * leverage;
    } else { // 'sell'
      pnl = ((position.entryPrice - closingPrice) / position.entryPrice) * position.amount * leverage;
    }
    
    const cappedPnl = Math.max(pnl, -position.amount);
    const amountToReturn = position.amount + cappedPnl;

    setBalance(prev => prev + amountToReturn);

    addOperation({
      type: position.type,
      price: position.entryPrice,
      outcome: cappedPnl >= 0 ? 'win' : 'loss',
      amount: Math.abs(cappedPnl),
    });

    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
  };


  return (
    <AppContext.Provider value={{ balance, setBalance, operations, addOperation, openPositions, openPosition, closePosition, marketData, lastPrice }}>
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
