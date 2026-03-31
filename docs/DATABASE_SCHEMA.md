# Schema do Banco de Dados — Festa com IA

> Baseado nos tipos definidos em `lib/types.ts`. Pronto para mapear para PostgreSQL (Supabase) ou outro banco relacional.

---

## Tabelas

### `clients`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
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
| `name` | `text` | ex: Bolo Red Velvet |
| `type` | `text` | enum: Bolo, Doces, Salgados, Kit Festa |
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

### `ingredients`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
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
| `client_id` | `uuid` FK → clients | |
| `product_id` | `uuid` FK → products | nullable |
| `product_type` | `text` | enum: Bolo, Doces, Salgados, Kit Festa |
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
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### `payments`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
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
| `client_id` | `uuid` FK → clients | |
| `status` | `text` | enum: nova, em_atendimento, aguardando, finalizada |
| `channel` | `text` | enum: whatsapp |
| `unread_count` | `int` | |
| `last_message` | `text` | |
| `last_message_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

---

### `messages`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` FK → conversations | |
| `order_id` | `uuid` FK → orders | nullable |
| `sender` | `text` | enum: client, attendant |
| `text` | `text` | |
| `sent_at` | `timestamptz` | |

---

### `appointments`
| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | `uuid` PK | |
| `order_id` | `uuid` FK → orders | nullable |
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
| `business_config_id` | `uuid` FK → business_config | |
| `day` | `text` | enum: seg, ter, qua, qui, sex, sab, dom |
| `open` | `time` | ex: 09:00 |
| `close` | `time` | ex: 18:00 |
| `closed` | `boolean` | |

---

## Relacionamentos principais

```
clients ──< orders ──< payments
       ──< addresses
       ──< conversations ──< messages
orders ──< messages
       ──< appointments
       ──< notifications
products ──< ingredients
business_config ──< business_hours
                ──> addresses
```
