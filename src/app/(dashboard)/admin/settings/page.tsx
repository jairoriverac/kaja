'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
    Building2,
    MapPin,
    Phone,
    FileText,
    Save,
    Loader2,
    Percent,
    Mail,
    DollarSign
} from 'lucide-react'

// Definimos la interfaz localmente
interface SettingsData {
    id: string
    store_name: string
    address: string
    ruc: string
    phone: string
    email: string
    tax_rate: number
    currency_symbol: string
}

export default function SettingsPage() {
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState<SettingsData>({
        id: '',
        store_name: '',
        address: '',
        ruc: '',
        phone: '',
        email: '',
        tax_rate: 15,
        currency_symbol: '$'
    })

    // Cargar configuración
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await (supabase.from('settings') as any)
                    .select('*')
                    .limit(1)
                    .single()

                if (error) throw error

                if (data) {
                    setFormData({
                        id: data.id,
                        store_name: data.store_name || '',
                        address: data.address || '',
                        ruc: data.ruc || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        tax_rate: data.tax_rate || 0,
                        currency_symbol: data.currency_symbol || '$'
                    })
                }
            } catch (error) {
                console.error('Error cargando configuración:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    // Guardar cambios
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const { error } = await (supabase.from('settings') as any)
                .update({
                    store_name: formData.store_name,
                    address: formData.address,
                    ruc: formData.ruc,
                    phone: formData.phone,
                    email: formData.email,
                    tax_rate: formData.tax_rate,
                    currency_symbol: formData.currency_symbol
                })
                .eq('id', formData.id)

            if (error) throw error

            setMessage({ type: 'success', text: 'Información guardada correctamente' })
            setTimeout(() => setMessage(null), 3000)

        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: 'Error al guardar los cambios' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        // CAMBIO CLAVE: Quitamos 'relative' y usamos flex column estándar.
        <form onSubmit={handleSave} className="h-full flex flex-col bg-gray-50/50">

            {/* 1. ÁREA DE CONTENIDO (Scrollable) */}
            {/* flex-1 hace que ocupe todo el espacio MENOS el de la barra inferior */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                        <p className="text-gray-500 text-sm">Datos generales de tu negocio.</p>
                    </div>

                    {/* SECCIÓN 1: Identidad */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="text-blue-600" size={20} />
                            Identidad del Negocio
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.store_name}
                                    onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Bazar Doña María"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RUC / Identificación</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.ruc}
                                        onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ej: 1712345678001"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ej: Av. Principal 123"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: Contacto */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Phone className="text-green-600" size={20} />
                            Contacto
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Ej: 0991234567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email del Negocio</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="negocio@email.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: Fiscal */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Percent className="text-orange-600" size={20} />
                            Datos Fiscales
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IVA por Defecto (%)</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="number"
                                        value={formData.tax_rate}
                                        onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Símbolo Moneda</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={formData.currency_symbol}
                                        onChange={e => setFormData({ ...formData, currency_symbol: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Espaciador final para dar aire al último input antes del borde */}
                    <div className="h-4"></div>
                </div>
            </div>

            {/* 2. BARRA INFERIOR (Fija en el layout, no overlay) */}
            {/* Al no ser 'absolute', empuja el contenido hacia arriba */}
            <div className="bg-white border-t border-gray-200 p-4 shadow-lg z-10 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">

                    {/* Mensaje de estado */}
                    <div className="flex-1 mr-4">
                        {message && (
                            <span className={`text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                            </span>
                        )}
                    </div>

                    {/* Botón Grande */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-lg active:scale-95 hover:-translate-y-0.5"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

        </form>
    )
}