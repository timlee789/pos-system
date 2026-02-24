import { CartItem } from '@/shared/types/common';

export type OrderStatus = 'open' | 'paid' | 'cancelled' | 'refunded';
export type OrderType = 'dine_in' | 'to_go' | 'delivery';

export interface Order {
  id: string;
  orderNumber: string;    // #101, #102 등 짧은 번호
  status: OrderStatus;
  type: OrderType;
  tableNum?: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;      // ISO Date String
  paymentMethod?: string; // 'CASH', 'CARD'
}