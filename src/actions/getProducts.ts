'use server'
import { createClient } from '@/lib/supabaseServer'

export async function getProducts() {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)') // Traemos el nombre de la categoría también
            .order('created_at', { ascending: false })

        if (error) throw error
        return { success: true, data }

    } catch (error: any) {
        console.error(error)
        return { success: false, error: error.message }
    }
}