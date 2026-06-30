-- Migration: Add location fields to professionals table
-- Created at: 2026-06-10

ALTER TABLE "festa-com-ia-professionals"
ADD COLUMN IF NOT EXISTS location_state text,
ADD COLUMN IF NOT EXISTS location_city text,
ADD COLUMN IF NOT EXISTS location_street text,
ADD COLUMN IF NOT EXISTS location_latitude double precision,
ADD COLUMN IF NOT EXISTS location_longitude double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Adiciona comentários explicativos às novas colunas
COMMENT ON COLUMN "festa-com-ia-professionals".location_state IS 'Estado/UF opcional do estabelecimento';
COMMENT ON COLUMN "festa-com-ia-professionals".location_city IS 'Cidade opcional do estabelecimento';
COMMENT ON COLUMN "festa-com-ia-professionals".location_street IS 'Endereço completo opcional (rua, número, bairro) do estabelecimento';
COMMENT ON COLUMN "festa-com-ia-professionals".location_latitude IS 'Latitude opcional para cálculo futuro de distância e busca por proximidade';
COMMENT ON COLUMN "festa-com-ia-professionals".location_longitude IS 'Longitude opcional para cálculo futuro de distância e busca por proximidade';
COMMENT ON COLUMN "festa-com-ia-professionals".location_updated_at IS 'Data/hora da última atualização dos dados de localização';
