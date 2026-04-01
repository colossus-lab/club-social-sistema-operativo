-- Club Social OS - Schema de Base de Datos
-- Migración inicial para el Bot de WhatsApp

-- =============================================
-- SOCIOS
-- =============================================
CREATE TABLE IF NOT EXISTS socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  telefono TEXT UNIQUE,
  categoria TEXT CHECK (categoria IN ('Activo', 'Vitalicio', 'Cadete', 'Becado')) DEFAULT 'Activo',
  estado TEXT CHECK (estado IN ('Al día', 'Moroso')) DEFAULT 'Al día',
  cuota_mensual INTEGER DEFAULT 5000,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECURSOS (Canchas, Quinchos, Salones)
-- =============================================
CREATE TABLE IF NOT EXISTS recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Deportivo', 'Eventos')) DEFAULT 'Deportivo',
  precio_hora INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESERVAS
-- =============================================
CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_id UUID REFERENCES recursos(id) ON DELETE SET NULL,
  socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
  reservado_por TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  estado TEXT CHECK (estado IN ('Pendiente Seña', 'Confirmada', 'Cancelada', 'Completada')) DEFAULT 'Pendiente Seña',
  sena_pagada INTEGER DEFAULT 0,
  monto_total INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FACTURAS
-- =============================================
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
  monto INTEGER NOT NULL,
  concepto TEXT NOT NULL,
  estado TEXT CHECK (estado IN ('Pendiente', 'Pagada', 'Vencida')) DEFAULT 'Pendiente',
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  pdf_url TEXT,
  enviada_whatsapp BOOLEAN DEFAULT false,
  wa_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONVERSACIONES WHATSAPP
-- =============================================
CREATE TABLE IF NOT EXISTS conversaciones_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono TEXT NOT NULL,
  socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
  nombre_contacto TEXT,
  ultimo_mensaje TEXT,
  estado_flujo TEXT DEFAULT 'menu_principal',
  contexto JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por teléfono
CREATE INDEX IF NOT EXISTS idx_conversaciones_telefono ON conversaciones_whatsapp(telefono);

-- =============================================
-- MENSAJES WHATSAPP (Log)
-- =============================================
CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID REFERENCES conversaciones_whatsapp(id) ON DELETE CASCADE,
  direccion TEXT CHECK (direccion IN ('entrante', 'saliente')) NOT NULL,
  contenido TEXT,
  tipo TEXT DEFAULT 'text',
  wa_message_id TEXT,
  estado TEXT DEFAULT 'enviado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por conversación
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes_whatsapp(conversacion_id);

-- =============================================
-- CONFIGURACIÓN DEL BOT
-- =============================================
CREATE TABLE IF NOT EXISTS configuracion_bot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion_bot (clave, valor, descripcion) VALUES
  ('mensaje_bienvenida', 'Hola! Soy el asistente virtual del Club Social OS. ¿En qué puedo ayudarte?', 'Mensaje inicial del bot'),
  ('horarios_atencion', 'Lunes a Viernes: 8:00 - 22:00, Sábados: 9:00 - 20:00, Domingos: 10:00 - 18:00', 'Horarios de atención'),
  ('cbu_transferencia', '0000003100000000000001', 'CBU para transferencias'),
  ('alias_transferencia', 'CLUB.SOCIAL.OS', 'Alias para transferencias')
ON CONFLICT (clave) DO NOTHING;

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para socios
DROP TRIGGER IF EXISTS update_socios_updated_at ON socios;
CREATE TRIGGER update_socios_updated_at
  BEFORE UPDATE ON socios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para conversaciones
DROP TRIGGER IF EXISTS update_conversaciones_updated_at ON conversaciones_whatsapp;
CREATE TRIGGER update_conversaciones_updated_at
  BEFORE UPDATE ON conversaciones_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================

-- Insertar socios de ejemplo
INSERT INTO socios (nombre, dni, telefono, categoria, estado, cuota_mensual, avatar) VALUES
  ('Carlos Gardel', '12345678', '1122334455', 'Vitalicio', 'Al día', 0, 'CG'),
  ('Lionel Messi', '33445566', '1133445566', 'Activo', 'Al día', 5000, 'LM'),
  ('Diego Maradona', '14222333', '1144556677', 'Activo', 'Moroso', 5000, 'DM'),
  ('Juan Riquelme', '45678901', '1155667788', 'Cadete', 'Moroso', 3000, 'JR'),
  ('Martin Palermo', '56789012', '1166778899', 'Vitalicio', 'Al día', 0, 'MP'),
  ('Carlos Tevez', '67890123', '1177889900', 'Becado', 'Al día', 0, 'CT')
ON CONFLICT (dni) DO NOTHING;

-- Insertar recursos de ejemplo
INSERT INTO recursos (nombre, tipo, precio_hora, activo) VALUES
  ('Cancha Papi Fútbol (Sintético)', 'Deportivo', 15000, true),
  ('Quincho Principal', 'Eventos', 25000, true),
  ('Cancha de Tenis', 'Deportivo', 8000, true),
  ('Salón de Eventos', 'Eventos', 35000, true)
ON CONFLICT DO NOTHING;
