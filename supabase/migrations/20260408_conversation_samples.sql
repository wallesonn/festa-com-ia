-- Adiciona campo para conversas de exemplo

alter table if exists public."festa-com-ia-professionals"
  add column if not exists conversation_samples text;
