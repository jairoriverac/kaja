"use server";
import { createClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

// 1. Definimos qué forma tienen los datos
interface Sale {
  total: number;
}

interface Expense {
  amount: number;
}

export async function saveCashCut(countedCash: number, expectedCash: number) {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Usuario no autenticado" };

    // --- 1. ZONA HORARIA Y RANGO (Ecuador) ---
    const ecDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Guayaquil",
    });

    // A. Sumar Ventas de HOY
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("total")
      .gte("created_at", `${ecDate}T00:00:00`)
      .lte("created_at", `${ecDate}T23:59:59`);

    if (salesError) throw salesError;

    // CASTING: Le decimos a TS que esto es una lista de ventas
    const sales = salesData as Sale[] | null;
    const currentSystemSales = sales
      ? sales.reduce((sum, s) => sum + s.total, 0)
      : 0;

    // B. Sumar Gastos de HOY
    const { data: expensesData, error: expError } = await supabase
      .from("expenses")
      .select("amount")
      .gte("created_at", `${ecDate}T00:00:00`)
      .lte("created_at", `${ecDate}T23:59:59`);

    if (expError) throw expError;

    // CASTING: Le decimos a TS que esto es una lista de gastos
    // AQUÍ es donde fallaba antes:
    const expenses = expensesData as Expense[] | null;
    const currentSystemExpenses = expenses
      ? expenses.reduce((sum, e) => sum + e.amount, 0)
      : 0;

    const difference = countedCash - expectedCash;

    // --- 2. INSERTAR CON LA FOTO COMPLETA ---
    const { error } = await (supabase.from("cash_cuts") as any).insert({
      created_by: user.id,
      counted_cash: countedCash,
      expected_cash: expectedCash,

      // Guardamos la foto del momento
      system_sales: currentSystemSales,
      system_expenses: currentSystemExpenses,

      difference: difference,
      withdrawal: countedCash,
      notes:
        difference !== 0 ? `Diferencia de $${difference}` : "Cierre exacto",
    });

    if (error) throw error;

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Error guardando cierre:", error);
    return { success: false, message: "Error al guardar el cierre" };
  }
}
