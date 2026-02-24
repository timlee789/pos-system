'use client';

import { useEffect, useRef, useCallback } from 'react'; // ✨ useRef, useCallback 추가
import { usePaymentStore } from '../../store';
import { useCartStore } from '@/modules/cart/store';
import { usePrinter } from '@/modules/hardware/hooks/usePrinter';
import { createOrder, updateOrder } from '@/modules/order/services/orderApi'; // ✨ API 가져오기
import { useCheckoutStore } from '@/modules/checkout/store';
import CashPaymentModal from './CashPaymentModal';
import CardPaymentModal from './CardPaymentModal';
import { SuccessOverlay } from '@/shared/components/modals/PaymentStatusOverlay';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';

export default function PaymentModalRoot() {
  const { activeMethod, status, result, resetPayment } = usePaymentStore();
  const { items, clearCart, currentOrderId } = useCartStore();
  const { printReceipt, openDrawer } = usePrinter();
  const { tableNum, orderType, tipAmount } = useCheckoutStore();

  // ✨ 중복 저장 방지용 Ref
  const hasSavedOrder = useRef(false);

  useEffect(() => {
    // 성공 상태이고, 결과가 있으며, 아직 저장하지 않았을 때만 실행
    if (status === 'success' && result && !hasSavedOrder.current) {
      hasSavedOrder.current = true;

      const saveOrderToDb = async () => {
        // 1. 공통 저장 데이터 생성
        const orderPayload = {
          status: 'paid',
          // ✨ Store에서 가져온 값 사용 (없으면 기본값)
          type: orderType || 'dine_in',
          tableNum: tableNum || 'Quick Order',
          items: items,
          totalAmount: result.amountPaid - (result.change || 0), // [수정] 거스름돈을 제하고 실제 상품 가격 총합만 저장
          paymentMethod: activeMethod || 'CASH'
        };

        if (currentOrderId) {
          // ✨ [UPDATE] 기존 Open Order가 있다면 -> Paid로 상태 업데이트
          console.log(`🔄 Updating Existing Order #${currentOrderId} to PAID`);
          await updateOrder({
            id: currentOrderId,
            ...orderPayload
          } as any);
        } else {
          // ✨ [CREATE] 기존 주문이 없다면 -> 새로 생성
          console.log("💾 Creating New Paid Order");
          // orderPayload 안에 이미 type, tableNum이 들어있으므로 그대로 전달
          await createOrder(orderPayload as any);
        }
      };

      saveOrderToDb();

      // 2. 돈통 열기 (현금인 경우)
      if (activeMethod === 'CASH') {
        openDrawer();
      }
    }

    // 모달이 닫히거나 상태가 초기화되면 Ref도 초기화 (중복 저장 방지 해제)
    if (status === 'idle') {
      hasSavedOrder.current = false;
    }

    // ✨ [핵심 수정] orderType과 tableNum을 의존성 배열에 꼭 추가해야 최신 값을 가져옵니다!
  }, [status, result, activeMethod, openDrawer, items, currentOrderId, orderType, tableNum]);

  const handleClose = useCallback(() => {
    clearCart();     // 장바구니 비우기
    resetPayment();  // 결제 상태 초기화
  }, [clearCart, resetPayment]);

  // ✨ 카드 결제 성공 시 자동 닫기 타이머 (Kiosk 와 똑같이)
  useEffect(() => {
    if (status === 'success' && result && activeMethod === 'CARD') {
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, result, activeMethod, handleClose]);

  const handlePrintAndClose = async () => {
    if (result) {
      await printReceipt({
        type: 'RECEIPT',
        items: items, // *주의: clearCart 전에 보내야 함
        total: result.amountPaid,
        transactionId: result.transactionId
      });
    }
    handleClose();
  };

  // --- 화면 렌더링 ---

  if (status === 'success' && result) {
    if (activeMethod === 'CARD') {
      return (
        <div onClick={handleClose}>
          <SuccessOverlay />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50">
        <div className="text-center text-white bg-gray-900 p-10 rounded-3xl border border-gray-700 shadow-2xl animate-in zoom-in duration-200">
          <h1 className="text-6xl mb-4">✅ Paid!</h1>
          <p className="text-3xl mb-8 text-yellow-400 font-bold">
            Change: {result.change ? formatCurrency(result.change) : '$0.00'}
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={handlePrintAndClose}>
              🖨️ Print Receipt
            </Button>
            <Button size="lg" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeMethod === 'CASH') return <CashPaymentModal />;
  if (activeMethod === 'CARD') return <CardPaymentModal />;

  return null;
}