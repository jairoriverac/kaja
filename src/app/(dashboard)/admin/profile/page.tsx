'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Mail, Shield, Save, Loader2, Lock, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilePage() {
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Estados para Anti-Autocomplete
    const [isPwdReadOnly, setIsPwdReadOnly] = useState(true)
    const [isConfirmReadOnly, setIsConfirmReadOnly] = useState(true)

    // Estados para Fuerza de Contraseña
    const [pwdStrength, setPwdStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

    const [formData, setFormData] = useState({
        id: '',
        email: '',
        full_name: '',
        role: ''
    })

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    // Función de Fuerza
    const checkStrength = (pass: string) => {
        setPasswords(prev => ({ ...prev, newPassword: pass }))
        if (pass.length === 0) {
            setPwdStrength('weak')
            return
        }
        let score = 0
        if (pass.length >= 8) score++
        if (/[A-Z]/.test(pass)) score++
        if (/[0-9]/.test(pass)) score++

        if (score === 3) setPwdStrength('strong')
        else if (score === 2) setPwdStrength('medium')
        else setPwdStrength('weak')
    }

    // Helpers Visuales
    const getBorderColor = () => {
        if (passwords.newPassword.length === 0) return 'border-gray-300 focus:ring-orange-500'
        if (pwdStrength === 'weak') return 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
        if (pwdStrength === 'medium') return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200 text-yellow-900'
        return 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900'
    }

    const getStrengthText = () => {
        if (passwords.newPassword.length === 0) return ''
        if (pwdStrength === 'weak') return 'Débil'
        if (pwdStrength === 'medium') return 'Mejor'
        return 'Fuerte'
    }

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await (supabase.from('profiles') as any)
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    const profile = data as Profile
                    setFormData({
                        id: user.id,
                        email: user.email || '',
                        full_name: profile.full_name || '',
                        role: profile.role === 'admin' ? 'Administrador' : 'Cajero'
                    })
                }
            }
            setLoading(false)
        }
        getProfile()
    }, [])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            // 1. Actualizar Nombre
            const { error: profileError } = await (supabase.from('profiles') as any)
                .update({ full_name: formData.full_name })
                .eq('id', formData.id)

            if (profileError) throw profileError

            // 2. Actualizar Password
            if (passwords.newPassword) {
                if (passwords.newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
                if (passwords.newPassword !== passwords.confirmPassword) throw new Error('Las contraseñas no coinciden')

                const { error: authError } = await supabase.auth.updateUser({
                    password: passwords.newPassword
                })
                if (authError) throw authError
            }

            setMessage({ type: 'success', text: 'Datos actualizados correctamente' })
            setPasswords({ newPassword: '', confirmPassword: '' })
            setPwdStrength('weak') // Reiniciar medidor
            setTimeout(() => setMessage(null), 3000)

        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: error.message || 'Error al actualizar' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        // 👇 AQUÍ ESTÁ EL ARREGLO PRINCIPAL: h-full overflow-y-auto
        <div className="h-full overflow-y-auto bg-gray-50/50">

            <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24"> {/* pb-24 asegura espacio al final */}

                <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                    {/* COLUMNA IZQUIERDA: TARJETA DE PERFIL */}
                    <div className="md:col-span-1 w-full">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center sticky top-6">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-100 uppercase">
                                {formData.full_name ? formData.full_name.substring(0, 2) : 'US'}
                            </div>
                            <h2 className="font-bold text-gray-800 text-lg break-words">{formData.full_name || 'Sin Nombre'}</h2>
                            <p className="text-sm text-gray-500 mb-4 break-all">{formData.email}</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                <Shield size={12} />
                                {formData.role}
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: FORMULARIO */}
                    <div className="md:col-span-2 w-full">
                        <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6" autoComplete="off">

                            {/* HACK ANTI-AUTOCOMPLETE */}
                            <input type="text" style={{ display: 'none' }} />
                            <input type="password" style={{ display: 'none' }} />

                            {/* DATOS PERSONALES */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-600" /> Información Personal
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Correo (No editable)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                value={formData.email}
                                                disabled
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* SEGURIDAD (PASSWORD) */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <KeyRound size={20} className="text-orange-500" /> Seguridad
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* NUEVA CONTRASEÑA CON MEDIDOR */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                                            <span className={`text-xs font-bold transition-colors ${pwdStrength === 'strong' ? 'text-green-600' :
                                                    pwdStrength === 'medium' ? 'text-yellow-600' : 'text-gray-400'
                                                }`}>
                                                {getStrengthText()}
                                            </span>
                                        </div>
                                        <div className="relative group">
                                            {pwdStrength === 'strong' ? (
                                                <ShieldCheck className="absolute left-3 top-2.5 text-green-500 w-4 h-4 transition-all" />
                                            ) : (
                                                <Lock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-all" />
                                            )}

                                            <input
                                                type="password"
                                                placeholder="Mínimo 6 caracteres"
                                                autoComplete="new-password"

                                                // FIX AUTOCOMPLETE
                                                readOnly={isPwdReadOnly}
                                                onFocus={() => setIsPwdReadOnly(false)}

                                                value={passwords.newPassword}
                                                onChange={(e) => checkStrength(e.target.value)}
                                                className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none transition-all ${getBorderColor()}`}
                                            />
                                        </div>

                                        {/* Barra de progreso */}
                                        <div className="flex gap-1 mt-1.5 h-1">
                                            <div className={`flex-1 rounded-full transition-colors duration-500 ${passwords.newPassword.length > 0 ? (pwdStrength === 'weak' ? 'bg-red-400' : pwdStrength === 'medium' ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                                            <div className={`flex-1 rounded-full transition-colors duration-500 ${pwdStrength === 'medium' || pwdStrength === 'strong' ? (pwdStrength === 'medium' ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                                            <div className={`flex-1 rounded-full transition-colors duration-500 ${pwdStrength === 'strong' ? 'bg-green-500' : 'bg-gray-100'}`} />
                                        </div>
                                    </div>

                                    {/* CONFIRMAR */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-all" />
                                            <input
                                                type="password"
                                                placeholder="Repetir contraseña"
                                                autoComplete="new-password"

                                                // FIX AUTOCOMPLETE
                                                readOnly={isConfirmReadOnly}
                                                onFocus={() => setIsConfirmReadOnly(false)}

                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                    <ShieldAlert size={12} />
                                    Deja los campos vacíos si no deseas cambiar tu contraseña actual.
                                </p>
                            </div>

                            {/* MENSAJES */}
                            {message && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                                    <span className="font-medium">{message.text}</span>
                                </div>
                            )}

                            {/* BOTÓN */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}