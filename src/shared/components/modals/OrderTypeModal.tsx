interface OrderTypeModalProps {
    onSelect: (type: 'dine_in' | 'to_go') => void;
    onCancel: () => void;
}

export default function OrderTypeModal({ onSelect, onCancel }: OrderTypeModalProps) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-[500px] border border-gray-100 text-center shadow-2xl">
                <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Dine In or To Go?</h2>
                <div className="flex flex-col gap-4 mb-8">
                    <button onClick={() => onSelect('dine_in')} className="bg-blue-50 border-2 border-blue-500 text-blue-700 hover:bg-blue-100 rounded-3xl py-8 text-3xl font-black shadow-sm active:scale-95 transition-all flex flex-col items-center gap-2">
                        <span className="text-5xl">🍽️</span> Dine In
                    </button>
                    <button onClick={() => onSelect('to_go')} className="bg-orange-50 border-2 border-orange-500 text-orange-700 hover:bg-orange-100 rounded-3xl py-8 text-3xl font-black shadow-sm active:scale-95 transition-all flex flex-col items-center gap-2">
                        <span className="text-5xl">🛍️</span> To Go
                    </button>
                </div>
                <button onClick={onCancel} className="w-full text-xl font-bold bg-gray-100 text-gray-600 rounded-2xl py-4 hover:bg-gray-200 active:scale-95 transition-all">Cancel</button>
            </div>
        </div>
    );
}
