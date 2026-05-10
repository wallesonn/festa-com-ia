-- Migration: order_silenced_until
-- Created at: 2026-05-09
-- Adds temporary painel silencing for orders.

alter table if exists orders
  add column if not exists silenced_until timestamptz;
