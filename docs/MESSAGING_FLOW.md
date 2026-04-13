# Fluxo de Mensagens — Festa com IA

> Implementação do fluxo real de mensagens WhatsApp integrado ao Painel via n8n e Postgres.

---

## Visão geral da arquitetura

```
WhatsApp
   │
   ▼
  n8n  ──────────────────────────────────────────────────────────────────┐
   │  • recebe mensagem inbound                                          │
   │  • gera 3 sugestões de resposta                                     │
   │  • grava em messages (inbound + suggestions)                        │
   │  • atualiza conversations (last_message, unread_count)              │
   ▼                                                                     │
Postgres (local, mesmo VPS)                                             │
   │                                                                     │
   ▼  polling 15–30s                                                     │
Aplicação Next.js (Painel)                                              │
   │  • exibe as 10 últimas mensagens no card                           │
   │  • exibe sugestões da última mensagem do cliente                   │
   │  • campo de resposta → POST webhook n8n ──────────────────────────┘
                                │
                                ▼
                              n8n → WhatsApp (outbound)
                                │
                                ▼
                      grava em messages (outbound, status: sent)
```

---

## Infraestrutura

| Serviço | Localização | Comunicação |
|---------|-------------|-------------|
| Aplicação Next.js | Container Docker, VPS | HTTP interno |
| n8n | Container Docker separado, mesmo VPS | Rede Docker interna |
| Postgres | Container Docker, mesmo VPS | Rede Docker interna |

- App → n8n: **POST webhook** (HTTP interno na rede Docker)
- n8n → App: **gravação direta no Postgres** (app faz polling)

---

## Schema — tabelas envolvidas

### `messages`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK | |
| `professional_id` | `uuid` FK → professionals | |
| `conversation_id` | `uuid` FK → conversations | |
| `order_id` | `uuid` FK → orders | nullable |
| `sender` | `text` | `client` ou `attendant` |
| `direction` | `text` | `inbound` ou `outbound` |
| `text` | `text` | conteúdo da mensagem |
| `status` | `text` | `received`, `pending_send`, `sent`, `failed` |
| `provider_message_id` | `text` | nullable — ID do WhatsApp |
| `error_message` | `text` | nullable |
| `sent_at` | `timestamptz` | timestamp do evento |
| `metadata` | `jsonb` | nullable — dados extras |
| `suggestions` | `jsonb` | **array com até 3 sugestões geradas pelo n8n** |

### `conversations`

Sem alteração de schema. Campos relevantes:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK | |
| `client_id` | `uuid` FK → clients | |
| `status` | `text` | `nova`, `em_atendimento`, `aguardando`, `finalizada` |
| `unread_count` | `int` | atualizado pelo n8n a cada mensagem recebida |
| `last_message` | `text` | texto da última mensagem |
| `last_message_at` | `timestamptz` | timestamp da última mensagem |

---

## Contrato com o n8n

### Mensagem recebida do WhatsApp (inbound)

O n8n deve inserir uma linha em `messages` e opcionalmente atualizar `conversations`:

```sql
-- 1. Inserir mensagem recebida
INSERT INTO messages (
  professional_id, conversation_id, order_id,
  sender, direction, text, status, sent_at
) VALUES (
  '<professional_id>', '<conversation_id>', '<order_id ou null>',
  'client', 'inbound', '<texto da mensagem>', 'received', now()
)
RETURNING id;

-- 2. Atualizar sugestões geradas (após processamento da IA)
UPDATE messages
SET suggestions = '["Sugestão 1", "Sugestão 2", "Sugestão 3"]'::jsonb
WHERE id = '<id da mensagem>';

-- 3. Atualizar conversa
UPDATE conversations
SET
  last_message     = '<texto da mensagem>',
  last_message_at  = now(),
  unread_count     = unread_count + 1
WHERE id = '<conversation_id>';
```

### Mensagem enviada pelo atendente (outbound)

O n8n recebe o webhook do app e após envio ao WhatsApp deve gravar:

```sql
INSERT INTO messages (
  professional_id, conversation_id, order_id,
  sender, direction, text, status,
  provider_message_id, sent_at
) VALUES (
  '<professional_id>', '<conversation_id>', '<order_id ou null>',
  'attendant', 'outbound', '<texto>',
  'sent', '<id retornado pelo WhatsApp>', now()
);
```

---

## Camada de dados — aplicação

### Tipos TypeScript (`lib/types.ts`)

```typescript
interface ChatMessage {
  id: string
  sender: 'client' | 'attendant'
  text: string
  at: string           // ISO
  suggestions?: string[] // apenas em mensagens do cliente, geradas pelo n8n
}
```

### Query de leitura (`lib/db/queries.ts`)

```typescript
// Busca as últimas N mensagens de uma conversa (padrão: 10)
getLastMessagesByConversation(conversationId: string, limit = 10): Promise<DbMessageRow[]>

// Tipo de retorno
type DbMessageRow = {
  id: string
  conversation_id: string
  order_id: string | null
  sender: string
  direction: string
  text: string
  status: string
  sent_at: string
  suggestions: string[] | null
}
```

### Carregamento via pedidos (`getOrdersWithPayments`)

Os pedidos carregados para o Painel já trazem as **últimas 10 mensagens** da conversa associada, incluindo `suggestions`, no campo `Order.messages`.

---

## Plano de implementação

| # | Etapa | Status | Arquivos modificados |
|---|-------|--------|----------------------|
| 1 | Schema: coluna `suggestions` em `messages` | ✅ Concluído | `supabase/schema/local_postgres_final.sql` |
| 2 | Leitura: queries e tipos TypeScript | ✅ Concluído | `lib/types.ts`, `lib/database.types.ts`, `lib/db/mappers.ts`, `lib/db/queries.ts` |
| 3 | Polling: hook React para atualizar mensagens a cada 15–30s | 🔲 Pendente | `lib/hooks/useConversationPolling.ts` (a criar) |
| 4 | UI — leitura: `PainelCard` com mensagens reais + sugestões | 🔲 Pendente | `components/painel/PainelCard.tsx` |
| 5 | Envio: server action grava no Postgres + chama webhook n8n | 🔲 Pendente | `app/painel/actions.ts` (a criar) |
| 6 | UI — envio: campo de resposta integrado com server action | 🔲 Pendente | `components/painel/PainelCard.tsx` |
| 7 | Config: `N8N_WEBHOOK_URL` no docker-compose e Portainer | 🔲 Pendente | `festa-com-ia-dockercompose/docker-compose.yml`, `portainer.env.example` |

---

## Variáveis de ambiente necessárias

| Variável | Descrição | Onde configurar |
|----------|-----------|-----------------|
| `N8N_WEBHOOK_URL` | URL interna do webhook n8n para envio de mensagens | Portainer + docker-compose |
| `DATABASE_URL` | Conexão Postgres (já existente) | Portainer + docker-compose |

---

## Notas de implementação

- O polling será feito apenas para o card atualmente expandido/aberto no Painel, evitando requisições desnecessárias.
- As sugestões exibidas na UI serão sempre as da **última mensagem do cliente** na conversa.
- O campo de envio do `PainelCard` continuará visualmente no mesmo lugar — apenas a lógica de envio mudará de mock para real.
- A coluna `suggestions` é `jsonb` no Postgres; o postgres.js a retorna como `string[]` quando o n8n gravar um array JSON de strings.
