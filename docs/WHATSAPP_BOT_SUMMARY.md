# Club Social OS - Bot de WhatsApp

## Resumen del Proyecto

Este documento resume la implementación del Bot de WhatsApp para el sistema de gestión del Club Social OS.

---

## 1. Descripción General

Se implementó un Bot de WhatsApp integrado con **Meta Cloud API** que permite a los socios y afiliados del club interactuar de forma automatizada para:

- **Reservar canchas y recursos** (canchas de fútbol, tenis, quinchos, salones)
- **Consultar estado de cuenta** (cuotas pendientes, saldo)
- **Solicitar facturas mensuales** por WhatsApp
- **Obtener información del club** (horarios, contacto, ubicación, datos de transferencia)

---

## 2. Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 15 (App Router) + React 19 |
| Backend | Next.js API Routes |
| Base de datos | Supabase (PostgreSQL) |
| WhatsApp API | Meta Cloud API |
| Estilos | CSS Custom + Tailwind CSS |
| Estado | Zustand |
| Hosting | Vercel |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │   Next.js App   │     │         API Routes              │   │
│  │                 │     │                                 │   │
│  │  - Dashboard    │     │  /api/whatsapp/webhook (POST)   │   │
│  │  - Socios       │     │  /api/whatsapp/send (POST)      │   │
│  │  - Reservas     │     │  /api/whatsapp/conversations    │   │
│  │  - Tesorería    │     │  /api/whatsapp/send-invoices    │   │
│  │  - WhatsApp     │     │  /api/socios                    │   │
│  │                 │     │  /api/reservas                  │   │
│  └─────────────────┘     │  /api/facturas                  │   │
│                          │  /api/recursos                  │   │
│                          └─────────────────────────────────┘   │
│                                       │                         │
└───────────────────────────────────────│─────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
            │   Supabase    │   │  Meta Cloud   │   │    Socios     │
            │  (PostgreSQL) │   │   WhatsApp    │   │  (WhatsApp)   │
            └───────────────┘   └───────────────┘   └───────────────┘
```

---

## 4. Base de Datos (Supabase)

### Tablas Creadas

#### `socios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | TEXT | Nombre completo |
| dni | TEXT | DNI (único) |
| telefono | TEXT | Teléfono para WhatsApp |
| categoria | TEXT | Activo, Vitalicio, Cadete, Becado |
| estado | TEXT | Al día, Moroso |
| cuota_mensual | INTEGER | Monto de cuota |
| avatar | TEXT | Iniciales para avatar |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última actualización |

#### `recursos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| nombre | TEXT | Nombre del recurso |
| tipo | TEXT | Deportivo, Eventos |
| precio_hora | INTEGER | Precio por hora |
| activo | BOOLEAN | Si está disponible |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `reservas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| recurso_id | UUID | FK a recursos |
| socio_id | UUID | FK a socios |
| reservado_por | TEXT | Nombre de quien reserva |
| fecha | DATE | Fecha de la reserva |
| hora_inicio | TIME | Hora de inicio |
| hora_fin | TIME | Hora de fin |
| estado | TEXT | Pendiente Seña, Confirmada, Cancelada, Completada |
| sena_pagada | INTEGER | Monto de seña |
| monto_total | INTEGER | Monto total |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `facturas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| socio_id | UUID | FK a socios |
| monto | INTEGER | Monto de la factura |
| concepto | TEXT | Descripción |
| estado | TEXT | Pendiente, Pagada, Vencida |
| fecha_emision | DATE | Fecha de emisión |
| fecha_vencimiento | DATE | Fecha de vencimiento |
| pdf_url | TEXT | URL del PDF |
| enviada_whatsapp | BOOLEAN | Si se envió por WA |
| wa_message_id | TEXT | ID del mensaje de WA |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `conversaciones_whatsapp`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| telefono | TEXT | Número de teléfono |
| socio_id | UUID | FK a socios (si está vinculado) |
| nombre_contacto | TEXT | Nombre del contacto |
| ultimo_mensaje | TEXT | Último mensaje |
| estado_flujo | TEXT | Estado actual del flujo conversacional |
| contexto | JSONB | Contexto de la conversación |
| activo | BOOLEAN | Si está activa |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última actualización |

#### `mensajes_whatsapp`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| conversacion_id | UUID | FK a conversaciones |
| direccion | TEXT | entrante, saliente |
| contenido | TEXT | Contenido del mensaje |
| tipo | TEXT | text, button, list, etc. |
| wa_message_id | TEXT | ID de mensaje en WhatsApp |
| estado | TEXT | Estado del mensaje |
| created_at | TIMESTAMPTZ | Fecha de creación |

#### `configuracion_bot`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| clave | TEXT | Clave de configuración |
| valor | TEXT | Valor |
| descripcion | TEXT | Descripción |
| updated_at | TIMESTAMPTZ | Última actualización |

---

## 5. Flujos del Bot

### Menú Principal
```
Hola! Soy el asistente virtual del Club Social OS.
¿En qué puedo ayudarte?

[1] Reservar cancha
[2] Estado de cuenta
[3] Solicitar factura
[4] Info del club
```

### Flujo de Reservas
```
1. Usuario selecciona "Reservar cancha"
2. Bot muestra lista de recursos disponibles
3. Usuario selecciona recurso
4. Bot muestra fechas disponibles (próximos 7 días)
5. Usuario selecciona fecha
6. Bot muestra horarios disponibles
7. Usuario selecciona horario
8. Bot confirma reserva con detalles y datos de pago
```

