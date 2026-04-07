-- =============================================
-- UPDATE: Agregar columna apellido a usuarios_club
-- y actualizar trigger para email/password auth
-- =============================================

-- Agregar columna apellido si no existe
ALTER TABLE public.usuarios_club 
ADD COLUMN IF NOT EXISTS apellido TEXT;

-- Actualizar función del trigger para soportar email/password
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios_club (id, email, nombre, apellido, avatar_url, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'first_name',
      new.raw_user_meta_data ->> 'name',
      NULL
    ),
    COALESCE(
      new.raw_user_meta_data ->> 'apellido',
      new.raw_user_meta_data ->> 'last_name',
      NULL
    ),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', NULL),
    'admin' -- El primer usuario sera admin por defecto
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(EXCLUDED.nombre, public.usuarios_club.nombre),
    apellido = COALESCE(EXCLUDED.apellido, public.usuarios_club.apellido),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.usuarios_club.avatar_url),
    updated_at = NOW();
  
  RETURN new;
END;
$$;
