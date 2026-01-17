"use server";
import { createClient } from "@/lib/supabaseServer";

// 1. Definimos los tipos
interface SaleRecord {
  total: number;
  created_at: string;
}

interface ExpenseRecord {
  amount: number;
  created_at: string;
}

export async function getFinancialReport(
  range: "today" | "week" | "month" = "month"
) {
  const supabase = createClient();

  // 2. AJUSTE DE FECHAS (ECUADOR UTC-5)
  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  // Calculamos la fecha "visual" en Ecuador
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0]; // "2026-01-10"

  let startUtc = "";
  // El reporte termina "ahora mismo"
  const endUtc = new Date().toISOString();

  // --- LÓGICA DE RANGOS CORREGIDA ---
  if (range === "today") {
    // Desde las 00:00 EC (05:00 UTC)
    startUtc = `${todayStr}T05:00:00.000Z`;
  } else if (range === "week") {
    // Calcular el Lunes de esta semana en Ecuador
    const day = ecuadorDate.getDay(); // 0=Domingo, 1=Lunes...
    // Si es domingo (0), restamos 6 días. Si no, restamos (day - 1).
    const diff = ecuadorDate.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(ecuadorDate);
    monday.setDate(diff);
    const mondayStr = monday.toISOString().split("T")[0];

    // Lunes 00:00 EC (05:00 UTC)
    startUtc = `${mondayStr}T05:00:00.000Z`;
  } else if (range === "month") {
    // Primer día del mes actual en Ecuador
    const year = ecuadorDate.getFullYear();
    const month = String(ecuadorDate.getMonth() + 1).padStart(2, "0");

    // 1ro del Mes 00:00 EC (05:00 UTC)
    startUtc = `${year}-${month}-01T05:00:00.000Z`;
  }

  try {
    // 3. Traer VENTAS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: salesData, error: salesError } = await (supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", startUtc)
      .lte("created_at", endUtc) as any);

    if (salesError) throw salesError;

    const sales = salesData as SaleRecord[];

    // 4. Traer GASTOS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: expensesData, error: expensesError } = await (supabase
      .from("expenses")
      .select("amount, created_at")
      .gte("created_at", startUtc)
      .lte("created_at", endUtc) as any);

    if (expensesError) throw expensesError;

    const expenses = expensesData as ExpenseRecord[];

    // 5. Procesar datos para el gráfico
    const chartDataMap = new Map<
      string,
      { name: string; ventas: number; gastos: number }
    >();

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      // Formato corto visual para el gráfico: "10 Ene"
      // Aquí usamos la zona horaria para que el punto en el gráfico caiga en el día correcto
      return date.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "short",
        timeZone: "America/Guayaquil",
      });
    };

    // Sumar Ventas
    sales?.forEach((sale) => {
      const dayKey = formatDate(sale.created_at);
      const current = chartDataMap.get(dayKey) || {
        name: dayKey,
        ventas: 0,
        gastos: 0,
      };
      current.ventas += sale.total;
      chartDataMap.set(dayKey, current);
    });

    // Sumar Gastos
    expenses?.forEach((expense) => {
      const dayKey = formatDate(expense.created_at);
      const current = chartDataMap.get(dayKey) || {
        name: dayKey,
        ventas: 0,
        gastos: 0,
      };
      current.gastos += expense.amount;
      chartDataMap.set(dayKey, current);
    });

    const chartData = Array.from(chartDataMap.values());

    // Opcional: Ordenar el gráfico por fecha si Recharts se vuelve loco
    // (Por ahora el Map suele mantener orden de inserción si los datos vienen ordenados)

    // 6. Calcular Totales Generales
    const totalSales = sales?.reduce((sum, s) => sum + s.total, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const balance = totalSales - totalExpenses;

    return {
      success: true,
      data: {
        totalSales,
        totalExpenses,
        balance,
        chartData,
      },
    };
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return { success: false, message: error.message };
  }
}
