-- =============================================
-- TABLA: usuarios_club
-- Almacena los usuarios del sistema con sus roles
-- =============================================

-- Crear tabla usuarios_club vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.usuarios_club (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  avatar_url TEXT,
  rol TEXT NOT NULL DEFAULT 'viewer' CHECK (rol IN ('admin', 'tesorero', 'secretario', 'viewer')),
  club_id UUID, -- Para cuando tengamos multi-tenancy
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en usuarios_club
ALTER TABLE public.usuarios_club ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios_club
CREATE POLICY "usuarios_club_select_own" ON public.usuarios_club 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_club_insert_own" ON public.usuarios_club 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "usuarios_club_update_own" ON public.usuarios_club 
  FOR UPDATE USING (auth.uid() = id);

-- Admin puede ver todos los usuarios
CREATE POLICY "usuarios_club_admin_select_all" ON public.usuarios_club 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =============================================
-- TRIGGER: Auto-crear usuario al registrarse
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios_club (id, email, nombre, avatar_url, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', NULL),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', NULL),
    'admin' -- El primer usuario será admin por defecto
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, public.usuarios_club.nombre),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.usuarios_club.avatar_url),
    updated_at = NOW();
  
  RETURN new;
END;
$$;

-- Eliminar trigger existente si existe y crear nuevo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Habilitar RLS en tablas existentes
-- =============================================

-- Socios
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socios_authenticated_read" ON public.socios 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "socios_authenticated_insert" ON public.socios 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "socios_authenticated_update" ON public.socios 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "socios_authenticated_delete" ON public.socios 
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretario')
    )
  );

-- Recursos
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recursos_authenticated_read" ON public.recursos 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "recursos_authenticated_write" ON public.recursos 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'tesorero')
    )
  );

-- Reservas
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservas_authenticated_read" ON public.reservas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reservas_authenticated_insert" ON public.reservas 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "reservas_authenticated_update" ON public.reservas 
  FOR UPDATE TO authenticated USING (true);

-- Facturas
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturas_authenticated_read" ON public.facturas 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "facturas_authenticated_write" ON public.facturas 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'tesorero')
    )
  );

-- Configuracion Bot
ALTER TABLE public.configuracion_bot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_bot_authenticated_read" ON public.configuracion_bot 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "config_bot_admin_write" ON public.configuracion_bot 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Conversaciones WhatsApp
ALTER TABLE public.conversaciones_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_whatsapp_authenticated_read" ON public.conversaciones_whatsapp 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "conv_whatsapp_authenticated_write" ON public.conversaciones_whatsapp 
  FOR ALL TO authenticated USING (true);

-- Mensajes WhatsApp
ALTER TABLE public.mensajes_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_whatsapp_authenticated_read" ON public.mensajes_whatsapp 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "msg_whatsapp_authenticated_write" ON public.mensajes_whatsapp 
  FOR ALL TO authenticated USING (true);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_club_email ON public.usuarios_club(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_club_rol ON public.usuarios_club(rol);
