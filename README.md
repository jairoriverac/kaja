# Kaja POS 📦

**Kaja** es un sistema de Punto de Venta (POS) web moderno, diseñado para ser rápido, intuitivo y agnóstico al tipo de negocio. Aunque nació para gestionar una papelería/bazar, su arquitectura está diseñada para escalar como un **MicroSaaS** para cualquier comercio retail (ferreterías, panaderías, tiendas de conveniencia).

El objetivo principal es eliminar la fricción en el mostrador: escanear, cobrar e imprimir ticket en segundos.

## 🚀 Características Principales

-   **Sistema Híbrido de Inventario:**
    -   Manejo de **Productos Físicos** (control estricto de stock, alertas de mínimos).
    -   Manejo de **Servicios** (intangibles como copias, trámites, mano de obra sin stock).
-   **Hardware Ready:**
    -   Integración "Plug & Play" con lectores de códigos de barras (modo teclado).
    -   Diseño optimizado para impresión térmica de recibos (58mm/80mm).
-   **Caja y Finanzas:**
    -   Cálculo automático de vueltos/cambio.
    -   Reporte de Cierre de Caja diario (Ventas vs. Costos).
-   **Tecnología Web:**
    -   Accesible desde cualquier dispositivo con navegador (PC, Tablet, Móvil).

## 🛠 Tech Stack

El proyecto está construido sobre tecnologías modernas para asegurar velocidad y escalabilidad:

-   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router)
-   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
-   **Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL)
-   **Lenguaje:** TypeScript / JavaScript

## ⚙️ Configuración del Proyecto

### 1. Clonar y Dependencias

```bash
git clone [https://github.com/tu-usuario/kaja-pos.git](https://github.com/tu-usuario/kaja-pos.git)
cd kaja-pos
npm install
