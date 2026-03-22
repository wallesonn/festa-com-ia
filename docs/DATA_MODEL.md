# Modelo de Dados — Festa com IA

> Dados atualmente em mock (`lib/mockData.ts`). Backend e banco de dados ainda não implementados.

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
`Bolo` | `Doces` | `Salgados` | `Kit Festa`

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
| `getOrders()` | Retorna array de 12 pedidos com dados mock |
| `getConversations()` | Retorna array de 12 conversas mock |
| `generateSuggestions(msg)` | Gera 3 sugestões de resposta baseadas no texto da mensagem |
| `generateMessages(orderId)` | Gera histórico de 5 mensagens para um pedido |

---

## Funções Utilitárias (`lib/utils.ts`)

| Função | Descrição |
|--------|-----------|
| `urgencyLevel(dt)` | Retorna `UrgencyLevel` baseado em horas até entrega |
| `urgencyBgClass(dt)` | Retorna classe Tailwind de cor de fundo por urgência |
| `fmtDatetime(iso)` | Formata data e hora para exibição (ex: `22/03 às 14h`) |
| `fmtTimeShort(iso)` | Formata apenas hora curta (ex: `14:35`) |
| `painelStatusLabel(status)` | Retorna label em português do `PainelStatus` |
