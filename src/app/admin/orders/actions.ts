"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getOrdersAction() {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                item_name,
                quantity,
                price,
                options,
                notes
            )
        `)
        .order('created_at', { ascending: false }); // 최신순 정렬

    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) throw new Error(error.message);
}
