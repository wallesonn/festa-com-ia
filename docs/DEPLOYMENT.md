# Deploy na VPS com Portainer

Este documento descreve o deploy da aplicação **Festa com IA** em uma VPS usando **Portainer**, **Traefik**, **Postgres** e **Redis**.

## Escopo

O stack principal faz o deploy de:

- **`web`**: aplicação Next.js
- **`postgres`**: banco operacional local
- **`redis`**: suporte a filas/cache auxiliar

O n8n é tratado como integração complementar e pode rodar em um stack separado, se necessário.

---

## Visão geral do stack

O arquivo base do deploy fica em:

- `festa-com-ia-dockercompose/docker-compose.yml`

Serviços definidos nesse compose:

- `web`
- `postgres`
- `redis`

Rede e dependências:

- `web` usa a rede externa `web` para falar com o Traefik
- `web` também usa a rede interna `internal` para acessar o Postgres
- `postgres` e `redis` rodam apenas na infraestrutura interna do stack

---

## Pré-requisitos

Antes de subir o stack, garanta que você já tenha:

- uma VPS com Docker e Docker Compose instalados
- Portainer funcionando na VPS
- Traefik já configurado com a rede externa `web`
- um domínio público apontando para a VPS
- uma imagem publicada da aplicação no Docker Hub ou registry equivalente
- acesso ao projeto Supabase para Auth e cadastro do profissional

---

## Variáveis de ambiente

As variáveis abaixo são as principais usadas pelo stack no Portainer. Você pode copiar os blocos deste documento diretamente para preencher o stack.

### Obrigatórias para runtime

```env
APP_DOMAIN=festacomia.pro
IMAGE_TAG=latest
POSTGRES_DB=festacomia
POSTGRES_USER=festacomia
POSTGRES_PASSWORD=<senha-forte>
REDIS_PASSWORD=<senha-forte>
N8N_WEBHOOK_URL=http://n8n:5678/webhook/send-message
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Opcionais

```env
NEXT_PUBLIC_SITE_URL=https://festacomia.pro
DOCKER_IMAGE=seu-usuario/sua-imagem
```

### Somente se você for rebuildar a imagem

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Template completo para o Portainer

Use este bloco como referência única para preencher o stack no Portainer. Se você não for rebuildar a imagem na VPS, pode omitir `DOCKER_IMAGE`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```env
APP_DOMAIN=festacomia.pro
IMAGE_TAG=latest
POSTGRES_DB=festacomia
POSTGRES_USER=festacomia
POSTGRES_PASSWORD=<senha-forte>
REDIS_PASSWORD=<senha-forte>
N8N_WEBHOOK_URL=http://n8n:5678/webhook/send-message
NEXT_PUBLIC_SITE_URL=https://festacomia.pro
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DOCKER_IMAGE=seu-usuario/sua-imagem
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Variáveis extras para n8n no mesmo VPS

Se o n8n também estiver no mesmo ambiente, adicione estas variáveis no stack dele:

```env
N8N_DOMAIN=n8n.festacomia.pro
N8N_ENCRYPTION_KEY=<chave-aleatoria-32-bytes>
```

> O `N8N_WEBHOOK_URL` do app deve apontar para o container do n8n na rede Docker interna quando ambos estiverem no mesmo VPS.

---

## Ordem recomendada de deploy

### 1. Criar a rede externa do Traefik

O compose da aplicação usa a rede `web` como rede externa.

Se ela ainda não existir, crie antes do deploy:

```bash
docker network create web
```

### 2. Subir o stack base

No Portainer:

1. vá em **Stacks**
2. clique em **Add stack**
3. aponte para o `docker-compose.yml`
4. preencha as variáveis de ambiente
5. faça o deploy

### 3. Validar os serviços

Depois de subir o stack, verifique se os serviços estão saudáveis:

- `web`
- `postgres`
- `redis`

### 4. Validar o acesso público

Confirme que o domínio configurado em `APP_DOMAIN` responde corretamente via Traefik.

---

## O que cada variável faz

