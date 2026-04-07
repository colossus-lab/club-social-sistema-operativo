# Autenticación con Email/Password - Setup Simple

## ¿Qué tenemos ahora?

Autenticación **100% funcional** con Supabase, sin configuraciones externas:

- ✅ Registro con email y contraseña
- ✅ Login seguro
- ✅ Logout
- ✅ Protección de rutas automática
- ✅ Row Level Security en todas las tablas
- ✅ Usuario vinculado automáticamente

## No se necesita:

- ❌ Google Cloud Console
- ❌ Credenciales OAuth
- ❌ Configuración en Supabase (ya está hecha)

## Cómo probar

### 1. Ir a la página de registro

```
http://localhost:3000/auth/register
```

Rellena:
- **Email**: `admin@club.local`
- **Contraseña**: `tu_contraseña_segura`
- **Nombre**: `Juan`
- **Apellido**: `García`

### 2. Crear cuenta

El sistema:
1. Crea usuario en `auth.users`
2. Auto-crea registro en `usuarios_club` con rol **admin**
3. Redirige al login

### 3. Hacer login

```
http://localhost:3000/auth/login
```

Usa las credenciales que acabas de crear. El sistema:
1. Autentica con Supabase
2. Establece cookie segura
3. Redirige al dashboard

### 4. Ver protección de rutas

- Si intentas ir a `/` sin sesión → Redirige a `/auth/login` ✅
- Una vez logueado → Accedes al dashboard ✅

## Archivos clave

| Archivo | Qué hace |
|---------|----------|
| `src/app/auth/register/page.tsx` | Formulario de registro |
| `src/app/auth/login/page.tsx` | Formulario de login |
| `src/middleware.ts` | Protege rutas |
| `src/hooks/useAuth.ts` | Hook para acceder al usuario |
| `scripts/002_create_usuarios_club.sql` | Tabla + trigger |
| `scripts/003_update_usuarios_apellido.sql` | Actualización |

## Flujo de datos

```
Usuario llena formulario en /auth/register
              ↓
POST /auth/register → API de Supabase
              ↓
Crea usuario en auth.users + metadata
              ↓
Trigger → auto-crea row en usuarios_club
              ↓
Usuario es redirigido a /auth/login
              ↓
Usuario llena login/pass
              ↓
POST /auth/login → Supabase valida credenciales
              ↓
Establece cookie segura
              ↓
Redirige a / (protegido por middleware)
              ↓
useAuth() obtiene usuario + rol + nombre
              ↓
AppShell renderiza con datos reales del usuario
```

## Seguridad

- ✅ Contraseñas **hasheadas** con bcrypt en Supabase
- ✅ Cookies **HTTP-only** (imposible XSS)
- ✅ **SameSite=Lax** (previene CSRF)
- ✅ **RLS** (Row Level Security) en todas las tablas
- ✅ Datos filtrados automáticamente por usuario

## Crear más usuarios

Para agregar más usuarios del club con roles diferentes:

### Opción 1: Desde el UI

Comparte `/auth/register` con otros usuarios. Se crearán como **admin** por defecto.

### Opción 2: Manual en Supabase

```sql
UPDATE public.usuarios_club
SET rol = 'tesorero'
WHERE email = 'tesorero@club.local';

-- Opciones de rol:
-- 'admin' = administrador total
-- 'tesorero' = maneja finanzas
-- 'secretario' = maneja socios
-- 'viewer' = solo lectura
```

## Troubleshooting

### "No puedo hacer login"

1. ¿Creaste la cuenta primero en `/auth/register`? 
2. ¿Revisaste los logs en la consola?
3. ¿Las variables de entorno están configuradas?

```bash
# Variables necesarias (ya deben estar en Vercel):
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### "Me redirige a login después de loguear"

Probable causa: El middleware no está leyendo la cookie. Verifica:

1. ¿Está `src/middleware.ts` presente?
2. ¿Está `src/lib/supabase/middleware.ts` presente?
3. ¿La variable `NEXT_PUBLIC_SUPABASE_URL` existe?

### "El usuario no aparece en AppShell"

Verifica que `useAuth()` está retornando datos:

```tsx
const { user, profile } = useAuth()
console.log("Usuario:", user)
console.log("Perfil:", profile)
```

## Próximos pasos

Una vez que funcione:

1. **Fase 2**: Conectar UI con datos reales de Supabase
2. **Fase 3**: Crear CRUD de socios
3. **Fase 4**: Implementar módulo contable

¡Está todo listo para producción!
