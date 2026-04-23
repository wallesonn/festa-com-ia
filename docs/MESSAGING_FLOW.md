# Fluxo de Mensagens — Festa com IA

> Fluxo operacional de mensagens WhatsApp via Uazapi integrado ao Painel por meio de n8n e Postgres, com IA orientada por histórico completo da conversa e contexto do profissional.

---

## Visão geral da arquitetura

```
WhatsApp
   │
   ▼
  n8n  ──────────────────────────────────────────────────────────────────┐
   │  • recebe mensagem inbound                                          │
   │  • identifica conversa ativa e cria nova conversa quando necessário │
   │  • gera 3 sugestões de resposta via DeepSeek                         │
   │  • grava em messages (inbound + suggestions)                        │
   │  • atualiza conversations (last_message, unread_count)              │
   ▼                                                                     │
Postgres (local, mesmo VPS)                                             │
   │                                                                     │
   ▼  polling 15–30s                                                     │
Aplicação Next.js (Painel)                                              │
   │  • exibe um histórico curto da conversa no card                     │
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

**Payload anonimizado recebido pelo Webhook do n8n (padrão Uazapi / Baileys):**

```json
[
  {
    "headers": {
      "host": "n8n.exemplo.com",
      "user-agent": "uazapiGO-Webhook/1.0",
      "content-length": "2540",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
      "x-forwarded-host": "n8n.exemplo.com",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
      "x-real-ip": "203.0.113.10"
    },
    "params": {},
    "query": {},
    "body": {
      "BaseUrl": "https://sandbox.uazapi.com",
      "EventType": "messages",
      "chatSource": "updated",
      "instanceName": "docaria-central",
      "owner": "5511987654321",
      "token": "00000000-0000-0000-0000-000000000000",
      "chat": {
        "id": "r600a6729e76e00",
        "name": "Maria Silva",
        "owner": "5511987654321",
        "phone": "+55 11 98765-4321",
        "wa_chatid": "5511999999999@s.whatsapp.net",
        "wa_contactName": "Maria Silva",
        "wa_lastMsgTimestamp": 1776606626000,
        "wa_lastMessageTextVote": "oi tudo bem com voce??",
        "wa_lastMessageType": "Conversation",
        "wa_unreadCount": 1,
        "wa_isBlocked": false,
        "wa_isGroup": false,
        "wa_label": []
      },
      "message": {
        "buttonOrListid": "",
        "chatid": "5511999999999@s.whatsapp.net",
        "chatlid": "104677127540837@lid",
        "content": "oi tudo bem com voce??",
        "convertOptions": "",
        "edited": "",
        "fromMe": false,
        "groupName": "",
        "id": "5511987654321:3B42E035F80004272DE0",
        "isGroup": false,
        "mediaType": "",
        "messageTimestamp": 1776602377000,
        "messageType": "Conversation",
        "messageid": "3B42E035F80004272DE0",
        "owner": "5511987654321",
        "pinned": false,
        "quoted": "",
        "reaction": "",
        "sender": "104677127540837@lid",
        "senderName": "Maria Silva",
        "sender_lid": "104677127540837@lid",
        "sender_pn": "5511999999999@s.whatsapp.net",
        "source": "unknown",
        "status": "",
        "text": "oi tudo bem com voce??",
        "track_id": "",
        "track_source": "",
        "type": "text",
        "vote": "",
        "wasSentByApi": false
      }
    }
  }
]
```

**Campo para identificar a linha/conta receptora e associar ao profissional:** use `body.owner` como referência principal do profissional.

No modelo-alvo atual, `body.owner` continua sendo o número do WhatsApp do profissional/conta receptora, mas o cadastro do profissional fica somente no Supabase. O Postgres local deve permanecer restrito às tabelas operacionais; a migração do n8n para esse modelo será feita na próxima etapa.

Já `body.message.sender_pn` continua sendo o número do cliente que enviou a mensagem.

O n8n normaliza esse payload e deve inserir uma linha em `messages` e opcionalmente atualizar `conversations`.

Antes de chamar o **DeepSeek** para gerar sugestões de resposta, o n8n deve buscar o **histórico completo da conversa ativa**. Quando a conversa for recém-criada, o workflow pode aproveitar o histórico da última conversa ativa do mesmo cliente como referência de contexto, sem misturar pedidos distintos.

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

-- 2. Atualizar sugestões geradas (após processamento via DeepSeek)
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

> A documentação oficial da Uazapi para chamadas, webhooks, envio de mensagens, etiquetas e demais recursos operacionais fica em `docs.uazapi.com`.

**Workflow 1 — Inbound** (WhatsApp/Uazapi → Supabase + Postgres local)
- Recebe mensagem do cliente via webhook Uazapi
- **Filtra** eventos inválidos (`fromMe`, `isGroup`, `EventType ≠ messages`) → caminho `Ignorar Mensagem`
- **Normaliza** o payload: telefone do cliente, nome, mensagem, e o `owner` (telefone do profissional). Quando o `owner` vem com 12 dígitos (sem o 9 do móvel), o 9 é inserido automaticamente após o DDD.
- **`Buscar Profissional Supabase`** (Supabase native node) — lê o perfil completo em `festa-com-ia-professionals` usando o `owner` normalizado. É a **única fonte de verdade** do profissional.
- **`Resolver Profissional Local`** (Postgres local) — `SELECT id FROM professionals WHERE phone = $1` usando o phone do Supabase. Retorna o `professionals.id` local necessário para as FKs das tabelas operacionais.
- **`Garantir Cliente+Conversa+Pedido`** (Postgres local) — cria/reutiliza `clients`, `conversations` e `orders` a partir do `id` local.
- **`Inserir Mensagem no Banco`** (Postgres local) — grava a mensagem recebida em `messages`.
- **`Buscar Histórico da Conversa Atual`** e **`Buscar Histórico da Conversa Anterior`** (Postgres local) — compõem o contexto para a IA.
- **`Agente DeepSeek (3 Sugestões)`** — monta o prompt com o perfil vindo do Supabase + histórico do Postgres local e gera 3 sugestões curtas.
- **`Salvar Sugestões no Banco`** e **`Atualizar Conversa`** (Postgres local) — persistem as sugestões e atualizam metadados (`last_message`, `last_message_at`, `unread_count`).
- O SQL exato está na seção [Contrato com o n8n](#contrato-com-o-n8n) acima

**Workflow 2 — Outbound** (App → WhatsApp/Uazapi → Postgres)
- Recebe `POST /webhook/send-message` do app (a mensagem já foi gravada com `pending_send`)
- Busca o telefone do cliente via `conversation_id` no Postgres
- Envia a mensagem pelo provider Uazapi
- Atualiza `messages.status` para `sent` (ou `failed`) conforme resultado
- O SQL exato está na seção [Contrato com o n8n](#contrato-com-o-n8n) acima

### Prompt de sistema (DeepSeek)

A geração das respostas deve usar um **prompt de sistema** montado com os dados do profissional e com o contexto recente da conversa.

**Fontes de dados do profissional:**

- **Supabase**: tabela `public."festa-com-ia-professionals"` como fonte de verdade do perfil do profissional
- **Postgres local**: apenas tabelas operacionais da conversa e do pedido

**Campos do profissional disponíveis para o prompt:**

| Campo | Origem | Uso no prompt |
|-------|--------|---------------|
| `display_name` | Supabase | nome de exibição do profissional |
| `business_name` | Supabase | nome do negócio |
| `service_rules` | Supabase | regras operacionais do negócio (horários, delivery, produtos, restrições e prazos) |
| `products_produced` | Supabase | grupos de produtos que o profissional produz |
| `product_subgroups` | Supabase | subgrupos de produtos disponíveis |
| `product_variations` | Supabase | variações por grupo de produto |
| `conversation_samples` | Supabase | exemplos de conversas do profissional para orientar o tom e a forma de resposta |

**Como o prompt deve ser montado:**

1. Identificar o profissional da conversa.
2. Carregar os dados do profissional acima.
3. Buscar o **histórico completo da conversa** e, quando necessário, a última conversa ativa anterior do mesmo cliente.
4. Montar o prompt de sistema com:
   - identidade do negócio
   - regras operacionais do negócio (`service_rules`)
   - portfólio/produtos
   - exemplos de conversa (`conversation_samples`)
   - histórico recente da conversa
5. Enviar esse contexto para o **DeepSeek** gerar as **3 sugestões de resposta**.

> Observação: o prompt deve priorizar o histórico da conversa atual, acrescido de exemplos de conversa do profissional, regras de atendimento e dados de produtos vindos do Supabase. O recorte exibido no painel pode ser menor do que o contexto enviado para a IA.

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

### Variáveis de deploy / Portainer

A lista completa de variáveis do Portainer, ordem de subida do stack e exemplos prontos para copiar foram centralizados em [Deploy na VPS](./DEPLOYMENT.md).

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
// Busca o histórico da conversa para exibição no painel e contextos específicos
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

Os pedidos carregados para o Painel devem trazer um **resumo curto da conversa associada**, incluindo `suggestions`, no campo `Order.messages`, enquanto o prompt da IA pode consultar o histórico completo na camada operacional.

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
| 7 | Config: `N8N_WEBHOOK_URL` no docker-compose e Portainer | ✅ Concluído | `festa-com-ia-dockercompose/docker-compose.yml`, `docs/DEPLOYMENT.md`, `env.local.example` |

---

## Variáveis de ambiente necessárias

| Variável | Descrição | Onde configurar |
|----------|-----------|-----------------|
| `N8N_WEBHOOK_URL` | URL interna do webhook n8n para envio de mensagens | Portainer + docker-compose |
| `DATABASE_URL` | Conexão Postgres (já existente) | Portainer + docker-compose |

---

## Notas de implementação

- O polling será feito apenas para o card atualmente expandido/aberto no Painel, evitando requisições desnecessárias.
- O card deve exibir apenas um recorte curto do histórico, suficiente para contexto visual rápido do profissional.
- As sugestões exibidas na UI serão sempre as da **última mensagem do cliente** na conversa.
- O campo de envio do `PainelCard` continuará visualmente no mesmo lugar — apenas a lógica de envio mudará de mock para real.
- A coluna `suggestions` é `jsonb` no Postgres; o postgres.js a retorna como `string[]` quando o n8n gravar um array JSON de strings.

---

## Polling — detalhes de implementação (Etapa 3)

### Server action (`app/painel/actions.ts`)

```typescript
// Busca um recorte de mensagens de uma conversa e retorna em ordem cronológica (ASC)
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
