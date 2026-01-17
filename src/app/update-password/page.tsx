"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      // Actualizamos el usuario LOGUEADO (Supabase lo logueó al hacer click en el link del email)
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Fondos Decorativos */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl border border-gray-100 p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¡Contraseña Actualizada!
            </h2>
            <p className="text-sm text-gray-500">
              Te estamos redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold text-gray-900">
                Nueva Contraseña
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Ingresa tu nueva clave segura
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-bold text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Cambiar Contraseña"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
