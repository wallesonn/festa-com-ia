# Páginas — Festa com IA

## Dashboard (`/`)
**Arquivo:** `app/page.tsx`

Visão geral do negócio com cards de métricas e atividade recente.

- Total de pedidos, mensagens novas, pedidos urgentes e receita estimada
- Lista de pedidos recentes com status
- Lista de mensagens recentes

---

## Painel (`/painel`)
**Arquivo:** `app/painel/page.tsx`

Kanban interativo unificado para gestão de pedidos em tempo real.

**Colunas (em ordem):**
1. Atendimento
2. Agendado
3. Preparando
4. Pronto
5. Entregue
6. Cancelado

**Funcionalidades:**
- Drag & drop entre colunas (`@dnd-kit/core` + `@dnd-kit/sortable`)
  - Mouse: arrastar com clique
  - Mobile: toque e segure 250ms no handle `⠿` para ativar o drag
- Scroll horizontal com botões `‹` `›` nas laterais (300px por clique, suave)
- Scroll por dedo no mobile (`touchAction: pan-x`)
- Cor de fundo dos cards por urgência de entrega:
  - 🔴 Vermelho: menos de 2h
  - 🟠 Laranja: 2h–24h
  - 🟢 Verde: mais de 24h
- Botão **Avançar etapa**: move card para próxima coluna
- Botão **Cancelar**: move card para coluna "Cancelado"
- Histórico de mensagens com botão expandir
- Sugestões de resposta com IA (expansíveis)
- Campo de resposta inline

**Estado:** gerenciado localmente via `useState` (sem backend ainda).

---

## Pedidos (`/pedidos`)
**Arquivo:** `app/pedidos/page.tsx`

Kanban estático de pedidos por bucket de tempo/status usando `KanbanColumn` e `OrderCard`.

---

## Clientes (`/clientes`)
**Arquivo:** `app/clientes/page.tsx`

Lista de clientes com informações básicas. Placeholder para funcionalidades futuras.

---

## Configurações (`/configuracoes`)
**Arquivo:** `app/configuracoes/page.tsx`

Placeholder. Previsto para futuras integrações: n8n, WhatsApp/Uazapi, IA, preferências e usuários.

---

## Redirecionamentos

| Rota | Destino |
|------|---------|
| `/conversas` | `/painel` (redirect) |
