"use server";
import { createClient } from "@/lib/supabaseServer";

export async function createExpense(amount: number, description: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Usuario no autorizado" };

  // --- CORRECCIÓN DE HORA ---
  // Usamos new Date() directo (UTC).
  // Supabase guarda UTC. El ajuste visual a Ecuador se hace en el Frontend.
  const now = new Date();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("expenses") as any).insert({
      amount: amount,
      description: description,
      created_by: user.id,
      created_at: now.toISOString(), // <--- UTC PURO (Correcto)
    });

    if (error) throw error;

    return { success: true, message: "Gasto registrado correctamente" };
  } catch (error: any) {
    console.error("Error creando gasto:", error);
    return { success: false, message: "Error al registrar el gasto" };
  }
}
