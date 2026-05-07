# Changelog — Festa com IA

Todas as mudanças relevantes do projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — 2026-05-04

### Alterado
- **Documentação do inbound n8n**: os guias de fluxo operacional, fluxo de mensagens e arquitetura agora descrevem a etapa de transcrição de áudio via Uazapi antes da normalização, persistência e geração de sugestões pela IA.
- **Perfil / WhatsApp Uazapi**: a tela de perfil agora revalida o status da instância pelo endpoint administrativo `GET /instance/all` antes de confiar no cache local, refletindo corretamente desconexões feitas diretamente na Uazapi.
- **Integração server-side Uazapi**: a rota de conexão passou a depender do `UAZAPI_ADMIN_TOKEN` no runtime para consultar a listagem administrativa e sincronizar o estado real da instância.
- **Provisionamento de webhooks da instância**: ao conectar/reutilizar uma instância, o backend agora garante dois webhooks idempotentes por instância usando as URLs de produção e teste configuradas via ambiente.
- **Recuperação de instância apagada**: se a instância do profissional for removida manualmente na Uazapi, o próximo refresh/conexão limpa o vínculo local e recria a instância automaticamente.
- **Card de WhatsApp do perfil**: a seção foi simplificada visualmente e passou a exibir um alerta quando o telefone do perfil diverge do número já conectado na Uazapi.
- **Painel / abas por data de entrega**: o cabeçalho do painel agora exibe abas para `Todos`, `Hoje`, `Amanhã` e os próximos 7 dias, filtrando os pedidos por `deliveryDatetime` em todas as colunas exceto `Em atendimento`.
- **Pedidos e Painel / variações múltiplas**: os modais de editar/agendar pedido passaram a permitir selecionar mais de uma opção de variação/linha, mantendo compatibilidade com os pedidos já salvos no formato antigo.

### Corrigido
- **Workflow outbound do n8n**: o fluxo de envio de mensagens passou a receber `instanceId` no webhook do app, consultar `uazapi_instances.instance_token` no Postgres e usar esse token no envio para a Uazapi sem expor o segredo no payload.
- **Status travado em `connected`**: quando a instância permanecia cadastrada na Uazapi, mas o WhatsApp já tinha sido desconectado, o app agora atualiza para `disconnected` no próximo refresh.

### Adicionado
- **`UAZAPI_WEBHOOK_URL_PROD` e `UAZAPI_WEBHOOK_URL_TEST`**: novas variáveis de ambiente para provisionar os webhooks da instância em produção e teste.
- **Sons do painel**: adicionados feedbacks sonoros para novas mensagens recebidas, envio de respostas e movimentação de pedidos para a coluna `Pronto`, com volume mais alto e som de conclusão mais impactante.
- **Alerta urgente do painel**: pedidos com urgência vermelha agora disparam um áudio em MP3 com repetição a cada 2 segundos e fade-out quando o estado urgente termina.

## [Unreleased] — 2026-05-02

### Alterado
- **Fluxo inbound do n8n**: o workflow passou a fazer upsert de cliente por telefone e pode atualizar `clients.name` e `clients.profile_photo_url` com os dados mais recentes vindos da Uazapi.
- **Documentação de Uazapi e Postgres**: os docs agora deixam explícito que `body.chat.imagePreview`/`body.chat.image` podem ser usados como fonte da foto do cliente e persistidos no Postgres local para exibição no painel com fallback de avatar.

### Adicionado
- **`clients.profile_photo_url`**: a tabela operacional de clientes passou a documentar a coluna para armazenar a melhor URL de foto recebida da Uazapi.

## [Unreleased] — 2026-05-01

### Alterado
- **Painel Kanban**: os pedidos com mensagens do cliente ainda não respondidas agora aparecem primeiro dentro de cada coluna.
- **Indicadores visuais do painel**: o card do pedido exibe um badge verde com a quantidade de mensagens pendentes, e o badge de contagem da coluna também fica verde quando há cards com pendências.

