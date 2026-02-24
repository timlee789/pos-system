'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { fetchOrders, updateOrder } from '../services/orderApi'; // updateOrder 필요
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';
import { useCartStore } from '@/modules/cart/store';
import { useCheckoutStore } from '@/modules/checkout/store';

// ✨ 상세 모달 import
import OrderDetailModal from './OrderDetailModal'; 

interface Props {
  onClose: () => void;
}

export default function OrderListModal({ onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('open');
  const [isLoading, setIsLoading] = useState(true);
  
  // ✨ 선택된 주문 (상세보기용)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { clearCart, addToCart, setOrderId } = useCartStore();
  const { setOrderInfo } = useCheckoutStore();

  // 주문 목록 불러오기 함수 (재사용을 위해 분리)
  const loadOrders = () => {
    setIsLoading(true);
    fetchOrders().then(data => {
      setOrders(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 탭 필터링 (환불된 내역도 보여주기 위해 조건 수정)
  // 'refunded' 탭을 따로 만들거나, 'paid' 탭에 같이 보여줄 수 있음.
  // 여기서는 탭을 하나 더 추가하겠습니다.
  const filteredOrders = orders.filter(o => o.status === activeTab);

  // Recall (Open Order)
  const handleRecall = (order: Order) => {
    if (confirm(`Recall Order #${order.orderNumber}? Current cart will be cleared.`)) {
      clearCart();
      setOrderId(order.id);
      const safeOrderType = order.type === 'to_go' ? 'to_go' : 'dine_in';
      setOrderInfo(safeOrderType, order.tableNum); 

      order.items.forEach((item: any) => {
        addToCart({
             id: item.id || 'unknown',
             name: item.name,
             price: item.price,
             category: item.category || 'Recalled'
        }, item.quantity, item.selectedModifiers); // 옵션도 복구
      });
      onClose();
    }
  };

  // ✨ Refund 처리 로직
  const handleRefundProcess = async () => {
    if (!selectedOrder) return;

    try {
        console.log(`💸 Processing Refund for Order #${selectedOrder.orderNumber}`);
        
        // 1. DB 업데이트 (Status -> refunded)
        await updateOrder({
            id: selectedOrder.id,
            status: 'refunded'
        });

        // 2. (선택사항) 여기서 Stripe 환불 API 호출 등을 수행

        // 3. UI 갱신
        alert("Refund Successful!");
        setSelectedOrder(null); // 상세 모달 닫기
        loadOrders(); // 리스트 새로고침
    } catch (error) {
        alert("Refund failed. Check console.");
        console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-4xl h-[80vh] rounded-2xl border border-gray-700 flex flex-col shadow-2xl">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">📋 Order History</h2>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-4 text-xl font-bold transition-colors ${activeTab === 'open' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            ⏳ Open
          </button>
          <button 
            onClick={() => setActiveTab('paid')}
            className={`flex-1 py-4 text-xl font-bold transition-colors ${activeTab === 'paid' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            ✅ Paid
          </button>
          {/* ✨ 환불 탭 추가 */}
          <button 
            onClick={() => setActiveTab('refunded')}
            className={`flex-1 py-4 text-xl font-bold transition-colors ${activeTab === 'refunded' ? 'bg-red-900/50 text-red-200' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            ↩️ Refunded
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 mt-10">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">No {activeTab} orders found.</div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.id} 
                onClick={() => {
                    if (activeTab === 'open') handleRecall(order);
                    else setSelectedOrder(order); // ✨ Paid/Refunded는 상세 모달 열기
                }}
                className={`p-6 rounded-xl border-2 flex justify-between items-center transition-all cursor-pointer
                  ${activeTab === 'open' ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : ''}
                  ${activeTab === 'paid' ? 'bg-gray-800 border-gray-700 hover:border-green-500' : ''}
                  ${activeTab === 'refunded' ? 'bg-red-900/10 border-red-900/30 opacity-70 hover:opacity-100' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-gray-700 text-white px-3 py-1 rounded-lg font-bold text-lg">
                      #{order.orderNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.type === 'to_go' && <span className="text-2xl">📞</span>}
                      <span className="text-yellow-400 font-bold text-2xl">
                        {order.tableNum || 'No Name'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm ml-auto">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm pl-1 truncate">
                    {order.items.map((i: any) => `${i.name}`).join(', ')}
                  </div>
                </div>

                <div className="text-right ml-6 min-w-[120px]">
                  <div className="text-2xl font-black text-white">{formatCurrency(order.totalAmount)}</div>
                  {activeTab === 'open' && <div className="text-blue-400 text-sm font-bold mt-1">Click to Pay</div>}
                  {activeTab === 'paid' && <div className="text-green-500 text-sm font-bold mt-1">View Details</div>}
                  {activeTab === 'refunded' && <div className="text-red-400 text-sm font-bold mt-1">Refunded</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✨ 상세 보기 및 환불 모달 */}
      {selectedOrder && (
        <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onRefund={handleRefundProcess} 
        />
      )}

    </div>
  );
}