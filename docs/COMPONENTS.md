# Componentes — Festa com IA

## Layout

### `AppShell` (`components/layout/AppShell.tsx`)
Wrapper principal da aplicação. Controla abertura do sidebar no mobile via estado local.
- Sidebar fixo no desktop (`lg:pl-[var(--sidebar-width)]`)
- Overlay escuro no mobile ao abrir o sidebar
- `main` com padding responsivo (`px-4 sm:px-6 lg:px-8`)

### `Sidebar` (`components/layout/Sidebar.tsx`)
Navegação lateral com links para todas as páginas. Recebe `onNavigate` para fechar no mobile após clique.

### `Header` (`components/layout/Header.tsx`)
Barra superior com botão de toggle do sidebar (mobile) e avatar do usuário (`AvatarDefault`).

---

## UI Primitivos

### `AvatarDefault` (`components/ui/AvatarDefault.tsx`)
SVG inline de silhueta genérica de perfil. Props: `size` (px), `className`.

### `Button` (`components/ui/button.tsx`)
Componente de botão baseado em shadcn/ui com variantes (`default`, `outline`, `ghost`, etc.) e tamanhos (`sm`, `md`, `lg`).

---

## Dashboard

### `ActivityTicker` (`components/dashboard/ActivityTicker.tsx`)
Letreiro animado de atividade recente usado no dashboard inicial. Exibe eventos simulados em loop horizontal com uma etiqueta "Ao vivo" na lateral.

---

## Pedidos

### `PedidosView` (`components/pedidos/PedidosView.tsx`)
Componente principal da tela de Pedidos. Carrega a listagem do Postgres local, aplica filtros por grupo/subgrupo e controla os modais de cadastro e detalhes.

**Funcionalidades:**
- Lista pedidos reais carregados pelo servidor
- Modal de cadastro cria pedidos no banco com `painel_status = agendado`
- Modal de detalhes mostra o status atual do painel, histórico e informações do pedido
- Exclusão de pedidos direto no modal de detalhes
- Atualização otimista da lista após criar/deletar pedidos

Props: não possui props externas diretas; gerencia estado local e server actions.

---

## Kanban Genérico

### `KanbanColumn` (`components/kanban/KanbanColumn.tsx`)
Coluna de Kanban estática (sem DnD). Usada na página de Pedidos.
Props: `title`, `count`, `children`.

### `OrderCard` (`components/kanban/OrderCard.tsx`)
Card de pedido usado na página de Pedidos.

---

## Painel (Kanban interativo)

### `PainelColumn` (`components/painel/PainelColumn.tsx`)
Coluna droppable do Kanban do Painel. Integra `useDroppable` do `@dnd-kit/core` e `SortableContext`.
- Largura: `w-[82vw]` mobile / `sm:w-[300px]` desktop
- Altura: `min-h-[40vh] max-h-[calc(100vh-260px)]` com `overflow-y-auto`
- Destaque visual (`border-fuchsia-400/50 bg-fuchsia-500/5`) quando card está sendo arrastado sobre ela

Props: `id`, `title`, `count`, `itemIds`, `children`.

### `PainelCard` (`components/painel/PainelCard.tsx`)
Card interativo do Painel. Integra `useSortable` do `@dnd-kit/sortable`.

**Funcionalidades:**
- Handle de arrastar (ícone `GripVertical`) — `touch-none` para não conflitar com scroll
- Base em glassmorphism com borda e fundo translúcidos
- Borda lateral por urgência de entrega (`urgencyLevel` + `urgencyBorderClass`)
- Histórico de 5 mensagens com bolhas: atendente à direita, cliente à esquerda
- Botão expandir/recolher conversa
- Sugestões de resposta (1 visível, demais expansíveis)
- Campo de digitação com botão enviar
- Botão **Cancelar** (esquerda) e **Avançar etapa** (direita)

Props: `order`, `onAdvance(id)`, `onCancel(id)`.

---

## Outros

### `ConversationCard` (`components/conversations/ConversationCard.tsx`)
Card legado de conversa (não usado no Painel atual).
