# Implementation Plan: Módulo Contable — Club Social OS Beta

## Objetivo

Construir el módulo contable completo para Club Social OS con motor propio, integración ARCA para facturación electrónica, cumplimiento IGJ con libros digitales, y desplegarlo en AWS para una beta test con un club real.

> **Scope: Categoría I IGJ exclusivamente.** Clubes de barrio con ingresos anuales inferiores a la Categoría H del Monotributo. Esto habilita el régimen simplificado de la RG 15/2024: balance simplificado (sin Estado de Origen y Aplicación de Fondos), constitución por instrumento privado, y requisitos mínimos de presentación. El contador matriculado solo interviene **una vez al año** para firmar digitalmente el balance simplificado — no opera el sistema ni carga datos.

---

## Arquitectura del Proyecto

### Estructura de Directorios

```
Club Social OS/
├── app/                          ← Frontend (existente, React + Vite)
└── backend/                      ← NUEVO
    ├── package.json
    ├── .env.example
    ├── src/
    │   ├── index.js              ← Entry point Express
    │   ├── config/
    │   │   ├── db.js             ← Pool PostgreSQL
    │   │   └── auth.js           ← Firebase Admin SDK
    │   ├── routes/
    │   │   ├── socios.js
    │   │   ├── tesoreria.js
    │   │   ├── contabilidad.js
    │   │   ├── facturacion.js
    │   │   └── igj.js
    │   ├── services/
    │   │   ├── asientosService.js ← Reglas de asientos automáticos
    │   │   ├── arcaService.js     ← afip.js wrapper (WSAA + WSFE)
    │   │   ├── hashService.js     ← SHA-256 de libros digitales
    │   │   └── pdfService.js      ← Generación PDF (libros + facturas)
    │   ├── models/
    │   │   └── planDeCuentas.js   ← Plan de cuentas default
    │   └── middleware/
    │       └── authMiddleware.js  ← Verificación de JWT/Firebase token
    └── sql/
        └── schema.sql            ← DDL completo PostgreSQL
```

---

## Base de Datos — PostgreSQL Schema

### Tablas Core (Club y Autenticación)

| Tabla | Descripción |
|-------|-------------|
| `clubs` | Datos del club: nombre, CUIT, ubicación, categoría IGJ, ingresos anuales |
| `usuarios` | Usuarios con rol (admin, tesorero, profesor), vinculados a Firebase Auth |

### Tablas Operativas

| Tabla | Descripción |
|-------|-------------|
| `socios` | Nómina de socios con DNI, categoría, estado, cuota, fecha de alta |
| `disciplinas` | Deportes/actividades con profesor, horario, cupo máximo |
| `inscripciones` | Relación socio ↔ disciplina |
| `recursos` | Espacios físicos (canchas, quinchos) con precio por hora |
| `reservas` | Reservas de recursos con fecha, hora, estado y seña |

### Tablas Contables

| Tabla | Descripción |
|-------|-------------|
| `cuentas_contables` | Plan de cuentas jerárquico (código, nombre, tipo, padre) |
| `asientos_contables` | Cabecera de asientos con fecha, concepto, origen |
| `movimientos_contables` | Detalle debe/haber por cuenta para cada asiento |

### Tablas de Facturación ARCA

| Tabla | Descripción |
|-------|-------------|
| `comprobantes` | Facturas tipo C con CAE, punto de venta, importe, PDF |
| `configuracion_fiscal` | CUIT, condición IVA, punto de venta, paths a certificados X.509 |

### Tablas de Cumplimiento IGJ

| Tabla | Descripción |
|-------|-------------|
| `libros_digitales` | Libros PDF por período con hash SHA-256, folios, estado |

---

## Plan de Cuentas para Asociaciones Civiles

```
1. ACTIVO
   1.1 Caja y Bancos
   1.2 Créditos por Cuotas Sociales
   1.3 Bienes de Uso

2. PASIVO
   2.1 Deudas Comerciales
   2.2 Deudas Fiscales (ARCA)
   2.3 Fondos con Asignación Específica

3. PATRIMONIO NETO
   3.1 Capital Social
   3.2 Resultados Acumulados

4. INGRESOS
   4.1 Cuotas Sociales
   4.2 Alquileres de Espacios
   4.3 Inscripciones a Disciplinas
   4.4 Eventos y Rifas
   4.5 Subsidios Estatales
   4.6 Donaciones

5. EGRESOS
   5.1 Servicios (Luz, Gas, Agua)
   5.2 Honorarios Profesores
   5.3 Mantenimiento
   5.4 Gastos Administrativos
   5.5 Impuestos y Tasas
```

---

## Asientos Automáticos

Cada operación en el club genera automáticamente un asiento contable:

| Evento | Asiento |
|--------|---------|
| Cobro cuota socio | Caja (D) → Cuotas Sociales (H) |
| Reserva con seña | Caja (D) → Anticipo Alquileres (H) |
| Ingreso por rifa | Caja (D) → Ingresos Eventos (H) |
| Inscripción disciplina | Caja (D) → Inscripciones Deportivas (H) |
| Subsidio recibido | Bancos (D) → Subsidios Estatales (H) |
| Pago de servicio | Servicios (D) → Caja/Bancos (H) |

