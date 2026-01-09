'use server'
import { createClient } from '@/lib/supabaseServer'

export async function getLowStockAlerts() {
    const supabase = createClient()

    try {
        // Traemos productos físicos
        const { data, error } = await (supabase.from('products') as any)
            .select('id, name, stock, min_stock, code')
            .eq('product_type', 'fisico')

        if (error) throw error

        // Filtramos en el servidor (JavaScript) para mayor flexibilidad
        // Stock actual <= Stock mínimo
        const alerts = data.filter((p: any) => p.stock <= p.min_stock)

        return { success: true, data: alerts }
    } catch (error) {
        console.error("Error obteniendo alertas:", error)
        return { success: false, data: [] }
    }
}