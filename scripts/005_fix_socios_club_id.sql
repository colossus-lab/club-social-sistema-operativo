-- =====================================================
-- FIX: Agregar club_id a tablas y actualizar RLS
-- Los socios son datos que los admins cargan, NO usuarios de auth
-- =====================================================

-- =====================================================
-- 1. TABLA SOCIOS - Agregar club_id
-- =====================================================

-- Agregar columna club_id si no existe
ALTER TABLE public.socios 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Agregar mas campos utiles para socios argentinos
ALTER TABLE public.socios 
ADD COLUMN IF NOT EXISTS apellido TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS fecha_alta DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS numero_socio TEXT; -- Numero interno del club

-- Indice para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_socios_club_id ON public.socios(club_id);
CREATE INDEX IF NOT EXISTS idx_socios_telefono ON public.socios(telefono);
CREATE INDEX IF NOT EXISTS idx_socios_dni ON public.socios(dni);
CREATE INDEX IF NOT EXISTS idx_socios_numero_socio ON public.socios(numero_socio);

-- Eliminar politicas anteriores de socios
DROP POLICY IF EXISTS socios_authenticated_read ON public.socios;
DROP POLICY IF EXISTS socios_authenticated_insert ON public.socios;
DROP POLICY IF EXISTS socios_authenticated_update ON public.socios;
DROP POLICY IF EXISTS socios_authenticated_delete ON public.socios;

-- Nuevas politicas: solo ver/editar socios del propio club
CREATE POLICY "socios_select_own_club" ON public.socios
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "socios_insert_own_club" ON public.socios
  FOR INSERT WITH CHECK (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "socios_update_own_club" ON public.socios
  FOR UPDATE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "socios_delete_own_club" ON public.socios
  FOR DELETE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretario')
    )
  );

-- =====================================================
-- 2. TABLA RECURSOS - Agregar club_id
-- =====================================================

ALTER TABLE public.recursos 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

ALTER TABLE public.recursos
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS capacidad INTEGER,
ADD COLUMN IF NOT EXISTS requiere_sena BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS porcentaje_sena INTEGER DEFAULT 50;

CREATE INDEX IF NOT EXISTS idx_recursos_club_id ON public.recursos(club_id);

-- Eliminar politicas anteriores
DROP POLICY IF EXISTS recursos_authenticated_read ON public.recursos;
DROP POLICY IF EXISTS recursos_authenticated_write ON public.recursos;

-- Nuevas politicas
CREATE POLICY "recursos_select_own_club" ON public.recursos
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "recursos_insert_own_club" ON public.recursos
  FOR INSERT WITH CHECK (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretario')
    )
  );

CREATE POLICY "recursos_update_own_club" ON public.recursos
  FOR UPDATE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretario')
    )
  );

CREATE POLICY "recursos_delete_own_club" ON public.recursos
  FOR DELETE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 3. TABLA RESERVAS - Agregar club_id
-- =====================================================

ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

ALTER TABLE public.reservas
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id); -- Quien creo la reserva

CREATE INDEX IF NOT EXISTS idx_reservas_club_id ON public.reservas(club_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON public.reservas(fecha);

-- Eliminar politicas anteriores
DROP POLICY IF EXISTS reservas_authenticated_read ON public.reservas;
DROP POLICY IF EXISTS reservas_authenticated_insert ON public.reservas;
DROP POLICY IF EXISTS reservas_authenticated_update ON public.reservas;

-- Nuevas politicas
CREATE POLICY "reservas_select_own_club" ON public.reservas
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "reservas_insert_own_club" ON public.reservas
  FOR INSERT WITH CHECK (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "reservas_update_own_club" ON public.reservas
  FOR UPDATE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "reservas_delete_own_club" ON public.reservas
  FOR DELETE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'secretario', 'tesorero')
    )
  );

-- =====================================================
-- 4. TABLA FACTURAS - Agregar club_id
-- =====================================================

ALTER TABLE public.facturas 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

ALTER TABLE public.facturas
ADD COLUMN IF NOT EXISTS numero_factura TEXT,
ADD COLUMN IF NOT EXISTS tipo_comprobante TEXT DEFAULT 'recibo', -- recibo, factura_c, etc
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_facturas_club_id ON public.facturas(club_id);
CREATE INDEX IF NOT EXISTS idx_facturas_socio_id ON public.facturas(socio_id);

-- Eliminar politicas anteriores
DROP POLICY IF EXISTS facturas_authenticated_read ON public.facturas;
DROP POLICY IF EXISTS facturas_authenticated_write ON public.facturas;

-- Nuevas politicas
CREATE POLICY "facturas_select_own_club" ON public.facturas
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "facturas_insert_own_club" ON public.facturas
  FOR INSERT WITH CHECK (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'tesorero')
    )
  );

CREATE POLICY "facturas_update_own_club" ON public.facturas
  FOR UPDATE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol IN ('admin', 'tesorero')
    )
  );

-- =====================================================
-- 5. CONVERSACIONES WHATSAPP - Agregar club_id
-- =====================================================

ALTER TABLE public.conversaciones_whatsapp 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conv_whatsapp_club_id ON public.conversaciones_whatsapp(club_id);
CREATE INDEX IF NOT EXISTS idx_conv_whatsapp_telefono ON public.conversaciones_whatsapp(telefono);

-- Eliminar politicas anteriores
DROP POLICY IF EXISTS conv_whatsapp_authenticated_read ON public.conversaciones_whatsapp;
DROP POLICY IF EXISTS conv_whatsapp_authenticated_write ON public.conversaciones_whatsapp;

-- Nuevas politicas
CREATE POLICY "conv_whatsapp_select_own_club" ON public.conversaciones_whatsapp
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "conv_whatsapp_all_own_club" ON public.conversaciones_whatsapp
  FOR ALL USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

-- =====================================================
-- 6. CONFIGURACION BOT - Agregar club_id
-- =====================================================

ALTER TABLE public.configuracion_bot 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_config_bot_club_id ON public.configuracion_bot(club_id);

-- Eliminar politicas anteriores
DROP POLICY IF EXISTS config_bot_authenticated_read ON public.configuracion_bot;
DROP POLICY IF EXISTS config_bot_admin_write ON public.configuracion_bot;

-- Nuevas politicas
CREATE POLICY "config_bot_select_own_club" ON public.configuracion_bot
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

CREATE POLICY "config_bot_all_admin" ON public.configuracion_bot
  FOR ALL USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.usuarios_club 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 7. RESUMEN DE MODELO DE DATOS
-- =====================================================
-- 
-- USUARIOS DE LA APP (usuarios_club):
--   - Son los administradores del club (admin, tesorero, secretario, viewer)
--   - Se autentican con email/password via Supabase Auth
--   - Cada uno pertenece a UN solo club
--
-- SOCIOS DEL CLUB (socios):
--   - Son los miembros del club (no tienen cuenta en la app)
--   - Interactuan SOLO via WhatsApp con el bot
--   - Los admins los cargan manualmente en el sistema
--   - Campos clave: telefono (para WhatsApp), dni, numero_socio
--
-- FLUJO:
--   1. Admin se registra en la app
--   2. Admin configura su club (wizard)
--   3. Admin carga la lista de socios
--   4. Socios interactuan via WhatsApp (consultas, pagos, reservas)
--   5. Admin ve todo en el dashboard
--
-- =====================================================
