import { NextResponse } from 'next/server';

// 서버 메모리 (임시 DB)
const orders: any[] = [
  // ... 기존 데이터 유지 ...
];

export async function GET() {
  return NextResponse.json({ success: true, orders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber: `${100 + orders.length + 1}`,
    createdAt: new Date().toISOString(),
    ...body
  };
  orders.push(newOrder);
  return NextResponse.json({ success: true, order: newOrder });
}

// ✨ [추가] 주문 수정 (PUT) - Open -> Paid 로 변경할 때 사용
export async function PUT(request: Request) {
  const body = await request.json(); // { id: '...', status: 'paid', ... }
  
  const index = orders.findIndex(o => o.id === body.id);
  
  if (index > -1) {
    // 기존 데이터에 새 데이터 덮어쓰기 (Update)
    orders[index] = { ...orders[index], ...body };
    console.log(`📝 [API] Order #${orders[index].orderNumber} Updated -> ${body.status}`);
    return NextResponse.json({ success: true, order: orders[index] });
  }

  return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
}