# Arquitetura — Festa com IA

## Objetivo
Descrever a arquitetura de alto nível da plataforma para profissionais que produzem bolos, doces e itens de festa, cobrindo domínios, componentes, integrações e decisões em aberto.

## Visão de Alto Nível
Componentes atuais e previstos:

- Frontend Web (Painel do Profissional)
- Supabase Auth + `profiles` + cadastro do profissional
- Postgres local para toda a operação do negócio
- Redis para cache/fila auxiliar
- n8n para orquestração de mensagens, automações e envio ao WhatsApp
- Integração WhatsApp (provedor a definir)
- Módulo de IA (sugestões, automações e respostas assistidas)
- Observabilidade (logs, métricas, tracing)

Estado atual da aplicação web:

- `app/page.tsx`, `app/painel/page.tsx` e `app/pedidos/page.tsx` já carregam dados do Postgres local no servidor
- `lib/db/client.ts` centraliza o cliente `postgres.js`
- `lib/db/queries.ts` concentra as leituras operacionais para dashboard, painel e pedidos
- `lib/db/mappers.ts` converte rows do banco para os tipos de domínio usados no frontend

Fluxo básico de dados:

```
[Usuário autenticado] → [Supabase Auth / profiles]
                                ↓
                        [Painel da Aplicação]
                                ↓
                     [Postgres local operacional]

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

## Segurança
- Autenticação e autorização via Supabase Auth
- Autorização operacional por `professional_id` no Postgres local
- Armazenamento seguro de segredos (variáveis de ambiente)
- Princípio de menor privilégio para integrações externas

## Observabilidade
- Logs estruturados no Backend
- Métricas básicas (saúde, tráfego, erros)
- Dashboard futuro (a definir)

## Decisões em Aberto
- Provedor de WhatsApp
- Provedor de IA (API externa vs. modelo local)
- Estratégia de RLS/políticas do Supabase para `profiles`

## Próximos Passos
- Refinar requisitos do MVP e casos de uso principais
- Expandir a leitura do Postgres local para as demais telas e relatórios
- Implementar fluxo de orçamentos e conversas (MVP)
