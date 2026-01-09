'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, X } from 'lucide-react'
import { getLowStockAlerts } from '@/actions/getLowStockAlerts'

export default function NotificationsBell() {
    const [alerts, setAlerts] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Cargar alertas al montar
    useEffect(() => {
        const fetchAlerts = async () => {
            const result = await getLowStockAlerts()
            if (result.success) {
                setAlerts(result.data)
            }
            setLoading(false)
        }
        fetchAlerts()

        // (Opcional) Podrías poner un setInterval aquí para que revise cada 5 min
    }, [])

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            {/* BOTÓN CAMPANA */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
                <Bell size={20} />

                {/* Badge Rojo (Solo si hay alertas) */}
                {!loading && alerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
            </button>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">

                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm">Notificaciones</h3>
                        {alerts.length > 0 && (
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                {alerts.length} alertas
                            </span>
                        )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-gray-400">Cargando...</div>
                        ) : alerts.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Bell size={18} className="text-green-500" />
                                </div>
                                <p className="text-sm font-bold text-gray-800">Todo en orden</p>
                                <p className="text-xs text-gray-400">No hay productos con stock bajo.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {alerts.map((item) => (
                                    <li key={item.id} className="p-3 hover:bg-red-50/30 transition-colors flex items-start gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg shrink-0 mt-0.5">
                                            <AlertTriangle size={16} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-red-500 font-medium mt-0.5">
                                                Stock Crítico: <span className="font-bold">{item.stock}</span>
                                                <span className="text-gray-400 font-normal ml-1">(Mín: {item.min_stock})</span>
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {alerts.length > 0 && (
                        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                            <a href="/admin/inventory" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                Ir al Inventario
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}