"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Fetch Data ---
export async function getModifierGroupsAction() {
    const { data, error } = await supabase.from('modifier_groups').select('*').order('name');
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getAllItemsAction() {
    const { data, error } = await supabase.from('items').select('id, name, category_id').order('name');
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getModifierOptionsAction(groupId: string) {
    const { data, error } = await supabase
        .from('modifiers')
        .select('*')
        .eq('group_id', groupId)
        .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getLinkedItemsAction(groupId: string) {
    const { data, error } = await supabase.from('item_modifier_groups').select('item_id').eq('group_id', groupId);
    if (error) throw new Error(error.message);
    return data ? data.map(d => d.item_id) : [];
}

// --- Groups Mutations ---
export async function addModifierGroupAction(name: string) {
    const { data: restData } = await supabase.from('restaurants').select('id').limit(1).single();

    const payload: any = { name };
    if (restData) payload.restaurant_id = restData.id;

    const { error } = await supabase.from('modifier_groups').insert(payload);
    if (error) throw new Error(error.message);
}

export async function deleteModifierGroupAction(groupId: string) {
    const { error } = await supabase.from('modifier_groups').delete().eq('id', groupId);
    if (error) throw new Error(error.message);
}

// --- Options Mutations ---
export async function addModifierOptionAction(payload: { group_id: string, name: string, price: number, sort_order: number }) {
    const { error } = await supabase.from('modifiers').insert(payload);
    if (error) throw new Error(error.message);
}

export async function deleteModifierOptionAction(optionId: string) {
    const { error } = await supabase.from('modifiers').delete().eq('id', optionId);
    if (error) throw new Error(error.message);
}

export async function updateModifierOptionAction(optionId: string, name: string, price: number) {
    const { error } = await supabase.from('modifiers').update({ name, price }).eq('id', optionId);
    if (error) throw new Error(error.message);
}

export async function reorderModifierOptionsAction(idA: string, orderA: number, idB: string, orderB: number) {
    const { error: e1 } = await supabase.from('modifiers').update({ sort_order: orderB }).eq('id', idA);
    const { error: e2 } = await supabase.from('modifiers').update({ sort_order: orderA }).eq('id', idB);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
}

// --- Linking Mutations ---
export async function linkItemToGroupAction(itemId: string, groupId: string) {
    const { error } = await supabase.from('item_modifier_groups').insert({ item_id: itemId, group_id: groupId });
    if (error) throw new Error(error.message);
}

export async function unlinkItemFromGroupAction(itemId: string, groupId: string) {
    const { error } = await supabase.from('item_modifier_groups').delete().eq('item_id', itemId).eq('group_id', groupId);
    if (error) throw new Error(error.message);
}
