"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getOrdersAction, updateOrderStatusAction } from './actions';

// 데이터 타입 정의
interface OrderItem {
    item_name: string;
    quantity: number;
    price: number;
    options: any; // JSONB Array: [{name: 'Cheese', price: 1.0}, ...]
    notes?: string;
}

interface Order {
    id: string;
    order_number: string; // 사람이 읽기 쉬운 번호 (#101 등) - DB에 없다면 id 사용
    total_amount: number;
    status: 'pending' | 'paid' | 'completed' | 'refunded' | 'cancelled';
    type: 'dine_in' | 'to_go' | 'delivery';
    table_number: string | null;
    created_at: string;
    payment_method?: string;
    order_items: OrderItem[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Supabase 클라이언트 초기화
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchOrders();

        // 실시간 주문 구독 (INSERT: 새 주문, UPDATE: 상태 변경)
        const channel = supabase
            .channel('realtime_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime update:', payload);
                fetchOrders(); // 변경사항 있으면 새로고침
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrdersAction();
            setOrders(data as any[]);
        } catch (e: any) {
            console.error('Error fetching orders:', e.message);
        } finally {
            setLoading(false);
        }
    };

    // 주문 상태 변경 핸들러
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatusAction(orderId, newStatus);
            fetchOrders(); // UI 갱신
        } catch (e: any) {
            alert("Failed to update status: " + e.message);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // 상태별 색상 헬퍼
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'refunded': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // 필터링된 목록
    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full bg-gray-50 flex flex-col">
            {/* 상단 헤더 & 컨트롤 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
                    <p className="text-gray-500 text-sm">Real-time incoming orders</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchOrders}
                        className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2"
                    >
                        <span>↻</span> Refresh
                    </button>
                </div>
            </div>

            {/* 필터 탭 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'pending', 'paid', 'completed', 'refunded'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors
                            ${filterStatus === status
                                ? 'bg-gray-800 text-white shadow-md'
                                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* 주문 리스트 영역 */}
            {loading ? (
                <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span className="text-4xl mb-2">📭</span>
                    <p className="text-xl text-gray-400 font-bold">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-6 pb-10">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">

                            {/* 카드 헤더 */}
                            <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* 주문 번호 */}
                                    <span className="bg-gray-800 text-white px-3 py-1 rounded-md font-bold text-lg">
                                        #{order.order_number || order.id.slice(0, 4)}
                                    </span>

                                    {/* 테이블/타입 배지 */}
                                    {order.type === 'to_go' ? (
                                        <span className="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                                            🛍️ To-Go
                                            {order.table_number && <span className="text-xs ml-1">({order.table_number})</span>}
                                        </span>
                                    ) : (
                                        <span className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 rounded-lg font-bold">
                                            🍽️ Table {order.table_number || '?'}
                                        </span>
                                    )}

                                    <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                        🕒 {formatDate(order.created_at)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 self-end md:self-auto">
                                    {/* 상태 배지 (클릭 시 변경 가능하게 할 수도 있음) */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>

                                    <span className="text-2xl font-black text-gray-800">
                                        ${order.total_amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* 주문 내용 (Body) */}
                            <div className="p-6">
                                <ul className="space-y-4">
                                    {order.order_items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-400 text-lg">{item.quantity}x</span>
                                                    <span className="font-bold text-gray-800 text-lg">{item.item_name}</span>
                                                </div>

                                                {/* 옵션 표시 */}
                                                {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                                                    <div className="text-sm text-gray-500 mt-1 ml-7 font-medium space-y-0.5">
                                                        {item.options.map((opt: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-1">
                                                                <span className="text-xs text-blue-400">●</span>
                                                                <span>{opt.name}</span>
                                                                {opt.price > 0 && <span className="text-gray-400">(${opt.price})</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 메모 표시 */}
                                                {item.notes && (
                                                    <div className="ml-7 mt-1 text-yellow-600 text-sm italic bg-yellow-50 inline-block px-2 py-0.5 rounded border border-yellow-100">
                                                        📝 {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-bold text-gray-600">
                                                ${item.price.toFixed(2)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 하단 액션 버튼 (Footer) */}
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
                                {order.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                            className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'paid')}
                                            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                        >
                                            Mark as Paid
                                        </button>
                                    </>
                                )}
                                {order.status === 'paid' && (
                                    <>
                                        <button
                                            onClick={() => { if (confirm("Refund this order?")) handleStatusUpdate(order.id, 'refunded') }}
                                            className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            Refund
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                                            className="px-4 py-2 text-sm font-bold bg-green-600 text-white hover:bg-green-700 rounded-lg shadow-sm transition-colors"
                                        >
                                            Complete Order
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}