| Variável | Uso |
|----------|-----|
| `APP_DOMAIN` | domínio público da aplicação usado pelo Traefik |
| `IMAGE_TAG` | tag da imagem Docker usada pelo serviço `web` |
| `POSTGRES_DB` | nome do banco operacional |
| `POSTGRES_USER` | usuário do banco operacional |
| `POSTGRES_PASSWORD` | senha do Postgres |
| `REDIS_PASSWORD` | senha do Redis |
| `N8N_WEBHOOK_URL` | URL interna do webhook do n8n para envio de mensagens |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service role do Supabase usada no backend para exclusão total da conta |
| `NEXT_PUBLIC_SITE_URL` | URL pública usada no build e em links absolutos |
| `DOCKER_IMAGE` | nome da imagem publicada, útil em builds/redeploys |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase, usada no build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon do Supabase, usada no build |
| `N8N_DOMAIN` | domínio público do n8n quando ele roda na VPS |
| `N8N_ENCRYPTION_KEY` | chave de criptografia interna do n8n |

---

## Exemplo de stack no Portainer

```env
APP_DOMAIN=festacomia.pro
IMAGE_TAG=latest
POSTGRES_DB=festacomia
POSTGRES_USER=festacomia
POSTGRES_PASSWORD=sua_senha_forte
REDIS_PASSWORD=sua_senha_forte
N8N_WEBHOOK_URL=http://n8n:5678/webhook/send-message
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_SITE_URL=https://festacomia.pro
```

Se você for publicar uma imagem nova, adicione também:

```env
DOCKER_IMAGE=seu-usuario/sua-imagem
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Fluxo de startup esperado

Ao subir o stack, o fluxo esperado é:

1. **Postgres** inicia e carrega os dados persistidos no volume `postgres_data`
2. **Redis** inicia e fica disponível para o restante do stack
3. **web** sobe apontando para `DATABASE_URL` interno da rede Docker
4. **Traefik** expõe a aplicação no domínio configurado em `APP_DOMAIN`

---

## Integração com o n8n

O n8n não faz parte do stack principal da aplicação neste compose, mas pode ser adicionado como stack separado na mesma VPS.

Quando isso acontecer:

- o app envia mensagens para `N8N_WEBHOOK_URL`
- o n8n recebe o webhook e dispara o WhatsApp via Uazapi
- o n8n grava ou atualiza mensagens no Postgres operacional

Se o n8n estiver em outro stack, ajuste a URL do webhook conforme a topologia:

- `http://n8n:5678/webhook/send-message` quando estiver na mesma rede Docker
- `https://n8n.seu-dominio.com/webhook/send-message` quando estiver exposto por Traefik
- `http://host.docker.internal:5678/webhook/send-message` quando estiver acessível pela porta do host

---

## Segurança

- nunca commite `POSTGRES_PASSWORD`, `REDIS_PASSWORD` ou `N8N_ENCRYPTION_KEY`
- use senhas fortes e únicas para cada ambiente
- prefira variáveis separadas por ambiente: local, staging e produção
- mantenha `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas nos ambientes que realmente precisam rebuildar a imagem
- nunca commite `SUPABASE_SERVICE_ROLE_KEY`; ela dá acesso administrativo ao Supabase Auth

---

## Arquivos relacionados

- `festa-com-ia-dockercompose/docker-compose.yml`
- `.env.build.example`
- `env.local.example`
- `docs/MESSAGING_FLOW.md`
- `docs/ARCHITECTURE.md`

---

## Checklist rápido de deploy

- [ ] rede `web` criada no Docker
- [ ] domínio apontando para a VPS
- [ ] Portainer acessível
- [ ] variáveis de ambiente preenchidas
- [ ] imagem publicada disponível
- [ ] stack do app implantado
- [ ] Postgres e Redis saudáveis
- [ ] URL pública respondendo no `APP_DOMAIN`
- [ ] `N8N_WEBHOOK_URL` validada, se o n8n estiver ativo

---

## Observação final

Se você quiser padronizar totalmente o deploy, o próximo passo ideal é ter também um documento separado para o **stack do n8n**.
