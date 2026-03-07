# Club Social OS 🏟️

**Sistema Operativo Comunitario para Clubes de Barrio**

Club Social OS es una plataforma web integral diseñada específicamente para las necesidades de los clubes de barrio en Argentina y Latinoamérica. Desarrollado con un enfoque social, busca digitalizar y profesionalizar la gestión de estas instituciones fundamentales para la comunidad, ofreciendo herramientas de tesorería, administración de socios, reserva de espacios físicos y comunicación directa, todo bajo una interfaz moderna, rápida y accesible (optimizada para dispositivos móviles).

---

## Características Principales 🚀

*   **Gestión de Socios:** ABM (Alta, Baja, Modificación) de socios con diferentes categorías (Vitalicio, Activo, Cadete, **Becado**).
*   **Tesorería y Finanzas:** Control de pagos de cuotas sociales, registro de ingresos extraordinarios (rifas, eventos, donaciones, subsidios) y gráficos históricos de recaudación.
*   **Módulo de Disciplinas:** Administración de deportes y actividades, asignación de profesores, control de cupos y horarios, y sistema de inscripción ágil.
*   **Agenda y Reservas:** Sistema visual para el alquiler y reserva de recursos físicos del club (canchas de papi fútbol, quinchos, salones de usos múltiples), incluyendo control de señas y saldos pendientes.
*   **Integración Social (WhatsApp):** Accesos directos para contactar a los socios vía WhatsApp, ideal para recordatorios amigables de pago o notificaciones importantes a un solo clic.
*   **Dashboard Estadístico:** Vista panorámica del estado de la institución, masa societaria activa, ingresos del mes e índice de morosidad.
*   **Soporte Multi-Tema:** Interfaz Glassmorphism premium que incluye Modo Claro y Modo Oscuro.

---

## Motivación del Proyecto ❤️

Este proyecto nace como una **iniciativa social** orientada a empoderar a los clubes de barrio, especialmente en sectores vulnerables. Estas asociaciones civiles suelen depender del trabajo voluntario, hojas de cálculo o cuadernos de papel, limitando su potencial de crecimiento. Club Social OS se ofrece como una solución tecnológica gratuita o de bajo costo para llevar a estos clubes al "siguiente nivel".

**Desarrollado y potenciado por [ColossusLab.org](https://colossuslab.org).**

---

## Arquitectura Técnica 🛠️

El proyecto está construido como una Single Page Application (SPA), preparada para escalar e integrarse con Backend-as-a-Service (BaaS).

*   **Frontend Framework:** React 18 + Vite
*   **Enrutamiento:** React Router DOM v6
*   **Gestión del Estado:** Zustand (Actualmente utilizando persistencia simulada con mocks, listo para inyección de datos reales).
*   **Estilos:** CSS Vanilla + CSS Variables (Arquitectura Glassmorphism de alto rendimiento sin librerías de estilos adicionales pesadas).
*   **Iconografía:** Lucide React
*   **Gráficos:** Recharts

---

## Integración con Backend (Próximos Pasos) 🚧

La rama actual contiene toda la lógica de estado aislada en `useClubStore.js`. Está diseñada estructuralmente para conectarse sin fricciones a Firebase (Firestore + Authentication).
Las acciones del store actúan como interfaces que, en el futuro cercano, realizarán las operaciones asíncronas contra la base de datos de la nube.

---

## Instalación y Ejecución Local 💻

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dantedeagostino-dot/club-social-os.git
   cd club-social-os/app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

4. **Compilar para Producción:**
   ```bash
   npm run build
   ```

## Deploy en Vercel ⚙️

El repositorio incluye un archivo `vercel.json` en el directorio de la aplicación, configurado para manejar el enrutamiento correcto de la Single Page Application (previene errores 404 al recargar páginas). 
Asegúrate de configurar el **Root Directory** en Vercel apuntando a la carpeta `/app`.

---

*Haciendo que los clubes de barrio vuelen al siguiente nivel.* 🇦🇷⚽🏀
