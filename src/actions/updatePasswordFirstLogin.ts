'use server'

import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function updatePasswordFirstLogin(formData: FormData) {
    try {
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        // 1. Validaciones básicas previas
        if (!password || !confirmPassword) {
            throw new Error('Por favor, completa todos los campos.')
        }

        if (password !== confirmPassword) {
            throw new Error('Las contraseñas no coinciden.')
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }

        const supabase = createClient()

        // 2. Actualizar contraseña en Auth (Supabase)
        const { error: authError } = await supabase.auth.updateUser({
            password: password
        })

        if (authError) throw authError

        // 3. Obtener el usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No se encontró una sesión activa. Intenta iniciar sesión nuevamente.')

        // 4. Actualizar la bandera en la tabla 'profiles'
        const { error: profileError } = await (supabase.from('profiles') as any)
            .update({ is_first_login: false })
            .eq('id', user.id)

        if (profileError) throw profileError

        // 5. Consultar el rol para saber a dónde redirigir
        const { data: profile } = await (supabase.from('profiles') as any)
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'cashier'

        // Devolvemos éxito y el rol para que el cliente maneje la redirección
        return { success: true, role }

    } catch (error: any) {
        console.error('Error al cambiar contraseña:', error)

        let userMessage = error.message || 'Ocurrió un error al actualizar la contraseña.'

        // --- TRADUCCIÓN DE ERRORES DE SUPABASE ---

        // Contraseña igual a la anterior (algunas configuraciones de seguridad lo impiden)
        if (userMessage.includes('same as the old password')) {
            userMessage = 'La nueva contraseña no puede ser igual a la anterior.'
        }

        // Contraseña muy débil (si Supabase tiene reglas extras activadas)
        else if (userMessage.includes('Password should be')) {
            userMessage = 'La contraseña es muy débil. Intenta combinar letras y números.'
        }

        // Sesión expirada durante el proceso
        else if (userMessage.includes('Auth session missing')) {
            userMessage = 'Tu sesión ha expirado. Por favor inicia sesión de nuevo.'
        }

        return { error: userMessage }
    }
}