"use server";

import { createClient } from '@supabase/supabase-js';
import { MenuItem, ModifierGroup, ModifierItem } from "@/shared/types/common";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getPosMenuAction(): Promise<{ items: MenuItem[], categories: { id: string, name: string }[] }> {
    // 1. Fetch categories
    const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
    const categoryList = categories?.map(c => ({ id: c.id, name: c.name })) || [];

    // 2. Fetch items visible on POS
    const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('is_pos_visible', true)
        .order('sort_order', { ascending: true });

    if (!items) return { items: [], categories: categoryList };

    // 3. Fetch linked modifiers deeply
    // Supabase can join item_modifier_groups with modifier_groups and then modifiers
    const { data: itemModifiers } = await supabase
        .from('item_modifier_groups')
        .select(`
            item_id,
            modifier_groups (
                id,
                name,
                modifiers (
                    id,
                    name,
                    price,
                    sort_order
                )
            )
        `);

    // Group modifiers by item
    const modifiersByItem = new Map<string, ModifierGroup[]>();

    if (itemModifiers) {
        for (const link of itemModifiers) {
            const mg: any = link.modifier_groups;
            if (!mg) continue;

            // Format options
            const options: ModifierItem[] = (mg.modifiers || [])
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    price: m.price || 0
                }));

            const nameLower = mg.name.toLowerCase();
            const isSingleSelect = nameLower.includes('flavor') || nameLower.includes('size');

            const formattedGroup: ModifierGroup = {
                id: mg.id,
                name: mg.name,
                // Defaulting selection limits, ideally from DB if they existed
                minSelection: isSingleSelect ? 1 : 0,
                maxSelection: isSingleSelect ? 1 : 10,
                options
            };

            const existing = modifiersByItem.get(link.item_id) || [];
            existing.push(formattedGroup);
            modifiersByItem.set(link.item_id, existing);
        }
    }

    // Combine everything
    const menuItems: MenuItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        pos_name: item.pos_name || undefined,
        price: item.price || 0,
        category: categoryMap.get(item.category_id) || 'Uncategorized',
        description: item.description || '',
        image_url: item.image_url || undefined,
        modifierGroups: modifiersByItem.get(item.id) || []
    }));

    return { items: menuItems, categories: categoryList };
}
