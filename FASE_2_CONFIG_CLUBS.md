# Fase 2: Configuración de Clubs - Resumen Implementado

## Objetivo
Permitir que cada admin configure su club con datos reales y cargue la lista de socios, entendiendo que:
- **Admins** = Usuarios autenticados en la app
- **Socios** = Datos cargados por admins, interactúan vía WhatsApp Bot

## Lo Implementado

### 1. Schema de Base de Datos
```
✅ Tabla clubs - Datos básicos y características del club
✅ Tabla categorias_socios - 7 categorías argentinas pre-cargadas
✅ Tabla socios - Registros de socios (NO usuarios de auth)
✅ club_id agregado a: socios, recursos, reservas, facturas, conversaciones_whatsapp
✅ RLS habilitado en todas las tablas para aislar por club
```

### 2. Wizard de Setup Post-Registro (3 pasos)
```
✅ Paso 1: Datos básicos (nombre, nombre_corto, fecha_fundación)
✅ Paso 2: Ubicación (dirección, ciudad, provincia, CP)
✅ Paso 3: Contacto (teléfono, email, sitio web - todos opcionales)
→ Auto-genera 7 categorías de socios
→ Asigna club al usuario como admin
```

### 3. Componente SociosDB - Directorio de Socios
```
✅ Conectado directamente a Supabase (no mock data)
✅ Listar todos los socios del club
✅ Búsqueda por nombre, apellido o DNI
✅ Filtros por categoría y estado (activo/moroso/baja)
✅ Agregar nuevo socio (nombre, apellido, DNI, teléfono, email)
✅ Editar socio (inline editing)
✅ Eliminar socio
✅ Mostrar teléfono con link directo a WhatsApp
✅ Resumen KPIs (total, activos, morosos, ingresos mensuales)
```

### 4. Actualización de Componentes
```
✅ AppShell ahora usa SociosDB en lugar de Socios (mock)
✅ Hook useClub obtiene datos reales del club desde BD
✅ Sidebar muestra nombre y ubicación del club
✅ Protección por RLS asegura aislamiento de datos
```

### 5. Documentación
```
✅ MODELO_DATOS_SOCIOS.md - Explicación completa del modelo
✅ Arquitectura de dos tipos de usuarios
✅ Flujos: Admin carga socios vs Socio interactúa por WhatsApp
✅ RLS policies y seguridad
✅ Endpoints para que el Bot consulte socios
```

---

## Flujo Completo: Usuario nuevo

### 1. Registro
```
Usuario entra a /auth/register
Completa: email, password, nombre, apellido
→ Se crea usuario en auth.users
→ Se crea registro en usuarios_club (con rol: admin)
```

### 2. Setup Wizard (3 pasos)
```
Paso 1: Datos del club
  - Nombre: "Club Social Centro"
  - Nombre corto: "CSC"
  - Fecha fundación: 2015

Paso 2: Ubicación
  - Dirección: "Av. Rivadavia 1234"
  - Ciudad: "La Plata"
  - Provincia: "Buenos Aires"
  - CP: "1900"

Paso 3: Contacto (opcional)
  - Teléfono: 2214567890
  - Email: info@clubcentro.org
  - Sitio: www.clubcentro.org
  - CUIT: (dejar vacío, se completa después)

→ Se crea club en BD
→ Se genera automáticamente 7 categorías de socios
→ Usuario redirigido a Dashboard
```

### 3. Dashboard - Cargar socios
```
Admin clickea "Socios" en la navegación
Ve tabla vacía con botón "Nuevo Socio"

Opción A: Cargar uno por uno
  - Clickea "Nuevo Socio"
  - Completa nombre, apellido, DNI, teléfono
  - Se crea socio en BD
  - Aparece inmediatamente en tabla

Opción B: Importar lista (próximo)
  - Descarga template CSV
  - Completa con listado de socios
  - Sube archivo
  - Sistema crea todos los registros
```