### Corrigido
- **Finalização de conversa ao entregar/cancelar pedido**: a ação de atualizar o status do pedido passou a marcar a conversa vinculada como `finalizada` e a arquivá-la, evitando que novas mensagens caiam no pedido anterior.
- **Fluxo inbound do n8n**: a documentação foi atualizada para reforçar que o workflow deve reutilizar apenas conversas e pedidos ainda ativos, sem reaproveitar pedidos `entregue` ou `cancelado`.
- **Contexto auxiliar para a IA**: o workflow inbound do n8n passou a carregar o histórico completo de pedidos do cliente e incluí-lo no prompt do DeepSeek como contexto auxiliar.
## [Unreleased] — 2026-04-24

### Alterado
- **Atualização em tempo real do painel e de pedidos**: alterações gravadas no Postgres local agora emitem notificações via `LISTEN/NOTIFY`, e a UI passa a reagir a esses eventos por SSE sem depender de polling ou cache do navegador.
- **`app/pedidos` e `app/painel`**: as telas agora refletem mudanças vindas do n8n e das ações da própria UI assim que o banco é atualizado.

### Adicionado
- **`supabase/schema/local_postgres_final.sql`**: triggers e função de notificação para tabelas operacionais relevantes, publicando eventos de mudança em um canal realtime dedicado.

## [Unreleased] — 2026-04-23

### Alterado
- **Simplificação da tabela local `professionals`** (`supabase/schema/local_postgres_final.sql`): a tabela local foi reduzida às colunas mínimas necessárias para as FKs operacionais — `id`, `phone` (único, NOT NULL), `business_name`, `created_at`, `updated_at`. Todo o cadastro/contexto do profissional continua exclusivamente no Supabase (`festa-com-ia-professionals`).
- **`phone` vira o único elo de ligação** entre Supabase e Postgres local — `auth_user_id` deixou de ser persistido localmente
- **`app/api/account/sync-professional/route.ts`**: o sync agora faz upsert por `phone` e grava apenas `phone` + `business_name` no Postgres local
- **`scripts/migrate-and-start.sh`**: removidos o `ALTER TABLE` que re-adicionava as colunas antigas (`products_produced`, `product_subgroups`, `product_variations`, `conversation_samples`) e o INSERT do "Profissional Principal" padrão — profissionais locais passam a ser criados apenas via sync disparado em `/perfil`

### n8n — workflow `Festa: WhatsApp Inbound → AI Agent (DeepSeek) → Postgres`
- **Removido** o node desconectado `Buscar Profissional Local` (Postgres consultando Supabase), que não executava e poluía o fluxo
- **`Buscar Profissional Supabase`** (Supabase native node) passa a ser o único leitor do perfil do profissional — fonte de verdade
- **Adicionado `Resolver Profissional Local`** (Postgres local): `SELECT id FROM professionals WHERE phone = $1`, necessário para satisfazer as FKs das tabelas operacionais
- **`Garantir Cliente+Conversa+Pedido`** agora usa o `id` vindo do `Resolver Profissional Local` como `professional_id`
- **Prompt do `Agente DeepSeek`** agora referencia `Buscar Profissional Supabase` em todos os campos de contexto (antes apontava para o node desconectado)
- **Filtro de entrada** no webhook mantém a regra `fromMe = false`, `EventType = messages`, `isGroup = false`
- **Normalização do `owner`**: quando o telefone vier com 12 dígitos (sem o 9 no móvel), o fluxo insere automaticamente o 9 após o DDD antes de consultar o Supabase

### Removido
- Colunas antigas da tabela local `professionals`: `auth_user_id`, `display_name`, `slug`, `service_rules`, `status`, `products_produced`, `product_subgroups`, `product_variations`, `conversation_samples`, `email`, `photo_path`, `onboarding_completed`

