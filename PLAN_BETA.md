# Plan Beta - Club Social OS

## Que es

Sistema operativo para clubes de barrio argentinos. Los administradores gestionan todo desde un dashboard web, los socios interactuan solo via WhatsApp con un bot automatizado.

---

## Estado Actual (Abril 2026)

### Funciona con Supabase
| Modulo | Estado |
|--------|--------|
| Auth (registro/login) | OK |
| Setup Club (wizard 3 pasos) | OK |
| Socios (CRUD completo) | OK |
| Bot WhatsApp (webhook, flujos, API) | OK |

### Usa datos mock (hay que conectar)
| Modulo | Problema |
|--------|----------|
| Dashboard | KPIs de useClubStore |
| Recursos | No existe componente DB |
| Reservas | Usa mock data |
| Tesoreria | Usa mock data |
| Panel WhatsApp | Usa mock data |

---

## Lo que falta para Beta (4 dias)

### Dia 1: Dashboard + Recursos
| Tarea | Detalle |
|-------|---------|
| DashboardDB | KPIs reales: total socios, morosos, ingresos mes, reservas activas |
| RecursosDB | CRUD canchas/quinchos/salones conectado a tabla `recursos` |

### Dia 2: Reservas
| Tarea | Detalle |
|-------|---------|
| ReservasDB | Listar, crear, editar reservas desde tabla `reservas` |
| Calendario | Vista por recurso y fecha |
| Senas | Registrar sena pagada |

### Dia 3: Tesoreria
| Tarea | Detalle |
|-------|---------|
| TesoreriaDB | Lista de facturas pendientes/pagadas |
| Cobrar cuota | Crear factura para socio |
| Marcar pagada | Actualizar estado en BD |

### Dia 4: WhatsApp Panel + Testing
| Tarea | Detalle |
|-------|---------|
| WhatsAppDB | Leer conversaciones reales de `conversaciones_whatsapp` |
| Mensajes | Ver historial de `mensajes_whatsapp` |
| Testing | Flujo completo end-to-end |

---

## Bot WhatsApp (YA IMPLEMENTADO)

### Codigo existente
```
src/lib/whatsapp/
├── client.ts    # Cliente Meta Cloud API
├── bot.ts       # Logica conversacional
└── types.ts     # Tipos TypeScript

src/app/api/whatsapp/
├── webhook/route.ts       # Recibe mensajes de Meta
├── send/route.ts          # Envia mensajes
├── conversations/route.ts # Lista conversaciones
└── send-invoices/route.ts # Envio masivo facturas
```

### Flujos implementados
- Menu principal (4 opciones)
- Reservar cancha (seleccion recurso > fecha > hora > confirmacion)
- Estado de cuenta (busca socio por telefono)
- Solicitar factura (genera y envia)
- Info del club (horarios, contacto, ubicacion, CBU)

### Solo falta configuracion externa
1. Cuenta Meta Business
2. App WhatsApp en developers.facebook.com
3. Variables de entorno:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`

---

## Tablas en Supabase (todas con club_id y RLS)

| Tabla | Campos clave |
|-------|--------------|
| clubs | nombre, direccion, cuit, telefono |
| usuarios_club | email, nombre, rol, club_id |
| socios | nombre, dni, telefono, categoria, estado, cuota_mensual |
| categorias_socios | nombre, cuota_mensual, es_activo |
| recursos | nombre, tipo, precio_hora, activo |
| reservas | recurso_id, socio_id, fecha, hora_inicio, hora_fin, estado, sena |
| facturas | socio_id, monto, concepto, estado, fecha_emision |
| configuracion_bot | clave, valor |
| conversaciones_whatsapp | telefono, socio_id, estado_flujo, contexto |
| mensajes_whatsapp | conversacion_id, direccion, contenido, tipo |

---

## Checklist Beta

### Funcionalidad core
- [x] Registro y login de admin
- [x] Wizard configuracion club
- [x] CRUD socios
- [x] Bot WhatsApp (codigo)
- [ ] Dashboard con datos reales
- [ ] CRUD recursos
- [ ] CRUD reservas
- [ ] CRUD facturas/tesoreria
- [ ] Panel WhatsApp conectado

### Configuracion externa
- [ ] Cuenta Meta Business
- [ ] App WhatsApp configurada
- [ ] Webhook URL registrado
- [ ] Variables de entorno en Vercel

---

## Resultado Beta

Un club podra:
1. Registrarse y configurar su club (nombre, direccion, etc)
2. Cargar su lista de socios con categorias
3. Crear canchas, quinchos, salones
4. Gestionar reservas
5. Cobrar cuotas y ver facturas
6. Ver metricas reales en dashboard
7. Ver conversaciones de WhatsApp en el panel
8. (Con cuenta Meta) Bot respondiendo automaticamente a socios

---

## Estimacion total

**4 dias de desarrollo** + configuracion cuenta Meta
