# Club Social OS - Plan de Desarrollo

## Estado Actual

### Completado (Prioridad Alta)
- [x] Autenticacion email/password con Supabase Auth
- [x] Wizard configuracion de club (3 pasos)
- [x] Base de datos con 10 tablas y RLS
- [x] Modulo Socios conectado a Supabase (CRUD completo)
- [x] 7 categorias de socios argentinas pre-cargadas

---

## PRIORIDAD MEDIA

### 1. Conectar Dashboard a Supabase
**Objetivo:** KPIs reales en tiempo real

**Tareas:**
- [ ] Crear hook `useDashboardStats.ts`
- [ ] Query: Total socios por estado (activo/inactivo/moroso)
- [ ] Query: Ingresos del mes (facturas pagadas)
- [ ] Query: Reservas del dia/semana
- [ ] Query: Socios nuevos ultimos 30 dias
- [ ] Query: Tasa de morosidad
- [ ] Actualizar `Dashboard.tsx` para usar datos reales

**Queries necesarios:**
```sql
-- Socios por estado
SELECT estado, COUNT(*) FROM socios WHERE club_id = ? GROUP BY estado

-- Ingresos del mes
SELECT SUM(monto) FROM facturas 
WHERE club_id = ? AND estado = 'pagada' 
AND fecha_emision >= date_trunc('month', NOW())

-- Reservas proximas
SELECT COUNT(*) FROM reservas 
WHERE club_id = ? AND fecha >= CURRENT_DATE AND estado = 'confirmada'
```

**Dependencias:** Ninguna
**Estimacion:** 1 dia

---

### 2. Conectar Tesoreria a Supabase
**Objetivo:** Cobro de cuotas real con generacion de facturas

**Tareas:**
- [ ] Crear hook `useTesoreria.ts`
- [ ] CRUD de facturas conectado a BD
- [ ] Generar factura desde UI (seleccionar socio, concepto, monto)
- [ ] Marcar factura como pagada
- [ ] Filtros: periodo, estado, socio
- [ ] Resumen: total facturado, cobrado, pendiente

**Tabla existente:** `facturas`
```
- id, club_id, socio_id
- numero_factura, tipo_comprobante
- concepto, monto, estado (pendiente/pagada/vencida/anulada)
- fecha_emision, fecha_vencimiento
- enviada_whatsapp, wa_message_id, pdf_url
```

**Dependencias:** Socios (para seleccionar a quien facturar)
**Estimacion:** 2 dias

---

### 3. Conectar Reservas a Supabase
**Objetivo:** Booking de canchas/recursos funcional

**Tareas:**
- [ ] Crear hook `useReservas.ts`
- [ ] Crear hook `useRecursos.ts`
- [ ] CRUD de recursos (canchas, quinchos, salones)
- [ ] Calendario visual de disponibilidad
- [ ] Crear reserva (seleccionar recurso, fecha, horario, quien reserva)
- [ ] Calcular sena automatica (porcentaje del precio)
- [ ] Validar conflictos de horarios
- [ ] Estados: pendiente, confirmada, cancelada, completada

**Tablas existentes:** `recursos`, `reservas`

**Dependencias:** Recursos debe existir antes de reservar
**Estimacion:** 3 dias

---

### 4. Crear Modulo Disciplinas
**Objetivo:** Gestionar actividades deportivas/culturales del club

