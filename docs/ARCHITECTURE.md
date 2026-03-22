# Arquitetura — Festa com IA

## Objetivo
Descrever a arquitetura de alto nível da plataforma para profissionais que produzem bolos, doces e itens de festa, cobrindo domínios, componentes, integrações e decisões em aberto.

## Visão de Alto Nível
Componentes previstos (sujeitos a ajuste nas próximas iterações):

- Frontend Web (Painel do Profissional)
- Backend (API de negócio e WebSockets)
- Banco de Dados Relacional (ex.: Postgres)
- Mensageria/Cache (ex.: Redis) — opcional inicialmente
- Integração WhatsApp (provedor a definir)
- Módulo de IA (sugestões, automações e respostas assistidas)
- Armazenamento de Arquivos (ex.: S3 compatível) — opcional
- Observabilidade (logs, métricas, tracing)

Fluxo básico de dados:

```
[Frontend] ⇄ [Backend/API] ⇄ [Banco de Dados]
                  ⇅
              [Mensageria]
                  ⇅
          [Integração WhatsApp]
                  ⇅
               [Módulo IA]
```

## Domínios e Módulos
- Painel do Profissional
  - Gestão de clientes, pedidos, orçamentos e agenda
  - Acompanhamento de produção e entregas
- Orçamentos e Catálogo
  - Itens, variações, precificação e templates
- Produção
  - Etapas, checklists, custos e status
- Comunicação (WhatsApp)
  - Conversas em tempo real, histórico e automações
- IA Assistiva
  - Sugestões de respostas, estimativas de custo/tempo e geração de textos

## Integrações Externas
- WhatsApp: provedor a definir (ex.: WPPConnect, Meta Cloud API, Twilio)
- Pagamentos: a definir (opcional, roadmap)
- E-mail/SMS: a definir (opcional)

## Modelo de Dados (alto nível)
- Usuário (profissional)
- Cliente
- Orçamento/Pedido
- Item de Catálogo
- Produção (etapas, insumos, custos)
- Mensagem/Conversa

Observação: O diagrama físico e o esquema detalhado serão definidos conforme o MVP evoluir.

## Operação e Infraestrutura
- VPS com Portainer + Traefik (reverse proxy) já previstos
- Diretório `festa-com-ia-dockercompose` conterá os manifests para orquestração
- Ambientes: dev (local), staging (opcional), prod (VPS)
- Deploy: a definir (CI/CD opcional em fase inicial)

## Segurança
- Autenticação e autorização (RBAC simples)
- Armazenamento seguro de segredos (variáveis de ambiente)
- Princípio de menor privilégio para integrações externas

## Observabilidade
- Logs estruturados no Backend
- Métricas básicas (saúde, tráfego, erros)
- Dashboard futuro (a definir)

## Decisões em Aberto
- Stack final de Frontend e Backend
- Provedor de WhatsApp
- Banco de dados e migrações
- Provedor de IA (API externa vs. modelo local)

## Próximos Passos
- Refinar requisitos do MVP e casos de uso principais
- Selecionar stack inicial e esqueleto de serviços
- Definir esquema mínimo de dados e migrações
- Implementar fluxo de orçamentos e conversas (MVP)
