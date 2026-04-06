# Checklist de Verificación - Fase 1

## Antes de Comenzar Fase 2

Asegúrate de que todos estos items funcionan correctamente:

### Autenticación
- [ ] Página de login es accesible en `/auth/login`
- [ ] El botón "Iniciar sesión con Google" abre popup de Google
- [ ] Después de autorizar, se redirige al dashboard
- [ ] El nombre y email del usuario aparecen en la topbar
- [ ] El avatar muestra las iniciales del usuario

### Protección de Rutas
- [ ] Si cierras sesión y vuelves a `/`, redirige a `/auth/login`
- [ ] No puedes acceder a `/` (home) sin estar autenticado
- [ ] Puedes acceder a `/auth/login` sin estar autenticado
- [ ] Las cookies se ven en DevTools → Application → Cookies

### Logout
- [ ] El botón de logout en topbar cierra sesión
- [ ] Después de logout, redirige a `/auth/login`
- [ ] Las cookies se borran después de logout

### Base de Datos
- [ ] La tabla `usuarios_club` existe en Supabase
- [ ] Cuando te registras con Google, se crea automáticamente un usuario en `usuarios_club`
- [ ] Puedes ver el usuario en Supabase Console → Table Editor → `usuarios_club`

### Row Level Security
- [ ] RLS está habilitado en todas las tablas:
  - [ ] `usuarios_club`
  - [ ] `socios`
  - [ ] `recursos`
  - [ ] `reservas`
  - [ ] `facturas`
  - [ ] `configuracion_bot`
  - [ ] `conversaciones_whatsapp`
  - [ ] `mensajes_whatsapp`
- [ ] Las políticas RLS están creadas y activas

### Ambiente de Desarrollo
- [ ] La aplicación compila sin errores
- [ ] No hay warnings en consola del navegador
- [ ] No hay warnings en logs del servidor (Vercel)

### Próximo: Fase 2 Ready
- [ ] Entiendes el flow de autenticación completo
- [ ] Sabes cómo usar el hook `useAuth()`
- [ ] Supabase está configurado correctamente
- [ ] Las credenciales de Google OAuth están en Supabase

---

## Cómo Verificar Cada Item

### Verificar que página de login es accesible
```bash
# En desarrollo
npm run dev
# Ir a http://localhost:3000/auth/login
```

### Verificar que usuario se crea en base de datos
```sql
-- En Supabase Console → SQL Editor
SELECT * FROM usuarios_club LIMIT 10;
```

### Verificar que RLS está habilitado
```sql
-- En Supabase Console → SQL Editor
-- Debería mostrar "Enabled"
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Verificar que políticas RLS existen
```sql
-- En Supabase Console → SQL Editor
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Verificar cookies de sesión
```javascript
// En consola del navegador (F12)
document.cookie
// Debería mostrar algo como:
// "sb-xxxxx-auth-token=..."
```

---

## Estado Post-Fase 1

La aplicación ahora tiene:

✅ **Seguridad**
- Autenticación con Google OAuth
- Sessions con tokens seguros
- Row Level Security en base de datos
- Protección de rutas con middleware

✅ **UX**
- Login page limpia
- Topbar con datos del usuario
- Logout funcional
- Loading state durante autenticación

✅ **Base de Datos**
- Tabla `usuarios_club` con estructura de roles
- RLS habilitado en todas las tablas
- Trigger para auto-crear usuarios
- Políticas de seguridad por rol

❌ **Todavía No Implementado**
- Conexión del frontend con datos reales de BD
- CRUD completo de socios en BD
- Cobro de cuotas conectado a BD
- Notificaciones de morosidad
- Módulo de contabilidad

---

## Errores Comunes

### "Failed to fetch" en login
**Causa:** Variables de entorno no configuradas
**Solución:** Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén en el `.env.local`

### "Unauthorized" después de login
**Causa:** RLS policy está bloqueando
**Solución:** Verificar que la política RLS en `usuarios_club` permite SELECT para usuarios autenticados

### Redirect loop (login → dashboard → login)
**Causa:** El hook `useAuth` no está cargando correctamente
**Solución:** Verificar en Supabase Console que la sesión existe, revisar console del navegador

### Google popup no abre
**Causa:** Pop-up blocker del navegador
**Solución:** Permitir pop-ups para este dominio en los settings del navegador

---

## Próximos Pasos

Una vez que Fase 1 esté totalmente verificada:

1. **Fase 2:** Conectar UI con base de datos real
   - Reemplazar datos mock de Zustand
   - Implementar queries con SWR + Supabase
   - CRUD completo de socios

2. **Fase 3:** WhatsApp Bot
   - Configurar credenciales
   - Probar webhook
   - Envío de facturas/recordatorios

3. **Fase 4:** Módulo Contable
   - Schema contable
   - Integración ARCA
   - Libros digitales IGJ

---

## Contacto/Soporte

Si tienes problemas:
1. Revisar los logs en Vercel Console
2. Revisar Supabase Console → Auth → Debug
3. Revisar la consola del navegador (F12 → Console)
4. Abrir issue en GitHub o contactar a ColossusLab.org
