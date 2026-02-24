'use client';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';

interface Props {
  itemName: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function NoteModal({ itemName, initialNote, onClose, onSave }: Props) {
  const [note, setNote] = useState(initialNote);

  // 자주 쓰는 상용구 (필요하면 추가/수정 가능)
  const quickNotes = ["No Onion", "Sauce on side", "Extra Spicy", "No Ice", "To Go"];

  const handleQuickNote = (text: string) => {
    setNote(prev => prev ? `${prev}, ${text}` : text);
  };

  const handleKeyClick = (key: string) => {
    setNote(prev => prev + key);
  };

  const handleDelete = () => {
    setNote(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
      <div className="bg-gray-900 w-full max-w-[800px] p-8 rounded-[2.5rem] border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-4">Memo for <span className="text-blue-400">{itemName}</span></h2>

        {/* 입력창 대신 표시 영역 */}
        <div className="w-full min-h-[5rem] bg-white text-gray-900 text-3xl font-black p-4 rounded-xl mb-4 border-4 border-gray-600 shadow-inner flex items-center flex-wrap">
          {note ? note : <span className="text-gray-300">Type special requests here...</span>}
        </div>

        {/* 상용구 버튼들 (옵션) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickNotes.map(q => (
            <button
              key={q}
              onClick={() => handleQuickNote(q)}
              className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-4 py-3 rounded-xl text-lg font-bold border border-blue-800/50 shadow-sm active:scale-95 transition-all"
            >
              {q}
            </button>
          ))}
          <button onClick={() => setNote('')} className="bg-red-900/50 text-red-300 px-4 py-3 rounded-xl text-lg font-bold border border-red-900/50 shadow-sm active:scale-95 transition-all">Clear All</button>
        </div>

        {/* On-Screen Keyboard */}
        <div className="bg-gray-800 p-2 rounded-2xl mb-6 border border-gray-700">
          {/* Row 1 */}
          <div className="flex justify-center gap-2 mb-2">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-14 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
          </div>
          {/* Row 2 */}
          <div className="flex justify-center gap-2 mb-2">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-14 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
          </div>
          {/* Row 3 */}
          <div className="flex justify-center gap-2 mb-2">
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button key={key} onClick={() => handleKeyClick(key)} className="w-[8.5%] h-14 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
                {key}
              </button>
            ))}
            <button onClick={handleDelete} className="w-[18%] h-14 bg-red-900/50 hover:bg-red-800 text-red-200 font-bold text-lg rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
              Delete
            </button>
          </div>
          {/* Row 4 (Space) */}
          <div className="flex justify-center gap-2">
            <button onClick={() => handleKeyClick(' ')} className="w-[60%] h-14 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xl rounded-xl active:scale-95 transition-transform shadow-sm flex items-center justify-center">
              Space
            </button>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(note)}>Save Note</Button>
        </div>
      </div>
    </div>
  );
}