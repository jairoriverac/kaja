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
  Legend,
} from "recharts";
import { DollarSign, Wallet, PieChart, Calendar } from "lucide-react";
import { getFinancialReport } from "@/actions/getFinancialReport";
import { KpiCard, LoadingState, RangeSelector } from "./ReportsUI";

export default function FinancialView() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month">("month");
  const [data, setData] = useState({
    totalSales: 0,
    totalExpenses: 0,
    balance: 0,
    chartData: [] as any[],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getFinancialReport(range);
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    };
    load();
  }, [range]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Resumen Financiero</h2>
        <RangeSelector range={range} setRange={setRange} />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {/* CARDS KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              title="Ventas Totales"
              value={data.totalSales}
              icon={<DollarSign />}
              color="emerald"
            />
            <KpiCard
              title="Gastos Operativos"
              value={data.totalExpenses}
              icon={<Wallet />}
              color="rose"
            />
            <KpiCard
              title="Balance Neto"
              value={data.balance}
              icon={<PieChart />}
              color="slate"
              isDark
            />
          </div>

          {/* GRÁFICO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" /> Flujo de Caja
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: "#1e293b",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="ventas"
                    name="Ingresos"
                    fill="#10b981"
                    radius={[4, 4, 0, 0] as any}
                    barSize={40}
                  />
                  <Bar
                    dataKey="gastos"
                    name="Egresos"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0] as any}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
