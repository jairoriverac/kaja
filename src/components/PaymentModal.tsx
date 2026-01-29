"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  DollarSign,
  Smartphone,
  Landmark,
  CheckCircle2,
  Loader2,
  Printer,
  User,
  Search,
  UserPlus,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { processSale } from "@/actions/processSale";
import { generateReceipt } from "@/utils/generateReceipt";

type StoreSettings = {
  store_name: string | null;
  address: string | null;
  ruc: string | null;
  phone: string | null;
  email: string | null;
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  cart: any[];
  onSaleComplete: () => void;
  settings: StoreSettings | null;
  logoBase64: string | null;
  onShowToast: (message: string, type: "success" | "error") => void;
}

type SaleType = "immediate" | "credit";

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  cart,
  onSaleComplete,
  settings,
  logoBase64,
  onShowToast,
}: PaymentModalProps) {
  const supabase = createClient();

  // --- ESTADOS GENERALES ---
  const [step, setStep] = useState<"payment" | "processing" | "success">(
    "payment"
  );
  const [saleType, setSaleType] = useState<SaleType>("immediate");

  // --- PAGO INMEDIATO ---
  const [method, setMethod] = useState<"EFECTIVO" | "DE_UNA" | "TRANSFERENCIA">(
    "EFECTIVO"
  );

  // --- CRÉDITO / FIADO ---
  // Buscador de clientes
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Montos
  const [amountReceived, setAmountReceived] = useState(""); // Lo que entrega el cliente

  const inputRef = useRef<HTMLInputElement>(null);

  // Reiniciar estados al abrir
  useEffect(() => {
    if (isOpen) {
      setStep("payment");
      setSaleType("immediate");
      setMethod("EFECTIVO");
      setAmountReceived("");
      setCustomerSearch("");
      setSelectedCustomer(null);
      setCustomersList([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // --- LÓGICA DE BÚSQUEDA DE CLIENTES ---
  useEffect(() => {
    const searchCustomers = async () => {
      if (
        saleType === "credit" &&
        customerSearch.length > 1 &&
        !selectedCustomer
      ) {
        // CORRECCIÓN AQUÍ: Usamos (as any) para evitar el error de tipos
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("customers") as any)
          .select("*")
          .ilike("name", `%${customerSearch}%`)
          .limit(5);
        setCustomersList(data || []);
      } else {
        setCustomersList([]);
      }
    };

    const timeout = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timeout);
  }, [customerSearch, saleType, selectedCustomer, supabase]);

  // Crear cliente rápido
  const handleCreateCustomer = async () => {
    if (!customerSearch.trim()) return;
    setIsCreatingCustomer(true);

    // CORRECCIÓN AQUÍ: Usamos (as any) para evitar el error de tipos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("customers") as any)
      .insert([{ name: customerSearch.toUpperCase(), is_active: true }])
      .select()
      .single();

    if (data) {
      setSelectedCustomer(data);
      setCustomerSearch(""); // Limpiar búsqueda para ocultar lista
      onShowToast("Cliente creado correctamente", "success");
    } else {
      onShowToast("Error al crear cliente", "error");
      console.error(error);
    }
    setIsCreatingCustomer(false);
  };

  // --- CÁLCULOS MATEMÁTICOS ---
  const tender = parseFloat(amountReceived) || 0; // Dinero entregado

  // Lógica dinámica según el tipo de venta
  let change = 0;
  let balanceDue = 0; // Lo que queda debiendo
  let isSufficient = true;

  if (saleType === "immediate") {
    change = tender - total;
    isSufficient = tender >= total;
  } else {
    // En crédito, el 'tender' es el ABONO INICIAL.
    balanceDue = total - tender;
    if (balanceDue < 0) balanceDue = 0; // No puede deber negativo
    isSufficient = true; // Siempre es válido procesar
  }

  // --- PROCESAR VENTA ---
  const handleConfirmPayment = async () => {
    // Validaciones
    if (saleType === "immediate" && method === "EFECTIVO" && !isSufficient) {
      onShowToast("El monto recibido es insuficiente.", "error");
      return;
    }
    if (saleType === "credit" && !selectedCustomer) {
      onShowToast("Debes seleccionar o crear un cliente para fiar.", "error");
      return;
    }

    setStep("processing");

    const saleData = {
      cart,
      total,
      method: saleType === "credit" ? "CREDITO" : method,
      paymentStatus:
        saleType === "immediate"
          ? "completed"
          : balanceDue > 0
          ? "partial"
          : "completed",
      amountPaid: tender,
      customerId: selectedCustomer?.id || null,
    };

    // NOTA: Recuerda que todavía debemos actualizar processSale.ts para que acepte estos argumentos extra
    const result = await processSale(
      cart,
      total,
      method,
      saleData.paymentStatus,
      saleData.amountPaid,
      saleData.customerId
    );

    if (result.success) {
      setTimeout(() => {
        generateReceipt(
          cart,
          total,
          saleType === "credit"
            ? `CRÉDITO (Abona: $${tender.toFixed(2)})`
            : method,
          change,
          result.ticketNumber || 0,
          settings
        );
        setStep("success");
      }, 1500);

      setTimeout(() => {
        onSaleComplete();
        onClose();
      }, 3500);
    } else {
      onShowToast("Error: " + result.message, "error");
      setStep("payment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-slate-50 pt-6 pb-4 px-6 text-center border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
            Total de la Venta
          </p>
          <p className="text-4xl font-black text-slate-900">
            ${total.toFixed(2)}
          </p>

          {/* TABS SELECTOR */}
          <div className="flex p-1 bg-gray-200 rounded-xl mt-4">
            <button
              onClick={() => setSaleType("immediate")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                saleType === "immediate"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign size={14} /> PAGO INMEDIATO
            </button>
            <button
              onClick={() => setSaleType("credit")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                saleType === "credit"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User size={14} /> FIADO / CRÉDITO
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === "processing" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-lg font-bold text-gray-700">Procesando...</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-xl font-bold text-green-700">
                {saleType === "credit" ? "Crédito Registrado" : "Venta Exitosa"}
              </p>
            </div>
          )}

          {step === "payment" && (
            <>
              {/* --- MODO PAGO INMEDIATO --- */}
              {saleType === "immediate" && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => setMethod("EFECTIVO")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                        method === "EFECTIVO"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-100 text-gray-500"
                      }`}
                    >
                      <DollarSign size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">EFECTIVO</span>
                    </button>
                    <button
                      onClick={() => setMethod("DE_UNA")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                        method === "DE_UNA"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-100 text-gray-500"
                      }`}
                    >
                      <Smartphone size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">DE UNA</span>
                    </button>
                    <button
                      onClick={() => setMethod("TRANSFERENCIA")}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                        method === "TRANSFERENCIA"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-100 text-gray-500"
                      }`}
                    >
                      <Landmark size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">TRANSF.</span>
                    </button>
                  </div>

                  {method === "EFECTIVO" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                          Dinero Recibido
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">
                            $
                          </span>
                          <input
                            ref={inputRef}
                            type="number"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div
                        className={`p-4 rounded-xl flex justify-between items-center ${
                          isSufficient
                            ? "bg-green-100 text-green-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        <span className="font-bold text-sm uppercase">
                          Su Cambio:
                        </span>
                        <span className="text-2xl font-black">
                          ${isSufficient ? change.toFixed(2) : "---"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- MODO CRÉDITO / FIADO --- */}
              {saleType === "credit" && (
                <div className="animate-in fade-in slide-in-from-right-4 space-y-5">
                  {/* SELECCIÓN DE CLIENTE */}
                  <div className="relative">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                      Cliente (¿A quién se fía?)
                    </label>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {selectedCustomer.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-800">
                            {selectedCustomer.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch("");
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          ref={inputRef}
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                          placeholder="Buscar nombre..."
                        />
                        {/* Lista desplegable */}
                        {customerSearch.length > 1 && !selectedCustomer && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                            {customersList.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerSearch("");
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 font-medium text-sm"
                              >
                                {c.name}
                              </button>
                            ))}
                            {/* Botón Crear Nuevo */}
                            <button
                              disabled={isCreatingCustomer}
                              onClick={handleCreateCustomer}
                              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm flex items-center gap-2"
                            >
                              {isCreatingCustomer ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <UserPlus size={16} />
                              )}
                              Crear "{customerSearch}"
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MONTO A PAGAR HOY */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">
                      Abona Hoy (Opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Si deja en 0.00, se fía el total de la venta.
                    </p>
                  </div>

                  {/* RESUMEN DEUDA */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-white rounded-full text-orange-500 shadow-sm">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-800 uppercase">
                        Saldo Pendiente (Deuda)
                      </p>
                      <p className="text-2xl font-black text-orange-600">
                        ${balanceDue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÓN CONFIRMAR */}
              <button
                onClick={handleConfirmPayment}
                disabled={
                  (saleType === "immediate" &&
                    method === "EFECTIVO" &&
                    !isSufficient) ||
                  (saleType === "credit" && !selectedCustomer)
                }
                className={`w-full mt-6 py-4 text-white rounded-xl font-bold text-lg shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                  saleType === "credit"
                    ? "bg-orange-600 hover:bg-orange-700 shadow-orange-200"
                    : "bg-slate-900 hover:bg-black"
                }`}
              >
                <Printer size={20} />
                {saleType === "credit" ? "REGISTRAR FIADO" : "CONFIRMAR VENTA"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
