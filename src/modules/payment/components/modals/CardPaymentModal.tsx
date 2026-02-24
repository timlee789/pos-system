'use client';

import { useEffect } from 'react';
import { usePaymentStore } from '../../store';
import { ProcessingOverlay } from '@/shared/components/modals/PaymentStatusOverlay';

export default function CardPaymentModal() {
  const { totalAmount, completePayment, failPayment, resetPayment } = usePaymentStore();

  // 실제로는 여기서 Stripe 단말기와 통신합니다. (지금은 3초 후 자동 성공 시뮬레이션)
  useEffect(() => {
    const timer = setTimeout(() => {
      completePayment({
        success: true,
        amountPaid: totalAmount,
        transactionId: `CARD-${Date.now()}`
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return <ProcessingOverlay />;
}