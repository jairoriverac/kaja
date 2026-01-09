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
        // 1. Intentar eliminar el usuario de Supabase Auth
        // Si tienes configurado ON DELETE CASCADE en PostgreSQL, esto borrará el perfil automáticamente.
        // Si NO tienes CASCADE y el usuario tiene datos vinculados, aquí saltará el error.
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) throw error

        return { success: true, message: 'Usuario eliminado correctamente.' }

    } catch (error: any) {
        console.error('Error eliminando usuario:', error)

        let userMessage = 'No se pudo eliminar el usuario debido a un error del sistema.'

        // 1. Error de Llave Foránea (Foreign Key Violation - Código PostgreSQL 23503)
        // Esto pasa si intentas borrar un cajero que ya hizo ventas y la BD protege esos datos.
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
            userMessage = 'No se puede eliminar este usuario porque tiene historial de ventas o registros asociados. Considere desactivarlo en su lugar.'
        }

        // 2. Usuario no encontrado
        else if (error.message?.includes('User not found') || error.status === 404) {
            userMessage = 'El usuario ya no existe o ya fue eliminado anteriormente.'
        }

        // 3. Error de permisos (aunque usamos service_role, por si acaso)
        else if (error.code === '42501') {
            userMessage = 'No tienes permisos suficientes para realizar esta acción.'
        }

        return { success: false, message: userMessage }
    }
}