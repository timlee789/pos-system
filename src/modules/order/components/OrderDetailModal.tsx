'use client';

import { Order } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';

interface Props {
  order: Order;
  onClose: () => void;
  onRefund: () => void; // 환불 실행 함수
}

export default function OrderDetailModal({ order, onClose, onRefund }: Props) {
  
  // 환불 확인 핸들러
  const handleRefundClick = () => {
    if (confirm(`Are you sure you want to refund Order #${order.orderNumber}?`)) {
      onRefund();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 w-[500px] rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-800 bg-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Order #{order.orderNumber}</h2>
              <p className="text-gray-400 text-sm mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className={`px-3 py-1 rounded text-sm font-bold border 
              ${order.status === 'paid' ? 'bg-green-900/30 border-green-700 text-green-400' : 
                order.status === 'refunded' ? 'bg-red-900/30 border-red-700 text-red-400' : 'text-white'}`}>
              {order.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* 주문 내역 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 테이블/타입 정보 */}
          <div className="bg-gray-800 p-4 rounded-xl mb-4">
             <div className="flex justify-between text-gray-300 mb-1">
                <span>Type:</span>
                <span className="font-bold text-white uppercase">{order.type.replace('_', ' ')}</span>
             </div>
             <div className="flex justify-between text-gray-300">
                <span>Table/Name:</span>
                <span className="font-bold text-yellow-400">{order.tableNum}</span>
             </div>
          </div>

          {/* 메뉴 리스트 */}
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="border-b border-gray-800 pb-2 last:border-0">
                <div className="flex justify-between text-white text-lg">
                  <span>{item.name} <span className="text-gray-500 text-sm">x{item.quantity}</span></span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
                {/* 옵션 표시 */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <div className="text-sm text-gray-500 ml-2">
                    {item.selectedModifiers.map(m => (
                      <div key={m.id}>+ {m.name}</div>
                    ))}
                  </div>
                )}
                {/* 메모 표시 */}
                {item.notes && (
                    <div className="text-sm text-yellow-600 ml-2 italic">📝 {item.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 합계 및 버튼 */}
        <div className="p-6 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-between text-2xl font-black text-white mb-6">
            <span>Total Paid</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            
            {/* 환불 버튼은 'paid' 상태일 때만 보임 */}
            {order.status === 'paid' && (
                <Button 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold" 
                    onClick={handleRefundClick}
                >
                    💸 Refund
                </Button>
            )}
             {order.status === 'refunded' && (
                <Button disabled className="bg-gray-700 text-gray-500 cursor-not-allowed">
                    Already Refunded
                </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}