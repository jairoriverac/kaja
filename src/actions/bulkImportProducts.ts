'use server'
import { createClient } from '@/lib/supabaseServer'

export async function bulkImportProducts(productsFromExcel: any[]) {
    const supabase = createClient()

    try {
        // 1. GESTIÓN DE CATEGORÍAS
        const uniqueCategories = Array.from(new Set(productsFromExcel.map((p: any) => p.Categoria?.toString().trim()))).filter(Boolean) as string[]

        for (const catName of uniqueCategories) {
            await (supabase.from('categories') as any).upsert({ name: catName }, { onConflict: 'name' })
        }

        const { data: categoriesDb } = await (supabase.from('categories') as any).select('id, name')
        const catMap = new Map<string, string>(categoriesDb?.map((c: any) => [c.name, c.id]))

        // 2. BUSCAR PRODUCTOS EXISTENTES (Por nombre)
        const { data: existingProducts } = await (supabase.from('products') as any).select('id, name, code')

        const productMap = new Map<string, { id: string, code: string }>()
        existingProducts?.forEach((p: any) => {
            if (p.name) {
                productMap.set(p.name.toString().trim().toLowerCase(), { id: p.id, code: p.code })
            }
        })

        // 3. CLASIFICAR: ¿ES NUEVO O ES ACTUALIZACIÓN?
        const toUpdate: any[] = []
        const toInsert: any[] = []

        productsFromExcel.forEach((p: any) => {
            const cleanName = p.Nombre?.toString().trim()
            if (!cleanName) return // Saltamos filas vacías

            const searchName = cleanName.toLowerCase()
            const type = p.Tipo?.toLowerCase() === 'servicio' ? 'servicio' : 'fisico'
            const existingMatch = productMap.get(searchName)

            // Objeto base sin ID
            const productData = {
                name: cleanName,
                description: p.Descripcion || null,
                category_id: catMap.get(p.Categoria?.toString().trim()) || null,
                product_type: type,
                cost: parseFloat(p.Costo) || 0,
                price: parseFloat(p.Precio) || 0,
                stock: type === 'servicio' ? 0 : (parseInt(p.Stock) || 0),
                min_stock: type === 'servicio' ? 0 : (parseInt(p.Stock_Min) || 5),
            }

            if (existingMatch) {
                // SI EXISTE: Agregamos el ID y mantenemos su código original si no viene uno nuevo
                toUpdate.push({
                    ...productData,
                    id: existingMatch.id, // ¡Importante! Esto activa la actualización
                    code: p.Codigo ? String(p.Codigo) : existingMatch.code
                })
            } else {
                // SI ES NUEVO: NO ponemos ID, y el código es null (para que se autogenere)
                toInsert.push({
                    ...productData,
                    code: p.Codigo ? String(p.Codigo) : null
                })
            }
        })

        // 4. EJECUTAR OPERACIONES POR SEPARADO

        // A) Actualizar los existentes
        if (toUpdate.length > 0) {
            const { error: updateError } = await (supabase.from('products') as any).upsert(toUpdate, { onConflict: 'id' })
            if (updateError) throw updateError
        }

        // B) Insertar los nuevos (La base de datos creará los IDs y Códigos INT-XXX)
        if (toInsert.length > 0) {
            const { error: insertError } = await (supabase.from('products') as any).insert(toInsert)
            if (insertError) throw insertError
        }

        return { success: true, count: toUpdate.length + toInsert.length }

    } catch (error: any) {
        console.error("Error en carga masiva:", error)
        return { success: false, message: error.message || 'Error al procesar el archivo' }
    }
}