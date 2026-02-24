'use client';

import { useState } from 'react';
import { useCartStore } from '../store';
import { formatCurrency } from '@/shared/lib/formatCurrency';
import { Button } from '@/shared/components/ui/Button';
import NoteModal from './NoteModal'; // ✨ 추가된 모달

export default function CartView() {
  const { items, removeFromCart, clearCart, updateQuantity, updateNotes } = useCartStore();

  // ✨ 메모 수정 중인 아이템 ID 저장
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  // 메모 저장 핸들러
  const handleSaveNote = (note: string) => {
    if (editingItemId) {
      updateNotes(editingItemId, note);
      setEditingItemId(null);
    }
  };

  // 현재 수정 중인 아이템 찾기
  const activeItem = items.find(i => i.uniqueId === editingItemId);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 text-white">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold">🛒 Order</h2>
        <Button variant="secondary" size="sm" onClick={clearCart} disabled={items.length === 0}>
          Clear All
        </Button>
      </div>

      {/* 아이템 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">Cart is empty</div>
        ) : (
          items.map((item) => (
            <div key={item.uniqueId} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm">
              
              {/* 1. 상단: 상품 정보 및 수량 조절 */}
              <div className="p-3 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                    <span className="font-bold text-blue-400 ml-2">{formatCurrency(item.totalPrice)}</span>
                  </div>
                  
                  {/* 옵션 표시 */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="mt-1 text-sm text-gray-400">
                      {item.selectedModifiers.map((mod) => (
                        <span key={mod.id} className="block">
                          + {mod.name} {mod.price > 0 && `(${formatCurrency(mod.price)})`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ✨ 메모 표시 (있을 때만) */}
                  {item.notes && (
                    <div className="mt-2 bg-yellow-900/30 text-yellow-200 text-sm p-2 rounded border border-yellow-700/50 flex items-start">
                        <span className="mr-1">📝</span>
                        <span className="italic">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. 중단: 수량 조절 (크고 누르기 쉽게) */}
              <div className="flex items-center justify-between bg-gray-800/50 px-3 pb-3">
                  <div className="flex items-center gap-4 bg-gray-900 rounded-lg p-1 border border-gray-700">
                     <button onClick={() => updateQuantity(item.uniqueId, -1)} className="w-10 h-10 bg-gray-800 rounded hover:bg-gray-700 text-xl font-bold">-</button>
                     <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                     <button onClick={() => updateQuantity(item.uniqueId, 1)} className="w-10 h-10 bg-gray-800 rounded hover:bg-gray-700 text-xl font-bold">+</button>
                  </div>
              </div>

              {/* 3. 하단: 메모 & 삭제 버튼 (꽉 찬 버튼) */}
              <div className="grid grid-cols-2 border-t border-gray-700 divide-x divide-gray-700">
                <button 
                  onClick={() => setEditingItemId(item.uniqueId)}
                  className="py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  📝 Memo
                </button>
                <button 
                  onClick={() => removeFromCart(item.uniqueId)}
                  className="py-3 bg-red-900/20 hover:bg-red-900/50 text-red-400 hover:text-red-200 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  🗑️ Remove
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 결제 요약 (Footer) */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-2 shrink-0">
        <div className="flex justify-between text-gray-400 text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-400 text-sm">
          <span>Tax (7%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-2xl font-black text-white pt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* ✨ 메모 모달 (조건부 렌더링) */}
      {editingItemId && activeItem && (
        <NoteModal 
          itemName={activeItem.name}
          initialNote={activeItem.notes || ''}
          onClose={() => setEditingItemId(null)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}