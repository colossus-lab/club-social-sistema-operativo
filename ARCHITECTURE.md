# Arquitectura de Autenticación - Documentación Técnica

## Diagrama de Flujo

```
Usuario No Autenticado
    ↓
GET / (sin cookie de sesión)
    ↓
middleware.ts (verifica sesión)
    ↓
❌ Sin sesión → Redirige a /auth/login
    ↓
Mostrar página de login
    ↓
Usuario hace clic: "Iniciar sesión con Google"
    ↓
redirectToAuthCodeFlow() → redirige a Google OAuth
    ↓
Usuario autoriza en Google
    ↓
Google redirige a /auth/callback?code=XXX
    ↓
exchangeCodeForSession() → Supabase canjea código por token
    ↓
Supabase retorna access_token + refresh_token
    ↓
middleware.ts → setSession() → Establece cookie de sesión
    ↓
Redirige a / (home)
    ↓
middleware.ts (verifica sesión) → ✅ Válida
    ↓
Renderiza AppShell con usuario autenticado
```

---

## Componentes Principales

### 1. Middleware (`src/middleware.ts`)

**Responsabilidad:** Proteger rutas y manejar sesiones

```typescript
// Ruta pública (no requiere autenticación)
const publicRoutes = ['auth/login', 'auth/error', 'auth/callback']

// Si la ruta es privada y no hay sesión
// → Redirige a /auth/login
```

**Rutas Protegidas:**
- `/` (home)
- `/dashboard` (y submódulos)
- Todas excepto `/auth/*`

**Rutas Públicas:**
- `/auth/login`
- `/auth/callback`
- `/auth/error`

---

### 2. Página de Login (`src/app/auth/login/page.tsx`)

**Responsabilidad:** Mostrar UI de login y manejar OAuth

**Flujo:**
1. Renderiza botón "Iniciar sesión con Google"
2. Al hacer clic, llama `redirectToAuthCodeFlow()` de Supabase
3. Supabase redirige a Google OAuth

**Variables de Entorno Necesarias:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 3. Callback Route (`src/app/auth/callback/route.ts`)

**Responsabilidad:** Canjear código de autorización por token

**Flujo:**
1. Google redirige aquí con parámetro `code=XXX`
2. Usa `exchangeCodeForSession()` de Supabase
3. Supabase verifica el código con Google
4. Si es válido, retorna tokens
5. Establece cookies seguras (HTTP-only)
6. Redirige a `/` (home)

**Nota:** Este es un API route (server-side), no expone tokens en cliente

---

### 4. Hook useAuth (`src/hooks/useAuth.ts`)

**Responsabilidad:** Proporcionar estado del usuario a componentes

**API:**
```typescript
const { user, profile, loading, error, logout } = useAuth()

// user: Usuario de auth.users (id, email, etc)
// profile: Usuario de usuarios_club (nombre, apellido, rol, etc)
// loading: boolean durante carga inicial
// error: string | null si hay error
// logout: () => Promise<void>
```

**Características:**
- Carga usuario en `useEffect` al montar
- Se suscribe a cambios de autenticación
- Auto-carga perfil de usuario de base de datos
- Sincroniza estado entre pestañas (opcional, con eventos)

---

### 5. AppShell Actualizado (`src/components/AppShell.tsx`)

**Cambios:**
- Importa y usa hook `useAuth()`
- Muestra datos reales del usuario (nombre, apellido, rol)
- Botón de logout funcional
- Avatar con iniciales dinámicas

**Datos que Muestra:**
```
┌─ Topbar ─────────────────┐
│ Dashboard    👤 Juan García    Logout
│               Administrador
└───────────────────────────┘
```

---

### 6. Página Principal (`src/app/page.tsx`)

**Cambios:**
- Verifica autenticación antes de renderizar
- Redirige a login si no está autenticado
- Muestra loader mientras verifica
- Solo renderiza AppShell si está autenticado

**Estados:**
1. `loading === true` → Mostrar loader
2. `loading === false && !user` → Redirige a login
3. `loading === false && user` → Renderiza AppShell

---

## Flujo de Tokens

### Access Token
- **Propósito:** Autorizar requests a Supabase API
- **Duración:** ~3600 segundos (1 hora)
- **Almacenamiento:** Cookie (HTTP-only, segura)
- **Refresh:** Automático antes de expirar

### Refresh Token
- **Propósito:** Obtener nuevo access token sin re-login
- **Duración:** ~604800 segundos (7 días)
- **Almacenamiento:** Cookie (HTTP-only, segura)
- **Uso:** Automático en middleware

### Cookie de Sesión
- **Nombre:** `sb-[project-id]-auth-token`
- **Seguridad:** HTTP-only (no accesible desde JS)
- **HTTPS Only:** Sí (segura en producción)
- **SameSite:** Strict (previene CSRF)

---

## Row Level Security (RLS)

### Estructura

