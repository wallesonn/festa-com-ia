# Changelog — Festa com IA

Todas as mudanças relevantes do projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — 2026-03-31

### Adicionado
- **`docs/OPERATIONAL_FLOW.md`** criado com o fluxo operacional do MVP:
  - WhatsApp → n8n → Postgres → Painel da aplicação
  - IA gerando 3 sugestões de resposta antes do envio humano
  - Regras de reabertura, pedido rascunho, falhas e reenvio manual
- **`README.md`** e **`docs/ARCHITECTURE.md`** atualizados com link e referência ao fluxo operacional

---

## [1.1.0] — 2026-03-22

### Adicionado
- **Página Pedidos** completamente reescrita: removido kanban, adicionada lista detalhada de pedidos
  - Filtros por tipo de produto (Bolo 🎂, Doces 🍬, Salgados 🥐, Kit Festa 🎉)
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
