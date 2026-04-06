# Configuración de Google OAuth para Club Social OS

## Resumen

Para que la autenticación con Google funcione completamente, necesitas:
1. Crear un proyecto en Google Cloud Console
2. Obtener credenciales de OAuth 2.0
3. Configurar las credenciales en Supabase
4. Verificar que todo funcione

---

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto (nombre sugerido: `club-social-os`)
3. Esperar a que se cree el proyecto
4. Seleccionar el proyecto nuevo

---

## Paso 2: Habilitar Google+ API

1. En Google Cloud Console, ir a `APIs & Services` → `Library`
2. Buscar "Google+ API"
3. Hacer clic en el resultado
4. Hacer clic en el botón azul "Enable"
5. Esperar a que se habilite

---

## Paso 3: Crear OAuth 2.0 Credentials

1. Ir a `APIs & Services` → `Credentials`
2. Hacer clic en `+ Create Credentials` → `OAuth client ID`
3. Si pide crear una "OAuth consent screen" primero:
   - Hacer clic en `Configure Consent Screen`
   - Seleccionar `External` (si prefieres)
   - Llenar `App name`: "Club Social OS"
   - Llenar `User support email`: Tu email
   - Llenar `Developer contact`: Tu email
   - Hacer clic en `Save and Continue`
   - En siguiente pantallas, hacer clic en `Save and Continue` (sin llenar scopes)
   - Hacer clic en `Back to Dashboard`

4. Volver a crear OAuth Credentials:
   - Hacer clic en `+ Create Credentials` → `OAuth client ID`
   - Seleccionar `Web Application`
   - Nombre: "Club Social OS Web"
   - En `Authorized redirect URIs`, agregar:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback?provider=google
     ```
     (Reemplazar `YOUR_SUPABASE_PROJECT` con tu proyecto Supabase)
   - Si estás en desarrollo local, agregar también:
     ```
     http://localhost:3000/auth/callback
     ```
   - Hacer clic en `Create`

5. Copiar el `Client ID` y `Client Secret` que aparecen

---

## Paso 4: Encontrar tu URL de Supabase

1. Ir a [Supabase Dashboard](https://app.supabase.com/)
2. Seleccionar tu proyecto `club-social-os`
3. En la página de configuración, copiar la URL que se ve en el lado derecho
   - Debería verse algo como: `https://xxxxxxxxxxxx.supabase.co`

4. Construir el redirect URI completo:
   ```
   https://xxxxxxxxxxxx.supabase.co/auth/v1/callback?provider=google
   ```

---

## Paso 5: Configurar en Supabase

1. Ir a [Supabase Dashboard](https://app.supabase.com/)
2. Seleccionar tu proyecto
3. Ir a `Authentication` → `Providers`
4. Hacer clic en `Google`
5. Pegar el `Client ID` en el campo "Client ID"
6. Pegar el `Client Secret` en el campo "Client Secret"
7. Copiar los `Authorized redirect URIs` que Supabase proporciona y asegurarse de que estén en Google Cloud Console
8. Hacer clic en `Save`

---

## Paso 6: Verificar Configuración

1. Ir a Vercel y desplegar la aplicación (o ejecutar en local con `npm run dev`)
2. Acceder a `http://localhost:3000` (o tu URL en Vercel)
3. Debería redirigir automáticamente a `/auth/login`
4. Hacer clic en "Iniciar sesión con Google"
5. Debería abrirse ventana de Google para autorizar
6. Después de autorizar, debería redirigir al dashboard

---

## Troubleshooting

### Error: "Invalid client_id"
- Verificar que el `Client ID` esté correctamente copiado en Supabase
- Verificar que el proyecto en Google Cloud Console está habilitado (mira en APIs & Services)

### Error: "Redirect URI mismatch"
- Verificar que el redirect URI en Google Cloud Console coincida exactamente con el que usa Supabase
- Verificar que NO hay espacios en blanco al principio o final
- Verificar que el dominio es exacto (incluir `https://` y `/auth/v1/callback?provider=google`)

### La ventana de Google no abre
- Verificar que JavaScript está habilitado en el navegador
- Intentar con otro navegador
- Verificar que el popup no está bloqueado

### Después de autorizar, no redirige a la app
- Revisar la consola del navegador (F12 → Console) para errores
- Revisar los logs de Supabase (Authentication → Auth → Users) para ver si se creó el usuario
- Verificar que el URL de la app está correcto en Supabase Redirect URLs

---

## URLs de Redirect Necesarias en Google Cloud Console

### Producción (Vercel)
```
https://YOUR_VERCEL_DOMAIN.vercel.app/auth/callback
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback?provider=google
```

### Desarrollo Local
```
http://localhost:3000/auth/callback
https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback?provider=google
```

---

## Próximo Paso

Una vez que Google OAuth esté funcionando:
1. Prueba el flow completo de login
2. Verifica que el usuario se crea en la tabla `usuarios_club`
3. Verifica que logout funciona correctamente
4. Continúa con Fase 2: Conectar UI con base de datos real
