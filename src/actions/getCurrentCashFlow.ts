"use server";
import { createClient } from "@/lib/supabaseServer";

export async function getCurrentCashFlow() {
  const supabase = createClient();

  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0];

  const startOfDayUtc = `${todayStr}T05:00:00.000Z`;
  const tomorrow = new Date(ecuadorDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfDayUtc = `${tomorrow.toISOString().split("T")[0]}T05:00:00.000Z`;

  try {
    // Buscar último corte de HOY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastCutToday } = await (supabase.from("cash_cuts") as any)
      .select("created_at, counted_cash, withdrawal")
      .gte("created_at", startOfDayUtc)
      .lt("created_at", endOfDayUtc)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let queryStartDate = startOfDayUtc;
    let calculatedInitial = 0;

    if (lastCutToday) {
      queryStartDate = lastCutToday.created_at;
      calculatedInitial =
        (lastCutToday.counted_cash || 0) - (lastCutToday.withdrawal || 0);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lastCutYesterday } = await (
        supabase.from("cash_cuts") as any
      )
        .select("counted_cash, withdrawal")
        .lt("created_at", startOfDayUtc)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCutYesterday) {
        calculatedInitial =
          (lastCutYesterday.counted_cash || 0) -
          (lastCutYesterday.withdrawal || 0);
      }
    }

    const [salesRes, expensesRes, injectionsRes] = await Promise.all([
      supabase
        .from("sales")
        .select("total, amount_paid, payment_method, balance_due") // Importante: balance_due
        .gt("created_at", queryStartDate)
        .lt("created_at", endOfDayUtc),
      supabase
        .from("expenses")
        .select("amount")
        .gt("created_at", queryStartDate)
        .lt("created_at", endOfDayUtc),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("cash_injections") as any)
        .select("amount")
        .gt("created_at", queryStartDate)
        .lt("created_at", endOfDayUtc),
    ]);

    // --- CÁLCULOS ---
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

    // Cálculo efectivo esperado:
    // (Inicial + Ventas + Ingresos) - (Gastos + Créditos + PagosDigitales)
    const expectedCash =
      calculatedInitial +
      totalSales +
      totalInjections -
      (totalExpenses + totalCredits + totalDigital);

    return {
      success: true,
      data: {
        totalSales,
        totalCredits, // Devolvemos créditos
        totalDigital, // Devolvemos digital
        totalExpenses,
        initial: calculatedInitial,
        totalInjections,
        expectedCash,
      },
    };
  } catch (error: any) {
    console.error("Error calculating cash flow:", error);
    return { success: false, message: "Error de cálculo" };
  }
}
