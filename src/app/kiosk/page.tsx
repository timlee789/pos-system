'use client';

import { useState, useEffect, useRef } from 'react';
import { getKioskMenuAction } from './actions';
import { MenuItem, ModifierItem } from '@/shared/types/common';
import ItemCard from '@/shared/components/ui/ItemCard';
import KioskCart from './components/KioskCart';
import DayWarningModal from './components/DayWarningModal';
import { ProcessingOverlay, SuccessOverlay } from '@/shared/components/modals/PaymentStatusOverlay';

// Reusing existing modals (ModifierModal only)
import ModifierModal from '@/modules/menu/components/ModifierModal';
import TableNumberModal from '@/shared/components/modals/TableNumberModal';
import OrderTypeModal from '@/shared/components/modals/OrderTypeModal';
import TipModal from '@/shared/components/modals/TipModal';

interface ExtendedCartItem {
    id?: string;
    name: string;
    uniqueCartId: string;
    groupId?: string;
    totalPrice: number;
    quantity: number;
    selectedModifiers: { name: string; price: number }[];
}

export default function KioskPage() {
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Cart & UI State
    const [cart, setCart] = useState<ExtendedCartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    // Modals & Flow State
    const [showDayWarning, setShowDayWarning] = useState(false);
    const [warningTargetDay, setWarningTargetDay] = useState('');

    const [showTableModal, setShowTableModal] = useState(false);
    const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);

    const [currentTableNumber, setCurrentTableNumber] = useState<string>('');
    const [selectedOrderType, setSelectedOrderType] = useState<'dine_in' | 'to_go' | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        getKioskMenuAction().then(data => {
            setCategories(data.categories);
            setItems(data.items);
            if (data.categories.length > 0) {
                setActiveTab(data.categories[0].name);
            }
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch Kiosk menu", err);
            setLoading(false);
        });
    }, []);

    const resetToHome = () => {
        setCart([]);
        setCurrentTableNumber('');
        setSelectedOrderType(null);
        setIsSuccess(false);
        setIsProcessing(false);
        setShowTipModal(false);
        setShowTableModal(false);
        setShowOrderTypeModal(false);
        setShowDayWarning(false);
        setIsCartOpen(false);
        if (categories.length > 0) {
            setActiveTab(categories[0].name);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const resetIdleTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (!isProcessing) { resetToHome(); }
            }, 180000);
        };
        window.addEventListener('click', resetIdleTimer);
        window.addEventListener('touchstart', resetIdleTimer);
        window.addEventListener('scroll', resetIdleTimer);
        resetIdleTimer();
        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', resetIdleTimer);
            window.removeEventListener('touchstart', resetIdleTimer);
            window.removeEventListener('scroll', resetIdleTimer);
        };
    }, [isProcessing, categories]);

    // Derived values
    const filteredItems = items.filter(item => item.category === activeTab);
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.07;
    const cardFee = (subtotal + tax) * 0.03;
    const grandTotal = subtotal + tax + cardFee;

    const handleItemClick = (item: MenuItem) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayIndex = new Date().getDay();
        const todayName = days[todayIndex];
        const targetDay = days.find(day => item.name.includes(day));

        if (targetDay && targetDay !== todayName) {
            setWarningTargetDay(targetDay);
            setShowDayWarning(true);
            return;
        }
        if (!item.modifierGroups || item.modifierGroups.length === 0) {
            handleAddToCart(item, []);
        } else {
            setSelectedItem(item);
        }
    };

    const handleAddToCart = (item: MenuItem, selectedOptions: ModifierItem[]) => {
        const totalPrice = item.price + selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
        const isSpecialSet = item.category === 'Special';
        const currentGroupId = isSpecialSet ? `group-${Date.now()}-${Math.random()}` : undefined;

        const mainCartItem: ExtendedCartItem = {
            id: item.id,
            name: item.name,
            selectedModifiers: selectedOptions,
            totalPrice: totalPrice,
            quantity: 1,
            uniqueCartId: Date.now().toString() + Math.random().toString(),
            groupId: currentGroupId,
        };

        const newCartItems = [mainCartItem];

        // Special logic for combo meals
        if (isSpecialSet) {
            const desc = item.description?.toLowerCase() || '';
            if (desc.includes('fries') || desc.includes('ff')) {
                const friesItem = items.find(i => i.name === '1/2 FF' || i.name === 'French Fries' || i.pos_name === '1/2 FF');
                if (friesItem) newCartItems.push({ id: friesItem.id, name: `(Set) ${friesItem.name}`, selectedModifiers: [], totalPrice: 0, quantity: 1, uniqueCartId: Date.now().toString() + Math.random().toString(), groupId: currentGroupId });
            }
            if (desc.includes('drink')) {
                const drinkItem = items.find(i => i.name === 'Soft Drink' || i.pos_name === 'Soft Drink');
                if (drinkItem) newCartItems.push({ id: drinkItem.id, name: `(Set) ${drinkItem.name}`, selectedModifiers: [], totalPrice: 0, quantity: 1, uniqueCartId: Date.now().toString() + Math.random().toString(), groupId: currentGroupId });
            }
        }
        setCart(prev => [...prev, ...newCartItems]);
        setSelectedItem(null);
        setIsCartOpen(true);
    };

    const removeFromCart = (uniqueId: string) => {
        setCart(prev => {
            const targetItem = prev.find(item => item.uniqueCartId === uniqueId);
            if (targetItem && targetItem.groupId) {
                return prev.filter(item => item.groupId !== targetItem.groupId);
            }
            return prev.filter(item => item.uniqueCartId !== uniqueId);
        });
    };

    // Checkout Flow
    const startCheckout = () => {
        setShowTableModal(true);
    };

    const handleTableNumberConfirm = (tableNum: string) => {
        setCurrentTableNumber(tableNum);
        setShowTableModal(false);
        setIsCartOpen(false);
        setShowOrderTypeModal(true);
    };

    const handleOrderTypeSelect = (type: 'dine_in' | 'to_go') => {
        setSelectedOrderType(type);
        setShowOrderTypeModal(false);
        setShowTipModal(true);
    };

    const handleTipSelect = (tipAmount: number) => {
        setShowTipModal(false);
        processRealPayment(tipAmount);
    };

    const processRealPayment = async (finalTipAmount: number) => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        // Simulate payment processing flow
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            setTimeout(() => { resetToHome(); }, 5000);
        }, 3000);
    };

    return (
        <div className="flex flex-col h-screen w-full bg-gray-800 relative overflow-hidden">

            {/* 1. Header & Categories */}
            <div className="bg-gray-800 border-b border-gray-700 shrink-0 z-30">
                <div className="pt-8 px-6 pb-2 text-center">
                    <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                        The Collegiate Grill
                    </h1>
                    <p className="text-gray-400 font-bold tracking-widest text-sm uppercase mt-1">Since 1947</p>
                </div>

                <div className="flex overflow-x-auto px-4 py-4 gap-3 scrollbar-hide items-center">
                    {!loading && categories.map((cat, index) => {
                        const displayName = cat.name === "Plates & Salads" ? "Salads" : cat.name;
                        return (
                            <button
                                key={cat.id || index}
                                onClick={() => setActiveTab(cat.name)}
                                className={`flex-shrink-0 px-6 h-18 rounded-full text-2xl font-extrabold transition-all shadow-sm border-[3px] whitespace-nowrap
                  ${activeTab === cat.name
                                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'}`}
                            >
                                {displayName}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Items Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
                {loading ? (
                    <div className="flex justify-center pt-20">
                        <p className="text-2xl font-bold text-gray-500 animate-pulse">Loading menu...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 pb-32">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, index) => (
                                <ItemCard
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center pt-20 text-gray-500">
                                <p className="text-2xl font-bold">No items available in this category.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Floating Cart Button */}
            <button
                onClick={() => setIsCartOpen(true)}
                className="absolute top-8 right-6 z-40 bg-gray-800 border-4 border-gray-700 p-4 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center gap-2 w-32 h-32"
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-14 h-14 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>

                    {cart.length > 0 && (
                        <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xl font-black w-10 h-10 flex items-center justify-center rounded-full border-4 border-white shadow-md">
                            {cart.length}
                        </span>
                    )}
                </div>

                {cart.length > 0 && (
                    <span className="font-black text-white text-xl tracking-tight">
                        ${grandTotal.toFixed(0)}
                    </span>
                )}
            </button>

            {/* Cart Drawer */}
            <KioskCart
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                subtotal={subtotal}
                tax={tax}
                cardFee={cardFee}
                grandTotal={grandTotal}
                removeFromCart={removeFromCart}
                clearCart={() => setCart([])}
                onCheckout={startCheckout}
            />

            {/* Modals & Overlays */}
            {selectedItem && (
                <ModifierModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onConfirm={(modifiers) => handleAddToCart(selectedItem, modifiers)}
                />
            )}

            {showTableModal && (
                <TableNumberModal
                    onConfirm={handleTableNumberConfirm}
                    onCancel={() => setShowTableModal(false)}
                />
            )}

            {showOrderTypeModal && (
                <OrderTypeModal
                    onSelect={handleOrderTypeSelect}
                    onCancel={() => setShowOrderTypeModal(false)}
                />
            )}

            {showTipModal && (
                <TipModal
                    subtotal={subtotal}
                    onSelectTip={handleTipSelect}
                // Note: Depending on the actual TipModal implementation, it might need different props or 'onClose'/'onCancel'.
                // Updating this loosely based on POS checkout flow.
                />
            )}

            {showDayWarning && (
                <DayWarningModal
                    targetDay={warningTargetDay}
                    onClose={() => setShowDayWarning(false)}
                />
            )}

            {isProcessing && <ProcessingOverlay />}
            {isSuccess && <SuccessOverlay />}
        </div>
    );
}
