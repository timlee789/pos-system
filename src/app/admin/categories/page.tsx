"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getCategoriesAction, addCategoryAction, deleteCategoryAction, updateCategoryNameAction, updateCategoryOrderAction } from './actions';

// 타입 정의
interface Category {
    id: string;
    name: string;
    sort_order: number;
}

export default function AdminCategoriesPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // 수정 모드 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    // ---------------------------------------------------------
    // CRUD Functions
    // ---------------------------------------------------------
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getCategoriesAction();
            setCategories(data);
        } catch (err: any) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAddCategory = async () => {
        const name = prompt("Enter new Category Name (e.g., 'Burgers')");
        if (!name) return;

        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) : 0;

        try {
            await addCategoryAction(name, maxOrder + 1);
            fetchCategories();
        } catch (err: any) {
            console.error("Fetch error:", err);
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category? Items in this category might lose their link.")) return;

        try {
            await deleteCategoryAction(id);
            fetchCategories();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        }
    };

    const startEditing = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        if (!editName.trim()) return alert("Name is required");

        try {
            await updateCategoryNameAction(editingId, editName);
            setEditingId(null);
            fetchCategories();
        } catch (err: any) {
            alert(`Failed to update: ${err.message}`);
        }
    };

    // ---------------------------------------------------------
    // 순서 변경 (Reorder)
    // ---------------------------------------------------------
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === categories.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // 1. UI 먼저 업데이트 (Optimistic UI)
        const newCats = [...categories];
        const catA = newCats[index];
        const catB = newCats[targetIndex];

        newCats[index] = catB;
        newCats[targetIndex] = catA;
        setCategories(newCats);

        // 2. DB 업데이트 (서로의 sort_order 교환)
        const orderA = catA.sort_order || 0;
        const orderB = catB.sort_order || 0;

        try {
            await updateCategoryOrderAction(catA.id, orderA, catB.id, orderB);
        } catch (err: any) {
            console.error("Reorder failed", err);
            fetchCategories(); // 실패 시 원복
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
                    <p className="text-gray-500">Manage menu categories (Burgers, Drinks, etc.)</p>
                </div>
                <button
                    onClick={handleAddCategory}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                >
                    + Add Category
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                {/* 헤더 Row */}
                <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-200 font-bold text-gray-600 text-sm uppercase">
                    <div className="col-span-1 text-center">Order</div>
                    <div className="col-span-8">Name</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                {/* 리스트 영역 */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400">Loading categories...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">No categories found. Add one to start!</div>
                    ) : (
                        categories.map((cat, index) => (
                            <div key={cat.id} className="grid grid-cols-12 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">

                                {/* 1. 순서 변경 버튼 */}
                                <div className="col-span-1 flex flex-col items-center justify-center gap-1">
                                    <button
                                        onClick={() => handleMove(index, 'up')}
                                        disabled={index === 0}
                                        className="text-gray-300 hover:text-blue-600 disabled:opacity-0 leading-none text-xs"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        onClick={() => handleMove(index, 'down')}
                                        disabled={index === categories.length - 1}
                                        className="text-gray-300 hover:text-blue-600 disabled:opacity-0 leading-none text-xs"
                                    >
                                        ▼
                                    </button>
                                </div>

                                {/* 2. 이름 (보기 모드 / 수정 모드) */}
                                <div className="col-span-8 px-2">
                                    {editingId === cat.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="border-b-2 border-blue-500 outline-none px-1 py-1 w-full font-bold text-gray-800"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-bold text-gray-800 text-lg">{cat.name}</span>
                                    )}
                                </div>

                                {/* 3. 액션 버튼 */}
                                <div className="col-span-3 flex justify-end gap-2">
                                    {editingId === cat.id ? (
                                        <>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                                            <button onClick={handleUpdate} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Save</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEditing(cat)}
                                                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-bold"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="px-3 py-1 text-sm bg-red-50 text-red-500 rounded hover:bg-red-100 font-bold"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}