**Tareas:**
- [ ] Crear tabla `disciplinas`
```sql
CREATE TABLE disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  profesor TEXT,
  dias TEXT[], -- ['lunes', 'miercoles']
  horario_inicio TIME,
  horario_fin TIME,
  cuota_mensual NUMERIC,
  edad_minima INTEGER,
  edad_maxima INTEGER,
  cupo_maximo INTEGER,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- [ ] Crear tabla `inscripciones`
```sql
CREATE TABLE inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  socio_id UUID REFERENCES socios(id),
  disciplina_id UUID REFERENCES disciplinas(id),
  fecha_inscripcion DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activa', -- activa, suspendida, baja
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(socio_id, disciplina_id)
);
```
- [ ] Crear hook `useDisciplinas.ts`
- [ ] CRUD de disciplinas
- [ ] Inscribir/desinscribir socios
- [ ] Ver inscriptos por disciplina
- [ ] Ver disciplinas de un socio

**Dependencias:** Socios
**Estimacion:** 2 dias

---

### 5. Importar Socios desde CSV
**Objetivo:** Carga masiva inicial de nomina

**Tareas:**
- [ ] Crear componente `ImportarSociosModal.tsx`
- [ ] Parser CSV con validacion
- [ ] Preview de datos antes de importar
- [ ] Mapeo de columnas (nombre, apellido, dni, telefono, email, categoria)
- [ ] Validar DNIs duplicados
- [ ] Insertar en batch
- [ ] Reporte de errores

**Formato CSV esperado:**
```csv
nombre,apellido,dni,telefono,email,categoria,fecha_alta
Juan,Perez,12345678,1122334455,juan@mail.com,Activo,2024-01-15
```

**Dependencias:** Categorias deben existir
**Estimacion:** 1 dia

---

### 6. Activar Bot WhatsApp
**Objetivo:** Comunicacion automatizada con socios

**Tareas:**
- [ ] Configurar cuenta Meta Business
- [ ] Obtener WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN
- [ ] Verificar webhook endpoint `/api/whatsapp/webhook`
- [ ] Probar envio de mensaje simple
- [ ] Probar recepcion de mensaje
- [ ] Vincular telefono de socio con conversacion

**Flujos del bot (ya disenados):**
- Consulta de deuda
- Ver proximas reservas
- Estado de cuenta
- Contactar al club

**Dependencias:** Cuenta Meta Business verificada
**Estimacion:** 1 dia (config) + testing

---

### 7. Envio Masivo de Facturas por WhatsApp
**Objetivo:** Distribuir facturas automaticamente

**Tareas:**
- [ ] Generar PDF de factura
- [ ] Subir PDF a Supabase Storage
- [ ] Endpoint envio individual `/api/whatsapp/enviar-factura`
- [ ] Envio masivo a todos los morosos
- [ ] Registrar envio en tabla facturas (enviada_whatsapp, wa_message_id)
- [ ] Template de mensaje aprobado por Meta

**Dependencias:** Bot WhatsApp activo, Tesoreria conectada
**Estimacion:** 2 dias

---

## PRIORIDAD BAJA

### 8. Modulo Contable Basico
**Objetivo:** Llevar contabilidad simplificada del club

**Tareas:**
- [ ] Crear tabla `plan_cuentas`
```sql
CREATE TABLE plan_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  codigo TEXT NOT NULL, -- '1.1.01'
  nombre TEXT NOT NULL, -- 'Caja'
  tipo TEXT NOT NULL, -- activo, pasivo, patrimonio, ingreso, egreso
  rubro TEXT,
  activa BOOLEAN DEFAULT true
);
```
- [ ] Crear tabla `asientos`
```sql
CREATE TABLE asientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id),
  fecha DATE NOT NULL,
  numero INTEGER,
  descripcion TEXT,
  created_by UUID REFERENCES usuarios_club(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- [ ] Crear tabla `movimientos`
```sql
CREATE TABLE movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id UUID REFERENCES asientos(id),
  cuenta_id UUID REFERENCES plan_cuentas(id),
  debe NUMERIC DEFAULT 0,
  haber NUMERIC DEFAULT 0
);
```
- [ ] Plan de cuentas predefinido para clubes
- [ ] Registro manual de asientos
- [ ] Libro Diario (listado de asientos)
- [ ] Libro Mayor (movimientos por cuenta)
- [ ] Balance de sumas y saldos

**Dependencias:** Ninguna directa
**Estimacion:** 5 dias

---

### 9. Asientos Automaticos
**Objetivo:** Generar asientos contables desde operaciones

**Tareas:**
- [ ] Trigger: Factura pagada -> Asiento (Caja a Cuotas Sociales)
- [ ] Trigger: Reserva pagada -> Asiento (Caja a Alquiler Canchas)
- [ ] Configurar cuentas por defecto por tipo de operacion
- [ ] Reversar asiento si se anula operacion

**Dependencias:** Modulo Contable, Tesoreria
**Estimacion:** 2 dias

---

### 10. Integracion ARCA (ex-AFIP)
**Objetivo:** Facturacion electronica legal

**Tareas:**
- [ ] Obtener certificado digital del club
- [ ] Integrar con API ARCA (WSFE)
- [ ] Solicitar CAE para facturas
- [ ] Generar PDF con codigo QR fiscal
- [ ] Tipos: Factura C (consumidor final), Recibo X

**Dependencias:** CUIT del club, certificado digital
**Estimacion:** 5 dias

---

### 11. Reportes para IGJ
**Objetivo:** Cumplimiento normativo asociaciones civiles

**Tareas:**
- [ ] Exportar libro de socios (PDF/Excel)
- [ ] Exportar libro de actas (estructura)
- [ ] Balance anual simplificado
- [ ] Memoria anual (template)

**Dependencias:** Modulo contable, datos completos de socios
**Estimacion:** 3 dias

---

### 12. Multi-usuario por Club
**Objetivo:** Varios admins con diferentes roles

**Tareas:**
- [ ] Invitar usuario por email
- [ ] Asignar rol (admin, tesorero, secretario, viewer)
- [ ] Permisos por rol:
  - Admin: todo
  - Tesorero: facturas, cobros
  - Secretario: socios, reservas
  - Viewer: solo lectura
- [ ] UI para gestionar usuarios del club

**Dependencias:** Auth funcionando
**Estimacion:** 2 dias

---

## Resumen de Estimaciones

| Prioridad | Tarea | Dias |
|-----------|-------|------|
| Media | Dashboard con datos reales | 1 |
| Media | Tesoreria conectada | 2 |
| Media | Reservas conectadas | 3 |
| Media | Modulo Disciplinas | 2 |
| Media | Importar CSV | 1 |
| Media | Bot WhatsApp activo | 1 |
| Media | Envio masivo facturas | 2 |
| **Subtotal Media** | | **12 dias** |
| Baja | Modulo Contable | 5 |
| Baja | Asientos automaticos | 2 |
| Baja | Integracion ARCA | 5 |
| Baja | Reportes IGJ | 3 |
| Baja | Multi-usuario | 2 |
| **Subtotal Baja** | | **17 dias** |
| **TOTAL** | | **29 dias** |

---

## Orden de Implementacion Sugerido

### Sprint 1 (Semana 1-2): Core Funcional
1. Dashboard con datos reales
2. Tesoreria conectada
3. Importar CSV de socios

### Sprint 2 (Semana 3-4): Reservas y Disciplinas
4. Recursos y Reservas
5. Disciplinas e Inscripciones

### Sprint 3 (Semana 5): WhatsApp
6. Activar bot
7. Envio masivo de facturas

### Sprint 4 (Semana 6-8): Contabilidad
8. Modulo contable basico
9. Asientos automaticos

### Sprint 5 (Semana 9-10): Compliance
10. Integracion ARCA
11. Reportes IGJ
12. Multi-usuario

---

## Notas Tecnicas

### Patron para nuevos modulos
```typescript
// 1. Crear hook en /hooks/useModulo.ts
export function useModulo() {
  const { profile } = useAuth()
  // Queries con club_id del usuario
}

// 2. Crear componente en /components/pages/ModuloDB.tsx
// 3. Actualizar AppShell para importar nuevo componente
// 4. RLS ya filtra por club_id automaticamente
```

### Variables de entorno pendientes
```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
```

### Consideraciones de seguridad
- Todas las tablas tienen RLS habilitado
- Queries SIEMPRE filtran por club_id del usuario autenticado
- No exponer IDs internos en URLs publicas
