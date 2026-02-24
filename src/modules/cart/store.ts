import { create } from 'zustand';
import { CartItem, MenuItem, ModifierItem } from '@/shared/types/common';

interface CartState {
  items: CartItem[];
  currentOrderId: string | null; // 현재 불러온 주문의 ID (Recall용)

  // 장바구니 조작 함수들
  addToCart: (item: MenuItem, quantity?: number, selectedModifiers?: ModifierItem[]) => void;
  removeFromCart: (uniqueId: string) => void;
  clearCart: () => void;
  updateQuantity: (uniqueId: string, delta: number) => void;
  updateNotes: (uniqueId: string, notes: string) => void; // ✨ 메모 업데이트
  setOrderId: (id: string | null) => void; // 주문 ID 설정
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  currentOrderId: null,

  addToCart: (menuItem, quantity = 1, selectedModifiers = []) => set((state) => {
    // 1. 가격 계산 (기본가 + 옵션 가격 총합)
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    const finalUnitPrice = menuItem.price + modifiersTotal;

    // 2. 옵션 구성 "지문(Fingerprint)" 생성 (비교용)
    // ID들을 정렬해서 합치면, 순서가 달라도 같은 옵션 구성인지 알 수 있음
    const newModsFingerprint = selectedModifiers.map(m => m.id).sort().join('|');

    // 3. 이미 완전히 똑같은 아이템(메뉴ID + 옵션구성)이 있는지 확인
    const existingItemIndex = state.items.findIndex(i => {
        const existingModsFingerprint = i.selectedModifiers.map(m => m.id).sort().join('|');
        return i.id === menuItem.id && existingModsFingerprint === newModsFingerprint;
    });

    // Case A: 이미 있으면 수량만 증가
    if (existingItemIndex > -1) {
       const newItems = [...state.items];
       const item = newItems[existingItemIndex];
       
       item.quantity += quantity;
       // 수량이 늘었으니 총 가격도 재계산 (단가 * 수량)
       item.totalPrice = finalUnitPrice * item.quantity; 
       
       return { items: newItems };
    }

    // Case B: 새 아이템 추가
    const newItem: CartItem = {
      ...menuItem,
      // uniqueId를 더 확실하게 생성 (시간 + 랜덤)
      uniqueId: `${menuItem.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      quantity,
      selectedModifiers: selectedModifiers, // 옵션 저장
      totalPrice: finalUnitPrice * quantity, // 옵션 포함 가격 저장
      notes: '' // 초기값 빈 문자열
    };
    return { items: [...state.items, newItem] };
  }),

  removeFromCart: (uniqueId) => set((state) => ({
    items: state.items.filter((i) => i.uniqueId !== uniqueId),
  })),

  clearCart: () => set({ items: [], currentOrderId: null }),

  updateQuantity: (uniqueId, delta) => set((state) => {
     return {
        items: state.items.map(item => {
           if(item.uniqueId === uniqueId) {
              const newQty = Math.max(1, item.quantity + delta);
              
              // 수량 변경 시 옵션 가격도 포함해서 재계산
              const modifiersTotal = item.selectedModifiers.reduce((sum, m) => sum + m.price, 0);
              const unitPrice = item.price + modifiersTotal;

              return { ...item, quantity: newQty, totalPrice: unitPrice * newQty };
           }
           return item;
        })
     };
  }),

  // ✨ 메모 업데이트 구현
  updateNotes: (uniqueId, notes) => set((state) => ({
    items: state.items.map((item) => 
      item.uniqueId === uniqueId ? { ...item, notes } : item
    )
  })),

  setOrderId: (id) => set({ currentOrderId: id }),
}));