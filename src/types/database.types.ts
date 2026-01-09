export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    code: string | null         // Nuevo: Código (barras o auto)
                    name: string
                    description: string | null
                    category_id: string | null  // Nuevo: Relación con categorías
                    product_type: 'fisico' | 'servicio' // Nuevo: Tipo en español
                    price: number
                    cost: number | null
                    stock: number
                    min_stock: number
                    image_url: string | null    // Nuevo
                    created_at: string
                    is_quick_access: boolean
                    is_variable_price: boolean
                }
                Insert: {
                    id?: string
                    code?: string | null
                    name: string
                    description?: string | null
                    category_id?: string | null
                    product_type?: 'fisico' | 'servicio'
                    price?: number
                    cost?: number | null
                    stock?: number
                    min_stock?: number
                    image_url?: string | null
                    created_at?: string
                    is_quick_access: boolean
                    is_variable_price: boolean
                }
                Update: {
                    id?: string
                    code?: string | null
                    name?: string
                    description?: string | null
                    category_id?: string | null
                    product_type?: 'fisico' | 'servicio'
                    price?: number
                    cost?: number | null
                    stock?: number
                    min_stock?: number
                    image_url?: string | null
                    created_at?: string
                    is_quick_access: boolean
                    is_variable_price: boolean
                }
            }
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    cedula: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    role: 'admin' | 'cashier'
                    store_name: string | null
                    is_first_login: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    cedula?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    role?: 'admin' | 'cashier'
                    store_name?: string | null
                    is_first_login?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    cedula?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    role?: 'admin' | 'cashier'
                    store_name?: string | null
                    is_first_login?: boolean
                    created_at?: string
                }
            }
            sales: {
                Row: {
                    id: string
                    created_at: string
                    total: number
                    payment_method: string | null
                    status: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    total: number
                    payment_method?: string | null
                    status?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    total?: number
                    payment_method?: string | null
                    status?: string | null
                }
            }
            sale_items: {
                Row: {
                    id: string
                    sale_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    subtotal: number
                }
                Insert: {
                    id?: string
                    sale_id: string
                    product_id: string
                    quantity?: number
                    unit_price: number
                    subtotal: number
                }
                Update: {
                    id?: string
                    sale_id?: string
                    product_id?: string
                    quantity?: number
                    unit_price?: number
                    subtotal?: number
                }
            }
            settings: {
                Row: {
                    id: string
                    created_at: string
                    store_name: string | null
                    address: string | null
                    ruc: string | null
                    phone: string | null
                    email: string | null
                    tax_rate: number
                    currency_symbol: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    store_name?: string | null
                    address?: string | null
                    ruc?: string | null
                    phone?: string | null
                    email?: string | null
                    tax_rate?: number
                    currency_symbol?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    store_name?: string | null
                    address?: string | null
                    ruc?: string | null
                    phone?: string | null
                    email?: string | null
                    tax_rate?: number
                    currency_symbol?: string
                }
            }
        }
    }
}