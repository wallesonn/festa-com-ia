-- Schema final operacional do Postgres local
-- Consolida o schema que a aplicação realmente usa em produção/VPS.

create extension if not exists "uuid-ossp";

create table professionals (
  id uuid primary key default uuid_generate_v4(),
  phone text not null unique,
  business_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table ingredients (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  cost_per_unit numeric(10,4)
);

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
  metadata jsonb,
  suggestions jsonb
);

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

create table business_hours (
  id uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references professionals(id) on delete cascade,
  business_config_id uuid not null references business_config(id) on delete cascade,
  day text not null,
  open time,
  close time,
  closed boolean not null default false
);

create table if not exists product_taxonomy_reference (
  id uuid primary key default uuid_generate_v4(),
  product_group text not null unique,
  subgroups text[] not null default '{}'::text[],
  variations text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into product_taxonomy_reference (product_group, subgroups, variations)
values
  (
    'Bolo',
    ARRAY['Tradicional', 'Recheado', 'Decorado', 'Naked Cake', 'Mini bolo']::text[],
    ARRAY[
      'Receita tradicional',
      'Massa de chocolate',
      'Recheio trufado',
      'Cobertura de chantilly',
      'Cobertura de ganache',
      'Massa fofinha',
      'Massa branca',
      'Massa de cenoura',
      'Toque cítrico',
      'Finalização com granulado',
      'Recheio de frutas vermelhas',
      'Camadas duplas',
      'Acabamento rústico',
      'Decoração com drip',
      'Borda artesanal'
    ]::text[]
  ),
  (
    'Doces',
    ARRAY['Brigadeiros', 'Docinhos de festa', 'Doces finos', 'Sobremesas', 'Copinhos']::text[],
    ARRAY[
      'Docinho tradicional',
      'Coco ralado fino',
      'Castanha',
      'Chocolate ao leite',
      'Chocolate meio amargo',
      'Creme de leite ninho',
      'Maracujá cremoso',
      'Morango fresco',
      'Doce de leite cremoso',
      'Nozes picadas',
      'Pó dourado',
      'Papel arroz',
      'Acabamento premium',
      'Recheio aerado',
      'Bocado gourmet'
    ]::text[]
  ),
  (
    'Salgados',
    ARRAY['Fritos', 'Assados', 'Mini porções', 'Gourmet', 'Kits de salgados']::text[],
    ARRAY[
      'Salgado tradicional',
      'Massa assada',
      'Massa frita',
      'Recheio de frango',
      'Recheio de carne',
      'Queijo cremoso',
      'Catupiry',
      'Temperinho caseiro',
      'Empanado leve',
      'Tamanho coquetel',
      'Porção individual',
      'Porção para cento',
      'Finalização dourada',
      'Serviço misto',
      'Sabor intenso'
    ]::text[]
  ),
  (
    'Refeição',
    ARRAY['Feijoadas', 'Tortas', 'Lasanhas', 'Pratos executivos', 'Pratos caseiros']::text[],
    ARRAY[
      'Prato tradicional',
      'Arroz temperado',
      'Feijão encorpado',
      'Molho caseiro',
      'Proteína grelhada',
      'Proteína desfiada',
      'Acompanha salada',
      'Acompanha farofa',
      'Porção individual',
      'Travessa familiar',
      'Temperos suaves',
      'Temperos marcantes',
      'Montagem executiva',
      'Pronto para aquecer',
      'Serviço completo'
    ]::text[]
  )
on conflict (product_group) do update
set
  subgroups = excluded.subgroups,
  variations = excluded.variations,
  updated_at = now();

create index if not exists idx_clients_professional_id on clients(professional_id);
create index if not exists idx_clients_phone on clients(phone);
create index if not exists idx_conversations_professional_id on conversations(professional_id);
create index if not exists idx_conversations_client_id on conversations(client_id);
create index if not exists idx_conversations_status on conversations(status);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_professional_id on messages(professional_id);
create index if not exists idx_orders_professional_id on orders(professional_id);
create index if not exists idx_orders_client_id on orders(client_id);
create index if not exists idx_orders_conversation_id on orders(conversation_id);
create index if not exists idx_orders_painel_status on orders(painel_status);
create index if not exists idx_notifications_professional_id on notifications(professional_id);
create index if not exists idx_notifications_read on notifications(read);
