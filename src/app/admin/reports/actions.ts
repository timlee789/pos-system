"use server";

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function fetchReportAction(rpcName: string, params: { start_date: string, end_date: string }) {
    const { data, error } = await supabase.rpc(rpcName, params);
    if (error) throw new Error(error.message);
    return data || [];
}
