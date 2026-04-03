# Schema do Banco de Dados — Festa com IA

> Baseado nos tipos definidos em `lib/types.ts`.
>
> O modelo é **multi-tenant por profissional** e hoje está dividido em duas camadas:
>
> - **Supabase**: auth, `festa-com-ia-professionals` e tabela de regras
> - **Postgres local**: toda a operação do negócio (clientes, pedidos, conversas, mensagens etc.) e a referência global de taxonomia

---

## Estratégia multi-tenant

- No **Postgres local**, a tabela raiz operacional é `professionals`.
- Toda entidade operacional recebe `professional_id`.
- No **Supabase**, o vínculo com login acontece via `auth.users` + `festa-com-ia-professionals`.
- Os dados mockados podem ser usados como **seed inicial** por profissional.

## Escopo atual por banco

### Supabase

- `festa-com-ia-professionals` — cadastro do profissional/negócio, onboarding e taxonomia comercial
- `regras_criacao_tabelas` — tabela simples de referência e regras

### `festa-com-ia-professionals`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `auth_user_id` | `uuid` | vínculo com `auth.users.id` |
| `display_name` | `text` | nome exibido no painel |
| `business_name` | `text` | nome do negócio |
| `phone` | `text` | WhatsApp |
| `email` | `text` | nullable |
| `products_produced` | `text` | grupos produzidos pelo profissional, serializados pelo app |
| `product_subgroups` | `jsonb` | mapa de subgrupos por grupo de produto |
| `product_variations` | `jsonb` | mapa de variações por grupo de produto |
| `onboarding_completed` | `boolean` | concluiu primeiro acesso |
| `slug` | `text` | nullable, útil para URL |
| `style_prompt` | `text` | nullable |
| `tone_of_voice` | `text` | nullable |
| `service_rules` | `text` | nullable |
| `status` | `text` | active / paused / archived |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### Postgres local

- `professionals`
- `clients`
- `addresses`
- `products`
- `product_taxonomy_reference`
- `ingredients`
- `conversations`
- `orders`
- `payments`
- `messages`
- `appointments`
- `notifications`
- `business_config`
- `business_hours`

## Tabelas

As tabelas abaixo descrevem o **schema operacional do Postgres local**.

