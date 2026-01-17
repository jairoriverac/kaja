"use client";

import { useState } from "react";
import {
  TrendingUp,
  Package,
  History,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

// Importamos los componentes limpios
import FinancialView from "@/components/FinancialView";
import InventoryView from "@/components/InventoryView";
import AuditView from "@/components/AuditView";

type ReportView = "menu" | "financial" | "inventory" | "audit";

export default function ReportsPage() {
  const [currentView, setCurrentView] = useState<ReportView>("menu");

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER DE NAVEGACIÓN */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          {currentView === "menu" ? (
            <>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Centro de Reportes
              </h1>
              <p className="text-slate-500 font-medium">
                Selecciona una categoría para ver detalles
              </p>
            </>
          ) : (
            <button
              onClick={() => setCurrentView("menu")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <div className="p-2 bg-white border border-slate-200 rounded-lg group-hover:border-slate-400 transition-colors">
                <ArrowLeft size={20} />
              </div>
              <span className="font-bold text-lg">Volver al Menú</span>
            </button>
          )}
        </div>
      </div>

      {/* RENDERIZADO DEL CONTENIDO */}
      <div className="max-w-7xl mx-auto">
        {currentView === "menu" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Botón Finanzas */}
            <MenuCard
              onClick={() => setCurrentView("financial")}
              title="Finanzas y Flujo"
              desc="Ventas, gastos, balance neto y comparativas gráficas."
              icon={<TrendingUp size={32} className="text-emerald-600" />}
              color="bg-emerald-50 border-emerald-100"
            />
            {/* Botón Inventario */}
            <MenuCard
              onClick={() => setCurrentView("inventory")}
              title="Inventario y Productos"
              desc="Top productos más vendidos y alertas de stock bajo."
              icon={<Package size={32} className="text-blue-600" />}
              color="bg-blue-50 border-blue-100"
            />
            {/* Botón Auditoría */}
            <MenuCard
              onClick={() => setCurrentView("audit")}
              title="Auditoría de Caja"
              desc="Historial de cierres, sobrantes, faltantes y retiros."
              icon={<History size={32} className="text-purple-600" />}
              color="bg-purple-50 border-purple-100"
            />
          </div>
        )}

        {currentView === "financial" && <FinancialView />}
        {currentView === "inventory" && <InventoryView />}
        {currentView === "audit" && <AuditView />}
      </div>
    </div>
  );
}

// Componente simple para las tarjetas del menú (local)
function MenuCard({ onClick, title, desc, icon, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative p-8 text-left rounded-3xl border transition-all hover:shadow-xl hover:-translate-y-1 group bg-white border-slate-200`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${color}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed mb-8">{desc}</p>
      <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <div className="p-2 bg-slate-900 rounded-full text-white shadow-lg">
          <ChevronRight size={20} />
        </div>
      </div>
    </button>
  );
}
