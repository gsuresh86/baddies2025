'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast as ToastType, Toast as ToastComponent } from '@/components/ui/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastType, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = useCallback((toast: Omit<ToastType, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastType = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastType, 'id'>) => {
    // Ensure message is always a string or undefined
    const safeToast = {
      ...toast,
      message: typeof toast.message === 'string' ? toast.message : undefined
    };
    addToast(safeToast);
  }, [addToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    const safeMessage = typeof message === 'string' ? message : undefined;
    addToast({ type: 'success', title, message: safeMessage });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string) => {
    // Ensure message is always a string
    const safeMessage = typeof message === 'string' ? message : 'Unknown error occurred';
    addToast({ type: 'error', title, message: safeMessage });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    const safeMessage = typeof message === 'string' ? message : undefined;
    addToast({ type: 'warning', title, message: safeMessage });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    const safeMessage = typeof message === 'string' ? message : undefined;
    addToast({ type: 'info', title, message: safeMessage });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 