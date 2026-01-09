'use server'
import { createClient } from '@/lib/supabaseServer'

interface ProductData {
    name: string
    code?: string
    description?: string
    categoryName: string // Mandamos el nombre, no el ID, para ser flexibles
    type: 'fisico' | 'servicio'
    price: number
    cost: number
    stock: number
    minStock: number
    isQuickAccess: boolean
    isVariablePrice: boolean
}

export async function createProduct(data: ProductData) {
    const supabase = createClient()

    try {
        // 1. Gestionar la Categoría (Buscar o Crear)
        let categoryId: string | null = null

        if (data.categoryName) {
            // Normalizamos el nombre (ej: "  Papelería " -> "Papelería")
            const cleanName = data.categoryName.trim()

            // Intentamos crearla. Si existe, no pasa nada.
            const { error: catError } = await (supabase.from('categories') as any)
                .upsert({ name: cleanName }, { onConflict: 'name' })

            if (catError) throw catError

            // Buscamos el ID de esa categoría
            const { data: catData } = await (supabase.from('categories') as any)
                .select('id')
                .eq('name', cleanName)
                .single()

            categoryId = catData?.id
        }

        // 2. Crear el Producto
        const { error: prodError } = await (supabase.from('products') as any).insert({
            name: data.name,
            code: data.code || null, // Si es vacío, el Trigger de la DB generará uno
            description: data.description,
            category_id: categoryId,
            product_type: data.type,
            cost: data.cost,
            price: data.price,
            stock: data.type === 'servicio' ? 0 : data.stock,
            min_stock: data.type === 'servicio' ? 0 : data.minStock,
            is_quick_access: data.isQuickAccess,
            isVariablePrice: data.isVariablePrice,
        })

        if (prodError) throw prodError

        return { success: true, message: 'Producto creado exitosamente' }

    } catch (error: any) {
        console.error('Error creando producto:', error)
        return { success: false, message: error.message || 'Error al guardar producto' }
    }
}