-- Migration: initial_schema_multitenant
-- Criada em: 2026-03-31
-- Projeto Supabase: ajggojpmtckfbgujwsbe (festa-com-ia)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- professionals
create table professionals (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid,
  display_name text not null,
  business_name text not null,
  slug text,
  style_prompt text,
  tone_of_voice text,
  service_rules text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- clients
create table clients (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  source text default 'whatsapp',
  notes text,
  total_orders int not null default 0,
  total_spent numeric(10,2) not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  tags text[]
);

-- addresses
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  street text not null,
  neighborhood text,
  city text not null,
  state char(2) not null,
  zip_code text,
  complement text,
  reference text
);

-- products
create table products (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  name text not null,
  type text not null,
  subtype text,
  description text,
  base_price numeric(10,2),
  price_per_person numeric(10,2),
  min_people int,
  max_people int,
  prep_time_hours int,
  shelf_life_days int,
  available boolean not null default true,
  image_emoji text
);

-- ingredients
create table ingredients (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  cost_per_unit numeric(10,4)
);

-- conversations (antes de orders por causa do FK)
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  status text not null default 'nova',
  channel text not null default 'whatsapp',
  unread_count int not null default 0,
  last_message text,
  last_message_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  product_type text not null,
  product_subtype text,
  event_date date,
  delivery_datetime timestamptz,
  delivery_type text not null default 'retirada',
  delivery_address_id uuid references addresses(id) on delete set null,
  people_count int,
  observations text,
  internal_notes text,
  total_price numeric(10,2) not null default 0,
  status text not null default 'nao_confirmado',
  painel_status text not null default 'atendimento',
  last_message text,
  last_message_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- payments
create table payments (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  method text,
  status text not null default 'pendente',
  total_amount numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  due_amount numeric(10,2) not null default 0,
  deposit_percent int,
  deposit_paid_at timestamptz,
  full_paid_at timestamptz,
  notes text
);

-- messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  sender text not null,
  direction text not null default 'inbound',
  text text not null,
  status text not null default 'received',
  provider_message_id text,
  error_message text,
  sent_at timestamptz not null default now(),
  metadata jsonb
);

-- appointments
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  type text not null,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  duration_minutes int,
  confirmed boolean not null default false,
  color text
);

-- notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  order_id uuid references orders(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now()
);

-- business_config (1 por profissional)
create table business_config (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null unique references professionals(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  instagram text,
  address_id uuid references addresses(id) on delete set null,
  delivery_radius_km int,
  delivery_fee_per_km numeric(10,2),
  min_order_value numeric(10,2),
  default_deposit_percent int,
  min_advance_hours int,
  welcome_message text
);

-- business_hours
create table business_hours (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  business_config_id uuid not null references business_config(id) on delete cascade,
  day text not null,
  open time,
  close time,
  closed boolean not null default false
);

-- Indexes
create index idx_clients_professional_id on clients(professional_id);
create index idx_clients_phone on clients(phone);
create index idx_conversations_professional_id on conversations(professional_id);
create index idx_conversations_client_id on conversations(client_id);
create index idx_conversations_status on conversations(status);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_professional_id on messages(professional_id);
create index idx_orders_professional_id on orders(professional_id);
create index idx_orders_client_id on orders(client_id);
create index idx_orders_conversation_id on orders(conversation_id);
create index idx_orders_painel_status on orders(painel_status);
create index idx_notifications_professional_id on notifications(professional_id);
create index idx_notifications_read on notifications(read);
