export function ProcessingOverlay() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-[90%] text-center">
                <div className="mb-6 animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Processing...</h2>
                <p className="text-xl text-gray-600">Please check the Card Reader.</p>
            </div>
        </div>
    );
}

export function SuccessOverlay() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center w-[90%] text-center animate-bounce-in">
                <div className="mb-4 bg-green-100 rounded-full p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-16 h-16 text-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">Thank You!</h2>
                <p className="text-xl text-gray-500 mb-6">Payment Complete.</p>
                <div className="bg-red-50 border-4 border-red-500 p-8 rounded-3xl w-full shadow-xl mt-4">
                    <p className="text-4xl text-gray-900 font-extrabold leading-tight mb-4">🥤 If you ordered a Drink,</p>
                    <p className="text-4xl text-gray-800 font-black leading-snug">
                        Please <span className="block text-6xl text-white bg-red-600 py-6 px-4 rounded-3xl shadow-lg my-6 uppercase tracking-widest animate-pulse">Show Receipt</span> to the cashier for a cup!
                    </p>
                </div>
            </div>
        </div>
    );
}
