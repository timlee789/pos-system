'use client';

import { useState } from 'react';
import { usePaymentStore } from '../../store';
import { usePrinter } from '@/modules/hardware/hooks/usePrinter';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';

export default function CashPaymentModal() {
  const { totalAmount, completePayment, resetPayment } = usePaymentStore();
  const { openDrawer } = usePrinter();
  const [receivedAmount, setReceivedAmount] = useState('');

  const handleNumClick = (val: string) => {
    if (val === '.' && receivedAmount.includes('.')) return;
    setReceivedAmount(prev => prev + val);
  };

  const handleClear = () => setReceivedAmount('');

  const received = parseFloat(receivedAmount) || 0;
  const change = received - totalAmount;

  const handleConfirm = () => {
    if (change < 0) return;

    // 결제 시점에 현금 돈통(Drawer) 열기 명령 전송
    openDrawer();

    // 결제 완료 처리
    completePayment({
      success: true,
      amountPaid: received,
      change: change,
      transactionId: `CASH-${Date.now()}`
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-8 rounded-[2.5rem] w-full max-w-[500px] border border-gray-700 shadow-2xl">
        <h2 className="text-4xl font-black text-white mb-6 text-center tracking-tight">💵 Cash Payment</h2>

        <div className="flex justify-between items-center mb-6 bg-gray-800 p-6 rounded-2xl">
          <span className="text-gray-400 text-2xl font-bold">Total Due</span>
          <span className="text-5xl font-black text-blue-400">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="bg-white text-gray-900 text-5xl font-black p-4 rounded-2xl mb-2 text-right border-4 border-gray-600 h-24 flex items-center justify-end shadow-inner">
          {receivedAmount ? `$${receivedAmount}` : <span className="text-gray-300 text-3xl">Enter Amount</span>}
        </div>

        <div className="flex justify-between items-center mb-8 px-4">
          <span className="text-gray-400 text-xl font-bold">Change</span>
          <span className={`text-4xl font-black ${change >= 0 ? 'text-green-400' : 'text-gray-600'}`}>
            {change >= 0 ? formatCurrency(change) : '$0.00'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(n => (
            <button
              key={n}
              onClick={() => handleNumClick(n)}
              className="text-4xl font-black bg-gray-800 border-2 border-gray-700 text-white rounded-2xl py-6 hover:bg-gray-700 active:scale-95 transition-all shadow-sm"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="text-4xl font-black bg-red-900/50 text-red-400 border-2 border-red-900/50 rounded-2xl py-6 hover:bg-red-800 hover:text-white active:scale-95 transition-all shadow-sm"
          >
            C
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={resetPayment} className="text-2xl font-bold bg-gray-800 text-gray-300 rounded-2xl py-6 hover:bg-gray-700 active:scale-95 transition-all w-full">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={change < 0 || isNaN(change)}
            className={`text-3xl font-black rounded-2xl py-6 transition-all shadow-md w-full ${change >= 0 ? 'bg-green-600 text-white hover:bg-green-500 active:scale-95' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}