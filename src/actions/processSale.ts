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
  paymentMethod: string,
  // --- NUEVOS PARÁMETROS (Con valores por defecto para evitar errores) ---
  paymentStatus: string = "completed",
  amountPaid: number = total,
  customerId: string | null = null
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuario no autorizado" };

  const now = new Date();

  // Cálculo del saldo pendiente (Deuda)
  // Si el total es 10 y paga 8, debe 2. Si paga 10, debe 0.
  const balanceDue = total - amountPaid;

  try {
    // 1. Crear Venta con los datos de Crédito/Fiado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sale, error: saleError } = await (
      supabase.from("sales") as any
    )
      .insert({
        total: total,
        payment_method: paymentMethod, // 'EFECTIVO', 'CREDITO', etc.

        // --- CAMPOS NUEVOS ---
        status: "completed", // Estado "Técnico" de la fila (no borrada)
        payment_status: paymentStatus, // 'completed', 'partial', 'pending' (Estado Financiero)
        amount_paid: amountPaid, // Lo que pagó hoy
        balance_due: balanceDue, // Lo que quedó debiendo
        customer_id: customerId, // Quién compró (si es crédito)

        created_by: user.id,
        created_at: now.toISOString(),
      })
      .select()
      .single();

    if (saleError) throw saleError;

    // 2. Procesar Ítems (Igual que antes)
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
        created_at: now.toISOString(),
      });

      if (itemError) throw itemError;

      // 3. Descontar Stock (Solo si es físico)
      if (item.type === "fisico") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: product } = await (supabase.from("products") as any)
          .select("stock")
          .eq("id", item.dbId)
          .single();

        if (product) {
          const newStock = product.stock - item.quantity;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("products") as any)
            .update({ stock: newStock })
            .eq("id", item.dbId);
        }
      }
    }

    // 4. (OPCIONAL PERO RECOMENDADO) Registrar el abono inicial en el historial de pagos
    // Si hubo un pago inicial mayor a 0 y es crédito parcial, dejamos constancia.
    if (amountPaid > 0 && paymentStatus !== "completed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("debt_payments") as any).insert({
        sale_id: sale.id,
        amount: amountPaid,
        notes: "Abono inicial al momento de la compra",
        created_by: user.id,
        created_at: now.toISOString(),
      });
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
