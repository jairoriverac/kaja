"use server";
import { createClient } from "@/lib/supabaseServer";

interface CashCut {
  id: string;
  details: any;
  notes: string;
  withdrawal: number;
  counted_cash: number;
  is_admin_finalized: boolean;
  initial_cash: number;
  system_sales: number;
  system_expenses: number;
  system_injections: number;
  system_credits: number; // <--- Importante leer esto de la DB
  system_digital: number; // <--- Importante leer esto de la DB
}

export async function getDailySummary() {
  const supabase = createClient();

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
    // 1. BUSCAR CIERRE DE HOY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: todayCutData } = await (supabase.from("cash_cuts") as any)
      .select(`*`) // Seleccionamos TODO para traer system_credits y system_digital
      .gte("created_at", startUtc)
      .lt("created_at", endUtc)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const todayCut = todayCutData as CashCut | null;

    // --- CASO A: YA EXISTE UN CIERRE (FOTO CONGELADA) ---
    if (todayCut) {
      return {
        success: true,
        data: {
          // Devolvemos EXACTAMENTE lo que se guardó al cerrar.
          // No recalculamos nada para no mezclar con ventas posteriores.
          initial: todayCut.initial_cash,
          sales: todayCut.system_sales,
          credits: todayCut.system_credits || 0, // Leemos de la foto
          digital: todayCut.system_digital || 0, // Leemos de la foto
          expenses: todayCut.system_expenses,
          injections: todayCut.system_injections,

          existingDetails: todayCut.details,
          existingNotes: todayCut.notes,
          existingWithdrawal: todayCut.withdrawal,
          existingTotal: todayCut.counted_cash,
          isAdminFinalized: todayCut.is_admin_finalized,
        },
      };
    }

    // --- CASO B: CALCULAR EN VIVO (SIN CIERRE AÚN) ---

    // B.1. Inicial (del cierre de ayer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastCut } = await (supabase.from("cash_cuts") as any)
      .select("counted_cash, withdrawal")
      .lt("created_at", startUtc)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const initial = lastCut
      ? lastCut.counted_cash - (lastCut.withdrawal || 0)
      : 0;

    // B.2. Consultas en vivo
    const [salesRes, expensesRes, injectionsRes] = await Promise.all([
      supabase
        .from("sales")
        .select("total, amount_paid, payment_method, balance_due")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
      supabase
        .from("expenses")
        .select("amount")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("cash_injections") as any)
        .select("amount")
        .gte("created_at", startUtc)
        .lt("created_at", endUtc),
    ]);

    // B.3. Cálculos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalSales =
      salesRes.data?.reduce((sum, r: any) => sum + (r.total || 0), 0) || 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalCredits =
      salesRes.data?.reduce((sum, r: any) => sum + (r.balance_due || 0), 0) ||
      0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalDigital =
      salesRes.data?.reduce((sum, r: any) => {
        if (["TRANSFERENCIA", "DE_UNA"].includes(r.payment_method))
          return sum + (r.total || 0);
        return sum;
      }, 0) || 0;
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
        credits: totalCredits,
        digital: totalDigital,
        expenses: totalExpenses,
        injections: totalInjections,
        existingDetails: null,
        existingNotes: "",
        existingWithdrawal: 0,
        existingTotal: 0,
        isAdminFinalized: false,
      },
    };
  } catch (error: any) {
    console.error("Error fetching summary:", error);
    return {
      success: false,
      data: {
        initial: 0,
        sales: 0,
        credits: 0,
        digital: 0,
        expenses: 0,
        injections: 0,
        isAdminFinalized: false,
      },
    };
  }
}
