"use server";
import { createClient } from "@/lib/supabaseServer";

interface CashCutData {
  countedCash: number;
  systemSales: number;
  systemExpenses: number;
  systemInitial: number;
  systemInjections: number;
  // --- NUEVOS CAMPOS ---
  systemCredits: number;
  systemDigital: number;
  // ---------------------
  notes: string;
  details: Record<string, string>;
  withdrawal: number;
}

export async function createCashCut(data: CashCutData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "No autorizado" };

  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const todayStr = new Date(now.getTime() - ecuadorOffset)
    .toISOString()
    .split("T")[0];
  const startUtc = `${todayStr}T05:00:00.000Z`;
  const endUtc = `${
    new Date(new Date(startUtc).getTime() + 86400000)
      .toISOString()
      .split("T")[0]
  }T05:00:00.000Z`;

  try {
    // Buscar último cierre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latestCut } = await (supabase.from("cash_cuts") as any)
      .select("id, is_admin_finalized")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const commonData = {
      counted_cash: data.countedCash,
      withdrawal: data.withdrawal,
      notes: data.notes,
      details: data.details,
      status: "CLOSED",
      updated_at: now.toISOString(),
      // Guardamos la foto completa para que el historial cuadre
      system_sales: data.systemSales,
      system_expenses: data.systemExpenses,
      system_injections: data.systemInjections,
      system_credits: data.systemCredits, // <--- NUEVO
      system_digital: data.systemDigital, // <--- NUEVO
    };

    if (latestCut && !latestCut.is_admin_finalized) {
      // ACTUALIZAR
      await (supabase.from("cash_cuts") as any)
        .update({ ...commonData, is_admin_finalized: true })
        .eq("id", latestCut.id);
    } else {
      // CREAR NUEVO
      await (supabase.from("cash_cuts") as any).insert({
        ...commonData,
        initial_cash: data.systemInitial,
        created_by: user.id,
        created_at: now.toISOString(),
        is_admin_finalized: false,
      });
    }

    return { success: true, message: "Cierre guardado correctamente" };
  } catch (error: any) {
    console.error("Error saving cash cut:", error);
    return { success: false, message: error.message };
  }
}
