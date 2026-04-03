# Páginas — Festa com IA

## Login (`/login`)
**Arquivo:** `app/login/page.tsx`

Tela de autenticação com Supabase Auth (email/senha). Após login bem-sucedido, redireciona para o dashboard ou para `/perfil` quando o cadastro do profissional ainda está incompleto.

---

## Dashboard (`/`)
**Arquivo:** `app/page.tsx`

Visão geral do negócio com cards de métricas, letreiro de atividade e blocos em glassmorphism, calculada a partir dos pedidos do Postgres local.

- Total de pedidos, mensagens novas, pedidos urgentes e receita estimada
- Lista de próximos pedidos/entregas com base em `deliveryDatetime`
- Status agregado dos pedidos por etapa do painel

---

## Painel (`/painel`)
**Arquivo:** `app/painel/page.tsx`

Kanban interativo unificado para gestão de pedidos em tempo real, carregado do Postgres local via `getOrdersWithPayments()`, com visual glassmorphism e bordas de urgência por card.

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
- Indicador lateral por urgência de entrega:
  - 🔴 Vermelho: menos de 2h
  - 🟠 Laranja: 2h–24h
  - 🟢 Verde: mais de 24h
- Botão **Avançar etapa**: move card para próxima coluna
- Botão **Cancelar**: move card para coluna "Cancelado"
- Histórico de mensagens com botão expandir
- Sugestões de resposta com IA (expansíveis)
- Campo de resposta inline

**Estado:** o estado inicial vem do banco e as interações continuam locais no client component para preservar a experiência de drag-and-drop.

---

## Pedidos (`/pedidos`)
**Arquivo:** `app/pedidos/page.tsx`

Lista de pedidos com filtros, subtipos, busca e modais de detalhes/cadastro, inicializada com dados reais do Postgres local.

**Funcionalidades:**
- filtros por tipo de produto
- filtros por subtipo e variação, respeitando as tags cadastradas pelo profissional para cada grupo
- busca por cliente, produto ou subtipo
- modal de detalhes do pedido
- modal de cadastro de novo pedido

---

## Produtos (`/produtos`)
**Arquivo:** `app/produtos/page.tsx`

Página de cadastro da taxonomia comercial do profissional, com linhas, subgrupos e variações por grupo de produto.

**Funcionalidades:**
- seleciona os grupos produzidos pelo profissional
- cadastra subgrupos por grupo de produto
- cadastra variações por grupo de produto
- salva os dados em `festa-com-ia-professionals.product_subgroups` e `product_variations`

---

## Perfil (`/perfil`)
**Arquivo:** `app/perfil/page.tsx`

Tela de onboarding e edição básica do profissional.

**Funcionalidades:**
- coleta nome da empresa e WhatsApp
- marca o onboarding como concluído
- registra os grupos de produto produzidos
- grava os dados em `festa-com-ia-professionals`

---

## Clientes (`/clientes`)
**Arquivo:** `app/clientes/page.tsx`

Lista de clientes com informações básicas. Ainda funciona como placeholder para funcionalidades futuras.

---

## Configurações (`/configuracoes`)
**Arquivo:** `app/configuracoes/page.tsx`

Rota legada que redireciona para `/perfil`.

---

## Redirecionamentos

| Rota | Destino |
|------|---------|
| `/conversas` | `/painel` (redirect) |
| `/configuracoes` | `/perfil` (redirect) |

---

## Proteção de sessão

O shell da aplicação valida sessão do Supabase no cliente:

- sem sessão em rotas internas: redireciona para `/login`
- com sessão em `/login`: redireciona para `/` ou `/perfil`, dependendo do onboarding
