-- Migration: professional_onboarding_completed
-- Criada em: 2026-04-04

alter table if exists "festa-com-ia-professionals"
  add column if not exists onboarding_completed boolean not null default false;
