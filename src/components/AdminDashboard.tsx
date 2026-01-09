'use client'

import Link from 'next/link'
import {
    ShoppingCart,
    Package,
    Users,
    FileBarChart,
    Settings,
    Lock
} from 'lucide-react'

// Definimos los módulos del sistema
const MODULES = [
    {
        title: 'Ir a la Caja (POS)',
        desc: 'Facturación y venta de productos',
        icon: ShoppingCart,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        href: '/pos',
    },
    {
        title: 'Inventario',
        desc: 'Productos, precios y stock',
        icon: Package,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        href: '/admin/inventory'
    },
    {
        title: 'Cierre de Caja',
        desc: 'Cuadre diario de efectivo',
        icon: Lock,
        color: 'text-green-600',
        bg: 'bg-green-50',
        href: '/admin/cash-count'
    },
    {
        title: 'Reportes',
        desc: 'Ventas por día, mes y año',
        icon: FileBarChart,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        href: '/admin/reports'
    },
    {
        title: 'Usuarios',
        desc: 'Gestión de cajeros y permisos',
        icon: Users,
        color: 'text-pink-600',
        bg: 'bg-pink-50',
        href: '/admin/users'
    },
    {
        title: 'Configuración',
        desc: 'Impresoras y datos del negocio',
        icon: Settings,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        href: '/admin/settings'
    }
]

export default function AdminDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
                <p className="text-gray-500">Bienvenido a BazarOS. ¿Qué deseas hacer hoy?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MODULES.map((mod, idx) => (
                    <Link
                        key={idx}
                        href={mod.href}
                        className="cursor-pointer group relative bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
                    >
                        <div className={`w-14 h-14 rounded-xl ${mod.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <mod.icon className={`w-7 h-7 ${mod.color}`} />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">{mod.title}</h3>
                        <p className="text-sm text-gray-500">{mod.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}