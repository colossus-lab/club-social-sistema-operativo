-- =====================================================
-- Script 004: Crear tablas clubs y categorias_socios
-- =====================================================

-- 1. Crear tabla clubs
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos basicos
  nombre TEXT NOT NULL,
  nombre_legal TEXT,
  tipo TEXT NOT NULL DEFAULT 'deportivo' CHECK (tipo IN ('deportivo', 'social', 'cultural', 'vecinal', 'otro')),
  descripcion TEXT,
  logo_url TEXT,
  
  -- Ubicacion
  direccion TEXT,
  ciudad TEXT,
  provincia TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'Argentina',
  
  -- Contacto
  telefono TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  
  -- Legal/Fiscal (opcional)
  cuit TEXT,
  personeria_juridica TEXT,
  fecha_fundacion DATE,
  
  -- Configuracion
  moneda TEXT DEFAULT 'ARS',
  zona_horaria TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  setup_completado BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla categorias_socios
CREATE TABLE IF NOT EXISTS public.categorias_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cuota_mensual DECIMAL(10, 2) DEFAULT 0,
  edad_minima INTEGER,
  edad_maxima INTEGER,
  requiere_apto_medico BOOLEAN DEFAULT false,
  activa BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(club_id, nombre)
);

-- 3. Agregar FK de usuarios_club a clubs (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_usuarios_club_club'
  ) THEN
    ALTER TABLE public.usuarios_club 
    ADD CONSTRAINT fk_usuarios_club_club 
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Agregar columna categoria_id a socios (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'socios' AND column_name = 'categoria_id'
  ) THEN
    ALTER TABLE public.socios 
    ADD COLUMN categoria_id UUID REFERENCES public.categorias_socios(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Habilitar RLS en clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 6. Politicas RLS para clubs
DROP POLICY IF EXISTS "users_view_own_club" ON public.clubs;
CREATE POLICY "users_view_own_club" ON public.clubs
  FOR SELECT USING (
    id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "users_insert_club" ON public.clubs;
CREATE POLICY "users_insert_club" ON public.clubs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admins_update_own_club" ON public.clubs;
CREATE POLICY "admins_update_own_club" ON public.clubs
  FOR UPDATE USING (
    id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "admins_delete_own_club" ON public.clubs;
CREATE POLICY "admins_delete_own_club" ON public.clubs
  FOR DELETE USING (
    id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid() AND rol = 'admin')
  );

-- 7. Habilitar RLS en categorias_socios
ALTER TABLE public.categorias_socios ENABLE ROW LEVEL SECURITY;

-- 8. Politicas RLS para categorias_socios
DROP POLICY IF EXISTS "users_view_club_categorias" ON public.categorias_socios;
CREATE POLICY "users_view_club_categorias" ON public.categorias_socios
  FOR SELECT USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_insert_categorias" ON public.categorias_socios;
CREATE POLICY "admins_insert_categorias" ON public.categorias_socios
  FOR INSERT WITH CHECK (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "admins_update_categorias" ON public.categorias_socios;
CREATE POLICY "admins_update_categorias" ON public.categorias_socios
  FOR UPDATE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid() AND rol = 'admin')
  );

DROP POLICY IF EXISTS "admins_delete_categorias" ON public.categorias_socios;
CREATE POLICY "admins_delete_categorias" ON public.categorias_socios
  FOR DELETE USING (
    club_id IN (SELECT club_id FROM public.usuarios_club WHERE id = auth.uid() AND rol = 'admin')
  );

-- 9. Funcion para crear categorias por defecto
CREATE OR REPLACE FUNCTION public.crear_categorias_default(p_club_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categorias_socios (club_id, nombre, descripcion, cuota_mensual, edad_minima, edad_maxima, requiere_apto_medico, orden)
  VALUES
    (p_club_id, 'Activo', 'Socio pleno con voz y voto en asambleas', 15000, 18, NULL, false, 1),
    (p_club_id, 'Vitalicio', 'Socio honorario sin cuota', 0, NULL, NULL, false, 2),
    (p_club_id, 'Cadete', 'Jovenes de 13 a 17 anios', 8000, 13, 17, true, 3),
    (p_club_id, 'Infantil', 'Menores de 12 anios', 5000, 0, 12, true, 4),
    (p_club_id, 'Becado', 'Socio exento de cuota por beca', 0, NULL, NULL, false, 5),
    (p_club_id, 'Jubilado', 'Mayores de 60 anios con descuento', 7500, 60, NULL, false, 6),
    (p_club_id, 'Familiar', 'Cuota grupal para familia', 25000, NULL, NULL, false, 7)
  ON CONFLICT (club_id, nombre) DO NOTHING;
END;
$$;

-- 10. Indices para mejor performance
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON public.clubs(created_at);
CREATE INDEX IF NOT EXISTS idx_categorias_club_id ON public.categorias_socios(club_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_club_club_id ON public.usuarios_club(club_id);

-- 11. Trigger para updated_at en clubs
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categorias_updated_at ON public.categorias_socios;
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias_socios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
