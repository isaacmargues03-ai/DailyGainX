'use client';

import type { Operation } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

const INITIAL_BALANCE = 150.0;

interface AppContextType {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  operations: Operation[];
  addOperation: (operation: Omit<Operation, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [operations, setOperations] = useState<Operation[]>([]);

  const addOperation = (operation: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOperation: Operation = {
      ...operation,
      id: new Date().getTime().toString(),
      timestamp: new Date().toLocaleString(),
    };
    setOperations(prev => [newOperation, ...prev]);
  };

  return (
    <AppContext.Provider value={{ balance, setBalance, operations, addOperation }}>
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
