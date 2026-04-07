# Plan para Beta - Club Social OS

## Estado Actual (Abril 2026)

### Funcional (conectado a Supabase)
| Modulo | Estado |
|--------|--------|
| Auth (registro/login) | OK |
| Setup Club (wizard 3 pasos) | OK |
| Socios (CRUD completo) | OK |

### NO Funcional (usa datos mock de Zustand)
| Modulo | Problema |
|--------|----------|
| Dashboard | Usa mock data |
| Tesoreria | Usa mock data |
| Reservas | Usa mock data |
| WhatsApp | Usa mock data |

---

## Lo que falta para Beta

### Tareas Ordenadas por Prioridad

| # | Tarea | Que implica | Complejidad |
|---|-------|-------------|-------------|
| 1 | **Dashboard conectado a BD** | Query socios, facturas, calcular KPIs reales | Baja |
| 2 | **Recursos conectado a BD** | CRUD canchas/quinchos/salones | Baja |
| 3 | **Reservas conectado a BD** | CRUD reservas + calendario | Media |
| 4 | **Tesoreria conectado a BD** | CRUD facturas + cobro cuotas | Media |
| 5 | **Config Bot WhatsApp en BD** | Guardar credenciales en configuracion_bot | Baja |
| 6 | **Probar bot WhatsApp** | Requiere cuenta Meta Business | Externa |

### Resumen
- **4 componentes** a conectar con Supabase
- **1 modulo** nuevo (Recursos) 
- **1 configuracion** externa (Meta WhatsApp)

---

## Detalle por Tarea

### 1. Dashboard conectado a BD
**Archivo:** `src/components/pages/Dashboard.tsx`
**Cambios:**
- Reemplazar `useClubStore` por queries a Supabase
- Calcular KPIs reales:
  - Socios activos: `SELECT COUNT(*) FROM socios WHERE activo = true AND club_id = ?`
  - Ingresos mensuales: `SELECT SUM(monto) FROM facturas WHERE pagada = true AND fecha >= ?`
  - Cuotas pendientes: `SELECT SUM(monto) FROM facturas WHERE pagada = false`
  - Nuevas altas: `SELECT COUNT(*) FROM socios WHERE created_at >= ?`
- Grafico de evolucion: datos reales de facturas por mes
- Pie chart: distribucion real por categoria

### 2. Recursos conectado a BD
**Archivo:** Crear `src/components/pages/RecursosDB.tsx`
**Tabla:** `recursos` (ya existe con club_id)
**Cambios:**
- CRUD completo: listar, crear, editar, eliminar
- Campos: nombre, tipo, precio_hora, descripcion, activo
- Tipos: Cancha, Quincho, Salon, Pileta, Otro

### 3. Reservas conectado a BD
**Archivo:** Crear `src/components/pages/ReservasDB.tsx`
**Tabla:** `reservas` (ya existe con club_id)
**Cambios:**
- Listar reservas del club
- Crear reserva (seleccionar recurso, socio, fecha, hora)
- Registrar sena
- Calendario visual (opcional para beta)

### 4. Tesoreria conectado a BD
**Archivo:** Crear `src/components/pages/TesoreriaDB.tsx`
**Tabla:** `facturas` (ya existe con club_id)
**Cambios:**
- Listar facturas pendientes y pagadas
- Registrar pago de cuota
- Generar factura para socio
- Ver morosos
- Grafico de flujo de caja real

### 5. Config Bot WhatsApp en BD
**Archivo:** `src/components/pages/WhatsApp.tsx`
**Tabla:** `configuracion_bot` (ya existe con club_id)
**Cambios:**
- Guardar credenciales en BD (access_token, phone_number_id, verify_token)
- Cargar configuracion al montar
- Mensaje de bienvenida, horarios, CBU en BD

### 6. Probar bot WhatsApp
**Requisitos externos:**
- Cuenta Meta for Developers
- WhatsApp Business API aprobada
- Numero de telefono verificado
- Configurar webhook URL

---

## Orden de Implementacion Sugerido

```
Dia 1: Dashboard + Recursos
Dia 2: Reservas
Dia 3: Tesoreria
Dia 4: WhatsApp config + testing
```

**Total estimado: 4 dias de desarrollo**

---

## Checklist Pre-Beta

- [ ] Dashboard muestra KPIs reales
- [ ] Se pueden crear/editar recursos (canchas, quinchos)
- [ ] Se pueden crear/gestionar reservas
- [ ] Se pueden cobrar cuotas y ver facturas
- [ ] Configuracion del bot guardada en BD
- [ ] Bot responde mensajes basicos (requiere Meta)
- [ ] Un admin puede:
  - [ ] Registrarse y crear su club
  - [ ] Cargar lista de socios
  - [ ] Gestionar recursos
  - [ ] Crear reservas
  - [ ] Cobrar cuotas
  - [ ] Ver dashboard con datos reales

---

## Post-Beta (Mejoras)

- Importar socios desde CSV
- Calendario visual de reservas
- Envio masivo de facturas por WhatsApp
- Reportes exportables (PDF/Excel)
- Notificaciones de morosidad automaticas
