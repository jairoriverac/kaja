"use server";
import { createClient } from "@/lib/supabaseServer";

export async function getDailySummary() {
  const supabase = createClient();

  // --- 1. AJUSTE ROBUSTO DE HORAS PARA ECUADOR (UTC-5) ---
  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0];

  // Rango UTC: 05:00 de hoy hasta 05:00 de mañana
  // Esto cubre todo el día operativo en Ecuador.
  const startUtc = `${todayStr}T05:00:00.000Z`;

  const tomorrow = new Date(ecuadorDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const endUtc = `${tomorrowStr}T05:00:00.000Z`;

  try {
    // 2. Obtener Cierre de AYER (Para calcular caja inicial)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastCut, error: lastCutError } = await (
      supabase.from("cash_cuts") as any
    )
      .select("counted_cash, withdrawal")
      .lt("created_at", startUtc) // Todo lo anterior al inicio de "hoy"
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastCutError && lastCutError.code !== "PGRST116") {
      console.error("Error obteniendo cierre anterior:", lastCutError.message);
    }

    // Fórmula: Lo que se contó ayer MENOS lo que se llevó al banco = Lo que quedó en caja
    const initial = lastCut
      ? lastCut.counted_cash - (lastCut.withdrawal || 0)
      : 0;

    // 3. Revisar si YA hay un cierre HOY (Para modo edición)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: todayCut, error: todayError } = await (
      supabase.from("cash_cuts") as any
    )
      .select("*")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
      .maybeSingle();

    if (todayError) {
      console.error("Error buscando cierre de hoy:", todayError.message);
    }

    // 4. Calcular Totales del Día (Ventas, Gastos, Inyecciones)
    // Optimizamos usando Promise.all para lanzar las 3 consultas al mismo tiempo
    const [salesRes, expensesRes, injectionsRes] = await Promise.all([
      supabase
        .from("sales")
        .select("total")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
      supabase
        .from("expenses")
        .select("amount")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
      (supabase.from("cash_injections") as any)
        .select("amount")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
    ]);

    // Sumatorias
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSales =
      salesRes.data?.reduce((sum, r: any) => sum + (r.total || 0), 0) || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalExpenses =
      expensesRes.data?.reduce((sum, r: any) => sum + (r.amount || 0), 0) || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalInjections =
      injectionsRes.data?.reduce(
        (sum: any, r: any) => sum + (r.amount || 0),
        0
      ) || 0;

    return {
      success: true,
      data: {
        initial,
        sales: totalSales,
        expenses: totalExpenses,
        injections: totalInjections,
        // Datos para pre-llenar si ya existe cierre hoy (Modo Edición)
        existingDetails: todayCut?.details || null,
        existingNotes: todayCut?.notes || "",
        existingWithdrawal: todayCut?.withdrawal || 0,
        existingTotal: todayCut?.counted_cash || 0,
      },
    };
  } catch (error: any) {
    console.error("Error fetching daily summary:", error);
    // Devolvemos 0 en lugar de romper la app
    return {
      success: false,
      data: { initial: 0, sales: 0, expenses: 0, injections: 0 },
    };
  }
}
