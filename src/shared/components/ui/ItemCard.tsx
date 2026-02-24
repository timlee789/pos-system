import { MenuItem } from "@/shared/types/common";
import { formatCurrency } from "@/shared/lib/formatCurrency";

interface ItemCardProps {
    item: MenuItem;
    onClick: () => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white border text-gray-900 rounded-2xl cursor-pointer shadow-sm hover:shadow-lg transition-all active:scale-95 overflow-hidden flex flex-col p-4 min-h-[160px]"
        >
            {item.image_url && (
                <div className="aspect-square w-full bg-gray-100 rounded-xl mb-3 overflow-hidden relative shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
            )}
            <div className="flex-1 flex flex-col justify-start">
                <h3 className="text-xl font-black leading-tight mb-1">{item.name}</h3>
                {item.description && (
                    <p className="text-sm text-gray-500 font-medium mb-2 line-clamp-2">{item.description}</p>
                )}
            </div>
            <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-end">
                <p className="text-xl font-black text-gray-900">{formatCurrency(item.price)}</p>
                <div className="bg-red-50 text-red-600 w-8 h-8 rounded-full flex items-center justify-center -mr-1 -mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
