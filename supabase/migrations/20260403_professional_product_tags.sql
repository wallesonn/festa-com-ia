-- Migration: professional_product_tags
-- Criada em: 2026-04-03

alter table if exists "festa-com-ia-professionals"
  add column if not exists product_subgroups text[] not null default '{}'::text[],
  add column if not exists product_variations text[] not null default '{}'::text[];
