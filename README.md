# Festa com IA
Plataforma destinada a profissionais que produzem bolos, doces e itens de festa em geral. Foco em orçamentos, produção, comunicação com clientes (WhatsApp) e assistência com IA.

## Status do Projeto
- Fase: MVP Frontend com integração ao Postgres local — em desenvolvimento ativo
- Stack: Next.js 14 (App Router), TypeScript, TailwindCSS
- Dados: arquitetura híbrida
  - Supabase para Auth, profiles e cadastro do profissional
  - Postgres local para toda a operação do sistema

## Funcionalidades Implementadas
- **Painel Kanban** interativo com 6 etapas (Atendimento → Entregue) consumindo pedidos reais do Postgres local
  - Drag & drop entre colunas (mouse e toque mobile)
  - Scroll horizontal com botões e deslize de dedo
  - Cor de fundo dos cards por urgência de entrega
  - Histórico de mensagens com bolhas de chat (expansível)
  - Sugestões de resposta com IA (expansíveis)
  - Botões Avançar etapa e Cancelar
- **Dashboard** com métricas calculadas a partir dos pedidos reais do Postgres local
- **Pedidos** — listagem com filtros, modal de detalhes e modal de cadastro, também conectada ao Postgres local
- **Clientes** — listagem de clientes
- **Configurações** — placeholder para integrações futuras

## Roadmap
1. ✅ Frontend MVP (Painel, Dashboard, Pedidos, Clientes)
2. ⬜ Backend (API REST + WebSockets)
3. ⬜ Integração WhatsApp (WPPConnect / Meta Cloud API)
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

## Documentação
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Fluxo Operacional](./docs/OPERATIONAL_FLOW.md)
- [Páginas](./docs/PAGES.md)
- [Componentes](./docs/COMPONENTS.md)
- [Modelo de Dados](./docs/DATA_MODEL.md)
- [Changelog](./docs/CHANGELOG.md)

## Licença
A definir
