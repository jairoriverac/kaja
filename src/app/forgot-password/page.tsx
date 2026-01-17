"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // IMPORTANTE: redirectTo debe apuntar a tu ruta de callback que redirige a update-password
      // Asegúrate de que localhost:3000 esté en los "Redirect URLs" de tu Dashboard en Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Fondos Decorativos (Mismo estilo que Login) */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl border border-gray-100 p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¡Correo enviado!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Revisa tu bandeja de entrada (y spam). Hemos enviado un enlace
              para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="text-sm font-bold text-slate-900 hover:underline"
            >
              Volver al Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-slate-900" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Recuperar Contraseña
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Ingresa tu correo para recibir las instrucciones
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2 ml-1">
                  Correo Registrado
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-800"
                    placeholder="ejemplo@kaja.com"
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
                  "Enviar Enlace"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={16} /> Volver a Iniciar Sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
