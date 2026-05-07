# Arquitetura — Festa com IA

## Objetivo
Descrever a arquitetura de alto nível da plataforma para profissionais que produzem bolos, doces e itens de festa, cobrindo domínios, componentes, integrações e decisões em aberto.

## Visão de Alto Nível
Componentes atuais e previstos:

- Frontend Web (Painel do Profissional)
- Supabase Auth + `festa-com-ia-professionals` como fonte de verdade do cadastro do profissional
- Postgres local para toda a operação do negócio, incluindo clientes, conversas, mensagens e pedidos
- Redis para cache/fila auxiliar
- n8n para orquestração de mensagens, automações, IA e envio ao WhatsApp
- Integração WhatsApp via Uazapi
- Módulo de IA DeepSeek (sugestões, automações e respostas assistidas)
- Observabilidade (logs, métricas, tracing)

Estado atual da aplicação web:

- `app/page.tsx`, `app/painel/page.tsx` e `app/pedidos/page.tsx` já carregam dados do Postgres local no servidor
- `app/produtos/page.tsx` e `app/perfil/page.tsx` mantêm o cadastro do profissional e a taxonomia comercial no Supabase
- `app/configuracoes/page.tsx` apenas redireciona para `/perfil`
- `lib/db/client.ts` centraliza o cliente `postgres.js` em um singleton compartilhado via `globalThis`
- `lib/db/queries.ts` concentra as leituras operacionais para dashboard, painel e pedidos
- `lib/db/mappers.ts` converte rows do banco para os tipos de domínio usados no frontend
- `app/pedidos/actions.ts` concentra as mutations de pedidos, incluindo criação, exclusão e atualização de `painel_status`
- O fluxo inbound do n8n faz upsert de cliente por telefone, pode atualizar `clients.name` e `clients.profile_photo_url` com os dados mais recentes vindos da Uazapi e, quando a mensagem chega como áudio, transcreve o conteúdo antes de seguir para a normalização e para o prompt da IA
- `app/api/realtime/orders/route.ts` expõe uma stream SSE que escuta o canal `festa_realtime_operational` do Postgres e sinaliza a UI quando o banco muda
- `components/painel/PainelBoard.tsx` e `components/pedidos/PedidosView.tsx` reagem a esses eventos e fazem refresh do servidor sem polling contínuo

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
                     [DeepSeek IA]
                           ↓
                [Postgres local / Painel]
                           ↓
                        [n8n]
                           ↓
                 [WhatsApp / Cliente]

[Postgres local] → [LISTEN/NOTIFY] → [SSE /api/realtime/orders] → [Painel e Pedidos]
```

## Fluxo Operacional

O detalhamento do caminho da mensagem entre WhatsApp, n8n, Postgres e aplicação está documentado em [Fluxo Operacional](./OPERATIONAL_FLOW.md).

Além disso, a UI principal do MVP já segue este fluxo de leitura:

`Postgres local` → `queries.ts` → `server components` → `client components`

Na visão-alvo do produto, o n8n resolve a conversa ativa do cliente, mantém o pedido associado à conversa e envia para a IA o histórico completo daquela conversa, além de exemplos de conversa, regras de atendimento, dados de produtos do profissional e o texto transcrito quando a mensagem chegar em áudio. No painel, o profissional vê apenas um recorte curto do histórico junto com as sugestões de resposta.

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
  - Conversas em tempo real, histórico completo para IA, automações e handoff humano
- IA Assistiva (DeepSeek)
  - Sugestões de respostas, estimativas de custo/tempo e geração de textos com contexto do profissional
- Orquestração Operacional
  - Recepção de mensagens, identificação de conversa ativa, criação manual de novo pedido quando necessário, persistência em banco e disparo de mensagens via n8n

## Integrações Externas
- WhatsApp: Uazapi
- n8n: orquestração de webhooks, IA e envio de respostas
- Pagamentos: a definir (opcional, roadmap)
- E-mail/SMS: a definir (opcional)

## Modelo de Dados (alto nível)
- Usuário autenticado no Supabase
- Profissional / perfil de negócio
- Cliente
- Conversa
- Mensagem
- Pedido
- Item de Catálogo
- Produção (etapas, insumos, custos)

Relações principais:

- `profissionais` (operacional) → `clientes` em `1:n`
- `clientes` → `conversas` em `1:n`
- `conversas` → `pedido` em `1:1` enquanto o atendimento estiver ativo
- novo pedido dentro da mesma conversa é criado manualmente pelo profissional
- `clients.profile_photo_url` armazena a melhor URL de foto disponível enviada pela Uazapi (`imagePreview`/`image`) para reutilização no painel e em fallbacks de avatar
- Mensagens de áudio recebem uma etapa de transcrição na Uazapi antes de alimentar o histórico, a persistência e o prompt da IA

Observação: o MVP operacional mantém o histórico de conversas e pedidos no Postgres local, enquanto o Supabase fica restrito à autenticação e aos dados do usuário/profissional.

Observação adicional: o cadastro do profissional, incluindo telefone e contexto comercial, fica somente no Supabase. O Postgres local não deve ser usado como fonte de verdade do perfil do profissional.

Observação: o esquema físico final do projeto está consolidado nos arquivos `supabase/schema/local_postgres_final.sql` e `supabase/schema/supabase_final.sql`.

## Operação e Infraestrutura
- VPS com Portainer + Traefik (reverse proxy) já previstos
- Diretório `festa-com-ia-dockercompose` conterá os manifests para orquestração
- Ambientes: dev (local), staging (opcional), prod (VPS)
- Deploy: a definir (CI/CD opcional em fase inicial)
- O backend operacional local roda em Docker com Postgres e Redis; n8n seguirá fora do compose principal
- O bootstrap do stack usa o schema final consolidado do Postgres local e cria um profissional ativo padrão quando a tabela `professionals` estiver vazia
- O schema final do Supabase fica separado e cobre Auth, perfil do profissional e Storage
- Conceitos como `authenticated`, `storage.buckets`, `storage.objects` e RLS pertencem somente ao Supabase e não ao Postgres operacional local

## Observações de Runtime
- O cliente Postgres usa `keep_alive` e `idle_timeout` desativado para evitar cold start no ambiente local de desenvolvimento
- Como o Next.js App Router separa Server Components e Server Actions em bundles distintos, o `globalThis` é usado para compartilhar a mesma conexão em todo o processo Node.js
- A UI operacional usa um canal realtime baseado em `LISTEN/NOTIFY` + SSE para atualizar painel e pedidos quando o Postgres local muda

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
- Provedor de IA: DeepSeek (via API externa ou local)
- Estratégia de RLS/políticas do Supabase para `festa-com-ia-professionals`
- Profundidade do recorte exibido no painel versus o histórico completo usado no prompt da IA

## Próximos Passos
- Refinar requisitos do MVP e casos de uso principais
- Expandir a leitura do Postgres local para as demais telas e relatórios
- Implementar fluxo de orçamentos e conversas (MVP)
