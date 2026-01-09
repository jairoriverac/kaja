'use server'
import { createClient } from '@/lib/supabaseServer'

export async function deleteProduct(productId: string) {
    const supabase = createClient()

    try {
        const { error } = await (supabase.from('products') as any)
            .delete()
            .eq('id', productId)

        if (error) throw error

        return { success: true, message: 'Producto eliminado correctamente' }

    } catch (error: any) {
        console.error('Error eliminando producto:', error)

        // Manejo de error de llave foránea (Si el producto ya tiene ventas)
        if (error.code === '23503') {
            return { success: false, message: 'No se puede eliminar porque este producto tiene historial de ventas.' }
        }

        return { success: false, message: error.message || 'Error al eliminar' }
    }
}