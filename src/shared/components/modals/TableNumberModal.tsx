import { useState } from 'react';

interface TableNumberModalProps {
    onConfirm: (tableNum: string) => void;
    onCancel: () => void;
}

export default function TableNumberModal({ onConfirm, onCancel }: TableNumberModalProps) {
    const [input, setInput] = useState('');

    const handleNumClick = (num: string) => setInput(prev => prev.length < 4 ? prev + num : prev);
    const handleClear = () => setInput('');
    const handleConfirm = () => { if (input) onConfirm(input); };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-[500px] border border-gray-100 text-center shadow-2xl">
                <h2 className="text-5xl font-black text-gray-900 mb-8 tracking-tight">Table Number</h2>
                <div className="bg-gray-100 text-5xl text-gray-900 p-4 rounded-2xl mb-8 font-bold h-28 flex items-center justify-center border-2 border-gray-200 shadow-inner">
                    {input || '_'}
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} onClick={() => handleNumClick(n.toString())} className="text-4xl font-black bg-gray-50 text-gray-800 rounded-2xl py-8 hover:bg-gray-200 active:scale-95 transition-all shadow-sm border border-gray-200">{n}</button>
                    ))}
                    <button onClick={handleClear} className="text-4xl font-black bg-red-50 text-red-500 rounded-2xl py-8 hover:bg-red-100 active:scale-95 transition-all shadow-sm border border-red-100">C</button>
                    <button onClick={() => handleNumClick('0')} className="text-4xl font-black bg-gray-50 text-gray-800 rounded-2xl py-8 hover:bg-gray-200 active:scale-95 transition-all shadow-sm border border-gray-200">0</button>
                    <button onClick={onCancel} className="text-3xl font-bold bg-gray-100 text-gray-600 rounded-2xl py-8 hover:bg-gray-200 active:scale-95 transition-all">Cancel</button>
                </div>
                <button onClick={handleConfirm} className="w-full text-3xl font-black bg-green-500 text-white rounded-2xl py-6 hover:bg-green-600 active:scale-95 transition-all shadow-md">OK</button>
            </div>
        </div>
    );
}