---

## API Endpoints

| Método | Ruta | Función |
|--------|------|---------|
| POST | /api/clubs | Crear club |
| GET | /api/clubs/:id | Obtener datos del club |
| PUT | /api/clubs/:id/config-fiscal | Actualizar configuración fiscal |
| GET/POST | /api/socios | CRUD socios |
| POST | /api/tesoreria/cobrar-cuota | Cobrar cuota + asiento + factura |
| POST | /api/tesoreria/ingreso-evento | Registrar ingreso extraordinario |
| GET | /api/contabilidad/libro-diario | Consultar asientos por período |
| GET | /api/contabilidad/libro-mayor/:cuentaId | Libro mayor de una cuenta |
| GET | /api/contabilidad/balance | Balance de sumas y saldos |
| POST | /api/facturacion/emitir | Emitir factura tipo C (ARCA) |
| GET | /api/facturacion/comprobantes | Historial de comprobantes |
| POST | /api/igj/generar-libro | Generar PDF + hash SHA-256 |
| GET | /api/igj/libros | Listar libros digitales |
| GET | /api/igj/acta/:libroId | Descargar acta de habilitación |
| POST | /api/igj/balance-simplificado | Balance anual simplificado (Cat. I) |

---

## Integración ARCA — Facturación Electrónica

### Flujo de Emisión de Factura Tipo C

1. El administrador cobra una cuota o registra un ingreso
2. El backend solicita autenticación al WSAA (firmando con certificado X.509)
3. El WSAA devuelve un token temporal
4. Con el token, el backend solicita un CAE al WSFE (servicio de facturación)
5. ARCA devuelve el CAE + fecha de vencimiento
6. El sistema genera el PDF de la factura con CAE y código QR
7. La factura queda disponible para enviar por WhatsApp al socio

### Tecnología

- Librería: `afip.js` (Node.js, open source)
- Ambiente de testing: Homologación de ARCA (sin efecto fiscal)
- Tipo de comprobante: Factura C (para entidades exentas de IVA)

---

## Cumplimiento IGJ — Libros Digitales

### Flujo de Certificación de Libros

1. Al cierre de cada mes, el sistema genera el Libro Diario en PDF
2. Se calcula el hash SHA-256 del archivo PDF
3. Se genera el Acta de Habilitación con el hash, folios y fecha
4. Se almacena el PDF en triple respaldo: base de datos + cloud storage + descarga local
5. El hash permite verificar que el libro no fue alterado posteriormente

### Balance Simplificado (Categoría I)

Para clubes Cat. I, el balance anual incluye solo:
- **Estado de Situación Patrimonial** (Activo, Pasivo, Patrimonio Neto)
- **Estado de Recursos y Gastos** (Ingresos vs Egresos del ejercicio)

**No se requiere**:
- Estado de Origen y Aplicación de Fondos
- Estado de Evolución del Patrimonio Neto
- Notas y Anexos complejos

El sistema genera este balance automáticamente y lo envía por email al contador firmante.

---

## Deployment en AWS

```
Route 53 (DNS) → club.colossuslab.org
    ↓
Application Load Balancer (HTTPS / TLS 1.3)
    ↓                  ↓
EC2 (Backend)     S3 (Frontend Vite build)
Node.js/Express
    ↓
RDS (PostgreSQL)
```

Alternativa: Mantener frontend en Vercel y solo desplegar backend + DB en AWS.

---

## Nuevas Páginas en el Frontend

| Página | Función |
|--------|---------|
| Contabilidad | Libro Diario, Libro Mayor, Balance de Sumas y Saldos |
| Facturación | Emisión de facturas tipo C, historial con CAE |
| Configuración Fiscal | CUIT, certificados ARCA, datos del contador firmante |
| Libros Digitales | Generación mensual, hash SHA-256, actas, balance anual |

---

## Dependencias Técnicas

| Paquete | Propósito |
|---------|-----------|
| express | API server |
| pg / pg-pool | PostgreSQL driver |
| firebase-admin | Auth verification |
| @afipsdk/afip.js | ARCA web services |
| pdfkit | Generación de PDFs |
| qrcode | QR para facturas |
| cors | CORS para frontend |
| dotenv | Variables de entorno |
| jest + supertest | Testing |

---

## Timeline Estimado

| Fase | Duración | Entregable |
|------|----------|-----------|
| Fase 0 — Backend Foundation | 2 semanas | Backend + DB + Auth |
| Fase 1 — Motor Contable | 3 semanas | Asientos automáticos + UI |
| Fase 2 — Integración ARCA | 2 semanas | Facturación electrónica |
| Fase 3 — Cumplimiento IGJ | 2 semanas | Libros digitales + balance |
| Fase 4 — Deploy AWS | 1 semana | Producción + inicio beta |
| Beta Test | 4 semanas | Operación real con club piloto |
| **Total** | **~14 semanas** | |

