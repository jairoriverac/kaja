'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, LayoutDashboard, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function AdminBackBar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(false)
    const supabase = createClient()

    // 1. Detectar el título de la sección actual
    const getPageName = (path: string) => {
        if (path === '/pos') return 'Punto de Venta (POS)'
        if (path.includes('/settings')) return 'Configuración General'
        if (path.includes('/products')) return 'Inventario de Productos'
        if (path.includes('/users')) return 'Gestión de Usuarios'
        if (path.includes('/sales')) return 'Historial de Ventas'
        if (path.includes('/cash-count')) return 'Cierre de Caja'
        if (path.includes('/reports')) return 'Reportes'
        return 'Gestión del Sistema'
    }

    // 2. Icono dinámico según la sección
    const getPageIcon = (path: string) => {
        if (path === '/pos') return <ShoppingCart size={18} />
        return <ShieldCheck size={18} />
    }

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await (supabase.from('profiles') as any)
                    .select('role')
                    .eq('id', user.id)
                    .single()
                if ((data as Profile)?.role === 'admin') {
                    setIsAdmin(true)
                }
            }
        }
        checkRole()
    }, [])

    // 3. LÓGICA CORREGIDA:
    // Mostrar SOLO SI:
    // - Soy Admin (isAdmin === true)
    // - Y NO estoy en el Dashboard principal (pathname !== '/')
    const shouldShow = isAdmin && pathname !== '/'

    if (!shouldShow) return null

    return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white shadow-lg z-30 border-b border-slate-800 sticky top-0">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">

                {/* BOTÓN IZQUIERDO: VOLVER AL DASHBOARD */}
                <button
                    onClick={() => router.push('/')}
                    className="group flex items-center gap-2 pl-3 pr-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 transition-all duration-300 active:scale-95"
                >
                    <div className="bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors">
                        <ArrowLeft size={16} className="text-blue-200" />
                    </div>
                    <span className="text-sm font-medium tracking-wide">Volver al Panel</span>
                </button>

                {/* LADO DERECHO: CONTEXTO */}
                <div className="flex items-center gap-3 text-slate-400">
                    <span className="hidden md:inline text-xs font-medium uppercase tracking-wider opacity-60 border-r border-slate-700 pr-3">
                        Modo Administrador
                    </span>
                    <div className="flex items-center gap-2 text-blue-100">
                        {getPageIcon(pathname)}
                        <span className="text-sm font-semibold">{getPageName(pathname)}</span>
                    </div>
                </div>

            </div>
        </div>
    )
}