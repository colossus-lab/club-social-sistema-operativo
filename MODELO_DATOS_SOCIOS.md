# Modelo de Datos: Gestión de Socios

## Arquitectura

La aplicación Club Social OS tiene **dos tipos de usuarios**:

### 1. **Administradores del Club** (Usuario en `auth.users`)
- Se registran en la app con email/password
- Tienen acceso al dashboard administrativo
- Cargan, editan y administran la lista de socios
- Vinculados a un club específico via `usuarios_club`

### 2. **Socios del Club** (Registros en `socios`)
- **NO son usuarios de autenticación**
- Son datos cargados/administrados por los admins
- Se comunican con el club exclusivamente vía WhatsApp Bot
- El bot consulta la tabla `socios` para validar y procesar solicitudes

---

## Tablas y Relaciones

### `clubs`
```sql
id (UUID, PK)
nombre (TEXT) - Nombre oficial del club
nombre_corto (TEXT) - Para interfaces compactas (ej: "CASC")
ubicacion (TEXT) - Dirección principal
ciudad (TEXT)
provincia (TEXT)
codigo_postal (TEXT)
telefono (TEXT, nullable)
email (TEXT, nullable)
sitio_web (TEXT, nullable)
cuit (TEXT, nullable) - Para facturación
fecha_fundacion (DATE)
logo_url (TEXT, nullable)
plan (TEXT) - free, premium, enterprise
activo (BOOLEAN)
created_at (TIMESTAMP)
```

### `usuarios_club` → Admins/Gerentes
```sql
id (UUID, PK) - FK auth.users.id
club_id (UUID, FK) - El club al que pertenece
email (TEXT)
nombre (TEXT)
apellido (TEXT)
rol (ENUM) - admin, tesorero, secretario, viewer
activo (BOOLEAN)
created_at (TIMESTAMP)
```

**RLS Policy:** Un usuario solo puede ver su propio registro

### `socios` → Datos administrados por admins
```sql
id (UUID, PK)
club_id (UUID, FK) - A qué club pertenece
nombre (TEXT) - Nombre completo del socio
apellido (TEXT) - Apellido del socio
dni (TEXT) - Documento de identidad
email (TEXT, nullable)
telefono (TEXT) - Celular para WhatsApp (ej: 2216123456)
categoria (UUID, FK) - Link a categorias_socios
estado (ENUM) - activo, moroso, baja
cuota_mes (DECIMAL) - Monto mensual
fecha_ingreso (DATE)
created_at (TIMESTAMP)
```

**RLS Policy:** Solo el admin del club puede ver/editar socios de su club

### `categorias_socios`
```sql
id (UUID, PK)
club_id (UUID, FK)
nombre (TEXT) - Activo, Vitalicio, Cadete, etc.
descripcion (TEXT, nullable)
cuota_base (DECIMAL, nullable)
created_at (TIMESTAMP)
```

**Pre-cargadas:** Al crear un club, se cargan 7 categorías argentinas standard:
- Activo
- Vitalicio
- Cadete
- Infantil
- Becado
- Jubilado
- Familiar

---

## Flujo: Admin carga socios

### Paso 1: Admin ingresa a Dashboard
```
Login (email/password) → Profile → Club asignado → Dashboard
```

### Paso 2: Admin navega a "Directorio de Socios"
- Ve tabla con todos los socios del club
- Puede buscar, filtrar por categoría/estado

### Paso 3: Admin carga nuevo socio
```
Botón "Nuevo Socio" 
→ Completa: nombre, apellido, DNI, teléfono, email
→ Se crea registro en tabla `socios`
→ Se asigna categoría (default: Activo)
```

### Paso 4: Admin administra socios
- **Editar:** Cambiar nombre, categoría, estado, cuota
- **Eliminar:** Marcar como baja o eliminar completamente
- **Exportar:** CSV para reportes
- **Importar:** CSV masivo de socios

---

## Flujo: Socio interactúa vía WhatsApp

