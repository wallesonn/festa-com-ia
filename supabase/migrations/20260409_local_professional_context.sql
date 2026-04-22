-- Migration: local_professional_context
-- Criada em: 2026-04-09
-- Adiciona no Postgres local as colunas de contexto do profissional
-- sincronizadas a partir do Supabase (festa-com-ia-professionals).

alter table if exists professionals
  add column if not exists phone text,
  add column if not exists products_produced text,
  add column if not exists product_subgroups text[] not null default '{}'::text[],
  add column if not exists product_variations text[] not null default '{}'::text[],
  add column if not exists conversation_samples text;
