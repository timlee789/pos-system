import { motion } from 'framer-motion';

export default function DayWarningModal({ targetDay, onClose }: { targetDay: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-2xl">
                <div className="mb-6 flex justify-center text-orange-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-24 h-24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4">Are you sure?</h2>
                <p className="text-2xl text-gray-600 mb-8 leading-tight">This item is a Special for <strong>{targetDay}</strong>.</p>
                <div className="flex flex-col gap-4">
                    <button onClick={onClose} className="w-full h-20 text-3xl font-bold bg-gray-100 text-gray-700 rounded-3xl active:scale-95 transition-all">Go Back</button>
                    {/* <button onClick={onProceed} className="w-full h-20 text-2xl font-bold bg-orange-100 text-orange-700 rounded-3xl active:scale-95 transition-all">Order Anyway</button> */}
                </div>
            </motion.div>
        </div>
    );
}
