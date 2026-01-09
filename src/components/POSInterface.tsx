'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation' // <--- Importamos useRouter
import { Trash2, ShoppingCart, Printer, FileText, Search, CreditCard, Zap, Package, X, Layers, Loader2, DollarSign, LogOut, ClipboardList } from 'lucide-react'

// --- TIPOS ---
type CartItem = {
    id: string
    dbId: string
    name: string
    price: number
    quantity: number
    type: 'fisico' | 'servicio'
}

type Product = {
    id: string
    name: string
    price: number
    code: string | null
    product_type: 'fisico' | 'servicio'
    is_variable_price: boolean
    stock: number
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function POSInterface() {
    const supabase = createClient()
    const router = useRouter() // <--- Hook de navegación

    // --- STATE ---
    const [cart, setCart] = useState<CartItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [quickProducts, setQuickProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    // Estado Búsqueda
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)

    // Estado Modal Precio Variable
    const [priceModal, setPriceModal] = useState<{ open: boolean, product: Product | null }>({ open: false, product: null })
    const [manualPriceInput, setManualPriceInput] = useState('')
    const priceInputRef = useRef<HTMLInputElement>(null)

    const inputRef = useRef<HTMLInputElement>(null)

    // --- CARGA INICIAL ---
    useEffect(() => {
        const fetchQuickAccess = async () => {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('is_quick_access', true)
                .order('name')
            if (data) setQuickProducts(data as Product[])
            setLoading(false)
        }
        fetchQuickAccess()
    }, [])

    // --- BÚSQUEDA ---
    useEffect(() => {
        const isQuantityMode = !isNaN(parseInt(searchQuery)) && searchQuery.length < 5
        if (!searchQuery.trim() || isQuantityMode) {
            setSearchResults([])
            setShowDropdown(false)
            return
        }
        const timer = setTimeout(async () => {
            setIsSearching(true)
            setShowDropdown(true)
            const { data } = await supabase
                .from('products')
                .select('*')
                .or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%`)
                .limit(5)
            if (data) setSearchResults(data as Product[])
            setIsSearching(false)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // --- LÓGICA AGREGAR AL CARRITO ---
    const handleProductClick = (product: Product) => {
        if (product.is_variable_price) {
            setManualPriceInput('')
            setPriceModal({ open: true, product })
            setTimeout(() => priceInputRef.current?.focus(), 100)
            return
        }
        addToCart(product)
    }

    const confirmVariablePrice = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!priceModal.product) return

        const price = parseFloat(manualPriceInput)
        if (isNaN(price) || price <= 0) return

        addToCart(priceModal.product, undefined, price)

        setPriceModal({ open: false, product: null })
        setManualPriceInput('')
        inputRef.current?.focus()
    }

    const addToCart = (product: Product, quantityOverride?: number, priceOverride?: number) => {
        let qtyToAdd = quantityOverride || 1

        const searchAsNumber = parseInt(searchQuery)
        if (!quantityOverride && !isNaN(searchAsNumber) && searchAsNumber > 0 && searchQuery.length < 5) {
            qtyToAdd = searchAsNumber
        }

        const finalPrice = priceOverride !== undefined ? priceOverride : product.price

        setCart(prev => {
            const existing = prev.find(i => i.dbId === product.id && i.price === finalPrice)

            if (existing) {
                return prev.map(i => (i.dbId === existing.dbId && i.price === existing.price) ? { ...i, quantity: i.quantity + qtyToAdd } : i)
            }
            return [...prev, {
                id: crypto.randomUUID(),
                dbId: product.id,
                name: product.name,
                price: finalPrice,
                quantity: qtyToAdd,
                type: product.product_type
            }]
        })

        setSearchQuery('')
        setShowDropdown(false)
        inputRef.current?.focus()
    }

    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const { data } = await supabase.from('products').select('*').eq('code', searchQuery.trim()).single()
            if (data) {
                handleProductClick(data as Product)
            } else if (searchResults.length > 0) {
                handleProductClick(searchResults[0])
            }
        }
    }

    const updateQuantity = (id: string, newQty: string) => {
        const qty = parseInt(newQty)
        if (isNaN(qty) || qty < 1) return
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item))
    }

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId))
        inputRef.current?.focus()
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

    const getProductStyle = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes('b/n') || (n.includes('blanco') && n.includes('negro'))) return { icon: Printer, color: 'text-gray-700', bg: 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 shadow-sm' }
        if (n.includes('color')) return { icon: Printer, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300 shadow-sm' }
        if (n.includes('anillado') || n.includes('plastifi')) return { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm' }
        if (n.includes('oficio') || n.includes('redac') || n.includes('impre')) return { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 shadow-sm' }
        return { icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 shadow-sm' }
    }

    const smallCards = quickProducts.filter(p => p.name.length <= 15)
    const largeCards = quickProducts.filter(p => p.name.length > 15)
    const orderedQuickProducts = [...smallCards, ...largeCards]

    useEffect(() => {
        if (!priceModal.open) {
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(timeout)
        }
    }, [cart, priceModal.open])

    return (
        <div className="flex h-full bg-gray-100 font-sans overflow-hidden relative">

            {/* IZQUIERDA */}
            <div className="flex-1 flex flex-col p-4 pr-2 gap-4 h-full min-w-0 relative">

                {/* BARRA BÚSQUEDA */}
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 border border-gray-200 shrink-0 relative z-20">
                    <Search className="text-gray-400 w-6 h-6" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleScan}
                        placeholder="Escanea, escribe nombre o cantidad..."
                        className="flex-1 text-xl outline-none placeholder:text-gray-300 font-medium text-gray-700"
                        autoFocus
                        autoComplete="off"
                    />
                    {!isNaN(parseInt(searchQuery)) && searchQuery.length > 0 && searchQuery.length < 5 && (
                        <div className="absolute right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-in zoom-in">Modo Cantidad: {searchQuery}x</div>
                    )}
                    {searchQuery.length > 0 && isNaN(parseInt(searchQuery)) && (
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    )}

                    {/* DROPDOWN */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {isSearching ? (
                                <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Buscando...</div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">No se encontraron productos.</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {searchResults.map((prod) => (
                                        <button key={prod.id} onClick={() => handleProductClick(prod)} className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center group transition-colors">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{prod.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{prod.code ? `COD: ${prod.code}` : 'Sin Código'} • {prod.product_type === 'fisico' ? `Stock: ${prod.stock}` : 'Servicio'}</p>
                                            </div>
                                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 group-hover:bg-white transition-colors">${prod.price.toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* TABLA CARRITO */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden z-10">
                    <div className="grid grid-cols-12 bg-gray-50 p-3 font-semibold text-gray-500 text-xs uppercase tracking-wider border-b">
                        <div className="col-span-6 pl-2">Descripción</div>
                        <div className="col-span-2 text-center">Cant.</div>
                        <div className="col-span-2 text-right">Precio</div>
                        <div className="col-span-2 text-right pr-2">Total</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <ShoppingCart size={48} className="mb-3 opacity-20" />
                                <p className="font-medium">El carrito está vacío</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 items-center p-3 border-b border-gray-50 hover:bg-blue-50/50 transition-colors group">
                                    <div className="col-span-6 pl-2">
                                        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                                        {item.type === 'servicio' && <span className="inline-block mt-0.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded font-medium">SERVICIO</span>}
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-16 text-center font-bold text-gray-700 bg-gray-100 border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded-lg p-1 outline-none transition-all" />
                                    </div>
                                    <div className="col-span-2 text-right text-gray-500 text-sm font-mono">{item.price.toFixed(2)}</div>
                                    <div className="col-span-2 text-right font-bold text-gray-900 pr-2 flex justify-end items-center gap-2">
                                        <span>{formatCurrency(item.price * item.quantity)}</span>
                                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="bg-gray-50 p-2 text-xs text-gray-400 text-center border-t border-gray-100 flex justify-between px-4">
                        <span>Items: {cart.length}</span>
                        <span>Unidades: {totalItems}</span>
                    </div>
                </div>
            </div>

            {/* DERECHA */}
            <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-10">

                {/* Header Total y Botón Cierre */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50 relative">
                    {/* BOTÓN DE CIERRE DE CAJA */}
                    <button
                        onClick={() => router.push('/cash-cut')}
                        className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                        title="Ir a Cierre de Caja"
                    >
                        <ClipboardList size={20} />
                    </button>

                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total a Pagar</h2>
                    <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-5xl font-extrabold tracking-tight">{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="flex-1 p-5 overflow-y-auto bg-white">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={14} /> Accesos Rápidos</h3>
                    {loading ? (
                        <div className="flex flex-col gap-2 animate-pulse">
                            <div className="h-12 bg-gray-100 rounded-xl"></div><div className="h-12 bg-gray-100 rounded-xl"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {orderedQuickProducts.map((prod) => {
                                const style = getProductStyle(prod.name)
                                const Icon = style.icon
                                const isLongName = prod.name.length > 15
                                return (
                                    <button key={prod.id} onClick={() => handleProductClick(prod)} className={`flex items-center p-3 border rounded-xl transition-all active:scale-95 shadow-sm ${style.bg} ${isLongName ? 'col-span-2 flex-row justify-between px-4' : 'flex-col justify-center gap-1'}`}>
                                        <div className={`flex items-center gap-2 ${!isLongName && 'flex-col'}`}>
                                            <Icon className={`w-5 h-5 ${style.color}`} />
                                            <span className={`font-bold text-xs text-gray-700 leading-tight ${isLongName ? 'text-left' : 'text-center line-clamp-2'}`}>{prod.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold ${style.color} bg-white/60 px-2 py-0.5 rounded border border-gray-100`}>
                                            {prod.is_variable_price ? 'Variable' : `$${prod.price.toFixed(2)}`}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-200 bg-white">
                    <button className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-xl font-bold text-lg shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50" onClick={() => alert(`Procesando...`)} disabled={cart.length === 0 || processing}>
                        <CreditCard className="w-5 h-5" /> <span>{processing ? 'Procesando...' : 'COBRAR'}</span>
                    </button>
                </div>
            </div>

            {/* --- MODAL PRECIO VARIABLE --- */}
            {priceModal.open && priceModal.product && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="text-blue-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Precio Variable</h3>
                            <p className="text-sm text-gray-500">Ingresa el valor para: <br /><strong className="text-gray-800">{priceModal.product.name}</strong></p>
                        </div>

                        <form onSubmit={confirmVariablePrice}>
                            <div className="relative mb-6">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                                <input
                                    ref={priceInputRef}
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={manualPriceInput}
                                    onChange={e => setManualPriceInput(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-gray-900 bg-gray-50 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:bg-white outline-none text-center transition-all"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setPriceModal({ open: false, product: null })} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}