"use server";
import { createClient } from "@/lib/supabaseServer";

export async function checkRegisterStatus() {
  const supabase = createClient();

  // 1. Ajuste ROBUSTO de Zona Horaria (Ecuador UTC-5)
  // Calculamos la fecha en Ecuador
  const now = new Date();
  const ecuadorOffset = 5 * 60 * 60 * 1000;
  const ecuadorDate = new Date(now.getTime() - ecuadorOffset);
  const todayStr = ecuadorDate.toISOString().split("T")[0];

  // 2. Definimos el Rango UTC Correcto
  // El día en Ecuador empieza a las 05:00 UTC y termina a las 05:00 UTC de mañana
  const startUtc = `${todayStr}T05:00:00.000Z`;

  const tomorrow = new Date(ecuadorDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Buscamos hasta las 5 AM de mañana
  const endUtc = `${tomorrowStr}T05:00:00.000Z`;

  try {
    // Buscamos si existe al menos UN cierre de caja en este rango operativo
    const { count, error } = await supabase
      .from("cash_cuts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startUtc)
      .lt("created_at", endUtc); // Usamos 'lt' (menor estricto)

    if (error) throw error;

    // Lógica:
    // Si count > 0 (hay cierre) -> isOpen es FALSE (Caja Cerrada)
    // Si count == 0 (no hay cierre) -> isOpen es TRUE (Caja Abierta)
    return { isOpen: count === 0 };
  } catch (error) {
    console.error("Error checking register:", error);
    // En caso de error, dejamos pasar para no bloquear la venta
    return { isOpen: true };
  }
}
