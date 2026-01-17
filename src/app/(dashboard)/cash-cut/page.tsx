"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Eye,
  LogOut,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getDailySummary } from "@/actions/getDailySummary";
import { createCashCut } from "@/actions/createCashCut";

const DENOMINATIONS = [
  { value: 20, label: "Billetes $20" },
  { value: 10, label: "Billetes $10" },
  { value: 5, label: "Billetes $5" },
  { value: 1, label: "Billetes $1" },
  { value: 0.5, label: "Monedas 50¢" },
  { value: 0.25, label: "Monedas 25¢" },
  { value: 0.1, label: "Monedas 10¢" },
  { value: 0.05, label: "Monedas 5¢" },
  { value: 0.01, label: "Centavos 1¢" },
];

export default function CashCutPage() {
  const supabase = createClient();
  const router = useRouter();

  // Estados
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [userRole, setUserRole] = useState<"admin" | "cashier" | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- NUEVOS ESTADOS PARA CONTROL DE CIERRE ---
  const [hasClosedToday, setHasClosedToday] = useState(false); // ¿Ya se cerró hoy?
  const [isEditing, setIsEditing] = useState(false); // ¿El admin quiere editar?

  // Datos del Sistema
  const [systemData, setSystemData] = useState({
    initial: 0.0,
    sales: 0.0,
    expenses: 0.0,
    injections: 0.0,
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const initPage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profile = data as any;
        setUserRole(profile?.role as "admin" | "cashier");
      }

      const summary = await getDailySummary();

      if (summary.success && summary.data) {
        setSystemData({
          initial: summary.data.initial,
          sales: summary.data.sales,
          expenses: summary.data.expenses,
          injections: summary.data.injections,
        });

        // Si ya existen detalles, significa que la caja YA fue cerrada
        if (summary.data.existingDetails) {
          setHasClosedToday(true); // <--- ACTIVAMOS EL MODO "CERRADO"

          let loadedCounts: any = {};
          if (typeof summary.data.existingDetails === "string") {
            try {
              loadedCounts = JSON.parse(summary.data.existingDetails);
            } catch (e) {
              console.error("Error JSON:", e);
            }
          } else {
            loadedCounts = summary.data.existingDetails;
          }

          const formattedCounts: Record<number, string> = {};
          Object.entries(loadedCounts).forEach(([key, val]) => {
            formattedCounts[parseFloat(key)] = String(val);
          });
          setCounts(formattedCounts);
        }

        if (summary.data.existingNotes) setNotes(summary.data.existingNotes);
        if (summary.data.existingWithdrawal)
          setWithdrawalAmount(summary.data.existingWithdrawal.toString());
      }
      setLoading(false);
    };
    initPage();
  }, []);

  // --- CÁLCULOS ---
  const totalCounted = DENOMINATIONS.reduce((acc, denom) => {
    const qty = parseInt(counts[denom.value] || "0");
    return acc + qty * denom.value;
  }, 0);

  const expectedTotal =
    systemData.initial +
    systemData.sales +
    systemData.injections -
    systemData.expenses;
  const rawDiff = totalCounted - expectedTotal;
  const difference = Math.round(rawDiff * 100) / 100;

  const withdrawal = parseFloat(withdrawalAmount) || 0;
  const maxWithdrawal = totalCounted > 0 ? totalCounted : 0;
  const leftForTomorrow = totalCounted - withdrawal;

  // Lógica Semáforo
  let statusColor = "";
  let statusIcon = null;
  let statusLabel = "";
  let statusText = "";

  if (difference === 0) {
    statusColor = "bg-green-50 border-green-500";
    statusIcon = <CheckCircle2 size={20} className="text-green-600" />;
    statusLabel = "text-green-800";
    statusText = "CUADRE PERFECTO";
  } else if (difference > 0) {
    statusColor = "bg-yellow-50 border-yellow-500";
    statusIcon = <AlertTriangle size={20} className="text-yellow-600" />;
    statusLabel = "text-yellow-800";
    statusText = "SOBRANTE (Revisar)";
  } else {
    statusColor = "bg-red-50 border-red-500";
    statusIcon = <AlertTriangle size={20} className="text-red-600" />;
    statusLabel = "text-red-800";
    statusText = "FALTANTE";
  }

  // --- HANDLERS ---
  const handleCountChange = (value: number, qty: string) => {
    if (parseInt(qty) < 0) return;
    setCounts((prev) => ({ ...prev, [value]: qty }));
  };

  const handleWithdrawalChange = (val: string) => {
    if (parseFloat(val) < 0) return;
    setWithdrawalAmount(val);
  };

  const handleRequestClose = () => {
    if (withdrawal > maxWithdrawal) {
      showToast("No puedes retirar más dinero del que existe.", "error");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeCloseShift = async () => {
    setIsSaving(true);
    setShowConfirmModal(false);

    const result = await createCashCut({
      countedCash: totalCounted,
      systemSales: systemData.sales,
      systemExpenses: systemData.expenses,
      systemInitial: systemData.initial,
      systemInjections: systemData.injections,
      notes: notes,
      details: counts,
      withdrawal: withdrawal,
    });

    if (result.success) {
      showToast("Cierre guardado/actualizado correctamente.", "success");
      // Al guardar cambios, volvemos a bloquear la pantalla
      setHasClosedToday(true);
      setIsEditing(false);
      setIsSaving(false);
    } else {
      showToast("Error: " + result.message, "error");
      setIsSaving(false);
    }
  };

  // Variable auxiliar: ¿Está la pantalla bloqueada?
  // Se bloquea si (Ya se cerró HOY) Y (No se está editando)
  const isLocked = hasClosedToday && !isEditing;

  if (loading)
    return (
      <div className="h-[calc(100vh-65px)] flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="animate-spin" /> Cargando...
      </div>
    );

  return (
    <div className="h-[calc(100vh-65px)] overflow-y-auto bg-gray-50 p-4 md:p-6 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-20">
        {/* === IZQUIERDA: CONTADOR === */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 order-2 lg:order-1 flex flex-col relative">
          {/* OVERLAY DE BLOQUEO (Opcional visual, aquí usaremos disabled en inputs) */}

          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Calculator size={24} className="text-blue-400" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">
                  Cierre de Caja
                </h1>
                <p className="text-xs text-slate-400">Contabilización</p>
              </div>
            </div>
            {/* Si está cerrado mostramos CANDADO */}
            {hasClosedToday && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/50 text-green-300">
                <Lock size={14} />{" "}
                <span className="text-[10px] font-bold">CERRADO</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DENOMINATIONS.map((item) => (
                <div
                  key={item.value}
                  className={`flex items-center justify-between p-3 bg-white border rounded-xl transition-all shadow-sm ${
                    isLocked
                      ? "opacity-70 bg-gray-50 border-gray-200"
                      : "border-gray-200 hover:border-blue-400"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-700 text-sm">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      = $
                      {(
                        parseInt(counts[item.value] || "0") * item.value
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      disabled={isLocked} // <--- BLOQUEO DE INPUTS
                      value={counts[item.value] || ""}
                      className={`w-24 text-right font-bold text-lg text-gray-900 border rounded-lg pl-3 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                        isLocked
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-gray-50"
                      }`}
                      onChange={(e) =>
                        handleCountChange(item.value, e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Total Físico Contado
                </p>
                <p className="text-4xl font-black text-slate-900 tracking-tight">
                  ${totalCounted.toFixed(2)}
                </p>
              </div>

              {/* BOTONES CAJERO (Se ocultan si ya cerró) */}
              {userRole === "cashier" && !hasClosedToday && (
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleRequestClose}
                    disabled={isSaving}
                    className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <LogOut size={20} />
                    )}{" "}
                    Cerrar Turno
                  </button>
                </div>
              )}

              {/* MENSAJE PARA CAJERO SI YA CERRÓ */}
              {userRole === "cashier" && hasClosedToday && (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 size={18} /> Turno Cerrado. Buen descanso.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === DERECHA: AUDITORÍA (SOLO ADMIN) === */}
        {userRole === "admin" && (
          <div className="w-full lg:w-[400px] shrink-0 order-1 lg:order-2 animate-in slide-in-from-right-4 fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sticky top-4">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Eye size={18} className="text-blue-600" /> Auditoría
                </h2>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold uppercase">
                  Admin View
                </span>
              </div>

              {/* Grid de Resumen */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-[10px] text-green-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <TrendingUp size={10} /> Ventas
                  </p>
                  <p className="font-mono font-bold text-green-800">
                    ${systemData.sales.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <ArrowDownCircle size={10} /> Ingresos
                  </p>
                  <p className="font-mono font-bold text-blue-800">
                    ${systemData.injections.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <TrendingDown size={10} /> Gastos
                  </p>
                  <p className="font-mono font-bold text-red-800">
                    ${systemData.expenses.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                    <Wallet size={10} /> Inicial
                  </p>
                  <p className="font-mono font-bold text-gray-700">
                    ${systemData.initial.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Debería haber
                </span>
                <span className="text-sm font-bold text-gray-900">
                  ${expectedTotal.toFixed(2)}
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between mb-5 transition-all ${statusColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full bg-white/60`}>
                    {statusIcon}
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase ${statusLabel}`}
                    >
                      {statusText}
                    </p>
                    <p
                      className={`text-2xl font-black leading-none ${
                        difference === 0
                          ? "text-green-700"
                          : difference > 0
                          ? "text-yellow-700"
                          : "text-red-700"
                      }`}
                    >
                      {difference > 0 ? "+" : ""}
                      {difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* RETIRO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase">
                    Monto a retirar
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Máx: ${maxWithdrawal.toFixed(2)}
                  </span>
                </div>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => handleWithdrawalChange(e.target.value)}
                    disabled={isLocked || totalCounted <= 0} // BLOQUEADO SI ESTÁ CERRADO
                    className={`w-full pl-6 pr-3 py-2 border rounded-lg text-slate-900 font-bold outline-none text-sm transition-all ${
                      isLocked ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600">
                    INICIAL DE MAÑANA:
                  </span>
                  <span
                    className={`text-base font-black ${
                      leftForTomorrow < 0 ? "text-red-500" : "text-blue-600"
                    }`}
                  >
                    ${leftForTomorrow.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLocked}
                  className={`w-full p-2 border border-gray-200 rounded-lg text-xs outline-none resize-none ${
                    isLocked ? "bg-gray-100" : "bg-white"
                  }`}
                  placeholder="..."
                />
              </div>

              {/* --- BOTONERA INTELIGENTE --- */}
              {isLocked ? (
                // SI ESTÁ CERRADO: Muestra banner verde y botón editar
                <div className="space-y-3">
                  <div className="bg-green-100 border border-green-200 p-3 rounded-xl flex items-center justify-center gap-2 text-green-800 font-bold text-sm">
                    <CheckCircle2 size={20} />{" "}
                    <span>Cierre Registrado Hoy</span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Unlock size={14} /> Habilitar Edición
                  </button>
                </div>
              ) : (
                // SI ESTÁ ABIERTO O EDITANDO: Botón de guardar
                <button
                  onClick={handleRequestClose}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {hasClosedToday
                    ? "GUARDAR CAMBIOS"
                    : "CONFIRMAR CIERRE FINAL"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL Y TOASTS */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
            <div className="text-center mb-6 relative">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="text-slate-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {isEditing
                  ? "Actualizar Cierre"
                  : userRole === "admin"
                  ? "¿Cerrar Caja Final?"
                  : "¿Cerrar Turno?"}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {userRole === "admin"
                  ? `Se confirma el retiro de $${withdrawal.toFixed(
                      2
                    )} y quedarán $${leftForTomorrow.toFixed(
                      2
                    )} para iniciar mañana.`
                  : "Se guardará tu conteo y saldrás del sistema."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeCloseShift}
                disabled={isSaving}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin inline mr-2" size={18} />
                ) : null}{" "}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
              toast.type === "success"
                ? "bg-white border-green-100 text-green-800"
                : "bg-white border-red-100 text-red-800"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                toast.type === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {" "}
              {toast.type === "success" ? (
                <CheckCircle2 size={24} />
              ) : (
                <AlertCircle size={24} />
              )}{" "}
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {toast.type === "success" ? "¡Éxito!" : "Error"}
              </h4>
              <p className="text-sm font-medium opacity-90">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
