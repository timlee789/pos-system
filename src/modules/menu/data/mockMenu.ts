import { MenuItem, ModifierGroup } from "@/shared/types/common";

// 1. 옵션 그룹 정의
const TEMP_GROUP: ModifierGroup = {
  id: 'g_temp',
  name: 'Cooking Temperature',
  minSelection: 1, // 필수 선택
  maxSelection: 1, // 하나만 선택 가능
  options: [
    { id: 'm_rare', name: 'Rare', price: 0 },
    { id: 'm_med', name: 'Medium', price: 0 },
    { id: 'm_well', name: 'Well Done', price: 0 },
  ]
};

const TOPPING_GROUP: ModifierGroup = {
  id: 'g_topping',
  name: 'Extra Toppings',
  minSelection: 0, // 선택 안 해도 됨
  maxSelection: 5, // 여러 개 선택 가능
  options: [
    { id: 'm_cheese', name: 'Extra Cheese', price: 1.00 },
    { id: 'm_bacon', name: 'Bacon', price: 1.50 },
    { id: 'm_avocado', name: 'Avocado', price: 2.00 },
  ]
};

// 2. 메뉴에 옵션 연결
export const MOCK_MENU_ITEMS: MenuItem[] = [
  { 
    id: '1', 
    name: 'Classic Burger', 
    price: 8.99, 
    category: 'Burgers',
    // ✨ 이 버거는 굽기와 토핑을 선택해야 함
    modifierGroups: [TEMP_GROUP, TOPPING_GROUP] 
  },
  { 
    id: '2', 
    name: 'Cheese Burger', 
    price: 9.99, 
    category: 'Burgers',
    modifierGroups: [TEMP_GROUP] 
  },
  { 
    id: '3', 
    name: 'French Fries', 
    price: 3.99, 
    category: 'Sides' 
    // 옵션 없음
  },
  { 
    id: '4', 
    name: 'Coke', 
    price: 1.99, 
    category: 'Drinks' 
  },
];