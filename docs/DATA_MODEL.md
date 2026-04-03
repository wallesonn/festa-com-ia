# Modelo de Dados — Festa com IA

> A camada operacional já lê dados do Postgres local.
>
> Os mocks em `lib/mockData.ts` continuam existindo como fallback visual e base de seed.
>
> A arquitetura atual está separada em duas camadas:
>
> - **Supabase**: auth e `festa-com-ia-professionals` (onboarding, perfil e taxonomia do profissional)
> - **Postgres local**: todas as tabelas operacionais do negócio e a referência global de taxonomia

---

## Tipos (`lib/types.ts`)

### `Order`
Representa um pedido de cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador único |
| `clientName` | `string` | Nome do cliente |
| `productType` | `ProductType` | Tipo de produto |
| `eventDate` | `string` (ISO) | Data do evento (legado) |
| `deliveryDatetime` | `string` (ISO) | Data e hora da entrega |
| `peopleCount` | `number` | Quantidade de pessoas |
| `status` | `OrderStatus` | Status geral do pedido |
| `painelStatus` | `PainelStatus` | Etapa no Kanban do Painel |
| `lastMessage` | `string` | Texto da última mensagem |
| `lastMessageAt` | `string` (ISO) | Timestamp da última mensagem |
| `messages` | `ChatMessage[]` | Histórico de mensagens |

### `ChatMessage`
Mensagem individual de uma conversa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador único |
| `sender` | `MessageSender` | Quem enviou (`client` ou `attendant`) |
| `text` | `string` | Texto da mensagem |
| `at` | `string` (ISO) | Timestamp do envio |

### `Conversation`
Conversa independente (legado, não usado no Painel atual).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador único |
| `clientName` | `string` | Nome do cliente |
| `lastMessage` | `string` | Última mensagem |
| `timestamp` | `string` (ISO) | Timestamp da última mensagem |
| `status` | `ConversationStatus` | Status da conversa |

### `festa-com-ia-professionals`
Cadastro do profissional no Supabase, usado por login, onboarding e taxonomia comercial.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador da linha |
| `auth_user_id` | `string` | vínculo com `auth.users` |
| `display_name` | `string` | nome exibido no painel |
| `business_name` | `string` | nome do negócio |
| `phone` | `string \| null` | WhatsApp |
| `email` | `string \| null` | email de contato |
| `products_produced` | `string[] \| string` | grupos selecionados pelo profissional |
| `product_subgroups` | `Record<string, string[]>` | subgrupos por grupo de produto |
| `product_variations` | `Record<string, string[]>` | variações por grupo de produto |
| `onboarding_completed` | `boolean` | marca o primeiro acesso como concluído |
| `status` | `string` | active / paused / archived |
| `created_at` | `string` | timestamp de criação |
| `updated_at` | `string` | timestamp de atualização |

### `product_taxonomy_reference`
Tabela de referência global no Postgres local, com um conjunto base por grupo de produto.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` | Identificador da linha |
| `product_group` | `ProductType` | grupo base da taxonomia |
| `subgroups` | `string[]` | subgrupos padrão do grupo |
| `variations` | `string[]` | variações padrão do grupo |
| `created_at` | `string` | timestamp de criação |
| `updated_at` | `string` | timestamp de atualização |

> Observação: as variações são de nível de grupo e não ficam vinculadas a um subgrupo específico.

---

## Enums e Union Types

### `PainelStatus`
Etapas do Kanban do Painel, em ordem:
```
atendimento → agendado → preparando → pronto → entregue
                                                    ↑ fim do fluxo normal
cancelado ← qualquer etapa (ação do usuário)
```

### `OrderStatus`
`em_andamento` | `finalizado` | `cancelado` | `nao_confirmado`

### `ProductType`
`Bolo` | `Doces` | `Salgados` | `Refeição`

### `MessageSender`
`client` | `attendant`

### `ConversationStatus`
`nova` | `em_atendimento` | `aguardando` | `finalizada`

### `UrgencyLevel`
Calculado a partir de `deliveryDatetime`:

| Nível | Condição | Cor |
|-------|----------|-----|
| `vermelho` | Menos de 2h para entrega | Vermelho vivo |
| `laranja` | Entre 2h e 24h | Âmbar |
| `verde` | Mais de 24h | Esmeralda |

---

## Funções de Mock (`lib/mockData.ts`)

| Função | Descrição |
|--------|-----------|
| `getOrders()` | Retorna array de 12 pedidos com dados mock para fallback/seed |
| `getConversations()` | Retorna array de 12 conversas mock para fallback/seed |
| `generateSuggestions(msg)` | Gera 3 sugestões de resposta baseadas no texto da mensagem |
| `generateMessages(orderId)` | Gera histórico de 5 mensagens para um pedido |

> Observação: estas funções continuam úteis para o frontend e para a geração de massa demo, mesmo após a migração da leitura principal para o Postgres local.

---

## Funções Utilitárias (`lib/utils.ts`)

| Função | Descrição |
|--------|-----------|
| `urgencyLevel(dt)` | Retorna `UrgencyLevel` baseado em horas até entrega |
| `urgencyBgClass(dt)` | Retorna classe Tailwind de cor de fundo por urgência |
| `fmtDatetime(iso)` | Formata data e hora para exibição (ex: `22/03 às 14h`) |
| `fmtTimeShort(iso)` | Formata apenas hora curta (ex: `14:35`) |
| `painelStatusLabel(status)` | Retorna label em português do `PainelStatus` |
