# Festa com IA
Plataforma destinada a profissionais que produzem bolos, doces e itens de festa em geral. Foco em orçamentos, produção, comunicação com clientes (WhatsApp) e assistência com IA.

## Status do Projeto
- Fase: MVP Frontend com integração ao Postgres local — em desenvolvimento ativo
- Stack: Next.js 14 (App Router), TypeScript, TailwindCSS
- Dados: arquitetura híbrida
  - Supabase para Auth e **fonte de verdade do cadastro do profissional** (`festa-com-ia-professionals`)
  - Postgres local para todas as tabelas operacionais do sistema
  - UI operacional com atualização em tempo real via notificações do Postgres

## Deploy e Banco de Dados
- O container da aplicação aplica automaticamente o schema final local do Postgres ao subir no VPS
- Se o banco estiver vazio, a stack cria um profissional ativo padrão para permitir o primeiro pedido sem intervenção manual
- O schema final de Supabase fica separado e não entra no boot do banco operacional local
- Os dados de perfil do profissional permanecem somente no Supabase; o Postgres local fica restrito às entidades operacionais
- O schema operacional final do Postgres local fica em `supabase/schema/local_postgres_final.sql`
- O schema final de Supabase fica em `supabase/schema/supabase_final.sql` e cobre Auth, perfil do profissional e Storage

## Funcionalidades Implementadas
- **Login com Supabase Auth** em `/login` com email/senha
- **Proteção de sessão** nas rotas internas da aplicação (redireciona para login quando não autenticado)
- **Painel Kanban** interativo com 6 etapas (Atendimento → Entregue) consumindo pedidos reais do Postgres local, com visual glassmorphism e persistência das mudanças de status no banco
  - Atualização em tempo real via `LISTEN/NOTIFY` do Postgres para refletir mudanças do n8n sem polling
  - Drag & drop entre colunas (mouse e toque mobile)
  - Scroll horizontal com botões e deslize de dedo
  - Pedidos com mensagens do cliente ainda não respondidas aparecem primeiro dentro de cada coluna
  - O card exibe um badge verde com a quantidade de mensagens pendentes e o cabeçalho da coluna também muda de cor quando há cards com pendências
  - Cor de fundo dos cards por urgência de entrega
  - Histórico de mensagens com bolhas de chat (expansível)
  - Sugestões de resposta com IA (expansíveis)
  - Botões Avançar etapa e Cancelar
- **Dashboard** com métricas calculadas a partir dos pedidos reais do Postgres local e layout em cards glassmorphism
- **Pedidos** — listagem com filtros, modal de detalhes e modal de cadastro, também conectada ao Postgres local e às tags por grupo do profissional
  - A tela reflete alterações do banco em tempo real, sem depender de cache do navegador
  - Pedidos `entregue` ou `cancelado` há mais de 3 dias ficam fora das listas principais do painel e de pedidos
  - Ao marcar um pedido como `entregue` ou `cancelado`, a conversa vinculada é finalizada/arquivada para que novas mensagens do cliente abram um novo atendimento
  - Exportação em `.xlsx` dos pedidos arquivados diretamente pela tela de Pedidos
  - Criação de pedidos já inicia com status de painel em `agendado`
  - Exclusão de pedidos direto pela tela de detalhes
  - Modal de detalhes exibe o status atual do painel
- **Integração n8n/IA** — o workflow inbound gera sugestões com DeepSeek usando o histórico da conversa e o histórico completo de pedidos do cliente como contexto auxiliar
- **Clientes** — o fluxo inbound também pode atualizar `clients.profile_photo_url` com a foto recebida da Uazapi, usando fallback de avatar quando não houver URL
- **Envio outbound via n8n/Uazapi** — o app envia `instanceId` no webhook de saída e o workflow consulta `uazapi_instances.instance_token` no Postgres antes de disparar o `POST /send/text`, sem expor o token no payload
- **Produtos** — cadastro das linhas, subgrupos e variações por grupo de produto
- **Perfil** (`/perfil`) com onboarding do profissional, edição de dados básicos, WhatsApp padronizado para Brasil e exclusão total da conta com remoção dos dados
  - A verificação de conexão do WhatsApp agora revalida o status direto na Uazapi pelo endpoint administrativo de listagem de instâncias antes de atualizar a tela
  - O backend usa `UAZAPI_ADMIN_TOKEN` para consultar `/instance/all` e refletir corretamente desconexões feitas fora do app
  - Se a instância do profissional for apagada manualmente na Uazapi, o app limpa o vínculo local e recria a conexão no próximo fluxo de conexão
  - Ao conectar/reutilizar a instância, o backend garante dois webhooks idempotentes por instância com as URLs de produção e teste configuradas por ambiente
  - A tela exibe um alerta quando o telefone salvo no perfil diverge do número já conectado na Uazapi
- **Clientes** — listagem de clientes
- **Configurações da Conta** (`/configuracoes`) redireciona para `/perfil`

## Roadmap
1. ✅ Frontend MVP (Painel, Dashboard, Pedidos, Clientes)
2. ⬜ Backend (API REST + WebSockets)
3. ⬜ Integração WhatsApp via Uazapi (referência oficial: docs.uazapi.com)
   - A tela de perfil usa a listagem administrativa da Uazapi para descobrir/revalidar a instância e o status atual da conexão
   - Se a instância sumir da Uazapi, o próximo fluxo de conexão recria a instância e reaplica os webhooks automaticamente
   - O outbound do painel envia `instanceId` para o n8n, que consulta o token da instância no Postgres antes de chamar a Uazapi
4. ⬜ IA assistiva (sugestões de resposta, estimativas)
5. ⬜ Autenticação e multi-tenant
6. ⬜ Deploy em VPS (Portainer + Traefik)

## Como Rodar

```bash
# Instalar dependências
npm install

# Subir o Postgres local do projeto
cd festa-com-ia-dockercompose
cp .env.example .env
docker compose up -d postgres

# Voltar para a raiz e popular o banco com os dados demo
cd ..
npm run seed

# Rodar em modo desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do Repositório
- `app/` — páginas Next.js (App Router)
- `components/` — componentes React reutilizáveis
- `lib/` — tipos, mock de dados e utilitários
- `docs/` — documentação detalhada do projeto
- `festa-com-ia-dockercompose/` — manifests de orquestração para VPS
- `supabase/schema/` — schemas finais consolidados para o Postgres local e para o Supabase

## Documentação
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Deploy na VPS](./docs/DEPLOYMENT.md)
- [Fluxo Operacional](./docs/OPERATIONAL_FLOW.md)
- [Páginas](./docs/PAGES.md)
- [Componentes](./docs/COMPONENTS.md)
- [Modelo de Dados](./docs/DATA_MODEL.md)
- [Changelog](./docs/CHANGELOG.md)

## Licença
A definir
