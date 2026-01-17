"use server";
import { createClient } from "@/lib/supabaseServer";

interface ProcessSaleCartItem {
  dbId: string;
  quantity: number;
  price: number;
  type: "fisico" | "servicio";
  name?: string;
}

export async function processSale(
  cart: ProcessSaleCartItem[],
  total: number,
  paymentMethod: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuario no autorizado" };

  // --- CORRECCIÓN DE HORA (FIX) ---
  // Usamos la hora UTC real del servidor.
  // Supabase guarda UTC. El ajuste visual a Ecuador se hace SOLO al leer los reportes.
  const now = new Date();

  try {
    // 1. Crear Venta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sale, error: saleError } = await (
      supabase.from("sales") as any
    )
      .insert({
        total: total,
        payment_method: paymentMethod,
        status: "completed", // O 'COMPLETED' según tu DB, mantén consistencia mayús/minús
        created_by: user.id,
        created_at: now.toISOString(), // <--- UTC PURO
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Procesar Ítems
    for (const item of cart) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemError } = await (
        supabase.from("sale_items") as any
      ).insert({
        sale_id: sale.id,
        product_id: item.dbId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        created_at: now.toISOString(), // <--- UTC PURO
      });

      if (itemError) throw itemError;

      // 3. Descontar Stock
      if (item.type === "fisico") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: product } = await (supabase.from("products") as any)
          .select("stock")
          .eq("id", item.dbId)
          .single();

        if (product) {
          // Calculamos nuevo stock
          const newStock = product.stock - item.quantity;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("products") as any)
            .update({ stock: newStock })
            .eq("id", item.dbId);
        }
      }
    }

    return {
      success: true,
      message: "Venta registrada correctamente",
      saleId: sale.id,
      ticketNumber: sale.ticket_number,
    };
  } catch (error: any) {
    console.error("Error procesando venta:", error);
    return { success: false, message: "Error: " + error.message };
  }
}
