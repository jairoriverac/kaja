"use server";
import { createClient } from "@/lib/supabaseServer";

export async function getStoreSettings() {
  const supabase = createClient();

  try {
    // Buscamos la primera fila de la tabla settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("settings") as any)
      .select("store_name")
      .limit(1)
      .single();

    if (error) throw error;

    return { success: true, name: data.store_name };
  } catch (error) {
    console.error("Error fetching store name:", error);
    // Si falla, devolvemos un nombre por defecto
    return { success: false, name: "Mi Negocio" };
  }
}
