"use server";
import { createClient } from "@/lib/supabaseServer";

export async function createCashInjection(amount: number, description: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "No autorizado" };

  // CORRECCIÓN: Usamos la hora UTC real.
  // Supabase espera UTC. Al guardarlo así (ej: 22:00),
  // cuando lo leas en Ecuador se transformará automáticamente a 17:00.
  const now = new Date();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("cash_injections") as any).insert({
      amount: amount,
      description: description,
      created_by: user.id,
      created_at: now.toISOString(), // <--- Guardamos UTC puro
    });

    if (error) throw error;
    return { success: true, message: "Dinero ingresado a caja correctamente" };
  } catch (error: any) {
    return { success: false, message: "Error: " + error.message };
  }
}
