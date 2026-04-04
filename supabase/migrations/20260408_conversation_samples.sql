-- Adiciona campo para conversas de exemplo e remove tone_of_voice

alter table if exists public."festa-com-ia-professionals"
  add column if not exists conversation_samples text;

alter table if exists public."festa-com-ia-professionals"
  drop column if exists tone_of_voice;
