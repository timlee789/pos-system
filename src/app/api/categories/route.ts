import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Use Service Role Key to bypass RLS for admin operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('categories')
            .insert(body)
            .select('*')
            .single();

        if (error) {
            console.error("Supabase Admin Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error("API Error (POST /api/categories):", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
