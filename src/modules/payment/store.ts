import { create } from 'zustand';
import { PaymentMethod, PaymentResult } from './types';

interface PaymentState {
  status: 'idle' | 'processing' | 'success' | 'failed';
  activeMethod: PaymentMethod | null;
  totalAmount: number;
  result: PaymentResult | null;

  // 액션
  startPayment: (method: PaymentMethod, amount: number) => void;
  setProcessing: () => void;
  completePayment: (result: PaymentResult) => void;
  failPayment: (error: string) => void;
  resetPayment: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  status: 'idle',
  activeMethod: null,
  totalAmount: 0,
  result: null,

  startPayment: (method, amount) => set({ 
    status: 'idle', // 모달이 열리고 대기 상태
    activeMethod: method, 
    totalAmount: amount, 
    result: null 
  }),

  setProcessing: () => set({ status: 'processing' }),

  completePayment: (result) => set({ 
    status: 'success', 
    result 
  }),

  failPayment: (error) => set({ status: 'failed' }), // 에러 처리는 나중에 더 정교하게

  resetPayment: () => set({ 
    status: 'idle', 
    activeMethod: null, 
    totalAmount: 0, 
    result: null 
  }),
}));