'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Calculator, AlertTriangle, CheckCircle2, Eye, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// Denominaciones de dinero (Ecuador - USD)
const DENOMINATIONS = [
    { value: 20, label: 'Billetes $20' },
    { value: 10, label: 'Billetes $10' },
    { value: 5, label: 'Billetes $5' },
    { value: 1, label: 'Billetes/Monedas $1' },
    { value: 0.50, label: 'Monedas 50¢' },
    { value: 0.25, label: 'Monedas 25¢' },
    { value: 0.10, label: 'Monedas 10¢' },
    { value: 0.05, label: 'Monedas 5¢' },
    { value: 0.01, label: 'Centavos 1¢' },
]

export default function CashCutPage() {
    const supabase = createClient()
    const router = useRouter()

    const [counts, setCounts] = useState<Record<number, string>>({})
    const [userRole, setUserRole] = useState<'admin' | 'cajero' | null>(null)
    const [loading, setLoading] = useState(true)

    // --- DATOS DEL SISTEMA (INICIALIZADOS EN 0 PARA EVITAR NEGATIVOS) ---
    // Cuando integres las ventas reales, reemplazarás estos ceros por los datos de DB.
    const systemData = {
        initial: 0.00,
        sales: 0.00,
        expenses: 0.00
    }

    useEffect(() => {
        const getRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                // Corrección de tipo segura
                const profile = data as { role: string } | null
                setUserRole(profile?.role as 'admin' | 'cajero')
            }
            setLoading(false)
        }
        getRole()
    }, [])

    // Cálculos en tiempo real
    const totalCounted = DENOMINATIONS.reduce((acc, denom) => {
        const qty = parseInt(counts[denom.value] || '0')
        return acc + (qty * denom.value)
    }, 0)

    const expectedTotal = systemData.initial + systemData.sales - systemData.expenses
    const difference = totalCounted - expectedTotal

    const handleCountChange = (value: number, qty: string) => {
        // Evitar números negativos
        if (parseInt(qty) < 0) return
        setCounts(prev => ({ ...prev, [value]: qty }))
    }

    const handleCloseShift = async () => {
        // TODO: Aquí conectarás el "Insert" a la tabla cash_cuts en Supabase
        alert(`Cierre guardado con éxito. Total contado: $${totalCounted.toFixed(2)}`)

        // Cerrar sesión y salir
        await supabase.auth.signOut()
        router.replace('/login')
    }

    if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Cargando sistema...</div>

    return (
        // TRUCO CSS: h-[calc(100vh-65px)] fuerza la altura exacta restando el Header (aprox 65px).
        // overflow-y-auto habilita el scroll vertical dentro de esta página si no cabe.
        <div className="h-[calc(100vh-65px)] overflow-y-auto bg-gray-50 p-4 md:p-6">

            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-20">

                {/* === COLUMNA IZQUIERDA: HERRAMIENTA DE CONTEO === */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 order-2 lg:order-1 flex flex-col">

                    {/* Header */}
                    <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg">
                                <Calculator size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">Arqueo de Caja</h1>
                                <p className="text-xs text-slate-400">Contabilización de efectivo</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {userRole === 'cajero' && (
                                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-200 px-3 py-1 rounded-full border border-yellow-500/50">
                                    MODO CIEGO
                                </span>
                            )}
                            <span className="text-xs font-mono bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-6 bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100">
                            {userRole === 'admin'
                                ? '💡 Como Admin, puedes ver la diferencia en tiempo real a la derecha.'
                                : '👋 Cuenta todo el dinero físico e ingrésalo aquí para cerrar tu turno.'}
                        </p>

                        {/* GRID RESPONSIVE: 1 col en móvil, 2 en tablet/pc */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {DENOMINATIONS.map((item) => (
                                <div key={item.value} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 transition-all shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            = ${(parseInt(counts[item.value] || '0') * item.value).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative flex items-center">
                                            {/* Símbolo de dólar visual */}
                                            <span className="absolute left-3 text-gray-400 text-sm font-bold">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="w-24 text-right font-bold text-lg text-gray-900 bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                                                onChange={(e) => handleCountChange(item.value, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TOTAL CARD */}
                        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="text-center sm:text-left">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Físico Contado</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tight">
                                    ${totalCounted.toFixed(2)}
                                </p>
                            </div>

                            {/* Botón CAJERO */}
                            {userRole === 'cajero' && (
                                <button
                                    onClick={handleCloseShift}
                                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    <LogOut size={20} />
                                    Cerrar Turno y Salir
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* === COLUMNA DERECHA: AUDITORÍA (SOLO ADMIN) === */}
                {/* Responsive: order-1 en móvil (arriba) para ver resumen, order-2 en PC (derecha) */}
                {userRole === 'admin' && (
                    <div className="w-full lg:w-96 shrink-0 order-1 lg:order-2 animate-in slide-in-from-right-4 fade-in duration-500">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-0">

                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Eye size={20} className="text-blue-500" />
                                    Auditoría
                                </h2>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-bold">
                                    VISTA ADMIN
                                </span>
                            </div>

                            {/* Resumen */}
                            <div className="space-y-3 text-sm mb-6">
                                <div className="flex justify-between p-2 rounded hover:bg-gray-50">
                                    <span className="text-gray-500">Fondo Inicial</span>
                                    <span className="font-mono font-medium text-gray-700">${systemData.initial.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded hover:bg-gray-50">
                                    <span className="text-gray-500">(+) Ventas Sistema</span>
                                    <span className="font-mono font-medium text-green-600">${systemData.sales.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded hover:bg-gray-50">
                                    <span className="text-gray-500">(-) Gastos</span>
                                    <span className="font-mono font-medium text-red-500">${systemData.expenses.toFixed(2)}</span>
                                </div>

                                <div className="border-t border-dashed border-gray-300 my-2"></div>

                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="font-bold text-gray-600 text-xs uppercase">Debería haber</span>
                                    <span className="font-black text-xl text-gray-900">${expectedTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Semáforo de Diferencia */}
                            <div className={`p-5 rounded-xl border-l-4 shadow-sm flex items-start gap-4 transition-all
                                ${difference === 0
                                    ? 'bg-green-50 border-green-500 text-green-900'
                                    : difference < 0
                                        ? 'bg-red-50 border-red-500 text-red-900'
                                        : 'bg-yellow-50 border-yellow-500 text-yellow-900'
                                }`}
                            >
                                <div className={`p-2 rounded-full bg-white/50 shrink-0`}>
                                    {difference === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-70">
                                        {difference === 0 ? 'CUADRE PERFECTO' : difference < 0 ? 'FALTANTE' : 'SOBRANTE'}
                                    </p>
                                    <p className="text-3xl font-black tracking-tight leading-none">
                                        {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block ml-1">Observaciones</label>
                                <textarea
                                    rows={3}
                                    placeholder="Ej: Faltaron 5 centavos..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none resize-none bg-white focus:bg-gray-50 transition-colors"
                                />
                            </div>

                            <button className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2">
                                <Save size={18} />
                                CONFIRMAR CIERRE FINAL
                            </button>

                            <button
                                onClick={() => router.back()}
                                className="w-full mt-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Volver sin cerrar
                            </button>

                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}