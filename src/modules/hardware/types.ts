import { CartItem } from '@/shared/types/common';

export interface PrintJob {
  type: 'RECEIPT' | 'KITCHEN';
  items: CartItem[];
  total: number;
  transactionId?: string;
  orderNum?: string;
}

export interface PrinterConfig {
  serverUrl: string; // "http://localhost:4000"
}