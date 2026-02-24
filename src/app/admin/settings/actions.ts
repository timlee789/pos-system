"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getStoreSettingsAction() {
    const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }

    // Create default if not found
    if (!data || (error && error.code === 'PGRST116')) {
        const { error: insertError } = await supabase.from('store_settings').insert({
            is_table_number_required: true,
            enable_on_reader_tipping: false
        });
        if (insertError) throw new Error(insertError.message);

        return { is_table_number_required: true, enable_on_reader_tipping: false };
    }

    return data;
}

export async function updateStoreSettingsAction(updates: any) {
    const { error } = await supabase
        .from('store_settings')
        .update(updates)
        .gt('id', 0); // Update existing settings

    if (error) throw new Error(error.message);
}