---

# Guía para el Administrador del Club Beta

## Lo que necesita preparar el club

### 1. Datos Institucionales

- [ ] CUIT del club (como persona jurídica)
- [ ] Razón social exacta como figura en ARCA
- [ ] Domicilio fiscal registrado
- [ ] Condición ante IVA (mayormente "Exenta" para clubes de barrio)
- [ ] Estatuto social vigente (PDF)
- [ ] Acta de designación de autoridades vigente (PDF)
- [ ] Último balance presentado ante IGJ (PDF, si existe)

### 2. Certificados ARCA (Paso Crítico)

**Paso 2.1 — Generar certificado de seguridad:**

1. Ir a https://auth.afip.gob.ar/contribuyente
2. Loguearse con CUIT del club y clave fiscal (nivel 3 o superior)
3. Ir a "Administración de Certificados Digitales"
4. Seleccionar "Agregar alias" → escribir un nombre como `clubsocialos`
5. Generar un CSR (Certificate Signing Request) — el sistema lo guía
6. Descargar el certificado (.crt) y guardar la clave privada (.key)

**Paso 2.2 — Habilitar Web Services:**

1. En el portal ARCA, ir a "Administrador de Relaciones de Clave Fiscal"
2. Agregar relación con los servicios: "ws_sr_constancia_inscripcion" (padrón) y "wsfe" (facturación electrónica)
3. Asociar el certificado digital creado en el paso anterior

**Paso 2.3 — Configurar Punto de Venta:**

1. Ir a "ABM Puntos de Venta" en el portal ARCA
2. Crear un nuevo punto de venta de tipo "Web Services"
3. Anotar el número de punto de venta asignado

⚠️ Los certificados ARCA tienen validez limitada (generalmente 2 años). El sistema alertará cuando estén próximos a vencer.

### 3. Datos de Socios

Preparar un archivo Excel/CSV con la nómina actual de socios:
- Nombre completo
- DNI
- Teléfono (con código de área)
- Categoría (Activo, Vitalicio, Cadete, Becado)
- Estado de cuota (Al día / Moroso)
- Monto de cuota mensual
- Fecha de ingreso al club

### 4. Datos Contables

- [ ] Valor de la cuota mensual por categoría
- [ ] Ingresos anuales estimados del último ejercicio (deben ser inferiores a Cat. H Monotributo para calificar como Cat. I)
- [ ] Plan de cuentas actual (si tienen uno); si no, el sistema carga uno predeterminado para asociaciones civiles

### 5. Contador Firmante (mínimo)

El sistema automatiza toda la contabilidad. El contador solo se necesita una vez al año para firmar digitalmente el balance simplificado que el sistema genera. Necesitan:

- [ ] Nombre y matrícula del contador
- [ ] Email del contador (para enviarle el PDF del balance cuando esté listo)
- [ ] Al momento de la presentación anual ante IGJ, el contador revisa el balance generado por el sistema y lo legaliza ante el Consejo Profesional

---

## Cronograma de la Beta Test

### Semana 1: Onboarding
- Carga de datos del club y socios (CSV o manual)
- Configuración fiscal (CUIT, certificados ARCA)
- El sistema detecta automáticamente que es Cat. I
- Verificación de conexión con ARCA (homologación)
- Emisión de factura de prueba (sin efecto fiscal)

### Semana 2: Operación Real
- Cobrar cuotas reales → el sistema genera automáticamente:
  - Transacción en tesorería
  - Asiento contable automático
  - Factura tipo C con CAE de ARCA
- Registrar ingresos de cantina/eventos/rifas
- Revisar libro diario (se arma solo)
- Generar primer libro digital con hash SHA-256

### Semana 3: Cumplimiento IGJ (Cat. I simplificado)
- Generar balance anual simplificado (sin EOAF)
- Preparar acta de habilitación de libros digitales
- Exportar datos para SITIGJ
- Enviar balance al contador firmante por email

### Semana 4: Feedback
- Reunión de cierre con administrador
- Listado de bugs y mejoras
- Encuesta de usabilidad
- Decisión sobre go-live en producción

**Para Cat. I, el balance es simplificado: Estado de Situación Patrimonial + Estado de Recursos y Gastos. No se requiere Estado de Origen y Aplicación de Fondos ni Estado de Evolución del Patrimonio Neto. El sistema genera todo esto automáticamente.**

---

## Soporte durante la Beta

- **Canal de comunicación**: Grupo de WhatsApp dedicado con el equipo de ColossusLab
- **Horario de soporte**: Lunes a viernes 9:00 - 20:00
- **Reportar problemas**: Capturas de pantalla + descripción del paso donde falló
- **Contacto como respaldo**: El contador del club puede validar que los asientos y libros sean correctos

---

*Desarrollado por ColossusLab.org — Haciendo que los clubes de barrio vuelen al siguiente nivel.* 🇦🇷⚽🏀
