"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import NotificationsBell from "@/components/NotificationsBell"; // <--- 1. IMPORTAMOS EL COMPONENTE

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Header() {
  const [time, setTime] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    role: string;
    email: string;
  } | null>(null);

  const router = useRouter();
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Reloj Digital
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Obtener datos del Usuario
  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", user.id)
          .single();

        const profile = data as Profile;

        setUserData({
          email: user.email || "",
          name: profile?.full_name || user.email?.split("@")[0] || "Usuario",
          role: profile?.role === "admin" ? "Administrador" : "Cajero",
        });
      }
    };
    getUserData();
  }, []);

  // 3. Click Outside para cerrar menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Función de Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Lado Izquierdo: Branding */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => router.push("/")}
      >
        <div className="relative w-10 h-10 group-hover:scale-105 transition-transform flex items-center justify-center">
          <Image
            src="/images/kaja-logo.svg"
            alt="Kaja Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-none tracking-tight group-hover:text-blue-600 transition-colors">
            Kaja<span className="text-blue-600">.</span>
          </h1>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Kaja v1.0
          </span>
        </div>
      </div>

      {/* Lado Derecho: Utilidades */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Reloj */}
        <div className="hidden md:block text-right">
          <p className="text-2xl font-bold text-gray-700 leading-none">
            {time}
          </p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

        <div className="flex items-center gap-3">
          {/* --- AQUÍ REEMPLAZAMOS EL BOTÓN VIEJO POR EL NUEVO --- */}
          <NotificationsBell />
          {/* ----------------------------------------------------- */}

          {/* Menú Usuario */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-100 uppercase text-sm">
                {userData?.name.substring(0, 2) || "US"}
              </div>

              <div className="hidden lg:block text-left mr-1">
                <p className="font-bold text-gray-800 text-sm leading-tight">
                  {userData?.name || "Cargando..."}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {userData?.role || "..."}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 mb-1 bg-gray-50/50">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Cuenta Actual
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {userData?.email}
                  </p>
                </div>

                <Link
                  href="/admin/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  Mi Perfil
                </Link>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
