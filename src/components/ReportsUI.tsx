"use client";

import { Loader2 } from "lucide-react";

// 1. Selector de Rango (Hoy, Semana, Mes)
export function RangeSelector({
  range,
  setRange,
}: {
  range: any;
  setRange: any;
}) {
  return (
    <div className="bg-slate-100 p-1 rounded-lg flex">
      {(["today", "week", "month"] as const).map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize ${
            range === r
              ? "bg-white text-slate-900 shadow"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {r === "today" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
        </button>
      ))}
    </div>
  );
}

// 2. Estado de Carga (Spinner)
export function LoadingState({ small }: { small?: boolean }) {
  return (
    <div
      className={`${
        small ? "h-32" : "h-96"
      } flex flex-col items-center justify-center text-slate-400 gap-3`}
    >
      <Loader2 className="animate-spin w-8 h-8 text-slate-900" />
      <p className="font-medium animate-pulse text-sm">Cargando datos...</p>
    </div>
  );
}

// 3. Tarjeta de KPI (Ventas, Gastos, Balance)
export function KpiCard({ title, value, icon, color, isDark }: any) {
  // CORRECCIÓN: Cambiado 'val' por 'v' que es el argumento de la función
  const format = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  const colors: any = {
    emerald: "text-emerald-600 bg-emerald-100",
    rose: "text-rose-600 bg-rose-100",
    slate: "text-white bg-white/20",
  };

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden ${
        isDark
          ? "bg-slate-900 border-slate-800 text-white"
          : "bg-white border-slate-100"
      }`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">{icon}</div>
      <p
        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
          isDark ? "opacity-70" : "text-slate-400"
        }`}
      >
        <span className={`p-1.5 rounded-md ${colors[color]}`}>{icon}</span>{" "}
        {title}
      </p>
      <p className="text-4xl font-black mt-3 tracking-tight">{format(value)}</p>
    </div>
  );
}
