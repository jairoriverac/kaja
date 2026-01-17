"use server";
import { createClient } from "@/lib/supabaseServer";

interface TopProduct {
  name: string;
  quantity: number;
  total: number;
}

export async function getTopProducts(
  range: "today" | "week" | "month" = "month"
) {
  const supabase = createClient();

  // 1. Fecha Base Ecuador (Tu lógica está PERFECTA aquí)
  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0];

  // 2. Calcular Rango UTC
  let startUtc = "";
  let endUtc = "";

  if (range === "today") {
    startUtc = `${todayStr}T05:00:00.000Z`;
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
    endUtc = new Date().toISOString();
  } else if (range === "month") {
    const year = ecuadorDate.getFullYear();
    const month = String(ecuadorDate.getMonth() + 1).padStart(2, "0");
    startUtc = `${year}-${month}-01T05:00:00.000Z`;
    endUtc = new Date().toISOString();
  }

  try {
    // 3. CONSULTA BLINDADA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items, error } = await (supabase
      .from("sale_items")
      .select(
        `
          quantity, 
          subtotal,
          products ( name ),
          sales!inner ( id, created_at ) 
        `
      )
      // --- CORRECCIÓN CLAVE ---
      // Filtramos por la fecha de la VENTA (sales), no del ítem.
      // Esto asegura sincronía matemática total con el reporte financiero.
      .gte("sales.created_at", startUtc)
      .lte("sales.created_at", endUtc) as any);

    if (error) throw error;

    if (!items || items.length === 0) {
      return { success: true, data: [] };
    }

    // 4. Agrupación
    const productMap = new Map<string, TopProduct>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?.forEach((item: any) => {
      const productName = item.products?.name || "Producto Eliminado";

      const current = productMap.get(productName) || {
        name: productName,
        quantity: 0,
        total: 0,
      };

      current.quantity += item.quantity;
      current.total += item.subtotal;

      productMap.set(productName, current);
    });

    // 5. Ordenar (Top 10 por monto)
    const rankedProducts = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return { success: true, data: rankedProducts };
  } catch (error: any) {
    console.error("Error fetching top products:", error);
    return { success: false, message: error.message };
  }
}