## [Unreleased] — 2026-04-20

### Alterado
- **Arquitetura de dados do profissional**: o cadastro e o contexto do profissional passam a ser tratados como dados exclusivos do Supabase (`festa-com-ia-professionals`), enquanto o Postgres local permanece responsável apenas pelas tabelas operacionais. A migração do n8n para esse modelo fica para a próxima etapa.

### Adicionado
- **Exclusão total de conta** (`app/perfil/page.tsx`, `app/api/account/delete/route.ts`): o profissional pode solicitar a remoção da conta diretamente na tela de perfil, com confirmação explícita e limpeza do cadastro no Supabase, do usuário no Auth e dos dados operacionais no Postgres local

### Alterado
- **WhatsApp do perfil padronizado para Brasil** (`app/perfil/page.tsx`): o onboarding passou a usar país fixo `+55`, seleção de DDD e normalização do número local para salvar apenas dígitos no formato consistente esperado pela integração
- **Deploy/runtime** (`festa-com-ia-dockercompose/docker-compose.yml`, `env.local.example`, `docs/DEPLOYMENT.md`): o backend agora exige `SUPABASE_SERVICE_ROLE_KEY` para concluir a exclusão total da conta

### Removido
- **Template separado de Portainer** (`portainer.env.example`): o exemplo de variáveis do stack foi incorporado ao `docs/DEPLOYMENT.md` para concentrar a documentação de deploy em uma única fonte

## [Unreleased] — 2026-04-16

### Adicionado
- Ajustado roteamento da home para redirecionar para `/painel`
- **Dashboard com dados reais** (`app/page.tsx`, `lib/db/queries.ts`): nova função `getDashboardStats` (agregação única em SQL) fornece KPIs (`messages_today`, `orders_in_progress`, `orders_finished_month`, `new_clients_week`, receita mensal dos últimos 6 meses), contagens por `painel_status`, pedidos por dia da semana e top produtos — todos com deltas contra o período anterior
- **Conversas recentes no dashboard** (`components/dashboard/RecentConversations.tsx`, `lib/db/queries.ts → getRecentConversations`): bloco com abas **Não respondidas** e **Respondidas**, classificação pela direção da última mensagem (`outbound`/`attendant` → respondida), contador de não lidas e timestamp relativo
- **Foto de perfil no header** (`components/layout/Header.tsx`, `components/layout/AppShell.tsx`): AppShell busca `photo_path` do profissional, gera URL pública do bucket `festa-com-ia` e passa ao `Header`, que renderiza `<img>` com fallback para `AvatarDefault`
- **Evento `profile-photo-updated`** (`app/perfil/page.tsx`): disparado após salvar o perfil para que o header atualize a foto sem reload
- **Arquivamento visual de pedidos** (`app/painel/page.tsx`, `app/pedidos/page.tsx`, `lib/db/queries.ts`): as telas principais passaram a ocultar pedidos `entregue` ou `cancelado` com mais de 3 dias, mantendo o histórico acessível na consulta de arquivados
- **Exportação de arquivados em `.xlsx`** (`app/api/orders/export/route.ts`, `components/pedidos/PedidosView.tsx`): adicionada uma rota de exportação e um botão para baixar somente os pedidos arquivados

### Corrigido
- Erro "new row violates row-level security policy" ao salvar o perfil: a tabela `festa-com-ia-professionals` estava com RLS habilitado sem policies. Reativado com policies `SELECT/INSERT/UPDATE` restritas ao próprio usuário (`auth_user_id = auth.uid()`)
- Policies de `storage.objects` para o bucket `festa-com-ia` ajustadas: `SELECT` público (bucket é public) e `INSERT/UPDATE/DELETE` restritos a `authenticated`

## [Unreleased] — 2026-04-04

