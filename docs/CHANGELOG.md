# Changelog — Festa com IA

Todas as mudanças relevantes do projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — 2026-04-16

### Adicionado
- **Dashboard com dados reais** (`app/page.tsx`, `lib/db/queries.ts`): nova função `getDashboardStats` (agregação única em SQL) fornece KPIs (`messages_today`, `orders_in_progress`, `orders_finished_month`, `new_clients_week`, receita mensal dos últimos 6 meses), contagens por `painel_status`, pedidos por dia da semana e top produtos — todos com deltas contra o período anterior
- **Conversas recentes no dashboard** (`components/dashboard/RecentConversations.tsx`, `lib/db/queries.ts → getRecentConversations`): bloco com abas **Não respondidas** e **Respondidas**, classificação pela direção da última mensagem (`outbound`/`attendant` → respondida), contador de não lidas e timestamp relativo
- **Foto de perfil no header** (`components/layout/Header.tsx`, `components/layout/AppShell.tsx`): AppShell busca `photo_path` do profissional, gera URL pública do bucket `festa-com-ia` e passa ao `Header`, que renderiza `<img>` com fallback para `AvatarDefault`
- **Evento `profile-photo-updated`** (`app/perfil/page.tsx`): disparado após salvar o perfil para que o header atualize a foto sem reload

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
