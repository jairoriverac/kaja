"use server";
import { createClient } from "@/lib/supabaseServer";

interface CashCutData {
  countedCash: number;
  systemSales: number;
  systemExpenses: number;
  systemInitial: number;
  systemInjections: number;
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

  // --- 1. OBTENER HORA EXACTA (UTC) ---
  const now = new Date(); // Esto tiene la hora real del servidor (UTC)

  // --- 2. CALCULAR RANGO DEL DÍA EN ECUADOR ---
  // Objetivo: Saber si ya existe un registro que pertenezca al "Día Operativo" de Ecuador.
  // Ecuador es UTC-5.
  const ecuadorOffset = 5 * 60 * 60 * 1000;

  // "ecuadorDate" es la fecha "virtual" restando 5 horas para saber en qué dia calendario estamos allá.
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0]; // Ej: "2026-01-10"

  // El día en Ecuador va desde las 05:00 UTC de hoy hasta las 05:00 UTC de mañana
  const startUtc = `${todayStr}T05:00:00.000Z`;

  const tomorrow = new Date(ecuadorDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const endUtc = `${tomorrowStr}T05:00:00.000Z`;

  try {
    // 3. BUSCAR SI YA EXISTE UN CIERRE EN ESE RANGO
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingCut } = await (supabase.from("cash_cuts") as any)
      .select("id")
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
      .maybeSingle();

    let error;

    if (existingCut) {
      // --- ACTUALIZAR ---
      // Si ya existe, actualizamos los montos pero NO tocamos la fecha de creación
      // para mantener el registro de a qué hora se abrió originalmente.
      const { error: updateError } = await (supabase.from("cash_cuts") as any)
        .update({
          counted_cash: data.countedCash,
          withdrawal: data.withdrawal,
          notes: data.notes,
          details: data.details,
          status: "CLOSED", // Aseguramos que quede cerrado
        })
        .eq("id", existingCut.id);
      error = updateError;
    } else {
      // --- CREAR NUEVO ---
      const { error: insertError } = await (
        supabase.from("cash_cuts") as any
      ).insert({
        initial_cash: data.systemInitial,
        system_sales: data.systemSales,
        system_expenses: data.systemExpenses,
        // system_injections: data.systemInjections,
        counted_cash: data.countedCash,
        withdrawal: data.withdrawal,
        notes: data.notes,
        details: data.details,
        created_by: user.id,
        created_at: now.toISOString(), // Guardamos UTC (Ej: 22:00). Correcto para Ecuador (17:00).
        status: "CLOSED",
      });
      error = insertError;
    }

    if (error) throw error;
    return { success: true, message: "Cierre guardado correctamente" };
  } catch (error: any) {
    console.error("Error saving cash cut:", error);
    return { success: false, message: error.message };
  }
}
