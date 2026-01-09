'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import {
    UserPlus,
    User,
    Loader2,
    Trash2,
    Mail,
    IdCard,
    Phone,
    MapPin,
    Edit,
    ShieldCheck,
    Store,
    X,
    CheckCircle2,
    AlertCircle,
    AlertTriangle // Nuevo icono para el modal de borrar
} from 'lucide-react'
import { createUser } from '@/actions/createUser'
import { updateUser } from '@/actions/updateUser'
import { deleteUser } from '@/actions/deleteUser'
import { Database } from '@/types/database.types'

interface ExtendedProfile {
    id: string
    full_name: string | null
    cedula: string | null
    email: string | null
    phone: string | null
    address: string | null
    role: 'admin' | 'cashier'
    created_at: string
}

export default function UsersPage() {
    const supabase = createClient()

    const [users, setUsers] = useState<ExtendedProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Estados de carga independientes
    const [isCreating, setIsCreating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [editingId, setEditingId] = useState<string | null>(null)

    // ESTADO PARA EL TOAST
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    })

    // ESTADO PARA EL MODAL DE ELIMINAR (Nuevo)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, userId: string | null }>({
        isOpen: false,
        userId: null
    })

    const [formData, setFormData] = useState({
        cedula: '',
        full_name: '',
        email: '',
        address: '',
        phone: '',
        role: 'cashier' as 'admin' | 'cashier'
    })

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }))
        }, 4000)
    }

    const fetchUsers = async () => {
        setLoading(true)
        const { data } = await (supabase.from('profiles') as any)
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setUsers(data as unknown as ExtendedProfile[])
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const openCreateModal = () => {
        setEditingId(null)
        setFormData({ cedula: '', full_name: '', email: '', address: '', phone: '', role: 'cashier' })
        setIsModalOpen(true)
    }

    const openEditModal = (user: ExtendedProfile) => {
        setEditingId(user.id)
        setFormData({
            cedula: user.cedula || '',
            full_name: user.full_name || '',
            email: user.email || '',
            address: user.address || '',
            phone: user.phone || '',
            role: user.role
        })
        setIsModalOpen(true)
    }

    // --- 1. SOLICITAR ELIMINACIÓN (Abre el modal) ---
    const handleDeleteClick = (userId: string) => {
        setDeleteModal({ isOpen: true, userId })
    }

    // --- 2. CONFIRMAR ELIMINACIÓN (Ejecuta la acción) ---
    const confirmDelete = async () => {
        if (!deleteModal.userId) return
        setIsDeleting(true)

        try {
            const result = await deleteUser(deleteModal.userId)

            if (!result.success) throw new Error(result.message)

            showToast('Usuario eliminado correctamente.', 'success')
            fetchUsers()
            setDeleteModal({ isOpen: false, userId: null }) // Cerrar modal

        } catch (error: any) {
            showToast(error.message || 'Error al eliminar', 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            if (editingId) {
                const result = await updateUser({
                    id: editingId,
                    email: formData.email,
                    cedula: formData.cedula,
                    fullName: formData.full_name,
                    address: formData.address,
                    phone: formData.phone,
                    role: formData.role
                })
                if (!result.success) throw new Error(result.message)
                showToast('Usuario actualizado correctamente.', 'success')
            } else {
                const result = await createUser({
                    email: formData.email,
                    cedula: formData.cedula,
                    fullName: formData.full_name,
                    address: formData.address,
                    phone: formData.phone,
                    role: formData.role
                })
                if (!result.success) throw new Error(result.message)
                showToast('Usuario registrado exitosamente.', 'success')
            }
            setIsModalOpen(false)
            fetchUsers()
        } catch (error: any) {
            showToast(error.message || 'Error inesperado', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="h-full flex flex-col bg-gray-50/50 relative overflow-hidden">

            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Equipo de Trabajo</h1>
                    <p className="text-gray-500 text-sm mt-1">Administra el acceso y roles de tu personal.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all"
                >
                    <UserPlus size={18} />
                    Nuevo Colaborador
                </button>
            </div>

            {/* GRID */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onEdit={() => openEditModal(user)}
                                onDelete={() => handleDeleteClick(user.id)} // 👈 Ahora llamamos a handleDeleteClick
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL CREAR/EDITAR (Sin cambios mayores) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    {editingId ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {editingId ? 'Actualiza la información' : 'La cédula será la contraseña inicial'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6" autoComplete="off">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Asignar Rol</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <RoleCard
                                        selected={formData.role === 'admin'}
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        title="Administrador"
                                        desc="Acceso total al sistema"
                                        icon={ShieldCheck}
                                        color="purple"
                                    />
                                    <RoleCard
                                        selected={formData.role === 'cashier'}
                                        onClick={() => setFormData({ ...formData, role: 'cashier' })}
                                        title="Cajero / Vendedor"
                                        desc="Solo ventas y caja"
                                        icon={Store}
                                        color="blue"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputGroup label="Cédula de Identidad" icon={IdCard}>
                                    <input
                                        required
                                        disabled={!!editingId}
                                        type="text"
                                        autoComplete="new-password"
                                        value={formData.cedula}
                                        onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    />
                                </InputGroup>
                                <InputGroup label="Nombre Completo" icon={User}>
                                    <input
                                        required
                                        type="text"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </InputGroup>
                                <InputGroup label="Correo Electrónico" icon={Mail}>
                                    <input
                                        required
                                        type="email"
                                        autoComplete="off"
                                        name="email_usuario_new"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </InputGroup>
                                <InputGroup label="Teléfono Celular" icon={Phone}>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </InputGroup>
                                <div className="md:col-span-2">
                                    <InputGroup label="Dirección Domiciliaria" icon={MapPin}>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </InputGroup>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isCreating} className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit size={16} /> : <UserPlus size={16} />)}
                                    {isCreating ? 'Procesando...' : (editingId ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NUEVO: MODAL DE ELIMINACIÓN CON ESTILO --- */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border-2 border-red-50">

                        {/* Icono animado */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <AlertTriangle size={32} className="text-red-600" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            ¿Eliminar Usuario?
                        </h3>

                        <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
                            Estás a punto de eliminar a este usuario permanentemente.<br />
                            <b>Esta acción no se puede deshacer.</b>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, userId: null })}
                                className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                                {isDeleting ? 'Borrando...' : 'Sí, Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'
                        }`}>
                        <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">{toast.type === 'success' ? '¡Éxito!' : 'Error'}</h4>
                            <p className="text-sm font-medium opacity-90">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-4 text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

// SUBCOMPONENTES (Igual que antes)
function UserCard({ user, onEdit, onDelete }: { user: ExtendedProfile, onEdit: () => void, onDelete: () => void }) {
    const isAdmin = user.role === 'admin'
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`} />
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                        {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{user.full_name || 'Sin Nombre'}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${isAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                            {isAdmin ? <ShieldCheck size={10} /> : <Store size={10} />}
                            {isAdmin ? 'ADMINISTRADOR' : 'CAJERO'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                        <Edit size={16} />
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-gray-50">
                <InfoRow icon={IdCard} text={user.cedula || 'No registrada'} />
                <InfoRow icon={Mail} text={user.email || 'No registrado'} />
                <InfoRow icon={Phone} text={user.phone || 'No registrado'} />
                <InfoRow icon={MapPin} text={user.address || 'No registrada'} />
            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="w-6 flex justify-center">
                <Icon size={14} className="text-gray-400" />
            </div>
            <span className="truncate">{text}</span>
        </div>
    )
}

function RoleCard({ selected, onClick, title, desc, icon: Icon, color }: any) {
    const isPurple = color === 'purple'
    const activeClass = isPurple
        ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
        : 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl border-2 p-4 transition-all relative ${selected ? activeClass : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
            {selected && (
                <div className={`absolute top-2 right-2 rounded-full p-0.5 ${isPurple ? 'text-purple-600 bg-white' : 'text-blue-600 bg-white'}`}>
                    <CheckCircle2 size={16} className="fill-current" />
                </div>
            )}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${selected ? (isPurple ? 'bg-purple-200 text-purple-700' : 'bg-blue-200 text-blue-700') : 'bg-gray-100 text-gray-500'}`}>
                <Icon size={20} />
            </div>
            <h4 className={`font-bold text-sm ${selected ? (isPurple ? 'text-purple-900' : 'text-blue-900') : 'text-gray-700'}`}>{title}</h4>
            <p className="text-xs text-gray-500 leading-tight mt-1">{desc}</p>
        </div>
    )
}

function InputGroup({ label, icon: Icon, children }: any) {
    return (
        <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                {children}
            </div>
        </div>
    )
}