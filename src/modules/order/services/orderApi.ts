import { Order } from '../types';

const API_URL = '/api/orders';

export const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch(API_URL);
  const data = await res.json();
  return data.orders || [];
};

export const createOrder = async (orderData: Partial<Order>) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return await res.json();
};

// ✨ [추가] 주문 업데이트 함수
export const updateOrder = async (orderData: Partial<Order>) => {
  const res = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return await res.json();
};