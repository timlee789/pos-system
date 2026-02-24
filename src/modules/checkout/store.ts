import { create } from 'zustand';
import { PaymentMethod } from '@/modules/payment/types';

type CheckoutStep = 'idle' | 'order-type' | 'table-num' | 'tip';

interface CheckoutState {
  step: CheckoutStep;
  targetMethod: PaymentMethod | null;

  orderType: 'dine_in' | 'to_go' | null;
  tableNum: string;
  tipAmount: number;

  // 액션
  startCheckout: (method: PaymentMethod) => void;
  setStep: (step: CheckoutStep) => void;
  setOrderInfo: (type: 'dine_in' | 'to_go', tableNum?: string) => void;
  setTip: (amount: number) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: 'idle',
  targetMethod: null,
  orderType: null,
  tableNum: '',
  tipAmount: 0,

  // ✨ [핵심 수정] startCheckout 로직
  startCheckout: (method) => set((state) => {
    // 1. 이미 정보가 다 있는지 확인 (Recall 된 주문인 경우)
    // orderType이 있고, tableNum(이름)이 비어있지 않아야 함
    const hasPreInfo = !!state.orderType && !!state.tableNum && state.tableNum !== '';

    let nextStep: CheckoutStep = 'table-num'; // 기본값 (Kiosk 순서 동일)

    if (hasPreInfo) {
      console.log(`🚀 Pre-filled info detected! Method: ${method}`);

      if (method === 'CASH' || method === 'CARD') {
        // 단말기에서 팁을 처리하므로 모달 스킵 후 바로 결제로 진행
        nextStep = 'idle';
      }
    }

    return {
      step: nextStep,
      targetMethod: method,
      // 중요: 기존 정보가 있으면 지우지 말고 유지
      orderType: hasPreInfo ? state.orderType : null,
      tableNum: hasPreInfo ? state.tableNum : '',
      tipAmount: 0
    };
  }),

  setStep: (step) => set({ step }),

  setOrderInfo: (type, tableNum) => set((state) => ({
    orderType: type,
    tableNum: tableNum !== undefined ? tableNum : state.tableNum
  })),

  setTip: (amount) => set({ tipAmount: amount }),

  resetCheckout: () => set({
    step: 'idle',
    targetMethod: null,
    orderType: null,
    tableNum: '',
    tipAmount: 0
  }),
}));