'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Importante para redirigir
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import AdminDashboard from '@/components/AdminDashboard'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function MainPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Obtenemos el rol
        const { data } = await (supabase.from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single()

        const userRole = (data as Profile)?.role || 'cashier'

        // LÓGICA DE RUTAS:
        // Si es CAJERO -> No tiene nada que hacer en el dashboard, va a /pos
        if (userRole === 'cashier') {
          router.replace('/pos')
        }
        // Si es ADMIN -> Se queda aquí a ver el Dashboard
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  // Ya no pasamos props porque la navegación será por Link
  return <AdminDashboard />
}