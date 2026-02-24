"use client";
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
    getModifierGroupsAction, getAllItemsAction, getModifierOptionsAction, getLinkedItemsAction,
    addModifierGroupAction, deleteModifierGroupAction, addModifierOptionAction, deleteModifierOptionAction,
    updateModifierOptionAction, reorderModifierOptionsAction, linkItemToGroupAction, unlinkItemFromGroupAction
} from './actions';

// 타입 정의
interface ModifierGroup {
    id: string;
    name: string;
}
interface ModifierOption {
    id: string;
    name: string;
    price: number;
    sort_order: number;
}
interface SimpleItem {
    id: string;
    name: string;
    category_id: string;
}

export default function AdminModifiersPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 데이터 상태
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null);

    const [options, setOptions] = useState<ModifierOption[]>([]);
    const [linkedItemIds, setLinkedItemIds] = useState<string[]>([]);
    const [allItems, setAllItems] = useState<SimpleItem[]>([]);

    // 옵션 수정용 상태
    const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
    const [editOptionForm, setEditOptionForm] = useState({ name: '', price: 0 });

    // 로딩 상태
    const [loadingOptions, setLoadingOptions] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        fetchGroups();
        fetchAllItems();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchOptions(selectedGroup.id);
            fetchLinkedItems(selectedGroup.id);
            setEditingOptionId(null);
        } else {
            setOptions([]);
            setLinkedItemIds([]);
        }
    }, [selectedGroup]);

    // ---------------------------------------------------------
    // Fetch Functions
    // ---------------------------------------------------------
    const fetchGroups = async () => {
        try {
            const data = await getModifierGroupsAction();
            setGroups(data);
        } catch (e: any) {
            console.error(e.message);
        }
    };

    const fetchAllItems = async () => {
        try {
            const data = await getAllItemsAction();
            setAllItems(data);
        } catch (e: any) {
            console.error(e.message);
        }
    };

    const fetchOptions = async (groupId: string) => {
        setLoadingOptions(true);
        try {
            const data = await getModifierOptionsAction(groupId);
            setOptions(data);
        } catch (e: any) {
            console.error(e.message);
        } finally {
            setLoadingOptions(false);
        }
    };

    const fetchLinkedItems = async (groupId: string) => {
        try {
            const ids = await getLinkedItemsAction(groupId);
            setLinkedItemIds(ids);
        } catch (e: any) {
            console.error(e.message);
        }
    };

    // ---------------------------------------------------------
    // Handlers (Groups)
    // ---------------------------------------------------------
    const handleAddGroup = async () => {
        const name = prompt("Enter new Group Name (e.g., 'Steak Temperature')");
        if (!name) return;

        try {
            await addModifierGroupAction(name);
            fetchGroups();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm("Delete this group? All options inside it will be deleted.")) return;
        try {
            await deleteModifierGroupAction(id);
            setSelectedGroup(null);
            fetchGroups();
        } catch (e: any) {
            alert(e.message);
        }
    };

    // ---------------------------------------------------------
    // Handlers (Options)
    // ---------------------------------------------------------
    const handleAddOption = async () => {
        if (!selectedGroup) return;
        const name = prompt("Enter Option Name (e.g., 'Medium Rare')");
        if (!name) return;
        const priceStr = prompt("Enter Price (0 for free)", "0");
        const price = parseFloat(priceStr || "0");

        const maxOrder = options.length > 0 ? Math.max(...options.map(o => o.sort_order || 0)) : 0;

        try {
            await addModifierOptionAction({
                group_id: selectedGroup.id,
                name,
                price,
                sort_order: maxOrder + 1
            });
            fetchOptions(selectedGroup.id);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteOption = async (id: string) => {
        if (!confirm("Delete this option?")) return;
        try {
            await deleteModifierOptionAction(id);
            if (selectedGroup) fetchOptions(selectedGroup.id);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const startEditingOption = (opt: ModifierOption) => {
        setEditingOptionId(opt.id);
        setEditOptionForm({ name: opt.name, price: opt.price });
    };

    const handleUpdateOption = async () => {
        if (!editingOptionId || !selectedGroup) return;
        if (!editOptionForm.name) return alert("Name is required");

        try {
            await updateModifierOptionAction(editingOptionId, editOptionForm.name, editOptionForm.price);
            setEditingOptionId(null);
            fetchOptions(selectedGroup.id);
        } catch (e: any) {
            alert("Error updating: " + e.message);
        }
    };

    const handleMoveOption = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === options.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const newOptions = [...options];
        const optA = newOptions[index];
        const optB = newOptions[targetIndex];

        newOptions[index] = optB;
        newOptions[targetIndex] = optA;
        setOptions(newOptions);

        const orderA = optA.sort_order || 0;
        const orderB = optB.sort_order || 0;

        try {
            await reorderModifierOptionsAction(optA.id, orderA, optB.id, orderB);
        } catch (e: any) {
            console.error("Reorder failed", e.message);
            if (selectedGroup) fetchOptions(selectedGroup.id);
        }
    };

    const toggleItemLink = async (itemId: string, isLinked: boolean) => {
        if (!selectedGroup) return;

        if (isLinked) {
            try {
                await unlinkItemFromGroupAction(itemId, selectedGroup.id);
                setLinkedItemIds(prev => prev.filter(id => id !== itemId));
            } catch (e: any) {
                console.error(e.message);
            }
        } else {
            try {
                await linkItemToGroupAction(itemId, selectedGroup.id);
                setLinkedItemIds(prev => [...prev, itemId]);
            } catch (e: any) {
                console.error(e.message);
            }
        }
    };

    return (
        <div className="flex h-full bg-gray-100 overflow-hidden">
            {/* 1. 좌측: Modifier Groups 목록 */}
            <div className="w-1/4 bg-white border-r flex flex-col min-w-[250px]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800">1. Groups</h2>
                    <button onClick={handleAddGroup} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">+ Add</button>
                </div>
                <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {groups.map(group => (
                        <li
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`p-3 rounded-lg cursor-pointer flex justify-between group items-center
                ${selectedGroup?.id === group.id ? 'bg-blue-100 text-blue-800 font-bold border-blue-200 border' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <span>{group.name}</span>
                            {selectedGroup?.id === group.id && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                    className="text-red-400 hover:text-red-600 px-2"
                                >
                                    ×
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 2. 중앙: Options 관리 */}
            <div className="w-1/3 bg-white border-r flex flex-col min-w-[350px]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800">
                        2. Options: <span className="text-blue-600">{selectedGroup?.name || '-'}</span>
                    </h2>
                    <button
                        onClick={handleAddOption}
                        disabled={!selectedGroup}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        + Add Option
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {!selectedGroup ? (
                        <div className="text-center text-gray-400 mt-10">Select a group first</div>
                    ) : loadingOptions ? (
                        <div className="text-center text-gray-400 mt-10">Loading...</div>
                    ) : (
                        <ul className="space-y-3">
                            {options.length === 0 && <p className="text-sm text-gray-400 text-center">No options yet.</p>}

                            {options.map((opt, index) => {
                                const isEditing = editingOptionId === opt.id;

                                return (
                                    <li key={opt.id} className={`bg-white p-3 rounded shadow-sm border flex flex-col gap-2 
                                        ${isEditing ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}>

                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editOptionForm.name}
                                                        onChange={(e) => setEditOptionForm(prev => ({ ...prev, name: e.target.value }))}
                                                        className="flex-1 border-b border-blue-500 outline-none text-sm font-bold"
                                                        placeholder="Name"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editOptionForm.price}
                                                        onChange={(e) => setEditOptionForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                                        className="w-20 border-b border-blue-500 outline-none text-sm font-bold"
                                                        placeholder="Price"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={() => setEditingOptionId(null)} className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">Cancel</button>
                                                    <button onClick={handleUpdateOption} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <button onClick={() => handleMoveOption(index, 'up')} disabled={index === 0} className="text-gray-300 hover:text-blue-600 disabled:opacity-0 text-[10px] leading-none">▲</button>
                                                        <button onClick={() => handleMoveOption(index, 'down')} disabled={index === options.length - 1} className="text-gray-300 hover:text-blue-600 disabled:opacity-0 text-[10px] leading-none">▼</button>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-800">{opt.name}</span>
                                                        {opt.price > 0 && <span className="text-sm text-green-600 ml-2">(+${opt.price})</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => startEditingOption(opt)} className="text-blue-400 hover:text-blue-600 text-xs font-bold px-2 py-1 bg-blue-50 rounded">Edit</button>
                                                    <button onClick={() => handleDeleteOption(opt.id)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded">Del</button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* 3. 우측: 연결된 아이템 */}
            <div className="flex-1 bg-white flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-gray-800">3. Apply to Items</h2>
                    <p className="text-xs text-gray-500">Items using <span className="font-bold text-blue-600">{selectedGroup?.name || '...'}</span></p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {!selectedGroup ? (
                        <div className="text-center text-gray-400 mt-10">Select a group to manage links</div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {allItems.map(item => {
                                const isLinked = linkedItemIds.includes(item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className={`flex items-center p-3 border rounded cursor-pointer transition-all select-none
                                            ${isLinked ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                            checked={isLinked}
                                            onChange={() => toggleItemLink(item.id, isLinked)}
                                        />
                                        <span className={`text-sm ${isLinked ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                            {item.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}