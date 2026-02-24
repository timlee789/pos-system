export type PaymentMethod = 'CASH' | 'CARD' | 'PENDING';

export interface PaymentResult {
  success: boolean;
  amountPaid: number;
  change?: number; // 현금일 때만 존재
  transactionId?: string;
  error?: string;
}

// 모든 결제 전략(Strategy) 클래스는 이 형태를 따라야 함
export interface IPaymentStrategy {
  method: PaymentMethod;
  processPayment(amount: number): Promise<PaymentResult>;
}