### Paso 1: Socio escribe al bot WhatsApp
```
Socio: "Hola, quiero reservar una cancha"
```

### Paso 2: Bot valida al socio
```javascript
// El bot busca el socio en BD
SELECT * FROM socios 
WHERE club_id = 'xxx' 
AND telefono = '2216123456'
AND estado = 'activo'
```

### Paso 3: Bot procesa según contexto
- ✅ Si estado = "activo" → Permite reserva/consulta
- ❌ Si estado = "moroso" → Notifica deuda pendiente
- ❌ Si estado = "baja" → Informa que ya no es socio
- ❌ Si no existe → Pide que se registre en persona

### Paso 4: Bot actualiza datos según acción
```sql
UPDATE socios 
SET cuota_mes = cuota_mes - pago
WHERE id = 'xxx'
AND club_id = 'yyy'
```

---

## Row Level Security (RLS)

### Política: Cada club ve solo sus socios
```sql
CREATE POLICY "club_isolation" ON socios
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM usuarios_club 
      WHERE id = auth.uid()
    )
  )
```

**Resultado:**
- Admin del Club A NO puede ver socios del Club B
- Imposible acceso a datos sin pasar por RLS
- Seguridad garantizada a nivel de BD

---

## Casos de Uso

### UC1: Importar lista de socios existentes
```
Admin descarga template CSV
Completa con socios del club (nombre, DNI, categoría)
Sube en "Importar CSV"
Sistema crea registros en socios automáticamente
```

### UC2: Actualizar estado de socio
```
Admin ve en tabla: Socio X está "moroso"
Admin edita y pasa a "activo" (pagó deuda)
BD actualiza
Bot envía SMS: "¡Bienvenido! Tu estado ha sido actualizado"
```

### UC3: Socio intenta reservar pero está moroso
```
Socio escribe: "Quiero reservar cancha"
Bot: "Hola Juan, detectamos que tienes una deuda de $2000
      Por favor regulariza para poder reservar"
```

### UC4: Agregar nueva categoría
```
Admin en Dashboard → Socios → Categorías
Crea "Socios Honorarios"
Asigna cuota = $0
Puede asignar socios a esa categoría
```

---

## Seguridad

| Aspecto | Implementación |
|--------|-----------------|
| **Aislamiento de clubs** | RLS filtra por `club_id` |
| **Acceso a socios** | Solo admins del club pueden verlos |
| **Modificación** | Solo admins autenticados pueden editar |
| **Datos personales** | Teléfono = conexión WhatsApp, no se expone públicamente |
| **Auditoría** | `created_at` y `updated_at` registran cambios |

---

## API Endpoints (Para el Bot)

### GET `/api/socios/validate`
```javascript
// Valida si un socio existe y está activo
GET /api/socios/validate?club_id=xxx&telefono=2216123456

Response:
{
  "existe": true,
  "activo": true,
  "nombre": "Juan García",
  "estado": "activo",
  "categoria": "Activo"
}
```

### POST `/api/socios/update-estado`
```javascript
// Actualiza estado de un socio
POST /api/socios/update-estado
{
  "socio_id": "xxx",
  "nuevo_estado": "moroso",
  "razon": "Deuda de $2000"
}
```

### GET `/api/socios/list`
```javascript
// Lista todos los socios de un club (admin only)
GET /api/socios/list?club_id=xxx

Response:
[
  {
    "id": "xxx",
    "nombre": "Juan García",
    "dni": "12345678",
    "estado": "activo",
    "categoria": "Activo"
  },
  ...
]
```

---

## Próximos Pasos

1. **Implementar CSV Import/Export**
   - Descargar plantilla
   - Subir lista completa de socios
   - Validación de datos

2. **Conectar Bot con BD**
   - Endpoints de validación
   - Actualización de estado en tiempo real

3. **Reportes**
   - Análisis de morosidad
   - Proyección de ingresos
   - Estadísticas por categoría

4. **Notificaciones**
   - SMS/Email a socios sobre estado
   - Alertas al admin sobre cambios