```sql
-- Tabla usuarios_club
CREATE TABLE usuarios_club (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  nombre TEXT,
  apellido TEXT,
  rol TEXT CHECK (rol IN ('admin', 'tesorero', 'secretario', 'viewer')),
  club_id UUID
);

-- Habilitar RLS
ALTER TABLE usuarios_club ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Usuarios ven su propio perfil"
  ON usuarios_club
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON usuarios_club
  FOR UPDATE
  USING (auth.uid() = id);
```

### Otras Tablas

```
socios          → RLS habilitado (filtrado por club_id)
recursos        → RLS habilitado (filtrado por club_id)
reservas        → RLS habilitado (filtrado por club_id)
facturas        → RLS habilitado (filtrado por club_id)
configuracion_bot → RLS habilitado (solo admins)
conversaciones_whatsapp → RLS habilitado (solo admins)
mensajes_whatsapp → RLS habilitado (solo admins)
```

### Cómo Funciona RLS

1. **Usuario hace request:** `GET /socios?club_id=123`
2. **Supabase verifica:** `auth.uid()` del usuario
3. **Supabase aplica política:** Solo retorna filas donde `club_id = usuario.club_id`
4. **Usuario solo ve sus datos:** Imposible ver datos de otros clubes

---

## Trigger de Auto-creación

```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios_club (
    id,
    email,
    nombre,
    apellido,
    rol,
    club_id
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    'viewer',  -- Rol por defecto
    NULL       -- Club asignado en onboarding
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**¿Qué hace?**
- Cuando alguien se registra en `auth.users`
- Automáticamente se crea su perfil en `usuarios_club`
- Con rol `viewer` por defecto
- Admin puede cambiar rol luego

---

## Variables de Entorno Necesarias

### Públicas (seguras de exponer)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Privadas (solo en servidor)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Opcional, para admin operations
```

**Nota:** Las claves públicas NO pueden hacer cambios directos. Solo pueden:
- Leer datos públicos
- Hacer operaciones respetando RLS
- Acceder a datos que la política RLS permite

---

## Seguridad

### Lo que Está Protegido

✅ Tokens no se exponen en URLs  
✅ Tokens almacenados en cookies HTTP-only  
✅ CSRF protection automática (SameSite cookies)  
✅ XSS protection (tokens en cookies, no en localStorage)  
✅ Datos privados protegidos por RLS  
✅ Tokens se refrescan automáticamente  
✅ Sessions duran máximo 7 días  

### Lo que NO Está Protegido (Todavía)

❌ Rate limiting (se recomienda agregar)  
❌ Verificación de email (se saltó en dev)  
❌ 2FA (se puede agregar después)  
❌ Detección de dispositivos (se puede agregar)  

---

## Cómo Usarlo en Componentes

### Para Proteger un Componente

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'

export function AdminPanel() {
  const { profile, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (profile?.rol !== 'admin') {
    return <div>No tienes permisos</div>
  }
  
  return <div>Panel de Admin</div>
}
```

### Para Hacer Queries Protegidas

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function SociosList() {
  const { user } = useAuth()
  const supabase = createClient()
  
  useEffect(() => {
    if (!user) return
    
    // RLS automáticamente filtra por club_id del usuario
    supabase
      .from('socios')
      .select('*')
      .then(({ data }) => console.log(data))
  }, [user])
}
```

---

## Diagrama de Componentes

```
middleware.ts (Next.js)
    ↓
src/app/page.tsx (Client Component)
    ↓
   ┌─────────────┬──────────────┐
   ↓             ↓              ↓
Landing.tsx  AppShell.tsx  useAuth() Hook
             ↓
    ┌─────────┬─────────┬──────────┐
    ↓         ↓         ↓          ↓
Sidebar  Topbar  Dashboard  Other Pages
         (usa profile       (usan useAuth)
          del hook)
```

---

## Next.js App Router + Supabase

### Client vs Server

| Operation | Client | Server |
|-----------|--------|--------|
| Leer datos | ✅ Sí (con RLS) | ✅ Sí |
| Crear datos | ✅ Sí (con RLS) | ✅ Sí |
| Borrar datos | ✅ Sí (con RLS) | ✅ Sí |
| Servir dinámicamente | ❌ No | ✅ Sí |
| Datos en URL | ❌ Expone | ✅ Seguro |

### Este Proyecto

- **Autenticación:** Server-side (middleware + callback route)
- **Operaciones de datos:** Client-side (con RLS)
- **Protección de rutas:** Server-side (middleware)
- **Estado de usuario:** Client-side (hook useAuth)

---

## Conclusión

La arquitectura implementada:
- ✅ Es segura (RLS, tokens seguros, middleware)
- ✅ Es escalable (soporta múltiples clubs)
- ✅ Sigue best practices de Next.js 15 + Supabase
- ✅ Prepara el camino para Fase 2 (datos reales)
- ✅ Lista para agregar más características

**Próximo paso:** Conectar la UI con datos reales de BD (Fase 2)
