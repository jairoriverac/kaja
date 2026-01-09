'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Usamos la llave maestra (Service Role) para poder editar cualquier usuario
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

interface UpdateUserData {
    id: string
    email: string
    cedula: string
    fullName: string
    address: string
    phone: string
    role: 'admin' | 'cashier'
}

export async function updateUser(data: UpdateUserData) {
    try {
        // 1. Actualizar el Usuario de Autenticación (Login, Email, Contraseña)
        // IMPORTANTE: Al cambiar la cédula, actualizamos la contraseña automáticamente.
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            data.id,
            {
                email: data.email,
                password: data.cedula, // Actualizamos la clave a la nueva cédula
                user_metadata: {
                    full_name: data.fullName
                },
                email_confirm: true
            }
        )

        if (authError) throw authError

        // 2. Actualizar la Tabla de Perfiles (Información Visual)
        const { error: profileError } = await (supabaseAdmin.from('profiles') as any)
            .update({
                full_name: data.fullName,
                cedula: data.cedula,
                address: data.address,
                phone: data.phone,
                email: data.email,
                role: data.role
            })
            .eq('id', data.id)

        if (profileError) throw profileError

        return { success: true, message: 'Usuario actualizado correctamente.' }

    } catch (error: any) {
        console.error('Error actualizando usuario:', error)

        let userMessage = 'No se pudo actualizar la información del usuario.'

        // 1. Correo duplicado en Auth
        if (error.message?.includes('already been registered') || error.code === 'email_exists') {
            userMessage = 'Este correo electrónico ya está en uso por otro usuario.'
        }

        // 2. Contraseña (cédula) muy corta
        else if (error.message?.includes('Password should be')) {
            userMessage = 'La cédula (nueva contraseña) debe tener al menos 6 caracteres.'
        }

        // 3. Duplicados en Base de Datos (Unique Violation - Código 23505)
        else if (error.code === '23505') {
            if (error.details?.includes('cedula')) {
                userMessage = 'Ya existe otro usuario registrado con esta Cédula.'
            } else if (error.details?.includes('email')) {
                userMessage = 'Este correo ya está asignado a otro perfil.'
            } else {
                userMessage = 'Ya existe un usuario con estos datos duplicados.'
            }
        }

        return { success: false, message: userMessage }
    }
}