### Flujo de Estado de Cuenta
```
1. Usuario selecciona "Estado de cuenta"
2. Bot busca al socio por número de teléfono
3. Si existe: muestra estado (Al día/Moroso), cuota, facturas pendientes
4. Si no existe: mensaje de que no está registrado
```

### Flujo de Solicitar Factura
```
1. Usuario selecciona "Solicitar factura"
2. Bot genera factura del mes actual
3. Bot envía datos de transferencia (CBU/Alias)
4. Bot confirma envío
```

### Flujo de Info del Club
```
1. Usuario selecciona "Info del club"
2. Bot muestra submenú:
   - Horarios de atención
   - Teléfono de contacto
   - Ubicación
   - Datos de transferencia
```

---

## 6. API Endpoints

### WhatsApp

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/whatsapp/webhook` | Verificación de webhook (Meta) |
| POST | `/api/whatsapp/webhook` | Recepción de mensajes |
| GET | `/api/whatsapp/conversations` | Listar conversaciones |
| POST | `/api/whatsapp/send` | Enviar mensaje manual |
| POST | `/api/whatsapp/send-invoices` | Envío masivo de facturas |

### Datos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/socios` | Listar socios |
| GET | `/api/recursos` | Listar recursos |
| GET | `/api/reservas` | Listar reservas |
| GET | `/api/facturas` | Listar facturas |
| GET | `/api/stats` | Estadísticas del dashboard |

---

## 7. Configuración

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# WhatsApp Meta Cloud API
WHATSAPP_ACCESS_TOKEN=EAAcxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_VERIFY_TOKEN=cs_os_wh_verify_X9k2mP7qL4nR
```

### Configuración en Meta Business

1. Ir a [Meta for Developers](https://developers.facebook.com/)
2. Seleccionar la app de WhatsApp Business
3. Ir a **WhatsApp > Configuración > Webhook**
4. Configurar:
   - **URL**: `https://club-social-sistema-operativo.vercel.app/api/whatsapp/webhook`
   - **Token de verificación**: `cs_os_wh_verify_X9k2mP7qL4nR`
5. Suscribirse a eventos: `messages`

---

## 8. Panel de Administración

Se agregó una nueva sección **"WhatsApp"** al dashboard con las siguientes funcionalidades:

- **Vista de conversaciones**: Lista de todas las conversaciones activas
- **Detalle de mensajes**: Ver historial completo de cada conversación
- **Respuesta manual**: Enviar mensajes directamente desde el panel
- **Envío masivo de facturas**: Enviar facturas a todos los socios morosos
- **Estadísticas**: Mensajes enviados/recibidos, conversaciones activas

---

## 9. Estructura de Archivos

```
/vercel/share/v0-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── whatsapp/
│   │   │   │   ├── webhook/route.ts
│   │   │   │   ├── conversations/route.ts
│   │   │   │   ├── send/route.ts
│   │   │   │   └── send-invoices/route.ts
│   │   │   ├── socios/route.ts
│   │   │   ├── recursos/route.ts
│   │   │   ├── reservas/route.ts
│   │   │   ├── facturas/route.ts
│   │   │   └── stats/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Socios.tsx
│   │   │   ├── Reservas.tsx
│   │   │   ├── Tesoreria.tsx
│   │   │   ├── Disciplinas.tsx
│   │   │   └── WhatsApp.tsx      # Nueva página
│   │   ├── AppShell.tsx
│   │   └── Landing.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── whatsapp/
│   │       ├── client.ts         # Cliente Meta API
│   │       ├── bot.ts            # Lógica del bot
│   │       └── types.ts          # Tipos TypeScript
│   └── store/
│       └── useClubStore.ts
├── scripts/
│   └── 001_create_schema.sql     # Migración de BD
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

---

## 10. Migración Realizada

Se migró el proyecto de **Vite + React** a **Next.js 15 (App Router)** para poder usar API Routes que manejen el webhook de WhatsApp.

### Cambios principales:

1. **Estructura**: De `app/src/` a `src/app/` (App Router)
2. **Routing**: De React Router a Next.js App Router
3. **API**: Nuevas API Routes en `src/app/api/`
4. **Base de datos**: De Zustand (memoria) a Supabase (PostgreSQL)
5. **Estilos**: Se mantuvieron los CSS existentes + Tailwind

---

## 11. URLs de Producción

- **Aplicación**: https://club-social-sistema-operativo.vercel.app
- **Webhook WhatsApp**: https://club-social-sistema-operativo.vercel.app/api/whatsapp/webhook

---

## 12. Próximos Pasos Sugeridos

1. **Autenticación**: Implementar login para el panel de administración
2. **Notificaciones**: Agregar notificaciones push cuando lleguen mensajes
3. **Reportes**: Generar reportes de uso del bot
4. **Templates**: Usar message templates de WhatsApp para mensajes de marketing
5. **Pagos**: Integrar pasarela de pagos (MercadoPago, etc.)
6. **Recordatorios**: Enviar recordatorios automáticos de cuotas vencidas

---

## 13. Soporte

Para cualquier consulta o problema técnico, revisar:

- [Documentación Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Next.js](https://nextjs.org/docs)

---

*Documento generado el 1 de Abril de 2026*
