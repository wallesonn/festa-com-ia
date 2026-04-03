-- Migration: professional_email_and_drop_profiles
-- Criada em: 2026-04-05

alter table if exists "festa-com-ia-professionals"
  add column if not exists email text;

do $$
begin
  if to_regclass('public.profiles') is not null then
    update "festa-com-ia-professionals" p
    set
      display_name = coalesce(p.display_name, pr.display_name, split_part(coalesce(pr.email, p.email, ''), '@', 1), 'Profissional'),
      business_name = coalesce(p.business_name, pr.business_name, pr.display_name, split_part(coalesce(pr.email, p.email, ''), '@', 1), 'Profissional'),
      phone = coalesce(p.phone, pr.phone),
      email = coalesce(p.email, pr.email),
      products_produced = coalesce(p.products_produced, pr.products_produced),
      onboarding_completed = coalesce(p.onboarding_completed, pr.onboarding_completed, false),
      updated_at = now()
    from profiles pr
    where p.auth_user_id = pr.id;

    insert into "festa-com-ia-professionals" (
      auth_user_id,
      display_name,
      business_name,
      phone,
      email,
      products_produced,
      onboarding_completed,
      status,
      created_at,
      updated_at
    )
    select
      pr.id,
      coalesce(pr.display_name, split_part(coalesce(pr.email, ''), '@', 1), 'Profissional'),
      coalesce(pr.business_name, pr.display_name, split_part(coalesce(pr.email, ''), '@', 1), 'Profissional'),
      pr.phone,
      pr.email,
      pr.products_produced,
      coalesce(pr.onboarding_completed, false),
      'active',
      pr.created_at,
      pr.updated_at
    from profiles pr
    where not exists (
      select 1
      from "festa-com-ia-professionals" p
      where p.auth_user_id = pr.id
    );

    drop table profiles;
  end if;
end $$;
