'use server'
import { createClient } from '@/lib/supabaseServer'

interface ProductData {
    id: string
    name: string
    code?: string
    description?: string
    categoryName: string
    type: 'fisico' | 'servicio'
    price: number
    cost: number
    stock: number
    minStock: number
    isQuickAccess: boolean
    isVariablePrice: boolean // <--- CORREGIDO: Debe coincidir con el frontend (camelCase)
}

export async function updateProduct(data: ProductData) {
    const supabase = createClient()

    try {
        // 1. Gestionar la Categoría
        let categoryId: string | null = null

        if (data.categoryName) {
            const cleanName = data.categoryName.trim()
            const { error: catError } = await (supabase.from('categories') as any)
                .upsert({ name: cleanName }, { onConflict: 'name' })

            if (catError) throw catError

            const { data: catData } = await (supabase.from('categories') as any)
                .select('id')
                .eq('name', cleanName)
                .single()

            categoryId = catData?.id
        }

        // 2. Actualizar el Producto
        const { error: prodError } = await (supabase.from('products') as any)
            .update({
                name: data.name,
                code: data.code || null,
                description: data.description,
                category_id: categoryId,
                product_type: data.type,
                cost: data.cost,
                price: data.price,
                stock: data.type === 'servicio' ? 0 : data.stock,
                min_stock: data.type === 'servicio' ? 0 : data.minStock,
                is_quick_access: data.isQuickAccess,
                is_variable_price: data.isVariablePrice, // <--- CORREGIDO: Mapeamos camelCase a snake_case
            })
            .eq('id', data.id)

        if (prodError) throw prodError

        return { success: true, message: 'Producto actualizado correctamente' }

    } catch (error: any) {
        console.error('Error actualizando producto:', error)
        return { success: false, message: error.message || 'Error al actualizar' }
    }
}