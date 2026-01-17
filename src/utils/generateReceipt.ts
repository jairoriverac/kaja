import jsPDF from "jspdf";

interface StoreSettings {
  store_name: string | null;
  address: string | null;
  ruc: string | null;
  phone: string | null;
  email: string | null;
}

export const generateReceipt = (
  cart: any[],
  total: number,
  paymentMethod: string,
  change: number,
  ticketNumber: number,
  settings: StoreSettings | null
  // Eliminamos el parámetro logoBase64
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });

  let y = 10;

  // --- ENCABEZADO ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  // Centramos el nombre del local
  doc.text(settings?.store_name?.toUpperCase() || "BAZAR Y PAPELERÍA", 40, y, {
    align: "center",
  });
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Datos del negocio
  if (settings?.ruc) {
    doc.text(`RUC: ${settings.ruc}`, 40, y, { align: "center" });
    y += 4;
  }

  if (settings?.address) {
    const splitAddress = doc.splitTextToSize(settings.address, 70);
    doc.text(splitAddress, 40, y, { align: "center" });
    y += splitAddress.length * 4;
  }

  if (settings?.phone) {
    doc.text(`Tel: ${settings.phone}`, 40, y, { align: "center" });
    y += 4;
  }

  // Separador
  y += 2;
  doc.text("------------------------------------------------", 40, y, {
    align: "center",
  });
  y += 4;

  // --- DATOS DEL TICKET ---
  // Convierte el número 5 en "000005"
  const ticketString = ticketNumber.toString().padStart(6, "0");

  doc.text(`Fecha: ${new Date().toLocaleString()}`, 40, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Ticket N°: ${ticketString}`, 40, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  y += 6;

  doc.line(5, y, 75, y);
  y += 5;

  // --- ÍTEMS ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CANT. DETALLE", 5, y);
  doc.text("TOTAL", 75, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 4;

  cart.forEach((item) => {
    const name = item.name.substring(0, 20);
    const subtotal = (item.price * item.quantity).toFixed(2);

    doc.text(`${item.quantity} x`, 5, y);
    doc.text(`${name}`, 15, y);
    doc.text(`$${subtotal}`, 75, y, { align: "right" });
    y += 4;
  });

  doc.line(5, y, 75, y);
  y += 5;

  // --- TOTALES ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL A PAGAR:", 5, y);
  doc.text(`$${total.toFixed(2)}`, 75, y, { align: "right" });
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Pago: ${paymentMethod}`, 5, y);

  if (paymentMethod === "EFECTIVO") {
    y += 4;
    doc.text(`Cambio: $${change.toFixed(2)}`, 5, y);
  }

  // --- PIE DE PÁGINA ---
  y += 10;
  doc.text("¡Gracias por su compra!", 40, y, { align: "center" });

  // Guardar PDF
  doc.save(`Recibo_No_${ticketString}.pdf`);
};
