"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getCategoriesAction, getMenuItemsAction, addMenuItemAction, updateMenuItemAction, deleteMenuItemAction, updateMenuItemImageAction, reorderMenuItemsAction, uploadMenuImageAction } from './actions';

// 타입 정의
interface MenuItem {
    id: string;
    name: string;
    pos_name?: string | null; // POS 전용 짧은 이름
    price: number;
    description: string | null;
    is_available: boolean;
    category_id: string;
    image_url: string | null;
    sort_order: number;
    restaurant_id?: string;
    is_kiosk_visible?: boolean;
    is_pos_visible?: boolean;
}

interface Category {
    id: string;
    name: string;
    sort_order: number;
    restaurant_id?: string;
}

export default function AdminMenuPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
    const [items, setItems] = useState<MenuItem[]>([]);

    // 편집 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<MenuItem>>({});

    // 초기 로딩
    useEffect(() => {
        fetchCategories();
    }, []);

    // 카테고리 선택 시 아이템 로딩
    useEffect(() => {
        if (selectedCatId) fetchItems(selectedCatId);
        else setItems([]);
    }, [selectedCatId]);

    // ---------------------------------------------------------
    // Fetch Data
    // ---------------------------------------------------------
    const fetchCategories = async () => {
        try {
            const data = await getCategoriesAction();
            if (data && data.length > 0) {
                setCategories(data);
                // 첫 번째 카테고리 자동 선택 (선택된 게 없을 때만)
                if (!selectedCatId) setSelectedCatId(data[0].id);
            }
        } catch (e: any) {
            console.error(e);
        }
    };

    const fetchItems = async (catId: string) => {
        try {
            const data = await getMenuItemsAction(catId);
            setItems(data);
        } catch (e: any) {
            console.error(e);
        }
    };

    // ---------------------------------------------------------
    // Handlers (Create / Update / Delete)
    // ---------------------------------------------------------
    const handleAddNewItem = async () => {
        if (!selectedCatId) return alert("Select a category first.");
        const name = prompt("Enter new Item Name:");
        if (!name) return;

        // 현재 카테고리의 마지막 순서 찾기
        const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order || 0)) : 0;

        // 레스토랑 ID 찾기
        const currentCat = categories.find(c => c.id === selectedCatId);

        try {
            await addMenuItemAction({
                restaurant_id: currentCat?.restaurant_id, // 카테고리의 식당 ID 상속
                category_id: selectedCatId,
                name: name,
                pos_name: '', // 초기값 빈 문자열
                price: 0,
                description: '',
                is_available: true,
                sort_order: maxOrder + 1,
                is_kiosk_visible: true,
                is_pos_visible: true
            });
            fetchItems(selectedCatId);
        } catch (e: any) {
            alert("Error adding item: " + e.message);
        }
    };

    const startEditing = (item: MenuItem) => {
        setEditingId(item.id);
        setEditForm({
            ...item,
            description: item.description || '',
            pos_name: item.pos_name || '',
            is_kiosk_visible: item.is_kiosk_visible ?? true,
            is_pos_visible: item.is_pos_visible ?? true
        });
    };

    const saveItem = async () => {
        if (!editingId) return;
        if (!editForm.name) return alert("Name is required");

        try {
            await updateMenuItemAction(editingId, {
                name: editForm.name,
                pos_name: editForm.pos_name,
                description: editForm.description,
                price: typeof editForm.price === 'string' ? parseFloat(editForm.price) : editForm.price,
                is_available: editForm.is_available,
                category_id: editForm.category_id, // 카테고리 이동 가능
                is_kiosk_visible: editForm.is_kiosk_visible,
                is_pos_visible: editForm.is_pos_visible
            });
            setEditingId(null);
            if (selectedCatId) fetchItems(selectedCatId);
        } catch (e: any) {
            alert("Error saving: " + e.message);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Delete this item? This action cannot be undone.")) return;
        try {
            await deleteMenuItemAction(itemId);
            if (selectedCatId) fetchItems(selectedCatId);
        } catch (e: any) {
            alert("Error deleting: " + e.message);
        }
    };

    // ---------------------------------------------------------
    // Image Upload
    // ---------------------------------------------------------
    const handleImageUpload = async (itemId: string, file: File) => {
        if (!confirm("Upload and replace image?")) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            await uploadMenuImageAction(itemId, formData);
            alert("Image uploaded!");
            if (selectedCatId) fetchItems(selectedCatId);
        } catch (e: any) {
            alert("Failed to upload image: " + e.message);
        }
    };

    // ---------------------------------------------------------
    // Reorder Items
    // ---------------------------------------------------------
    const handleMoveItem = async (index: number, direction: 'prev' | 'next') => {
        if (direction === 'prev' && index === 0) return;
        if (direction === 'next' && index === items.length - 1) return;

        const targetIndex = direction === 'prev' ? index - 1 : index + 1;

        // 1. UI Optimistic Update
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        setItems(newItems);

        // 2. DB Update (Batch Update sort_order)
        // 두 아이템의 sort_order를 서로 교환하는 것이 가장 안전함
        const itemA = items[index];
        const itemB = items[targetIndex];

        const orderA = itemA.sort_order || 0;
        const orderB = itemB.sort_order || 0;

        try {
            await reorderMenuItemsAction(itemA.id, orderA, itemB.id, orderB);
        } catch (e: any) {
            console.error("Reorder failed", e.message);
            if (selectedCatId) fetchItems(selectedCatId); // 실패 시 원복
        }
    };

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* 좌측: 카테고리 필터 사이드바 */}
            <div className="w-64 bg-white border-r flex flex-col shrink-0">
                <div className="p-5 border-b bg-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Filter by Category</h2>
                </div>
                <ul className="overflow-y-auto flex-1 p-2 space-y-1">
                    {categories.map(cat => (
                        <li
                            key={cat.id}
                            onClick={() => { setSelectedCatId(cat.id); setEditingId(null); }}
                            className={`p-3 cursor-pointer rounded-lg font-medium transition-all flex justify-between items-center
                                ${selectedCatId === cat.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span>{cat.name}</span>
                            {selectedCatId === cat.id && <span className="text-xs opacity-70">Selected</span>}
                        </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="p-4 text-center text-gray-400 text-sm">
                            No categories.<br />Go to Categories page to add one.
                        </li>
                    )}
                </ul>
            </div>

            {/* 우측: 아이템 리스트 메인 영역 */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Current Category: <span className="font-bold text-blue-600">{categories.find(c => c.id === selectedCatId)?.name || '-'}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleAddNewItem}
                        disabled={!selectedCatId}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>+</span> New Item
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-400">No items in this category.</p>
                        {selectedCatId && <button onClick={handleAddNewItem} className="text-blue-500 font-bold mt-2 hover:underline">Create one?</button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                        {items.map((item, index) => {
                            const isEditing = editingId === item.id;
                            // 편집 중이면 editForm 데이터를, 아니면 원본 데이터를 표시
                            const displayData = isEditing ? (editForm as MenuItem) : item;

                            return (
                                <div key={item.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all 
                                    ${isEditing ? 'ring-2 ring-blue-500 border-transparent shadow-xl z-10 scale-[1.02]' : 'border-gray-200'}`}>

                                    {/* 순서 변경 버튼 (보기 모드일 때만) */}
                                    {!isEditing && (
                                        <div className="flex justify-between mb-2">
                                            <button onClick={() => handleMoveItem(index, 'prev')} disabled={index === 0} className="text-gray-400 hover:text-blue-600 disabled:opacity-20 text-lg font-bold px-2">◀</button>
                                            <span className="text-xs text-gray-300 pt-1">Order: {item.sort_order}</span>
                                            <button onClick={() => handleMoveItem(index, 'next')} disabled={index === items.length - 1} className="text-gray-400 hover:text-blue-600 disabled:opacity-20 text-lg font-bold px-2">▶</button>
                                        </div>
                                    )}

                                    {/* 이미지 영역 */}
                                    <div className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group mb-4 flex items-center justify-center border border-gray-100">
                                        {displayData.image_url ? (
                                            <img src={displayData.image_url} alt={displayData.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-300">
                                                <span className="text-4xl mb-2">🍽️</span>
                                                <span className="text-xs font-bold">No Image</span>
                                            </div>
                                        )}
                                        {/* 이미지 업로드 오버레이 */}
                                        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white z-20">
                                            <span className="text-2xl mb-1">📷</span>
                                            <span className="text-sm font-bold">Change Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(item.id, e.target.files[0])} />
                                        </label>
                                    </div>

                                    {/* 폼 영역 */}
                                    <div className="space-y-3">
                                        {/* 카테고리 이동 (수정 모드일 때만) */}
                                        {isEditing && (
                                            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                                <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Move Category</label>
                                                <select
                                                    value={editForm.category_id}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, category_id: e.target.value }))}
                                                    className="w-full p-1 bg-white border border-gray-300 rounded text-sm font-bold text-gray-800 outline-none"
                                                >
                                                    {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                                </select>
                                            </div>
                                        )}

                                        {/* 아이템 이름 */}
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase">Item Name</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                value={displayData.name || ''}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                className={`w-full text-lg font-bold bg-transparent outline-none border-b-2 py-1 ${isEditing ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-800'}`}
                                            />
                                        </div>

                                        {/* POS 전용 이름 */}
                                        <div>
                                            <label className="text-xs text-blue-500 font-bold uppercase">POS Name (Short)</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.pos_name || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, pos_name: e.target.value }))}
                                                    placeholder="(Optional) Name for POS only"
                                                    className="w-full text-sm font-medium bg-blue-50 border-b-2 border-blue-200 focus:border-blue-500 outline-none py-1 px-1 rounded-t text-blue-900"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600 min-h-[1.2rem] font-medium pt-1">
                                                    {displayData.pos_name ? <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">🖥️ {displayData.pos_name}</span> : <span className="text-gray-300 text-xs italic">Same as Name</span>}
                                                </p>
                                            )}
                                        </div>

                                        {/* 설명 */}
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase">Description</label>
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.description || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                    rows={2}
                                                    className="w-full text-sm bg-gray-50 border border-gray-300 rounded p-2 mt-1 resize-none focus:outline-none focus:border-blue-500"
                                                    placeholder="Enter item description..."
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[1.5rem]">
                                                    {displayData.description || <span className="text-gray-300 italic text-xs">No description</span>}
                                                </p>
                                            )}
                                        </div>

                                        {/* 가격 및 품절 상태 */}
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase">Price ($)</label>
                                                <input
                                                    type="number" step="0.01" disabled={!isEditing}
                                                    value={displayData.price}
                                                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, price: e.target.value }))}
                                                    className={`w-full text-lg font-bold bg-transparent outline-none border-b-2 py-1 ${isEditing ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-800'}`}
                                                />
                                            </div>
                                            <div className="flex items-end pb-2">
                                                <button
                                                    disabled={!isEditing}
                                                    onClick={() => setEditForm(prev => ({ ...prev, is_available: !prev.is_available }))}
                                                    className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${displayData.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                >
                                                    {displayData.is_available ? 'IN STOCK' : 'SOLD OUT'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 노출 설정 (키오스크/POS) */}
                                        {isEditing ? (
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                                                <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.is_kiosk_visible ?? true}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, is_kiosk_visible: e.target.checked }))}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-xs font-bold text-gray-600">Show on Kiosk</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.is_pos_visible ?? true}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, is_pos_visible: e.target.checked }))}
                                                        className="w-4 h-4 text-green-600 rounded"
                                                    />
                                                    <span className="text-xs font-bold text-gray-600">Show on POS</span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 mt-1">
                                                {!displayData.is_kiosk_visible && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-200">Hidden on Kiosk</span>}
                                                {!displayData.is_pos_visible && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-200">Hidden on POS</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* 하단 액션 버튼 */}
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 text-sm font-bold hover:underline px-2">Delete</button>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                                                    <button onClick={saveItem} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md text-sm">Save</button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={() => startEditing(item)} className="w-full py-2 bg-gray-50 text-gray-600 font-bold rounded-lg hover:bg-gray-100 border border-gray-200 text-sm">Edit Item</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}