interface TipModalProps {
    subtotal: number;
    onSelectTip: (amount: number) => void;
}

export default function TipModal({ subtotal, onSelectTip }: TipModalProps) {
    const totalWithTax = subtotal * 1.07; // Tax 7%

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-[600px] border border-gray-100 text-center shadow-2xl">
                <div className="bg-yellow-50 text-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Add a Tip?</h2>
                <p className="text-2xl text-gray-500 font-bold mb-8">Amount to base tip: <span className="text-gray-900">${totalWithTax.toFixed(2)}</span></p>

                <div className="grid grid-cols-2 gap-4">
                    {[0.10, 0.15, 0.20].map(pct => (
                        <button key={pct} onClick={() => onSelectTip(totalWithTax * pct)} className="bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-500 rounded-3xl py-8 flex flex-col items-center gap-2 active:scale-95 transition-all">
                            <span className="text-3xl font-black text-gray-800">{pct * 100}%</span>
                            <span className="text-lg text-gray-500 font-bold">${(totalWithTax * pct).toFixed(2)}</span>
                        </button>
                    ))}
                    <button onClick={() => onSelectTip(0)} className="flex items-center justify-center text-3xl font-black bg-red-50 text-red-600 rounded-3xl py-8 hover:bg-red-100 active:scale-95 transition-all border-2 border-red-100">No Tip</button>
                </div>
            </div>
        </div>
    );
}
