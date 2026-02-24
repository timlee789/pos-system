"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

// 타입 정의
interface DashboardStats {
  totalSales: number;
  orderCount: number;
  pendingCount: number;
  completedCount: number;
}

interface RecentOrder {
  id: string;
  order_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  type: string;
  table_number: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    orderCount: 0,
    pendingCount: 0,
    completedCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchDashboardData();

    // 실시간 주문 감지
    const channel = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 오늘 날짜 범위 (UTC 기준 단순화)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, type, table_number')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching dashboard:", error);
    } else if (orders) {
      // 통계 계산
      const totalSales = orders
        .filter(o => o.status === 'paid' || o.status === 'completed')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
      
      setStats({
        totalSales,
        orderCount: orders.length,
        pendingCount,
        completedCount: orders.filter(o => o.status === 'completed').length
      });

      setRecentOrders(orders.slice(0, 5));
    }
    setLoading(false);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full bg-gray-50">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">👋 Welcome Back, Manager!</h1>
        <p className="text-gray-500 mt-1">Here is what's happening in your restaurant today.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* 1. 통계 카드 (KPI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
              <span className="text-3xl font-black text-green-600 mt-1">${stats.totalSales.toFixed(2)}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <span className="text-3xl font-black text-blue-600 mt-1">{stats.orderCount}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active / Pending</span>
              <span className="text-3xl font-black text-orange-500 mt-1">{stats.pendingCount}</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Completed</span>
              <span className="text-3xl font-black text-gray-600 mt-1">{stats.completedCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. 바로가기 (Quick Links) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/orders" className="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col justify-between h-40">
                <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center text-xl backdrop-blur-sm">🧾</div>
                <div>
                  <h3 className="text-xl font-bold group-hover:translate-x-1 transition-transform">Live Orders</h3>
                  <p className="text-blue-100 text-sm opacity-90">View and manage incoming orders.</p>
                </div>
              </Link>

              <Link href="/admin/menu" className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between h-40">
                <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl">🍔</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:translate-x-1 transition-transform">Menu Management</h3>
                  <p className="text-gray-500 text-sm">Update prices and items.</p>
                </div>
              </Link>

              <Link href="/admin/reports" className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between h-40">
                <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl">📊</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:translate-x-1 transition-transform">Sales Reports</h3>
                  <p className="text-gray-500 text-sm">Analyze your daily earnings.</p>
                </div>
              </Link>

              <Link href="/admin/settings" className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:border-gray-500 hover:shadow-md transition-all flex flex-col justify-between h-40">
                <div className="bg-gray-100 text-gray-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl">⚙️</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:translate-x-1 transition-transform">Settings</h3>
                  <p className="text-gray-500 text-sm">Configure printers & devices.</p>
                </div>
              </Link>
            </div>

            {/* 3. 최근 주문 내역 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>Recent Orders</span>
                <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">View All</Link>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-10 text-sm">No orders today.</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">#{order.order_number || '---'}</span>
                          {order.type === 'to_go' ? (
                            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-bold">To Go</span>
                          ) : (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold">Table {order.table_number}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                        <span className={`text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'text-green-500' :
                          order.status === 'pending' ? 'text-yellow-500' : 'text-blue-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}