### Alterado
- O schema operacional passou a ser descrito em um único arquivo final consolidado em `supabase/schema/local_postgres_final.sql`
- O schema do Supabase passou a ser descrito em um único arquivo final consolidado em `supabase/schema/supabase_final.sql`, separando Auth, Storage e RLS do Postgres operacional local

### Corrigido
- O boot do container da aplicação passou a aplicar apenas as migrations locais do Postgres e a criar um profissional ativo padrão quando a tabela `professionals` está vazia

### Alterado
- **`app/painel/page.tsx`** e **`components/painel/*`** passaram a persistir no Postgres local as mudanças de `painel_status` feitas no Kanban
- **`app/pedidos/page.tsx`** e **`components/pedidos/PedidosView.tsx`** passaram a exibir o status atual do painel no modal de detalhes, além de criar pedidos já com `painel_status = agendado` e permitir exclusão direta
- **`lib/db/client.ts`** passou a reutilizar o cliente Postgres via `globalThis`, com `keep_alive` ativo e `idle_timeout` desativado para o ambiente local de desenvolvimento

### Corrigido
- Divergência entre o status exibido no card, no modal de detalhes e no estado persistido após mover cards no Kanban

## [Unreleased] — 2026-04-03

### Adicionado
- **`app/produtos/page.tsx`** com cadastro de linhas, subgrupos e variações por grupo de produto
- **`app/perfil/page.tsx`** como tela separada de onboarding e edição básica do profissional
- **`product_taxonomy_reference`** como referência global de taxonomia por grupo no Postgres local

### Alterado
- **`app/page.tsx`** recebeu novo layout em cards glassmorphism, com letreiro de atividade restaurado
- **`app/painel/page.tsx`** e componentes do painel foram redesenhados com visual glassmorphism e bordas de urgência mais consistentes
- **`app/pedidos/page.tsx`** passou a filtrar subgrupos e variações por grupo do produto usando a taxonomia cadastrada pelo profissional
- **`app/configuracoes/page.tsx`** virou rota legada e redireciona para `/perfil`
- **`README.md`** e a documentação em `docs/` foram atualizados para refletir o fluxo atual do app

### Corrigido
- Divergência de documentação entre `/perfil`, `/configuracoes` e o fluxo real baseado em `festa-com-ia-professionals`

---

## [Unreleased] — 2026-04-01

### Adicionado
- **`app/login/page.tsx`** com login por email/senha usando Supabase Auth
- **`app/configuracoes/page.tsx`** como rota legada da conta do usuário logado, agora redirecionando para `/perfil`

### Alterado
- **`components/layout/AppShell.tsx`** agora valida sessão ativa do Supabase e protege rotas internas
- **`app/painel/page.tsx`**, **`app/pedidos/page.tsx`** e **`app/page.tsx`** passaram a consumir dados reais do Postgres local em vez de depender exclusivamente de mocks
- **`lib/db/client.ts`**, **`lib/db/queries.ts`** e **`lib/db/mappers.ts`** foram introduzidos/ajustados para leitura operacional do banco local
- **`README.md`** e **`docs/PAGES.md`** foram atualizados para refletir login/auth + perfil do usuário logado

---

## [Unreleased] — 2026-03-31

### Adicionado
- **`docs/OPERATIONAL_FLOW.md`** criado com o fluxo operacional do MVP:
  - WhatsApp → n8n → Postgres → Painel da aplicação
  - IA gerando 3 sugestões de resposta antes do envio humano
  - Regras de reabertura, pedido rascunho, falhas e reenvio manual
- **`README.md`** e **`docs/ARCHITECTURE.md`** atualizados com link e referência ao fluxo operacional

### Alterado
- A arquitetura de dados foi refinada para separar responsabilidades:
  - **Supabase** para Auth, `festa-com-ia-professionals`, cadastro do profissional e regras
  - **Postgres local** para toda a operação do negócio
- **`README.md`**, **`docs/ARCHITECTURE.md`**, **`docs/OPERATIONAL_FLOW.md`** e **`docs/DATABASE_SCHEMA.md`** atualizados para refletir o estado atual do projeto

