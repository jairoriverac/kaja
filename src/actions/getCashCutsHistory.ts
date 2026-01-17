"use server";
import { createClient } from "@/lib/supabaseServer";

interface CashCutRecord {
  id: string;
  opened_at: string;
  created_at: string; // Fecha de cierre
  initial_cash: number;
  system_sales: number;
  system_expenses: number;
  counted_cash: number;
  withdrawal: number;
  difference: number; // Sobrante o Faltante
  notes: string;
  casher_name: string;
}

export async function getCashCutsHistory(
  range: "today" | "week" | "month" = "month"
) {
  const supabase = createClient();

  // 1. AJUSTE DE FECHAS (ECUADOR UTC-5)
  // Copiamos la lógica ganadora que ya validamos
  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0];

  let startUtc = "";
  let endUtc = "";

  if (range === "today") {
    startUtc = `${todayStr}T05:00:00.000Z`;
    // Hasta mañana 5am
    const tomorrow = new Date(ecuadorDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    endUtc = `${tomorrow.toISOString().split("T")[0]}T05:00:00.000Z`;
  } else if (range === "week") {
    const day = ecuadorDate.getDay();
    const diff = ecuadorDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(ecuadorDate);
    monday.setDate(diff);
    const mondayStr = monday.toISOString().split("T")[0];

    startUtc = `${mondayStr}T05:00:00.000Z`;
    endUtc = new Date().toISOString(); // Hasta ahora
  } else if (range === "month") {
    const year = ecuadorDate.getFullYear();
    const month = String(ecuadorDate.getMonth() + 1).padStart(2, "0");
    startUtc = `${year}-${month}-01T05:00:00.000Z`;
    endUtc = new Date().toISOString();
  }

  try {
    // 2. CONSULTA
    // Traemos el historial y el nombre del perfil (si existe)
    // Nota: Como cambiamos a ON DELETE SET NULL, profiles podría ser null si borraste al usuario.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cuts, error } = await (supabase
      .from("cash_cuts")
      .select(
        `
        id,
        opened_at,
        created_at,
        initial_cash,
        system_sales,
        system_expenses,
        counted_cash,
        withdrawal,
        difference,
        notes,
        profiles ( full_name ) 
      `
      )
      .gte("created_at", startUtc)
      .lte("created_at", endUtc)
      .order("created_at", { ascending: false }) as any); // Más recientes primero

    if (error) throw error;

    // 3. Mapeo de datos
    const history: CashCutRecord[] = (cuts || []).map((cut: any) => ({
      id: cut.id,
      opened_at: cut.opened_at,
      created_at: cut.created_at,
      initial_cash: cut.initial_cash,
      system_sales: cut.system_sales,
      system_expenses: cut.system_expenses,
      counted_cash: cut.counted_cash,
      withdrawal: cut.withdrawal,
      difference: cut.difference,
      notes: cut.notes,
      casher_name: cut.profiles?.full_name || "Usuario Eliminado/Desconocido",
    }));

    return { success: true, data: history };
  } catch (error: any) {
    console.error("Error fetching cash cuts history:", error);
    return { success: false, message: error.message };
  }
}
