"use server";

import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using Service Role to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getCategoriesAction() {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw new Error(error.message);
    return data || [];
}

export async function addCategoryAction(name: string, sort_order: number) {
    const { data: restData } = await supabase.from('restaurants').select('id').limit(1).single();

    const payload: any = { name, sort_order };
    if (restData) {
        payload.restaurant_id = restData.id;
    }

    const { error } = await supabase.from('categories').insert(payload);
    if (error) throw new Error(error.message);
}

export async function deleteCategoryAction(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function updateCategoryNameAction(id: string, name: string) {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function updateCategoryOrderAction(idA: string, orderA: number, idB: string, orderB: number) {
    const { error: e1 } = await supabase.from('categories').update({ sort_order: orderB }).eq('id', idA);
    const { error: e2 } = await supabase.from('categories').update({ sort_order: orderA }).eq('id', idB);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
}
