import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminBackBar from '@/components/AdminBackBar' // 👈 Importamos

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Header Fijo */}
            <Header />

            {/* 👈 BARRA DE NAVEGACIÓN ADMIN (Se muestra sola si es necesario) */}
            <AdminBackBar />

            {/* Contenido Principal */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </main>

            {/* Footer Fijo */}
            <Footer />
        </div>
    )
}