"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getStoreSettingsAction, updateStoreSettingsAction } from './actions';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);

  // 설정 상태값들
  const [isTableRequired, setIsTableRequired] = useState(true);
  const [enableReaderTipping, setEnableReaderTipping] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. 페이지 로드 시 현재 설정 가져오기
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getStoreSettingsAction();
      setIsTableRequired(data.is_table_number_required);
      setEnableReaderTipping(data.enable_on_reader_tipping || false);
    } catch (e: any) {
      console.error("Failed to load settings:", e.message);
    }
    setLoading(false);
  };

  // 2-1. 테이블 번호 토글
  const toggleTableSetting = async () => {
    const newValue = !isTableRequired;
    setIsTableRequired(newValue); // UI 낙관적 업데이트

    try {
      await updateStoreSettingsAction({ is_table_number_required: newValue });
    } catch (e: any) {
      alert("Save failed: " + e.message);
      setIsTableRequired(!newValue); // 실패 시 원복
    }
  };

  // 2-2. 리더기 팁 모드 토글
  const toggleReaderTipping = async () => {
    const newValue = !enableReaderTipping;
    setEnableReaderTipping(newValue);

    try {
      await updateStoreSettingsAction({ enable_on_reader_tipping: newValue });
    } catch (e: any) {
      alert("Save failed: " + e.message);
      setEnableReaderTipping(!newValue);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full bg-gray-50">
      <h1 className="text-3xl font-black mb-8 text-gray-800">⚙️ Store Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-700">Kiosk & POS Configuration</h2>
          <p className="text-sm text-gray-500">Manage how your devices behave.</p>
        </div>

        <div className="p-6 divide-y divide-gray-100">

          {/* 옵션 1: 테이블 번호 입력 여부 */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Require Table Number</h3>
              <p className="text-gray-500 text-sm mt-1">
                When enabled, customers must enter a table number before payment.
              </p>
            </div>
            {/* 토글 스위치 */}
            <button
              onClick={toggleTableSetting}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isTableRequired ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isTableRequired ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          {/* 옵션 2: 팁 받기 방식 설정 */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Enable Reader Tipping (S700)
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">POS Only</span>
              </h3>
              <div className="text-gray-500 text-sm mt-2 space-y-1">
                <p><span className="font-bold text-green-600">ON:</span> Use Stripe Reader (S700) screen for tipping.</p>
                <p><span className="font-bold text-gray-500">OFF:</span> Use POS screen (iPad/PC) for tipping.</p>
              </div>
            </div>
            <button
              onClick={toggleReaderTipping}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enableReaderTipping ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${enableReaderTipping ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}