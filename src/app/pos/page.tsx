'use client';

import { useState, useEffect } from 'react';
import { getPosMenuAction } from './actions';

import { useCartStore } from '@/modules/cart/store';
import CartView from '@/modules/cart/components/CartView';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';

// ✨ 결제 및 체크아웃 모듈
import PaymentModalRoot from '@/modules/payment/components/modals/PaymentModalRoot';
import { useCheckoutStore } from '@/modules/checkout/store';
import CheckoutFlowManager from '@/modules/checkout/components/CheckoutFlowManager';

// ✨ 주문 모듈
import OrderListModal from '@/modules/order/components/OrderListModal';
import PhoneOrderModal from '@/modules/order/components/PhoneOrderModal';

// ✨ 메뉴 및 옵션 모듈
import ModifierModal from '@/modules/menu/components/ModifierModal';

import { MenuItem, ModifierItem } from '@/shared/types/common';

export default function PosPage() {
  const { addToCart, items } = useCartStore();
  const { startCheckout } = useCheckoutStore();

  const [showOrderList, setShowOrderList] = useState(false);
  const [showPhoneOrder, setShowPhoneOrder] = useState(false);

  // DB에서 가져온 메뉴 상태
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPosMenuAction().then(data => {
      setMenuItems(data.items);
      setCategories(data.categories);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch POS menu", err);
      setLoading(false);
    });
  }, []);

  // ✨ [추가] 옵션 선택을 위한 State (선택된 메뉴가 없으면 null)
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);

  // ✨ [추가] 메뉴 클릭 핸들러 (옵션 유무 확인)
  const handleItemClick = (item: MenuItem) => {
    // 옵션 그룹이 있다면 -> 모달 띄우기
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItemForMod(item);
    } else {
      // 옵션이 없다면 -> 바로 장바구니 담기
      addToCart(item);
    }
  };

  // ✨ [추가] 모달에서 "Add to Cart" 눌렀을 때
  const handleModConfirm = (modifiers: ModifierItem[]) => {
    if (selectedItemForMod) {
      addToCart(selectedItemForMod, 1, modifiers); // 옵션과 함께 담기
      setSelectedItemForMod(null); // 모달 닫기
    }
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      {/* 1. 장바구니 영역 */}
      <div className="w-1/3 h-full flex flex-col border-r border-gray-800">

        {/* 헤더 */}
        <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-xl font-bold">The Grill</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowPhoneOrder(true)} disabled={items.length === 0}>📞 Phone</Button>
            <Button size="sm" variant="outline" onClick={() => setShowOrderList(true)}>📋 Orders</Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <CartView />
        </div>

        {/* 결제 버튼들 */}
        <div className="p-4 bg-gray-900 grid grid-cols-2 gap-4 border-t border-gray-800">
          <Button
            variant="primary" size="lg" disabled={items.length === 0}
            onClick={() => startCheckout('CASH')}
          >
            💵 CASH
          </Button>
          <Button
            variant="primary" size="lg" disabled={items.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => startCheckout('CARD')}
          >
            💳 CARD
          </Button>
        </div>
      </div>

      {/* 2. 카테고리 영역 (세로) */}
      <div className="w-48 h-full flex flex-col border-r border-gray-800 bg-gray-900 shrink-0">
        <h2 className="p-4 text-xl font-bold border-b border-gray-800 shrink-0">Categories</h2>
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
          {!loading && categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`p-5 rounded-2xl text-lg font-bold text-left transition-colors ${activeCategory === cat.name
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
              {cat.name}
            </button>
          ))}
          {!loading && (
            <button
              onClick={() => setActiveCategory('all')}
              className={`p-5 rounded-2xl text-lg font-bold text-left transition-colors mt-auto ${activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
              All Items
            </button>
          )}
        </div>
      </div>

      {/* 3. 메뉴 영역 */}
      <div className="flex-1 p-8 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-4xl font-bold">🍔 Menu</h1>
          <h2 className="text-xl text-gray-400 font-bold">{activeCategory === 'all' ? 'All Items' : activeCategory}</h2>
        </div>

        {loading ? (
          <div className="text-gray-500 font-bold text-xl animate-pulse">Loading menu items...</div>
        ) : menuItems.length === 0 ? (
          <div className="text-gray-500 font-bold text-xl">No menu items found. Please add them in Admin.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {menuItems
              .filter(item => activeCategory === 'all' || item.category === activeCategory)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="bg-gray-900 border border-gray-800 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all active:scale-95 overflow-hidden flex flex-col p-6 min-h-[140px]"
                >
                  <div className="flex-1 flex flex-col justify-start">
                    <h3 className="text-2xl font-black leading-tight mb-1">{item.name}</h3>
                    {item.pos_name && (
                      <p className="text-md text-gray-400 font-bold mb-3">{item.pos_name}</p>
                    )}
                  </div>
                  <div className="mt-auto pt-2">
                    <p className="text-2xl text-green-400 font-black">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 3. 모달 매니저들 */}
      <CheckoutFlowManager />  {/* 체크아웃 정보 수집 (타입/테이블/팁) */}
      <PaymentModalRoot />     {/* 결제 및 영수증 */}

      {showOrderList && <OrderListModal onClose={() => setShowOrderList(false)} />}
      {showPhoneOrder && <PhoneOrderModal onClose={() => setShowPhoneOrder(false)} />}

      {/* ✨ [추가] 옵션 선택 모달 */}
      {selectedItemForMod && (
        <ModifierModal
          item={selectedItemForMod}
          onClose={() => setSelectedItemForMod(null)}
          onConfirm={handleModConfirm}
        />
      )}

    </div>
  );
}