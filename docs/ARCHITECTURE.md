# Arquitetura — Festa com IA

## Objetivo
Descrever a arquitetura de alto nível da plataforma para profissionais que produzem bolos, doces e itens de festa, cobrindo domínios, componentes, integrações e decisões em aberto.

## Visão de Alto Nível
Componentes atuais e previstos:

- Frontend Web (Painel do Profissional)
- Supabase Auth + `festa-com-ia-professionals`
- Postgres local para toda a operação do negócio
- Redis para cache/fila auxiliar
- n8n para orquestração de mensagens, automações e envio ao WhatsApp
- Integração WhatsApp (provedor a definir)
- Módulo de IA (sugestões, automações e respostas assistidas)
- Observabilidade (logs, métricas, tracing)

Estado atual da aplicação web:

- `app/page.tsx`, `app/painel/page.tsx` e `app/pedidos/page.tsx` já carregam dados do Postgres local no servidor
- `app/produtos/page.tsx` e `app/perfil/page.tsx` mantêm o cadastro do profissional e a taxonomia comercial no Supabase
- `app/configuracoes/page.tsx` apenas redireciona para `/perfil`
- `lib/db/client.ts` centraliza o cliente `postgres.js` em um singleton compartilhado via `globalThis`
- `lib/db/queries.ts` concentra as leituras operacionais para dashboard, painel e pedidos
- `lib/db/mappers.ts` converte rows do banco para os tipos de domínio usados no frontend
- `app/pedidos/actions.ts` concentra as mutations de pedidos, incluindo criação, exclusão e atualização de `painel_status`

Fluxo básico de dados:

```
[Usuário autenticado] → [Supabase Auth / festa-com-ia-professionals]
                                ↓
                        [Painel da Aplicação]
                                ↓
                     [Postgres local operacional]

[Painel da Aplicação] → [Server Actions] → [Postgres local operacional]

[Cliente WhatsApp] → [n8n Webhook] → [Postgres local]
                           ↓
                     [Módulo IA]
                           ↓
                [Painel da Aplicação]
                           ↓
                        [n8n]
                           ↓
                 [WhatsApp / Cliente]
```

## Fluxo Operacional

O detalhamento do caminho da mensagem entre WhatsApp, n8n, Postgres e aplicação está documentado em [Fluxo Operacional](./OPERATIONAL_FLOW.md).

Além disso, a UI principal do MVP já segue este fluxo de leitura:

`Postgres local` → `queries.ts` → `server components` → `client components`

## Domínios e Módulos
- Painel do Profissional
  - Gestão de clientes, pedidos, orçamentos e agenda
  - Acompanhamento de produção e entregas
- Orçamentos e Catálogo
  - Itens, variações, precificação e templates
- Catálogo e Taxonomia
  - Grupos de produto, subgrupos, variações e referência global de taxonomia
- Produção
  - Etapas, checklists, custos e status
- Comunicação (WhatsApp)
  - Conversas em tempo real, histórico, automações e handoff humano
- IA Assistiva
  - Sugestões de respostas, estimativas de custo/tempo e geração de textos
- Orquestração Operacional
  - Recepção de mensagens, persistência em banco, reabertura de conversa e disparo de mensagens via n8n

## Integrações Externas
- WhatsApp: provedor a definir (ex.: WPPConnect, Meta Cloud API, Twilio)
- n8n: orquestração de webhooks, IA e envio de respostas
- Pagamentos: a definir (opcional, roadmap)
- E-mail/SMS: a definir (opcional)

## Modelo de Dados (alto nível)
- Usuário autenticado no Supabase
- Profissional / perfil de negócio
- Cliente
- Conversa
- Mensagem
- Orçamento/Pedido
- Item de Catálogo
- Produção (etapas, insumos, custos)

Observação: o MVP operacional mantém o histórico de conversas e pedidos no Postgres local, enquanto o Supabase fica restrito à autenticação e aos dados do usuário/profissional.

Observação: O diagrama físico e o esquema detalhado serão definidos conforme o MVP evoluir.

## Operação e Infraestrutura
- VPS com Portainer + Traefik (reverse proxy) já previstos
- Diretório `festa-com-ia-dockercompose` conterá os manifests para orquestração
- Ambientes: dev (local), staging (opcional), prod (VPS)
- Deploy: a definir (CI/CD opcional em fase inicial)
- O backend operacional local roda em Docker com Postgres e Redis; n8n seguirá fora do compose principal

## Observações de Runtime
- O cliente Postgres usa `keep_alive` e `idle_timeout` desativado para evitar cold start no ambiente local de desenvolvimento
- Como o Next.js App Router separa Server Components e Server Actions em bundles distintos, o `globalThis` é usado para compartilhar a mesma conexão em todo o processo Node.js

## Segurança
- Autenticação e autorização via Supabase Auth
- Autorização operacional por `professional_id` no Postgres local
- Armazenamento seguro de segredos (variáveis de ambiente)
- Princípio de menor privilégio para integrações externas

## Observabilidade
- Logs estruturados no Backend
- Métricas básicas (saúde, tráfego, erros)
- Dashboard operacional já implementado em `app/page.tsx`

## Decisões em Aberto
- Provedor de WhatsApp
- Provedor de IA (API externa vs. modelo local)
- Estratégia de RLS/políticas do Supabase para `festa-com-ia-professionals`

## Próximos Passos
- Refinar requisitos do MVP e casos de uso principais
- Expandir a leitura do Postgres local para as demais telas e relatórios
- Implementar fluxo de orçamentos e conversas (MVP)
