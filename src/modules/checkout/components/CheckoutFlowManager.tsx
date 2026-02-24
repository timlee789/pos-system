'use client';

import { useEffect } from 'react';
import { useCheckoutStore } from '../store';
import { usePaymentStore } from '@/modules/payment/store';
import { useCartStore } from '@/modules/cart/store'; // 카트 합계 필요

import OrderTypeModal from '@/shared/components/modals/OrderTypeModal';
import TableNumberModal from '@/shared/components/modals/TableNumberModal';
import TipModal from '@/shared/components/modals/TipModal';

export default function CheckoutFlowManager() {
  const { step, targetMethod, tipAmount, resetCheckout, setOrderInfo, setStep, setTip, orderType, tableNum } = useCheckoutStore();
  const { startPayment } = usePaymentStore();
  const { items } = useCartStore();

  // 계산 로직 (유틸로 빼는 게 좋음)
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax + tipAmount; // 팁 포함된 최종 금액

  // [중요] 체크아웃 Step이 'idle'로 돌아왔는데, targetMethod가 남아있다면?
  // -> 모든 정보를 수집했으니 결제를 시작하라는 뜻입니다.
  useEffect(() => {
    if (step === 'idle' && targetMethod) {
      console.log(`🚀 Checkout Complete! Starting Payment: ${targetMethod} / $${total.toFixed(2)}`);

      // 결제 모듈 실행
      startPayment(targetMethod, total);

      // 체크아웃 스토어 초기화 (결제 모듈로 넘어갔으므로)
      resetCheckout();
    }
  }, [step, targetMethod, total, startPayment, resetCheckout]);

  // 단계별 모달 표시
  if (step === 'table-num') {
    return <TableNumberModal
      onConfirm={(num) => {
        setOrderInfo(orderType || 'dine_in', num);
        setStep('order-type');
      }}
      onCancel={resetCheckout}
    />;
  }

  if (step === 'order-type') {
    return <OrderTypeModal
      onSelect={(type) => {
        setOrderInfo(type, tableNum);
        setStep('idle');
      }}
      onCancel={resetCheckout}
    />;
  }

  if (step === 'tip') {
    return <TipModal
      subtotal={subtotal}
      onSelectTip={(amount) => {
        setTip(amount);
        setStep('idle');
      }}
    />;
  }

  return null;
}