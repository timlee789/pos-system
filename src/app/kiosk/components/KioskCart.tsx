import { motion, AnimatePresence } from 'framer-motion';

interface ExtendedCartItem {
    name: string;
    uniqueCartId: string;
    groupId?: string;
    totalPrice: number;
    quantity: number;
    selectedModifiers: { name: string; price: number }[];
}

interface KioskCartProps {
    isOpen: boolean;
    onClose: () => void;
    cart: ExtendedCartItem[];
    subtotal: number;
    tax: number;
    cardFee: number;
    grandTotal: number;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    onCheckout: () => void;
}

export default function KioskCart({
    isOpen, onClose, cart, subtotal, tax, cardFee, grandTotal, removeFromCart, clearCart, onCheckout
}: KioskCartProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-[450px] sm:w-[500px] max-w-full bg-white z-[60] shadow-2xl flex flex-col"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <div className="p-4 bg-gray-900 text-white shadow-md flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-extrabold">Your Order</h2>
                                <p className="text-gray-300 text-sm mt-1">{cart.length} items</p>
                            </div>

                            <button
                                onClick={onClose}
                                className="bg-red-600 p-2 rounded-full hover:bg-red-500 transition-colors shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                    <p className="text-xl font-bold">Cart is empty.</p>
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence initial={false} mode='popLayout'>
                                        {cart.map((cartItem) => (
                                            <motion.div
                                                key={cartItem.uniqueCartId} layout
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
                                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-row gap-3 relative z-0"
                                            >
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="font-extrabold text-xl text-gray-900 leading-tight">{cartItem.name}</h4>

                                                    {cartItem.selectedModifiers && cartItem.selectedModifiers.length > 0 && (
                                                        <div className="mt-2 text-sm text-gray-600 font-medium bg-gray-50 p-2 rounded-lg">
                                                            {cartItem.selectedModifiers.map((opt, i) => (
                                                                <span key={i} className="block">+ {opt.name} {opt.price > 0 && `($${opt.price.toFixed(2)})`}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 font-black text-gray-900 text-xl">${cartItem.totalPrice.toFixed(2)}</div>
                                                </div>
                                                <div className="flex flex-col justify-center border-l pl-3 border-gray-100">
                                                    <button onClick={() => removeFromCart(cartItem.uniqueCartId)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <div className="text-right pt-1"><button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 underline font-semibold">Clear All Items</button></div>
                                </>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-5 border-t bg-gray-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0">
                                <div className="space-y-2 mb-4 text-gray-600 font-medium text-sm">
                                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xs"><span>Tax (7%)</span><span>${tax.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xs"><span>Fee (3%)</span><span>${cardFee.toFixed(2)}</span></div>
                                </div>
                                <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-200">
                                    <span className="text-xl font-bold text-gray-800">Total</span>
                                    <span className="text-3xl font-black text-red-600">${grandTotal.toFixed(2)}</span>
                                </div>
                                <button className="w-full h-16 bg-green-600 text-white text-2xl font-black rounded-2xl hover:bg-green-700 shadow-lg active:scale-95 transition-all" onClick={onCheckout}>Pay Now</button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
