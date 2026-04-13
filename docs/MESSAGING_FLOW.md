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

> ⚠️ **Importante:** o app **já insere** a mensagem no Postgres com `status = 'pending_send'` antes de chamar o webhook. O n8n **não deve inserir** uma nova linha — deve apenas enviar ao WhatsApp e **atualizar** o registro existente.

**Payload recebido pelo webhook n8n (enviado pelo app):**

```json
{
  "messageId": "uuid-da-mensagem-já-inserida",
  "conversationId": "uuid",
  "orderId": "uuid ou null",
  "professionalId": "uuid",
  "text": "Texto da resposta",
  "sender": "attendant",
  "direction": "outbound"
}
```

**O que o n8n deve fazer após enviar ao WhatsApp:**

```sql
-- Marcar como enviado e registrar o ID do WhatsApp
UPDATE messages
SET
  status               = 'sent',
  provider_message_id  = '<id retornado pelo WhatsApp>',
  sent_at              = now()
WHERE id = '<messageId recebido no payload>';
```

**Em caso de falha no envio ao WhatsApp:**

```sql
UPDATE messages
SET status = 'failed', error_message = '<descrição do erro>'
WHERE id = '<messageId recebido no payload>';
```

---

## Configuração do n8n

### Responsabilidades do n8n

O n8n executa **dois workflows**:

**Workflow 1 — Inbound** (WhatsApp → Postgres)
- Recebe mensagem do cliente via provider WhatsApp
- Resolve `conversation_id` pelo telefone do cliente (busca no Postgres)
- Chama IA para gerar 3 sugestões de resposta
- Grava mensagem + sugestões em `messages` e atualiza `conversations`
- O SQL exato está na seção [Contrato com o n8n](#contrato-com-o-n8n) acima

**Workflow 2 — Outbound** (App → WhatsApp → Postgres)
- Recebe `POST /webhook/send-message` do app (a mensagem já foi gravada com `pending_send`)
- Busca o telefone do cliente via `conversation_id` no Postgres
- Envia a mensagem pelo provider WhatsApp
- Atualiza `messages.status` para `sent` (ou `failed`) conforme resultado
- O SQL exato está na seção [Contrato com o n8n](#contrato-com-o-n8n) acima

---

### Docker — adicionar n8n ao stack

O n8n deve estar nas redes `web` (Traefik) e `internal` (Postgres). Adicione ao `docker-compose.yml` do stack:

```yaml
  n8n:
    image: n8nio/n8n:latest
    container_name: festa-n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=${N8N_DOMAIN:-n8n.festacomia.pro}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_DOMAIN:-n8n.festacomia.pro}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB:-festacomia}
      - DB_POSTGRESDB_USER=${POSTGRES_USER:-festacomia}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY:?N8N_ENCRYPTION_KEY is required}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - web
      - internal
    depends_on:
      - postgres
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.festa-n8n.rule=Host(`${N8N_DOMAIN:-n8n.festacomia.pro}`)"
      - "traefik.http.routers.festa-n8n.entrypoints=websecure"
      - "traefik.http.routers.festa-n8n.tls=true"
      - "traefik.http.routers.festa-n8n.tls.certresolver=lets-encrypt"
      - "traefik.http.services.festa-n8n.loadbalancer.server.port=5678"
```

Adicione o volume ao bloco `volumes:`:
```yaml
volumes:
  postgres_data:
  redis_data:
  n8n_data:
```

---

### Variáveis adicionais no Portainer

Adicione ao `portainer.env.example` (e ao Portainer):

```
# Domínio público do n8n (roteado pelo Traefik)
N8N_DOMAIN=n8n.festacomia.pro

# Chave de criptografia do n8n — gere com: openssl rand -hex 32
N8N_ENCRYPTION_KEY=<chave-aleatória-32-bytes>

# N8N_WEBHOOK_URL já configurada acima, usando o container name na rede Docker:
N8N_WEBHOOK_URL=http://n8n:5678/webhook/send-message
```

> **`N8N_WEBHOOK_URL`** usa `http://n8n:5678` (rede interna Docker) — sem Traefik, comunicação direta entre containers.

---

### Conexão do n8n com o Postgres

No n8n, ao criar uma credencial Postgres, use:

| Campo | Valor |
|-------|-------|
| Host | `postgres` (nome do container na rede `internal`) |
| Porta | `5432` |
| Database | `festacomia` |
| Usuário | `festacomia` |
| Senha | mesma do `POSTGRES_PASSWORD` |

> O n8n usa o mesmo banco Postgres da aplicação — tabelas `messages`, `conversations`, `clients`, `professionals`.

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
| 3 | Polling: hook React para atualizar mensagens a cada 15–30s | ✅ Concluído | `app/painel/actions.ts`, `lib/hooks/useConversationPolling.ts` |
| 4 | UI — leitura: `PainelCard` com mensagens reais + sugestões | ✅ Concluído | `lib/types.ts`, `lib/db/mappers.ts`, `components/painel/PainelCard.tsx` |
| 5 | Envio: server action grava no Postgres + chama webhook n8n | ✅ Concluído | `app/painel/actions.ts` |
| 6 | UI — envio: campo de resposta integrado com server action | ✅ Concluído | `components/painel/PainelCard.tsx`, `components/painel/PainelBoard.tsx` |
| 7 | Config: `N8N_WEBHOOK_URL` no docker-compose e Portainer | ✅ Concluído | `festa-com-ia-dockercompose/docker-compose.yml`, `portainer.env.example`, `env.local.example` |

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

---

## Polling — detalhes de implementação (Etapa 3)

### Server action (`app/painel/actions.ts`)

```typescript
// Busca as últimas 10 mensagens de uma conversa e retorna em ordem cronológica (ASC)
fetchConversationMessages(conversationId: string): Promise<ChatMessage[]>
```

- Chama `getLastMessagesByConversation` (query do Postgres)
- Mapeia `DbMessageRow` → `ChatMessage` incluindo `suggestions`
- Inverte a ordem (DESC do banco → ASC para exibição)

### Hook (`lib/hooks/useConversationPolling.ts`)

```typescript
useConversationPolling(
  conversationId: string | null,
  intervalMs?: number  // padrão: 15_000ms (15s)
): { messages: ChatMessage[], isLoading: boolean }
```

**Comportamento:**
- Faz uma busca imediata ao receber um `conversationId`
- Repete a busca a cada `intervalMs` milissegundos
- Para automaticamente quando `conversationId` é `null`
- Cancela requisições em andamento ao desmontar ou trocar de conversa
- Em caso de erro, mantém silenciosamente as mensagens anteriores

**Uso previsto no `PainelCard` (Etapa 4):**

```typescript
const { messages, isLoading } = useConversationPolling(
  expanded ? order.conversationId : null
)
```
