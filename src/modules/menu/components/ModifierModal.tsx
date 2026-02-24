'use client';

import { useState, useEffect } from 'react';
import { MenuItem, ModifierGroup, ModifierItem } from '@/shared/types/common';
import { Button } from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/lib/formatCurrency';

interface Props {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (selectedModifiers: ModifierItem[]) => void;
}

export default function ModifierModal({ item, onClose, onConfirm }: Props) {
  // 선택된 옵션들을 저장하는 State
  const [selectedMods, setSelectedMods] = useState<ModifierItem[]>([]);

  // 옵션 선택/해제 핸들러
  const toggleModifier = (group: ModifierGroup, mod: ModifierItem) => {
    const isMulti = group.maxSelection > 1;
    const isSelected = selectedMods.find((m) => m.id === mod.id);

    if (isMulti) {
      // 다중 선택 (Checkbox)
      if (isSelected) {
        setSelectedMods(prev => prev.filter(m => m.id !== mod.id)); // 제거
      } else {
        setSelectedMods(prev => [...prev, mod]); // 추가
      }
    } else {
      // 단일 선택 (Radio) - 같은 그룹의 다른 옵션 제거 후 추가
      const otherGroupIds = group.options.map(o => o.id);
      setSelectedMods(prev => [
        ...prev.filter(m => !otherGroupIds.includes(m.id)), // 기존 것 제거
        mod // 새 것 추가
      ]);
    }
  };

  // 필수 선택 조건 확인 (Validation)
  const isValid = item.modifierGroups?.every(group => {
    if (group.minSelection === 0) return true;
    // 현재 그룹에서 선택된 옵션 개수 세기
    const count = selectedMods.filter(m => group.options.some(o => o.id === m.id)).length;
    return count >= group.minSelection;
  });

  // 실시간 가격 계산
  const modifiersTotal = selectedMods.reduce((sum, m) => sum + m.price, 0);
  const finalPrice = item.price + modifiersTotal;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]">
      <div className="bg-gray-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-gray-700 flex flex-col shadow-2xl overflow-hidden">

        {/* 헤더 */}
        <div className="p-6 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">{item.name}</h2>
            <p className="text-gray-400 text-lg">Base Price: {formatCurrency(item.price)}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-green-400">{formatCurrency(finalPrice)}</div>
          </div>
        </div>

        {/* 옵션 그룹 리스트 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {item.modifierGroups?.map((group) => (
            <div key={group.id} className="bg-black/30 p-6 rounded-2xl border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">{group.name}</h3>
                <span className={`text-sm font-bold px-3 py-1 rounded ${group.minSelection > 0 ? 'bg-red-900 text-red-200' : 'bg-gray-700 text-gray-400'}`}>
                  {group.minSelection > 0 ? 'REQUIRED' : 'OPTIONAL'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {group.options.map((option) => {
                  const isSelected = selectedMods.some(m => m.id === option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleModifier(group, option)}
                      className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-24
                        ${isSelected
                          ? 'bg-blue-900/50 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                      <span className="text-lg font-bold">{option.name}</span>
                      {option.price > 0 && (
                        <span className="text-green-400 font-bold">+{formatCurrency(option.price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-4">
          <Button variant="secondary" size="xl" onClick={onClose}>Cancel</Button>
          <Button
            size="xl"
            onClick={() => onConfirm(selectedMods)}
            disabled={!isValid} // 필수 조건 안 채우면 비활성화
            className={isValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed'}
          >
            Add to Cart - {formatCurrency(finalPrice)}
          </Button>
        </div>

      </div>
    </div>
  );
}