### 4. Socios interactúan vía WhatsApp
```
Socio escribe al bot: "Hola, quiero consultar mis cuotas"
Bot consulta BD:
  - SELECT * FROM socios 
    WHERE club_id='xxx' AND telefono='2216123456'
  
→ Si existe y estado='activo':
   "Hola Juan! Tus cuotas están al día. ¿Qué necesitas?"
   
→ Si existe y estado='moroso':
   "Hola Juan, detectamos una deuda de $2000"
   
→ Si no existe:
   "Parece que no estás en nuestro sistema..."
```

---

## Arquitectura: Aislamiento por Club

### Row Level Security (RLS)
```sql
CREATE POLICY "socios_isolate_by_club" ON socios
  FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM usuarios_club 
      WHERE id = auth.uid()
    )
  )
```

**Resultado:**
- Admin Club A: Solo ve socios con club_id = Club A
- Admin Club B: Solo ve socios con club_id = Club B
- Imposible leer/escribir datos de otro club
- Seguridad garantizada a nivel de base de datos

---

## Campos en tabla `socios`

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| id | UUID | ✅ | Auto-generated |
| club_id | UUID FK | ✅ | Link al club |
| nombre | TEXT | ✅ | Nombre completo |
| apellido | TEXT | ✅ | Apellido del socio |
| dni | TEXT | ✅ | Documento de identidad |
| email | TEXT | ❌ | Opcional |
| telefono | TEXT | ❌ | Para WhatsApp (ej: 2216123456) |
| categoria | UUID FK | ✅ | Link a categorias_socios |
| estado | ENUM | ✅ | activo, moroso, baja |
| cuota_mes | DECIMAL | ✅ | Monto de cuota mensual |
| fecha_ingreso | DATE | ✅ | Cuándo se sumó al club |
| created_at | TIMESTAMP | ✅ | Cuándo se cargó en el sistema |

---

## Categorías Pre-cargadas

Se cargan automáticamente al crear un club:

| Categoría | Descripción | Nota |
|-----------|-------------|------|
| Activo | Socio activo, paga cuota regular | Standard |
| Vitalicio | Pagó de una sola vez, sin cuota mensual | Sin obligación mensual |
| Cadete | Menores de 18 años | Cuota reducida |
| Infantil | Menores de 10 años | Cuota reducida |
| Becado | Con beca o reducción especial | Cuota especial |
| Jubilado | Mayor de 65 años | Cuota reducida |
| Familiar | Integrante de familia de socio | Cuota reducida |

El admin puede crear más categorías si lo necesita.

---

## Estado del Proyecto

### Completado en Fase 2
- ✅ Schema completo con RLS
- ✅ Wizard de 3 pasos post-registro
- ✅ Componente SociosDB funcional
- ✅ Aislamiento por club garantizado
- ✅ Documentación completa

### No completado (Fase 3+)
- ⏳ CSV Import/Export
- ⏳ API endpoints para Bot
- ⏳ Notificaciones WhatsApp desde admin
- ⏳ Reportes y análisis

---

## Para Probar

### 1. Crear cuenta
```
/auth/register
Email: admin@clubcentro.test
Password: TestClub123!
Nombre: Juan
Apellido: García
```

### 2. Completar Setup Wizard
```
Paso 1: Club Social Centro
Paso 2: Rivadavia 1234, La Plata, Buenos Aires
Paso 3: 2214567890, info@clubcentro.org
```

### 3. Cargar socios
```
Dashboard → Socios → Nuevo Socio
Nombre: Carlos
Apellido: López
DNI: 35123456
Teléfono: 2216123456
```

### 4. Verificar en BD
```
SELECT * FROM socios WHERE club_id = (
  SELECT club_id FROM usuarios_club WHERE email = 'admin@clubcentro.test'
)
```

---

## Próximas Fases

### Fase 3: CSV Import & API Bot
- Importar lista de socios masiva
- Endpoints para que el Bot valide socios
- Actualización de estado en tiempo real

### Fase 4: Módulo Contable
- Plan de cuentas
- Asientos automáticos
- Libros diario/mayor
- Integración ARCA

### Fase 5: Tesorería avanzada
- Cobro de cuotas
- Recordatorios de morosidad
- Reportes de ingresos/gastos
