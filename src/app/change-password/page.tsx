'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Save, Loader2, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { updatePasswordFirstLogin } from '@/actions/updatePasswordFirstLogin'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // --- ESTADOS PARA HACK ANTI-AUTOCOMPLETE ---
    // Iniciamos en true para que el navegador ignore los campos al cargar
    const [isPwdReadOnly, setIsPwdReadOnly] = useState(true)
    const [isConfirmReadOnly, setIsConfirmReadOnly] = useState(true)

    // --- ESTADOS PARA VALIDACIÓN VISUAL ---
    const [password, setPassword] = useState('')
    const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

    // Función para medir la fuerza de la contraseña
    const checkStrength = (pass: string) => {
        setPassword(pass)
        if (pass.length === 0) {
            setStrength('weak')
            return
        }

        let score = 0
        if (pass.length >= 8) score++       // Longitud aceptable
        if (/[A-Z]/.test(pass)) score++     // Tiene mayúsculas
        if (/[0-9]/.test(pass)) score++     // Tiene números

        if (score === 3) setStrength('strong')
        else if (score === 2) setStrength('medium')
        else setStrength('weak')
    }

    // Calcula el color del borde según la fuerza
    const getBorderColor = () => {
        if (password.length === 0) return 'border-gray-200 focus:ring-blue-500'
        if (strength === 'weak') return 'border-red-300 focus:border-red-500 focus:ring-red-200 text-red-900'
        if (strength === 'medium') return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200 text-yellow-900'
        return 'border-green-300 focus:border-green-500 focus:ring-green-200 text-green-900'
    }

    // Texto de ayuda dinámico
    const getStrengthText = () => {
        if (password.length === 0) return ''
        if (strength === 'weak') return 'Débil (Usa min 8 caracteres, números y mayúsculas)'
        if (strength === 'medium') return 'Aceptable'
        return 'Segura'
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const result = await updatePasswordFirstLogin(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else if (result?.success) {
            if (result.role === 'cashier') {
                router.replace('/pos')
            } else {
                router.replace('/')
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">

            {/* Decoración de fondo */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-gray-100 relative z-10 transition-all duration-300">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm rotate-3">
                        <KeyRound size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Actualizar Contraseña</h1>
                    <p className="text-gray-500 text-sm mt-2 px-4">
                        Por tu seguridad, establece una nueva contraseña personal.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">

                    {/* INPUTS FANTASMA: Trampa para navegadores antiguos */}
                    <input type="text" style={{ display: 'none' }} />
                    <input type="password" style={{ display: 'none' }} />

                    {/* CAMPO: NUEVA CONTRASEÑA */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-700 uppercase">Nueva Contraseña</label>
                            <span className={`text-xs font-bold transition-colors duration-300 ${strength === 'strong' ? 'text-green-600' :
                                    strength === 'medium' ? 'text-yellow-600' : 'text-gray-400'
                                }`}>
                                {getStrengthText()}
                            </span>
                        </div>
                        <div className="relative group">
                            {strength === 'strong' ? (
                                <ShieldCheck className="absolute left-3 top-3.5 text-green-500 w-5 h-5 transition-all" />
                            ) : (
                                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-all" />
                            )}

                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="Escribe tu nueva clave"
                                autoComplete="new-password"

                                // EL FIX DEL AUTOCOMPLETE: ReadOnly hasta que el usuario toque
                                readOnly={isPwdReadOnly}
                                onFocus={() => setIsPwdReadOnly(false)}

                                onChange={(e) => checkStrength(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all duration-300 focus:ring-4 font-medium ${getBorderColor()}`}
                            />
                        </div>

                        {/* Barra de progreso de fuerza */}
                        <div className="flex gap-1 mt-2 h-1">
                            <div className={`flex-1 rounded-full transition-colors duration-500 ${password.length > 0 ? (strength === 'weak' ? 'bg-red-400' : strength === 'medium' ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                            <div className={`flex-1 rounded-full transition-colors duration-500 ${strength === 'medium' || strength === 'strong' ? (strength === 'medium' ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                            <div className={`flex-1 rounded-full transition-colors duration-500 ${strength === 'strong' ? 'bg-green-500' : 'bg-gray-100'}`} />
                        </div>
                    </div>

                    {/* CAMPO: CONFIRMAR CONTRASEÑA */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Confirmar Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                placeholder="Repite la contraseña"
                                autoComplete="new-password"

                                // EL FIX DEL AUTOCOMPLETE TAMBIÉN AQUÍ
                                readOnly={isConfirmReadOnly}
                                onFocus={() => setIsConfirmReadOnly(false)}

                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
                            <ShieldAlert size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (strength === 'weak' && password.length > 0)}
                        className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Actualizando...' : 'Guardar y Entrar'}
                    </button>

                </form>
            </div>

            <div className="absolute bottom-6 text-center w-full">
                <p className="text-xs text-gray-400 font-medium">© 2026 Kaja Security System</p>
            </div>
        </div>
    )
}