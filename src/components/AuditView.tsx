"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { getCashCutsHistory } from "@/actions/getCashCutsHistory";
import { LoadingState, RangeSelector } from "./ReportsUI";

export default function AuditView() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month">("month");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getCashCutsHistory(range);
      if (res.success && res.data) setHistory(res.data);
      setLoading(false);
    };
    load();
  }, [range]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <History size={20} /> Historial de Cierres
        </h3>
        <RangeSelector range={range} setRange={setRange} />
      </div>

      {loading ? (
        <LoadingState />
      ) : history.length === 0 ? (
        <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No hay registros en este periodo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Fecha</th>
                <th className="px-4 py-3">Cajero</th>
                <th className="px-4 py-3 text-right">Contado</th>
                <th className="px-4 py-3 text-right">Retiro</th>
                <th className="px-4 py-3 text-right rounded-r-lg">
                  Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((cut: any) => (
                <tr key={cut.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatDate(cut.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {cut.casher_name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                    {formatMoney(cut.counted_cash)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">
                    {formatMoney(cut.withdrawal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        cut.difference === 0
                          ? "bg-slate-100 text-slate-500"
                          : cut.difference > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cut.difference > 0 ? "+" : ""}
                      {formatMoney(cut.difference)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
