'use client'; // ✨ [필수] 이 줄이 가장 위에 있어야 합니다.

import React from 'react';
import Link from 'next/link';
// ✨ [수정] next/navigation에서 가져와야 합니다.
import { usePathname, useRouter } from 'next/navigation'; 
import { createBrowserClient } from '@supabase/ssr';

// ... (ADMIN_MENU 배열 등 기존 코드 유지)

const ADMIN_MENU = [
  { name: 'Dashboard', path: '/admin' },
  { name: 'Categories', path: '/admin/categories' },
  { name: 'Menu Items', path: '/admin/menu' },
  { name: 'Modifiers', path: '/admin/modifiers' },
  { name: 'Orders', path: '/admin/orders' },
  { name: 'Employees', path: '/admin/employees' },
  { name: 'Reports', path: '/admin/reports' },
  { name: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-lg shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-wider">Admin</h1>
          <p className="text-xs text-gray-500 mt-1">POS Management</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {ADMIN_MENU.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`block px-6 py-3 transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white font-bold border-r-4 border-blue-400' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link href="/pos" className="block text-center w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors">
            ← Back to POS
          </Link>
          <button 
            onClick={handleLogout}
            className="block text-center w-full py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}