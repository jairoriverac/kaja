'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, LogIn, Lock, Mail, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Estados para la transición suave
    const [isSuccess, setIsSuccess] = useState(false)
    const [userName, setUserName] = useState('')

    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // 1. Login en Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            if (authData.user) {
                // 2. Consultar perfil (Rol y Primer Login)
                // Usamos 'as any' temporalmente para evitar errores de tipos si no has actualizado types.ts
                const { data: profile } = await (supabase.from('profiles') as any)
                    .select('full_name, role, is_first_login')
                    .eq('id', authData.user.id)
                    .single()

                // Preparamos el saludo
                const name = profile?.full_name ? profile.full_name.split(' ')[0] : 'Usuario'
                setUserName(name)

                // 3. ACTIVAR UI DE ÉXITO (Sin redirigir aún)
                setIsSuccess(true)

                // 4. Esperar 1.5s para que el usuario vea el mensaje y la transición sea suave
                setTimeout(() => {
                    if (profile?.is_first_login) {
                        // Caso 1: Primer Login -> Cambiar Clave
                        router.replace('/change-password')
                    } else if (profile?.role === 'cashier') {
                        // Caso 2: Cajero -> POS
                        router.replace('/pos')
                    } else {
                        // Caso 3: Admin -> Dashboard
                        router.replace('/')
                    }
                }, 1500)
            }
        } catch (err: any) {
            console.error(err)
            setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">

            {/* Fondos Decorativos (Blobs) */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl border border-gray-100 p-8 relative z-10 transition-all duration-500">

                {/* --- VISTA DE ÉXITO (Transición) --- */}
                {isSuccess ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm animate-bounce">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Hola, {userName}!</h2>
                        <p className="text-gray-500 text-sm">Accediendo al sistema...</p>

                        {/* Barra de carga falsa para efecto visual */}
                        <div className="mt-8 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 animate-[loading_1.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
                        </div>
                        <style jsx>{`
                @keyframes loading {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>
                    </div>
                ) : (

                    /* --- VISTA DE FORMULARIO --- */
                    <div className="animate-in fade-in duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20 rotate-3 hover:rotate-6 transition-transform duration-300">
                                <Image
                                    src="/images/kaja-logo.svg"
                                    alt="Kaja"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kaja POS</h1>
                            <p className="text-sm text-gray-500 mt-2">Inicia sesión para continuar</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400"
                                        placeholder="usuario@empresa.com"
                                        autoComplete="off" // Desactiva autocompletado
                                        name="kaja_email_login" // Nombre único para evitar conflictos
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400"
                                        placeholder="••••••••"
                                        autoComplete="new-password" // Evita sugerencias de claves viejas
                                        name="kaja_password_login"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg font-medium text-center animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
                                    <span className="block w-2 h-2 bg-red-500 rounded-full"></span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-400 font-medium">
                                © {new Date().getFullYear()} Kaja System. Secure Login.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}