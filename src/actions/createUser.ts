'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Cliente Admin para saltar restricciones RLS
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

interface CreateUserData {
    email: string
    cedula: string
    fullName: string
    address: string
    phone: string
    role: 'admin' | 'cashier'
}

export async function createUser(data: CreateUserData) {
    try {
        // 1. Crear el usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.cedula, // La clave inicial es la cédula
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName
            }
        })

        if (authError) throw authError

        if (!authUser.user) throw new Error('No se pudo generar el usuario.')

        // 2. Actualizar el perfil visual en la tabla 'profiles'
        const { error: profileError } = await (supabaseAdmin.from('profiles') as any)
            .update({
                full_name: data.fullName,
                cedula: data.cedula,
                address: data.address,
                phone: data.phone,
                email: data.email, // Guardamos copia del email en profiles para búsquedas
                role: data.role
            })
            .eq('id', authUser.user.id)

        if (profileError) throw profileError

        return { success: true, message: 'Usuario registrado exitosamente.' }

    } catch (error: any) {
        console.error('Error creando usuario:', error)

        // --- TRADUCCIÓN DE ERRORES ---
        let userMessage = 'Ocurrió un error al crear el usuario.'

        // 1. Error de correo duplicado (Auth)
        if (error.message?.includes('already been registered') || error.code === 'email_exists') {
            userMessage = 'Este correo electrónico ya está registrado en el sistema.'
        }

        // 2. Error de validación de contraseña (Auth)
        else if (error.message?.includes('Password should be')) {
            userMessage = 'La contraseña (cédula) debe tener al menos 6 caracteres.'
        }

        // 3. Error de unicidad en base de datos (Ej: Cédula duplicada en profiles)
        // Código 23505 es "Unique Violation" en PostgreSQL
        else if (error.code === '23505') {
            if (error.details?.includes('cedula')) {
                userMessage = 'Ya existe un usuario registrado con esta Cédula.'
            } else if (error.details?.includes('email')) {
                userMessage = 'Este correo ya está en uso en otro perfil.'
            } else {
                userMessage = 'Ya existe un usuario con estos datos duplicados.'
            }
        }

        // 4. Error de validación de email
        else if (error.message?.includes('Unable to validate email address')) {
            userMessage = 'El formato del correo electrónico no es válido.'
        }

        return { success: false, message: userMessage }
    }
}