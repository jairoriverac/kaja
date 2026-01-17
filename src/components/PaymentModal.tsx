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
} from "lucide-react";
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
  // AGREGADO: Prop para manejar notificaciones
  onShowToast: (message: string, type: "success" | "error") => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  cart,
  onSaleComplete,
  settings,
  logoBase64,
  onShowToast, // Destructuramos la función
}: PaymentModalProps) {
  const [method, setMethod] = useState<"EFECTIVO" | "DE_UNA" | "TRANSFERENCIA">(
    "EFECTIVO"
  );
  const [amountTendered, setAmountTendered] = useState("");
  const [step, setStep] = useState<"payment" | "processing" | "success">(
    "payment"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMethod("EFECTIVO");
      setAmountTendered("");
      setStep("payment");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const tender = parseFloat(amountTendered) || 0;
  const change = tender - total;
  const isSufficient = tender >= total;

  const handleConfirmPayment = async () => {
    if (method === "EFECTIVO" && !isSufficient) {
      onShowToast("El monto recibido es insuficiente.", "error");
      return;
    }

    setStep("processing");

    // 1. Guardar en BD
    const result = await processSale(cart, total, method);

    if (result.success) {
      // 2. Generar PDF
      setTimeout(() => {
        generateReceipt(
          cart,
          total,
          method,
          change,
          result.ticketNumber || 0,
          settings
          // Nota: logoBase64 se eliminó de generateReceipt en el paso anterior
        );
        setStep("success");
      }, 1500);

      // 3. Cerrar
      setTimeout(() => {
        onSaleComplete(); // El padre mostrará el toast de éxito final
        onClose();
      }, 3500);
    } else {
      // CORRECCIÓN: Usamos el Toast en lugar de alert
      onShowToast("Error: " + result.message, "error");
      setStep("payment");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 p-6 text-center border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
            Total a Cobrar
          </p>
          <p className="text-5xl font-black text-slate-900 mt-2">
            ${total.toFixed(2)}
          </p>
        </div>

        <div className="p-6">
          {step === "processing" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-lg font-bold text-gray-700">
                Registrando venta...
              </p>
              <p className="text-sm text-gray-400">Generando recibo PDF</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-xl font-bold text-green-700">
                ¡Venta Exitosa!
              </p>
              <p className="text-sm text-gray-500">Recibo descargado.</p>
            </div>
          )}

          {step === "payment" && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                Método de Pago
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setMethod("EFECTIVO")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                    method === "EFECTIVO"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-100 text-gray-500"
                  }`}
                >
                  <DollarSign size={24} className="mb-1" />{" "}
                  <span className="text-xs font-bold">Efectivo</span>
                </button>
                <button
                  onClick={() => setMethod("DE_UNA")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                    method === "DE_UNA"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-100 text-gray-500"
                  }`}
                >
                  <Smartphone size={24} className="mb-1" />{" "}
                  <span className="text-xs font-bold">De Una</span>
                </button>
                <button
                  onClick={() => setMethod("TRANSFERENCIA")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${
                    method === "TRANSFERENCIA"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-100 text-gray-500"
                  }`}
                >
                  <Landmark size={24} className="mb-1" />{" "}
                  <span className="text-xs font-bold">Transf.</span>
                </button>
              </div>

              {method === "EFECTIVO" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
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
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
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
              ) : (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center text-blue-800 font-medium">
                  {method === "DE_UNA"
                    ? "Solicita el pago por De Una."
                    : "Verifica la transferencia bancaria."}
                </div>
              )}

              <button
                onClick={handleConfirmPayment}
                disabled={method === "EFECTIVO" && !isSufficient}
                className="w-full mt-6 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={20} /> CONFIRMAR Y RECIBO
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
