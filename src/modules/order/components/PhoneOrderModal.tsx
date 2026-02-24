'use client';

import { useState } from 'react';
import { useCartStore } from '@/modules/cart/store';
import { createOrder } from '../services/orderApi';
import { Button } from '@/shared/components/ui/Button';
import { usePrinter } from '@/modules/hardware/hooks/usePrinter';

interface Props {
  onClose: () => void;
}

export default function PhoneOrderModal({ onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const { items, clearCart } = useCartStore();
  const { printKitchen } = usePrinter(); // 주방 프린터

  const handleKeyClick = (key: string) => {
    setCustomerName(prev => prev + key);
  };

  const handleDelete = () => {
    setCustomerName(prev => prev.slice(0, -1));
  };

  const handleConfirm = async () => {
    if (!customerName.trim()) return alert("Please enter a name.");

    // 1. 주문 데이터 생성 (Status: open)
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderData = {
      status: 'open', // ✨ 핵심: 결제 안 됨
      type: 'to_go',
      tableNum: `To-Go: ${customerName}`,
      items: items,
      totalAmount: subtotal * 1.07,
      paymentMethod: 'PENDING'
    };

    // 2. 가짜 DB에 저장
    await createOrder(orderData as any);

    // 3. 주방으로 주문서 전송
    await printKitchen({
      type: 'KITCHEN',
      items: items,
      total: orderData.totalAmount,
      orderNum: customerName
    });

    // 4. 정리
    clearCart();
    onClose();
    alert(`Phone Order for ${customerName} created!`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 p-8 rounded-[2.5rem] w-full max-w-[800px] border border-gray-700 shadow-2xl">
        <h2 className="text-4xl font-black text-white mb-6 text-center tracking-tight">📞 Phone Order</h2>

        <p className="text-gray-400 mb-2 font-bold text-xl px-2">Customer Name</p>
        <div className="bg-white text-gray-900 text-4xl font-black p-4 rounded-2xl mb-6 border-4 border-gray-600 h-20 flex items-center shadow-inner">
          {customerName ? customerName : <span className="text-gray-300">e.g. John Doe</span>}
        </div>

        {/* On-Screen Keyboard */}
        <div className="bg-gray-800 p-2 rounded-2xl mb-8 border border-gray-700">
          {/* Row 1 */}
          <div className="flex justify-center gap-2 mb-2">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-16 bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex justify-center gap-2 mb-2">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-16 bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
          </div>
          {/* Row 3 */}
          <div className="flex justify-center gap-2 mb-2">
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-16 bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
            <button onClick={handleDelete} className="w-[18%] h-16 bg-red-900/50 hover:bg-red-800 text-red-200 font-bold text-xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
              Delete
            </button>
          </div>
          {/* Row 4 (Space) */}
          <div className="flex justify-center gap-2">
            <button onClick={() => handleKeyClick(' ')} className="w-[60%] h-16 bg-gray-700 hover:bg-gray-600 text-white font-bold text-2xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
              Space
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onClose} className="text-2xl font-bold bg-gray-800 text-gray-300 rounded-2xl py-6 hover:bg-gray-700 active:scale-95 transition-all">Cancel</button>
          <button onClick={handleConfirm} className="text-3xl font-black bg-purple-600 text-white rounded-2xl py-6 hover:bg-purple-500 active:scale-95 transition-all shadow-md">
            Save Open Order
          </button>
        </div>
      </div>
    </div>
  );
}