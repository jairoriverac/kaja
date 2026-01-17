'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function deleteUser(userId: string) {
    try {
        // 1. Eliminar el usuario de Auth
        // Gracias al cambio SQL (ON DELETE SET NULL), 
        // las ventas quedarán huérfanas pero NO se borrarán.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) throw error

        // 2. Opcional: Si tienes la tabla 'profiles' conectada con CASCADE, se borrará sola.
        // Si la tienes manual, bórrala aquí:
        // await supabaseAdmin.from('profiles').delete().eq('id', userId)

        return { success: true, message: 'Usuario eliminado correctamente. Sus ventas se han conservado como anónimas.' }

    } catch (error: any) {
        console.error('Error eliminando usuario:', error)

        let userMessage = 'No se pudo eliminar el usuario.'

        if (error.message?.includes('User not found')) {
            userMessage = 'El usuario ya no existe.'
        }

        return { success: false, message: userMessage }
    }
}