### `professionals`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `auth_user_id` | `uuid` | nullable, futuro vínculo com `auth.users.id` |
| `display_name` | `text` | nome exibido no painel |
| `business_name` | `text` | nome do negócio |
| `slug` | `text` | nullable, útil para subdomínio/URL |
| `style_prompt` | `text` | prompt manual com o jeito do profissional falar |
| `tone_of_voice` | `text` | ex: acolhedor, objetivo, formal |
| `service_rules` | `text` | regras de atendimento, prazos e limites |
| `status` | `text` | enum: active, paused, archived |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `clients`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | isolamento por profissional |
| `name` | `text` | |
| `phone` | `text` | ex: +55 11 99999-9999 |
| `email` | `text` | nullable |
| `source` | `text` | enum: whatsapp, instagram, indicação, site, outro |
| `notes` | `text` | alergias, preferências |
| `total_orders` | `int` | calculado ou desnormalizado |
| `total_spent` | `numeric(10,2)` | R$ |
| `last_order_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | |
| `tags` | `text[]` | ex: ['vip', 'alérgico a nozes'] |

---

### `addresses`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `client_id` | `uuid` FK → clients | nullable (pode ser endereço de entrega avulso) |
| `street` | `text` | ex: Rua das Flores, 123 |
| `neighborhood` | `text` | |
| `city` | `text` | |
| `state` | `char(2)` | ex: SP |
| `zip_code` | `text` | |
| `complement` | `text` | nullable |
| `reference` | `text` | nullable |

---

### `products`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `name` | `text` | ex: Bolo Red Velvet |
| `type` | `text` | enum: Bolo, Doces, Salgados, Refeição |
| `subtype` | `text` | ex: Red Velvet, Brigadeiro |
| `description` | `text` | |
| `base_price` | `numeric(10,2)` | R$ preço base |
| `price_per_person` | `numeric(10,2)` | R$ adicional por pessoa |
| `min_people` | `int` | |
| `max_people` | `int` | |
| `prep_time_hours` | `int` | horas de preparo |
| `shelf_life_days` | `int` | validade em dias |
| `allergens` | `text[]` | ex: ['glúten', 'lactose'] |
| `available` | `boolean` | |
| `image_emoji` | `text` | |

---

### `product_taxonomy_reference`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `product_group` | `text` | único por grupo de produto |
| `subgroups` | `text[]` | subgrupos padrão do grupo |
| `variations` | `text[]` | variações padrão do grupo |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

> Observação: a tabela guarda uma linha por grupo de produto e serve como referência global de taxonomia. As variações continuam sendo de nível de grupo, não de subgrupo.

---

### `ingredients`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `product_id` | `uuid` FK → products | |
| `name` | `text` | ex: Farinha de trigo |
| `quantity` | `text` | ex: 500g |
| `unit` | `text` | ex: g, ml, un, xícara |
| `cost_per_unit` | `numeric(10,4)` | R$ |

---

### `orders`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `client_id` | `uuid` FK → clients | |
| `conversation_id` | `uuid` FK → conversations | nullable, conversa de origem do pedido |
| `product_id` | `uuid` FK → products | nullable |
| `product_type` | `text` | enum: Bolo, Doces, Salgados, Refeição |
| `product_subtype` | `text` | ex: Chocolate, Coxinha |
| `event_date` | `date` | data do evento |
| `delivery_datetime` | `timestamptz` | data+hora da entrega/retirada |
| `delivery_type` | `text` | enum: entrega, retirada |
| `delivery_address_id` | `uuid` FK → addresses | nullable |
| `people_count` | `int` | |
| `observations` | `text` | alergias, preferências do cliente |
| `internal_notes` | `text` | notas internas da equipe |
| `total_price` | `numeric(10,2)` | R$ |
| `status` | `text` | enum: em_andamento, finalizado, cancelado, nao_confirmado |
| `painel_status` | `text` | enum: atendimento, agendado, preparando, pronto, entregue, cancelado |
| `last_message` | `text` | |
| `last_message_at` | `timestamptz` | |
| `archived_at` | `timestamptz` | nullable, arquivamento sem apagar |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### `payments`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `order_id` | `uuid` FK → orders | |
| `method` | `text` | enum: pix, cartao_credito, cartao_debito, dinheiro, transferencia |
| `status` | `text` | enum: pendente, parcial, pago, estornado |
| `total_amount` | `numeric(10,2)` | R$ valor total |
| `paid_amount` | `numeric(10,2)` | R$ já pago |
| `due_amount` | `numeric(10,2)` | R$ restante |
| `deposit_percent` | `int` | % de sinal (ex: 50) |
| `deposit_paid_at` | `timestamptz` | nullable |
| `full_paid_at` | `timestamptz` | nullable |
| `notes` | `text` | nullable |

---

### `conversations`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `client_id` | `uuid` FK → clients | |
| `status` | `text` | enum: nova, em_atendimento, aguardando, finalizada |
| `channel` | `text` | enum: whatsapp |
| `unread_count` | `int` | |
| `last_message` | `text` | |
| `last_message_at` | `timestamptz` | |
| `archived_at` | `timestamptz` | nullable, conversa arquivada sem exclusão |
| `created_at` | `timestamptz` | |

---

### `messages`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `conversation_id` | `uuid` FK → conversations | |
| `order_id` | `uuid` FK → orders | nullable |
| `sender` | `text` | enum: client, attendant |
| `direction` | `text` | enum: inbound, outbound |
| `text` | `text` | |
| `status` | `text` | enum: received, pending_send, sent, failed, retry_pending |
| `provider_message_id` | `text` | nullable |
| `error_message` | `text` | nullable |
| `sent_at` | `timestamptz` | timestamp do evento da mensagem |
| `metadata` | `jsonb` | nullable |

---

### `appointments`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `order_id` | `uuid` FK → orders | nullable |
| `client_id` | `uuid` FK → clients | nullable |
| `client_name` | `text` | nullable (para compromissos sem pedido) |
| `type` | `text` | enum: producao, entrega, retirada, reuniao, compras |
| `title` | `text` | |
| `description` | `text` | |
| `scheduled_at` | `timestamptz` | |
| `duration_minutes` | `int` | |
| `confirmed` | `boolean` | |
| `color` | `text` | hex ou classe de cor |

---

### `notifications`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `type` | `text` | enum: novo_pedido, mensagem, entrega_proxima, pagamento, alerta |
| `title` | `text` | |
| `body` | `text` | |
| `read` | `boolean` | |
| `order_id` | `uuid` FK → orders | nullable |
| `client_id` | `uuid` FK → clients | nullable |
| `created_at` | `timestamptz` | |

---

### `business_config`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | linha única (config global) |
| `professional_id` | `uuid` FK → professionals | linha única por profissional |
| `name` | `text` | nome do negócio |
| `phone` | `text` | |
| `email` | `text` | |
| `instagram` | `text` | nullable |
| `address_id` | `uuid` FK → addresses | endereço do negócio |
| `delivery_radius_km` | `int` | |
| `delivery_fee_per_km` | `numeric(10,2)` | R$ |
| `min_order_value` | `numeric(10,2)` | R$ |
| `default_deposit_percent` | `int` | % padrão de sinal |
| `min_advance_hours` | `int` | antecedência mínima para pedidos |
| `pix_key` | `text` | |
| `welcome_message` | `text` | msg automática de boas-vindas |

---

### `business_hours`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `business_config_id` | `uuid` FK → business_config | |
| `day` | `text` | enum: seg, ter, qua, qui, sex, sab, dom |
| `open` | `time` | ex: 09:00 |
| `close` | `time` | ex: 18:00 |
| `closed` | `boolean` | |

---

## Seed inicial a partir dos mocks

Os dados mockados em `lib/mockData.ts` continuam servindo como base para o seed automatizado em `scripts/seed.ts`, que popula o Postgres local com uma empresa de demonstração.

### Estratégia aplicada

- criar pelo menos 1 profissional demo no seed
- usar `getOrders()` como base para `clients`, `orders`, `payments` e `messages`
- usar `getConversations()` como base para `conversations`
- usar `generateMessages(orderId)` para popular o histórico da conversa em `messages`
- deduplicar clientes por `phone` dentro do mesmo `professional_id`
- derivar `products` a partir de `productType` + `productSubtype` presentes nos mocks

### Observação para múltiplos profissionais

Para testar o comportamento multi-tenant, o seed pode ser repetido para mais de um profissional, alterando apenas:

- `professionals.id`
- `professionals.business_name`
- `business_config`
- os `professional_id` de todas as linhas geradas

Assim, o mesmo conjunto de mocks pode servir como:

- demo inicial da aplicação
- massa de testes
- base para validar isolamento por profissional

---

## Relacionamentos principais

```
professionals ──< clients ──< addresses
      ├──< products ──< ingredients
      ├──< conversations ──< messages
      ├──< conversations ──< orders ──< payments
      ├──< orders ──< appointments
      ├──< notifications
      └──< business_config ──< business_hours
                         ──> addresses
```
