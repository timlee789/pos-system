// 1. 개별 옵션 (예: "Medium Rare", "Extra Cheese")
export interface ModifierItem {
  id: string;
  name: string;
  price: number;
}

// 2. 옵션 그룹 (예: "Cooking Temp", "Sides")
export interface ModifierGroup {
  id: string;
  name: string;
  minSelection: number; // 최소 선택 개수 (1이면 필수)
  maxSelection: number; // 최대 선택 개수 (1이면 라디오 버튼, >1이면 체크박스)
  options: ModifierItem[];
}

// 3. 메뉴 아이템 (기존 내용 수정)
export interface MenuItem {
  id: string;
  name: string;
  pos_name?: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  // ✨ [추가] 이 메뉴가 가진 옵션 그룹들
  modifierGroups?: ModifierGroup[];
}

// 4. 장바구니 아이템 (기존 내용 수정)
export interface CartItem extends MenuItem {
  uniqueId: string;
  quantity: number;
  // ✨ [수정] 선택된 옵션들을 저장
  selectedModifiers: ModifierItem[];
  totalPrice: number;
  notes?: string;
}