---

## [1.1.0] — 2026-03-22

### Adicionado
- **Página Pedidos** completamente reescrita: removido kanban, adicionada lista detalhada de pedidos
  - Filtros por tipo de produto (Bolo 🎂, Doces 🍬, Salgados 🥐, Refeição 🍽)
  - Segundo nível de filtro por subtipo (ex: Chocolate, Red Velvet, Morango...)
  - Busca por cliente, produto ou subtipo
  - Modal de detalhes com abas: Informações e Receita/Produção (ingredientes + modo de preparo)
  - Modal de cadastro de novo pedido com formulário completo
- **`lib/types.ts`** expandido com todos os tipos do domínio:
  - `Client`, `Address`, `Product`, `Ingredient`, `Payment`
  - `Appointment`, `Notification`, `BusinessConfig`, `BusinessHours`
  - `DeliveryType`, `PaymentMethod`, `PaymentStatus`, `ClientSource`, `AppointmentType`, `NotificationType`
- **`docs/DATABASE_SCHEMA.md`** criado com 11 tabelas prontas para PostgreSQL/Supabase
- **`build.sh`** exibe mensagem de sucesso após build e push

### Corrigido
- Erro de hidratação SSR/CSR (`filterStatus is not defined`) causado por JSX em nível de módulo
- Mock de `Conversation` e `Order` atualizado para refletir novos campos obrigatórios dos tipos expandidos

---

## [0.2.0] — 2026-03-21

### Adicionado
- **Painel Kanban interativo** (`/painel`) substituindo a página de Conversas
  - 6 colunas: Atendimento, Agendado, Preparando, Pronto, Entregue, Cancelado
  - Drag & drop entre colunas e reordenação interna (`@dnd-kit/core`, `@dnd-kit/sortable`)
  - Suporte a mouse e toque (mobile: toque e segure 250ms para arrastar)
  - Scroll horizontal com botões `‹` `›` e deslize de dedo no mobile
- **PainelCard** com funcionalidades completas:
  - Cor de fundo por urgência de entrega (vermelho/laranja/verde)
  - Histórico das 5 últimas mensagens com bolhas de chat (expansíveis)
  - Sugestões de resposta com IA (expansíveis, 1 visível por padrão)
  - Campo de resposta inline
  - Botão **Cancelar** e **Avançar etapa**
- **AvatarDefault** — componente SVG de silhueta de perfil reutilizável
- **PainelColumn** — coluna droppable responsiva (`82vw` mobile / `300px` desktop)
- Redirecionamento automático de `/conversas` para `/painel`
- Campo `messages: ChatMessage[]` adicionado ao tipo `Order`
- `generateMessages()` no mock para gerar histórico de 5 mensagens por pedido
- Pasta `docs/` com documentação detalhada do projeto

### Alterado
- `AppShell`: removido `max-width` restritivo do `main`, padding responsivo mantido
- Header: avatar substituído por `AvatarDefault`
- Sidebar: "Conversas" renomeado para "Painel" com novo ícone e rota

## [0.1.0] — 2026-03-20

### Adicionado
- Scaffold Next.js 14 App Router com TypeScript e TailwindCSS
- Tema visual partido/festivo: fundo escuro neutro com cores vibrantes
- Layout base: `AppShell`, `Sidebar`, `Header`
- Páginas iniciais: Dashboard, Pedidos (Kanban), Clientes, Configurações
- Kanban de Pedidos com `KanbanColumn` e `OrderCard`
- Mock de dados (`lib/mockData.ts`) com pedidos e conversas
- Tipos base (`lib/types.ts`): `Order`, `Conversation`, `PainelStatus`, etc.
- Funções utilitárias (`lib/utils.ts`): urgência, formatação de datas, labels
- `README.md` e `ARCHITECTURE.md` iniciais
