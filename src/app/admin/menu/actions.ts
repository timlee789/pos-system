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

export async function getMenuItemsAction(catId: string) {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('category_id', catId)
        .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function addMenuItemAction(payload: any) {
    const { error } = await supabase.from('items').insert(payload);
    if (error) throw new Error(error.message);
}

export async function updateMenuItemAction(id: string, payload: any) {
    const { error } = await supabase.from('items').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function deleteMenuItemAction(id: string) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function updateMenuItemImageAction(id: string, imageUrl: string) {
    const { error } = await supabase.from('items').update({ image_url: imageUrl }).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function reorderMenuItemsAction(idA: string, orderA: number, idB: string, orderB: number) {
    const { error: e1 } = await supabase.from('items').update({ sort_order: orderB }).eq('id', idA);
    const { error: e2 } = await supabase.from('items').update({ sort_order: orderA }).eq('id', idB);

    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
}

export async function uploadMenuImageAction(itemId: string, formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error("No file provided");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucketName = 'menu-images';

    // Auto-create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === bucketName)) {
        await supabase.storage.createBucket(bucketName, { public: true });
    }

    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
        });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    // Update DB
    const { error } = await supabase.from('items').update({ image_url: urlData.publicUrl }).eq('id', itemId);
    if (error) throw new Error(error.message);
}
