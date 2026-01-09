'use client'

import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
    Search, Plus, Upload, Package,
    AlertTriangle, FileSpreadsheet, Loader2,
    TrendingUp, Archive, X, CheckCircle2, AlertCircle, Save,
    ChevronDown, DollarSign, Barcode, LayoutGrid, FileText,
    Edit, Trash2, Zap
} from 'lucide-react'
import { getProducts } from '@/actions/getProducts'
import { bulkImportProducts } from '@/actions/bulkImportProducts'
import { createProduct } from '@/actions/createProduct'
import { updateProduct } from '@/actions/updateProduct'
import { deleteProduct } from '@/actions/deleteProduct'

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // --- ESTADOS ---
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<{ id: string, name: string } | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [categoriesList, setCategoriesList] = useState<string[]>([])
    const [showCatDropdown, setShowCatDropdown] = useState(false)

    const initialForm = {
        name: '',
        code: '',
        description: '',
        categoryName: '',
        type: 'fisico' as 'fisico' | 'servicio',
        cost: '',
        price: '',
        stock: '',
        minStock: '',
        isQuickAccess: false,
        isVariablePrice: false // <--- NUEVO ESTADO
    }
    const [formData, setFormData] = useState(initialForm)

    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    })

    const fileInputRef = useRef<HTMLInputElement>(null)
    const catInputRef = useRef<HTMLInputElement>(null)

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000)
    }

    const fetchInventory = async () => {
        setLoading(true)
        const result = await getProducts()
        if (result.success && result.data) {
            setProducts(result.data)
            const cats = Array.from(new Set(result.data.map((p: any) => p.categories?.name).filter(Boolean))) as string[]
            setCategoriesList(cats)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInventory()
    }, [])

    // --- HANDLERS ---
    const openEditModal = (product?: any) => {
        if (product) {
            setEditingId(product.id)
            setFormData({
                name: product.name,
                code: product.code || '',
                description: product.description || '',
                categoryName: product.categories?.name || '',
                type: product.product_type,
                cost: product.cost?.toString() || '0',
                price: product.price?.toString() || '0',
                stock: product.stock?.toString() || '0',
                minStock: product.min_stock?.toString() || '5',
                isQuickAccess: product.is_quick_access || false,
                isVariablePrice: product.is_variable_price || false // <--- CARGAMOS EL VALOR
            })
        } else {
            setEditingId(null)
            setFormData(initialForm)
        }
        setIsModalOpen(true)
    }

    const handleSaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        const payload: any = {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            categoryName: formData.categoryName || 'General',
            type: formData.type,
            cost: parseFloat(formData.cost) || 0,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            minStock: parseInt(formData.minStock) || 5,
            isQuickAccess: formData.isQuickAccess,
            isVariablePrice: formData.isVariablePrice // <--- ENVIAMOS EL VALOR
        }

        try {
            let result
            if (editingId) {
                result = await updateProduct({ id: editingId, ...payload })
            } else {
                result = await createProduct(payload)
            }

            if (result.success) {
                showToast(result.message)
                setIsModalOpen(false)
                fetchInventory()
            } else {
                showToast(result.message, 'error')
            }
        } catch (error) {
            showToast('Error inesperado', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const promptDelete = (product: any) => {
        setProductToDelete({ id: product.id, name: product.name })
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!productToDelete) return
        setIsDeleting(true)
        try {
            const result = await deleteProduct(productToDelete.id)
            if (result.success) {
                showToast('Producto eliminado correctamente')
                fetchInventory()
                setIsDeleteModalOpen(false)
                setProductToDelete(null)
            } else {
                showToast(result.message, 'error')
            }
        } catch (error) {
            showToast('Error al intentar eliminar', 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws)
                const result = await bulkImportProducts(data)
                if (result.success) {
                    showToast(`✅ Procesado: ${result.count} ítems.`)
                    fetchInventory()
                } else {
                    showToast(`❌ Error: ${result.message}`, 'error')
                }
            } catch (error) {
                showToast('Error al leer Excel', 'error')
            } finally {
                setImporting(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
            }
        }
        reader.readAsBinaryString(file)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (catInputRef.current && !catInputRef.current.contains(event.target as Node)) {
                setShowCatDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const filteredCategories = categoriesList.filter(c =>
        c.toLowerCase().includes(formData.categoryName.toLowerCase())
    )

    const totalProducts = products.length
    const lowStockCount = products.filter(p => p.product_type === 'fisico' && p.stock <= p.min_stock).length
    const inventoryValue = products.reduce((acc, p) => acc + (p.cost * p.stock), 0)

    return (
        <div className="h-full flex flex-col bg-gray-50/50 relative">

            {/* 1. TOP BAR */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {totalProducts} productos registrados
                    </p>
                </div>

                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                        {importing ? <Loader2 className="animate-spin" size={14} /> : <FileSpreadsheet size={14} className="text-green-600" />}
                        Importar Excel
                    </button>
                    <button onClick={() => openEditModal()} className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all">
                        <Plus size={16} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* 2. STATS */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 bg-white border-b border-gray-200 shrink-0">
                <StatStrip label="Valor Total (Costo)" value={`$${inventoryValue.toFixed(2)}`} icon={TrendingUp} color="text-green-600" />
                <StatStrip label="Items Físicos" value={products.filter(p => p.product_type === 'fisico').length} icon={Package} color="text-blue-600" />
                <StatStrip label="Stock Bajo" value={lowStockCount} icon={AlertTriangle} color={lowStockCount > 0 ? "text-red-600" : "text-gray-400"} />
            </div>

            {/* 3. TABLA */}
            <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col min-h-0">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
                    />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl flex-1 overflow-auto shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 border-b">Código</th>
                                <th className="px-4 py-3 border-b">Producto</th>
                                <th className="px-4 py-3 border-b">Categoría</th>
                                <th className="px-4 py-3 border-b text-right">Costo</th>
                                <th className="px-4 py-3 border-b text-right">PVP</th>
                                <th className="px-4 py-3 border-b text-center">Stock</th>
                                <th className="px-4 py-3 border-b text-center">Estado</th>
                                <th className="px-4 py-3 border-b text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-20 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-20 text-gray-400">No hay productos que coincidan.</td></tr>
                            ) : (
                                filteredProducts.map((p) => {
                                    const isService = p.product_type === 'servicio'
                                    const isLowStock = !isService && p.stock <= p.min_stock

                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500 select-all">{p.code || '-'}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900 text-xs md:text-sm">{p.name}</p>
                                                {p.description && <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{p.description}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                    {p.categories?.name || 'Gral'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-400 text-xs">${p.cost.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 text-xs">
                                                {p.is_variable_price ? <span className="text-blue-500 italic">Var.</span> : `$${p.price.toFixed(2)}`}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isService ? <span className="text-gray-300 text-lg">∞</span> : <span className={`font-bold text-xs ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isService ? (
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">SERV</span>
                                                ) : isLowStock ? (
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 animate-pulse">BAJO</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">OK</span>
                                                )}
                                                {p.is_quick_access && (
                                                    <div className="flex justify-center mt-1" title="Botón Rápido en Caja">
                                                        <Zap size={10} className="text-orange-500 fill-orange-500" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => promptDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR/EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <p className="text-xs text-gray-500">{editingId ? 'Modifica los detalles del ítem.' : 'Ingresa los detalles del ítem o servicio.'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form id="productForm" onSubmit={handleSaveSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Nombre del Producto *</label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Código (Opcional)</label>
                                        <div className="relative">
                                            <Barcode className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input type="text" placeholder="Auto si vacío" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Tipo de Item</label>
                                        <div className="relative">
                                            <LayoutGrid className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none transition-all">
                                                <option value="fisico">Producto Físico (Stock)</option>
                                                <option value="servicio">Servicio (Intangible)</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="relative" ref={catInputRef}>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Categoría *</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input
                                                required type="text" placeholder="Escribe para buscar..."
                                                value={formData.categoryName}
                                                onFocus={() => setShowCatDropdown(true)}
                                                onChange={e => { setFormData({ ...formData, categoryName: e.target.value }); setShowCatDropdown(true) }}
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" autoComplete="off"
                                            />
                                            <div className="absolute right-3 top-2.5">
                                                {categoriesList.includes(formData.categoryName) ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Existente</span>
                                                ) : formData.categoryName.length > 0 ? (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Nueva</span>
                                                ) : null}
                                            </div>
                                        </div>
                                        {showCatDropdown && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                                                {filteredCategories.length > 0 ? (
                                                    filteredCategories.map(c => (
                                                        <button key={c} type="button" onClick={() => { setFormData({ ...formData, categoryName: c }); setShowCatDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors">
                                                            {c}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-xs text-gray-400 text-center">"{formData.categoryName}" será una nueva categoría.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Acceso Rápido en Caja</label>
                                        <div className="relative">
                                            <Zap className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <select
                                                value={formData.isQuickAccess.toString()}
                                                onChange={e => setFormData({ ...formData, isQuickAccess: e.target.value === 'true' })}
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none transition-all"
                                            >
                                                <option value="false">No (Estándar)</option>
                                                <option value="true">Sí (Botón Rápido)</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Descripción (Opcional)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                        <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Costo (Compra)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input type="number" step="0.01" min="0" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase block">Precio (Venta) *</label>
                                            {/* CHECKBOX PRECIO VARIABLE */}
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 w-3 h-3"
                                                    checked={formData.isVariablePrice}
                                                    onChange={e => setFormData({ ...formData, isVariablePrice: e.target.checked })}
                                                />
                                                <span className="text-[10px] font-bold text-blue-600 uppercase">¿Variable?</span>
                                            </label>
                                        </div>

                                        <div className="relative">
                                            <DollarSign className={`absolute left-3 top-2.5 w-4 h-4 ${formData.isVariablePrice ? 'text-gray-400' : 'text-green-500'}`} />
                                            <input
                                                required={!formData.isVariablePrice}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                disabled={formData.isVariablePrice} // Se bloquea si es variable
                                                placeholder={formData.isVariablePrice ? "Definir en Caja" : "0.00"}
                                                className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none font-bold transition-all
                                            ${formData.isVariablePrice
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'border-green-200 bg-green-50/50 text-green-800 focus:ring-2 focus:ring-green-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {formData.type === 'fisico' && (
                                        <>
                                            <div className="col-span-2 border-t border-gray-200 my-1"></div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Stock Actual *</label>
                                                <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Stock Mínimo</label>
                                                <input required type="number" min="0" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                            </div>
                                        </>
                                    )}
                                </div>

                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-white hover:border-gray-300 border border-transparent rounded-xl text-sm font-medium transition-all">Cancelar</button>
                            <button type="submit" form="productForm" disabled={isSaving} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {editingId ? 'Guardar Cambios' : 'Guardar Producto'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && productToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-600 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Producto?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Estás a punto de eliminar <strong>&quot;{productToDelete.name}&quot;</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200 flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOASTS */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'}`}>
                        <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">{toast.type === 'success' ? '¡Éxito!' : 'Error'}</h4>
                            <p className="text-sm font-medium opacity-90">{toast.message}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

function StatStrip({ label, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center justify-center gap-3 py-3 px-2">
            <div className={`p-2 rounded-full bg-gray-50 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-900 leading-none">{value}</p>
            </div>
        </div>
    )
}