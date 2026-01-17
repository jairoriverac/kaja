"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2, Save, Wallet, DollarSign } from "lucide-react";
import { createExpense } from "@/actions/createExpense";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Nueva prop para manejar la notificación desde el padre
  onShowToast: (message: string, type: "success" | "error") => void;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onShowToast,
}: ExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus cuando se abre
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDescription("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0 || !description.trim()) {
      onShowToast("Por favor ingresa un monto válido y un motivo.", "error");
      return;
    }

    setIsSaving(true);
    const result = await createExpense(val, description);
    setIsSaving(false);

    if (result.success) {
      // Notificación exitosa y cierre
      onShowToast(
        "Gasto registrado. Se descontará del cierre de caja.",
        "success"
      );
      onClose();
    } else {
      // Notificación de error (no cerramos el modal para que corrija)
      onShowToast("Error: " + result.message, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wallet className="text-orange-600 w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Registrar Gasto</h3>
          <p className="text-sm text-gray-500">Salida de dinero de la caja</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                Monto a retirar ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">
                  $
                </span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                Motivo
              </label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Compra de pan, pago de taxi..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
