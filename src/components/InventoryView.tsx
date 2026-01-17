"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Star, AlertTriangle, Download, Printer } from "lucide-react";
import { getTopProducts } from "@/actions/getTopProducts";
import { getLowStockAlerts } from "@/actions/getLowStockAlerts";
import { RangeSelector, LoadingState } from "./ReportsUI";

// IMPORTAMOS LA LIBRERÍA PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InventoryView() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month">("month");
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [metric, setMetric] = useState<"total" | "quantity">("total");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [topRes, alertRes] = await Promise.all([
        getTopProducts(range),
        getLowStockAlerts(),
      ]);
      if (topRes.success && topRes.data) setTopProducts(topRes.data);
      if (alertRes.success && alertRes.data) setAlerts(alertRes.data);
      setLoading(false);
    };
    load();
  }, [range]);

  // --- FUNCIÓN PARA GENERAR EL PDF ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // 1. Título y Fecha
    const fecha = new Date().toLocaleDateString("es-EC");
    doc.setFontSize(18);
    doc.text("Lista de Compras - Reposición", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${fecha}`, 14, 28);

    // 2. Tabla de Datos
    // Preparamos los datos para la tabla
    const tableRows = alerts.map((item) => [
      item.name, // Producto
      item.stock, // Tienes
      item.min_stock, // Deberías tener
      item.min_stock - item.stock > 0 ? item.min_stock - item.stock : 0, // A comprar (Sugerido)
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Producto", "Stock Actual", "Mínimo", "Faltante Sugerido"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38] }, // Rojo alerta
      styles: { fontSize: 10 },
    });

    // 3. Descargar
    doc.save(`lista_compras_${fecha.replace(/\//g, "-")}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* COLUMNA IZQUIERDA: ALERTAS + BOTÓN PDF */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle size={20} /> Stock Crítico
          </h3>

          {/* BOTÓN DESCARGAR SOLO SI HAY DATOS */}
          {alerts.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors border border-red-200"
              title="Descargar PDF para imprimir"
            >
              <Printer size={14} /> Imprimir Lista
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState small />
        ) : alerts.length === 0 ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium text-center">
            ¡Inventario saludable! No hace falta comprar nada.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {alerts.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100"
              >
                <div className="overflow-hidden">
                  <p
                    className="text-sm font-bold text-red-900 truncate pr-2"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-red-600">
                    Mínimo requerido: {item.min_stock}
                  </p>
                </div>
                <div className="text-right min-w-[50px]">
                  <span className="text-lg font-black text-red-600">
                    {item.stock}
                  </span>
                  <p className="text-[10px] uppercase text-red-400 font-bold">
                    Disp.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: GRÁFICO (Sin cambios) */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Star size={20} className="text-amber-400 fill-amber-400" /> Top
            Productos
          </h3>
          <div className="flex gap-4 items-center">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMetric("total")}
                className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  metric === "total"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-400"
                }`}
              >
                $$$
              </button>
              <button
                onClick={() => setMetric("quantity")}
                className={`p-1.5 px-3 rounded-md text-xs font-bold transition-all ${
                  metric === "quantity"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-400"
                }`}
              >
                Unid.
              </button>
            </div>
            <RangeSelector range={range} setRange={setRange} />
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: "#1e293b",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey={metric}
                  fill={metric === "total" ? "#3b82f6" : "#8b5cf6"}
                  radius={[0, 6, 6, 0] as any}
                  barSize={24}
                  background={{ fill: "#f8fafc", radius: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
