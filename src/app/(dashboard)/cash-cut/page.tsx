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
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  Lock,
  Layers,
  History,
  UserCog,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getDailySummary } from "@/actions/getDailySummary";
import { createCashCut } from "@/actions/createCashCut";
import { getCurrentCashFlow } from "@/actions/getCurrentCashFlow";

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

type Denomination = (typeof DENOMINATIONS)[number];
type Counts = Record<number, string>;
type SystemData = {
  initial: number;
  sales: number;
  credits: number;
  digital: number;
  expenses: number;
  injections: number;
};
type UserRole = "admin" | "cashier" | null;
type Toast = { show: boolean; message: string; type: "success" | "error" };

const ToastNotification = ({ show, message, type }: Toast) => {
  if (!show) return null;
  const isSuccess = type === "success";
  return (
    <div className="fixed bottom-6 right-6 z-[70] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
          isSuccess
            ? "bg-white border-green-100 text-green-800"
            : "bg-white border-red-100 text-red-800"
        }`}
      >
        <div
          className={`p-2 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
        </div>
        <div>
          <h4 className="font-bold text-sm">
            {isSuccess ? "¡Éxito!" : "Error"}
          </h4>
          <p className="text-sm font-medium opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
};

const DenominationRow = ({
  item,
  count,
  onChange,
  isLocked,
}: {
  item: Denomination;
  count: string;
  onChange: (value: string) => void;
  isLocked: boolean;
}) => (
  <div
    className={`flex items-center justify-between p-3 bg-white border rounded-xl transition-all shadow-sm ${
      isLocked
        ? "opacity-60 bg-gray-50 border-gray-100 grayscale-[0.5]"
        : "border-gray-200 hover:border-blue-400"
    }`}
  >
    <div className="flex flex-col">
      <span className="font-bold text-gray-700 text-sm">{item.label}</span>
      <span className="text-[10px] text-gray-400 font-mono">
        = ${(parseInt(count || "0") * item.value).toFixed(2)}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm font-bold">$</span>
      <input
        type="number"
        min="0"
        placeholder="0"
        disabled={isLocked}
        value={count}
        className={`w-24 text-right font-bold text-lg text-gray-900 border rounded-lg pl-3 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
          isLocked
            ? "bg-gray-100 text-gray-500 cursor-not-allowed border-transparent"
            : "bg-gray-50"
        }`}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

const ConfirmModal = ({
  show,
  onClose,
  onConfirm,
  isSaving,
  isEditing,
  userRole,
  withdrawal,
}: {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSaving: boolean;
  isEditing: boolean;
  userRole: UserRole;
  withdrawal: number;
  leftForTomorrow: number;
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
        <div className="text-center mb-6 relative">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            {isEditing ? (
              <UserCog className="text-slate-600 w-6 h-6" />
            ) : (
              <LogOut className="text-slate-600 w-6 h-6" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {isEditing
              ? "Confirmar Corrección"
              : userRole === "admin"
              ? "Cierre Definitivo"
              : "¿Cerrar Turno?"}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {isEditing
              ? "Vas a modificar el cierre anterior."
              : userRole === "admin"
              ? `Estás cerrando el turno. Se retirarán $${withdrawal.toFixed(
                  2
                )}.`
              : "Se guardará tu conteo y se cerrará tu sesión."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {isSaving ? (
              <Loader2 className="animate-spin inline mr-2" size={18} />
            ) : null}{" "}
            {isEditing ? "Guardar Definitivo" : "Confirmar Cierre"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CashCutPage() {
  const supabase = createClient();
  const router = useRouter();

  const [counts, setCounts] = useState<Counts>({});
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasClosedToday, setHasClosedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdminFinalized, setIsAdminFinalized] = useState(false);
  const [isSwitchingShift, setIsSwitchingShift] = useState(false);

  const [systemData, setSystemData] = useState<SystemData>({
    initial: 0.0,
    sales: 0.0,
    credits: 0.0,
    digital: 0.0,
    expenses: 0.0,
    injections: 0.0,
  });
  const [toast, setToast] = useState<Toast>({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile) setUserRole(profile.role as "admin" | "cashier");
        }
        const summary = await getDailySummary();
        if (summary.success && summary.data) {
          setSystemData({
            initial: summary.data.initial,
            sales: summary.data.sales,
            credits: summary.data.credits,
            digital: summary.data.digital,
            expenses: summary.data.expenses,
            injections: summary.data.injections,
          });
          if (summary.data.existingDetails) {
            setHasClosedToday(true);
            setIsAdminFinalized(summary.data.isAdminFinalized || false);
            let loadedCounts: any = {};
            if (typeof summary.data.existingDetails === "string") {
              try {
                loadedCounts = JSON.parse(summary.data.existingDetails);
              } catch (e) {
                console.error(e);
              }
            } else {
              loadedCounts = summary.data.existingDetails;
            }
            const formattedCounts: Counts = {};
            Object.entries(loadedCounts).forEach(([key, val]) => {
              formattedCounts[parseFloat(key)] = String(val);
            });
            setCounts(formattedCounts);
          }
          if (summary.data.existingNotes) setNotes(summary.data.existingNotes);
          if (summary.data.existingWithdrawal)
            setWithdrawalAmount(summary.data.existingWithdrawal.toString());
        }
      } catch (error) {
        console.error(error);
        showToast("Error al cargar datos.", "error");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [supabase]);

  const totalCounted = DENOMINATIONS.reduce(
    (acc, denom) => acc + parseInt(counts[denom.value] || "0") * denom.value,
    0
  );

  // --- CÁLCULO DE CUADRE ---
  // Inicial + Ventas + Ingresos - (Gastos + Créditos + Digitales)
  const expectedTotal =
    systemData.initial +
    systemData.sales +
    systemData.injections -
    (systemData.expenses + systemData.credits + systemData.digital);

  const rawDiff = totalCounted - expectedTotal;
  const difference = Math.round(rawDiff * 100) / 100;
  const withdrawal = parseFloat(withdrawalAmount) || 0;
  const maxWithdrawal = totalCounted > 0 ? totalCounted : 0;
  const leftForTomorrow = totalCounted - withdrawal;

  const getStatusInfo = () => {
    if (difference === 0)
      return {
        color: "bg-green-50 border-green-500 text-green-700",
        icon: <CheckCircle2 size={20} className="text-green-600" />,
        label: "text-green-800",
        text: "CUADRE PERFECTO",
      };
    else if (difference > 0)
      return {
        color: "bg-blue-50 border-blue-500 text-blue-700",
        icon: <AlertTriangle size={20} className="text-blue-600" />,
        label: "text-blue-800",
        text: "SOBRANTE (REVISAR)",
      };
    else
      return {
        color: "bg-red-50 border-red-500 text-red-700",
        icon: <AlertTriangle size={20} className="text-red-600" />,
        label: "text-red-800",
        text: "FALTANTE",
      };
  };
  const statusInfo = getStatusInfo();

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
    try {
      const result = await createCashCut({
        countedCash: totalCounted,
        systemSales: systemData.sales,
        systemExpenses: systemData.expenses,
        systemInitial: systemData.initial,
        systemInjections: systemData.injections,
        systemCredits: systemData.credits,
        systemDigital: systemData.digital,
        notes: notes,
        details: counts,
        withdrawal: withdrawal,
      });
      if (result.success) {
        setHasClosedToday(true);
        setIsEditing(false);
        if (userRole === "admin") {
          setIsAdminFinalized(true);
          showToast("Cierre guardado y finalizado.", "success");
        } else {
          showToast("¡Turno cerrado correctamente!", "success");
          setTimeout(() => router.push("/pos"), 2000);
        }
      } else {
        showToast("Error: " + result.message, "error");
      }
    } catch (error) {
      showToast("Error inesperado.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNewShift = async () => {
    setIsSwitchingShift(true);
    try {
      const res = await getCurrentCashFlow();
      if (res.success && res.data) {
        setSystemData({
          initial: res.data.initial || 0,
          sales: res.data.totalSales || 0,
          credits: res.data.totalCredits || 0,
          digital: res.data.totalDigital || 0,
          expenses: res.data.totalExpenses || 0,
          injections: res.data.totalInjections || 0,
        });
        setCounts({});
        setNotes("");
        setWithdrawalAmount("");
        setHasClosedToday(false);
        setIsEditing(false);
        setIsAdminFinalized(false);
        showToast("Nuevo turno iniciado.", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Error al cargar.", "error");
    } finally {
      setIsSwitchingShift(false);
    }
  };

  const isLocked = hasClosedToday && !isEditing;
  if (loading)
    return (
      <div className="h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );

  return (
    <div className="h-[calc(100vh-65px)] overflow-y-auto bg-gray-50 p-4 md:p-6 relative">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-20">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 order-2 lg:order-1 flex flex-col relative">
          <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Calculator size={24} className="text-blue-400" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">
                  Cierre de Caja
                </h1>
                <p className="text-xs text-slate-400">
                  Contabilización de efectivo
                </p>
              </div>
            </div>
            {hasClosedToday && (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">
                <Lock size={14} />
                <span className="text-[10px] font-bold">CERRADO</span>
              </div>
            )}
          </div>
          <div className="p-6 relative">
            {isSwitchingShift && (
              <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="text-sm font-medium animate-pulse">
                  Preparando nuevo turno...
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DENOMINATIONS.map((item) => (
                <DenominationRow
                  key={item.value}
                  item={item}
                  count={counts[item.value] || ""}
                  onChange={(val) => handleCountChange(item.value, val)}
                  isLocked={isLocked}
                />
              ))}
            </div>
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Total Físico Contado
                </p>
                <p className="text-4xl font-black text-slate-900">
                  ${totalCounted.toFixed(2)}
                </p>
              </div>
              {userRole === "cashier" && !hasClosedToday && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push("/pos")}
                    className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} />{" "}
                    <span className="hidden sm:inline">Volver</span> POS
                  </button>
                  <button
                    onClick={handleRequestClose}
                    disabled={isSaving}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all flex-1"
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
            </div>
          </div>
        </div>

        {userRole === "admin" && (
          <div className="w-full lg:w-[400px] shrink-0 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sticky top-4 relative overflow-hidden flex flex-col h-fit">
              {isSwitchingShift && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                  <Loader2 className="animate-spin text-slate-900" size={32} />
                </div>
              )}

              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Eye size={18} className="text-blue-600" /> Panel Admin
                </h2>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase tracking-wider">
                  Control Total
                </span>
              </div>

              {/* NUEVO GRID DE 2 COLUMNAS (6 CARDS) */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-[10px] text-green-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <TrendingUp size={10} /> Ventas
                  </p>
                  <p className="font-mono font-bold text-green-800 text-lg">
                    ${systemData.sales.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-[10px] text-yellow-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <CreditCard size={10} /> Créditos
                  </p>
                  <p className="font-mono font-bold text-yellow-800 text-lg">
                    -${systemData.credits.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <ArrowDownCircle size={10} /> Ingresos
                  </p>
                  <p className="font-mono font-bold text-blue-800 text-lg">
                    +${systemData.injections.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <TrendingDown size={10} /> Gastos
                  </p>
                  <p className="font-mono font-bold text-red-800 text-lg">
                    -${systemData.expenses.toFixed(2)}
                  </p>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 col-span-2 flex justify-between items-center px-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1">
                    <Wallet size={10} /> Inicial
                  </p>
                  <p className="font-mono font-bold text-gray-700 text-lg">
                    +${systemData.initial.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-2 px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Debería haber en caja
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ${expectedTotal.toFixed(2)}
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between mb-6 transition-all ${statusInfo.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-white/60`}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase opacity-80`}
                    >
                      {statusInfo.text}
                    </p>
                    <p className={`text-2xl font-black leading-none`}>
                      {difference > 0 ? "+" : ""}
                      {difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase">
                      Retiro de Efectivo
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Máx: ${maxWithdrawal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => handleWithdrawalChange(e.target.value)}
                      disabled={isLocked || totalCounted <= 0}
                      className={`w-full bg-transparent font-bold text-slate-900 outline-none text-lg ${
                        isLocked ? "cursor-not-allowed" : ""
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                    Observaciones / Notas
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isLocked}
                    className={`w-full p-3 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:border-blue-500 transition-colors ${
                      isLocked ? "bg-gray-50" : "bg-white"
                    }`}
                    placeholder="Escribe aquí..."
                  />
                </div>
              </div>

              {isLocked ? (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Cierre Anterior Registrado
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Puedes corregir este cierre o iniciar un turno nuevo.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {isAdminFinalized ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 bg-gray-100 border border-gray-200 text-gray-400 font-bold rounded-xl flex items-center justify-between text-xs cursor-not-allowed"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={16} /> Cierre Definitivo (Ya no
                          editable)
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 px-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold rounded-xl transition-all flex items-center justify-between text-xs group"
                      >
                        <span className="flex items-center gap-2">
                          <UserCog size={16} /> Corregir Cierre Anterior
                        </span>
                        <ArrowRight
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </button>
                    )}
                    <button
                      onClick={handleStartNewShift}
                      disabled={isSwitchingShift}
                      className="w-full py-4 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.98]"
                    >
                      {isSwitchingShift ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Layers size={16} />
                      )}{" "}
                      INICIAR NUEVO TURNO (VENTAS POST-CIERRE)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRequestClose}
                  disabled={isSaving}
                  className={`w-full py-4 rounded-xl font-bold text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                    isEditing
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                      : "bg-slate-900 hover:bg-black text-white"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}{" "}
                  {hasClosedToday && isEditing
                    ? "GUARDAR CORRECCIÓN DEFINITIVA"
                    : "CONFIRMAR CIERRE DE TURNO"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCloseShift}
        isSaving={isSaving}
        isEditing={isEditing}
        userRole={userRole}
        withdrawal={withdrawal}
        leftForTomorrow={leftForTomorrow}
      />
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
