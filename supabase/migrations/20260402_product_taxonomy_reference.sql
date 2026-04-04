-- Migration: product_taxonomy_reference
-- Criada em: 2026-04-02
-- Tabela de referência operacional para grupos, subgrupos e variações de produto.

create extension if not exists "uuid-ossp";

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
