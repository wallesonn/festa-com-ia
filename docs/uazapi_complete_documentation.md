# uazapiGO - WhatsApp API
**Versão:** 2.0.1

API para gerenciamento de instâncias do WhatsApp e comunicações.

## ⚠️ Recomendação Importante: WhatsApp Business
**É ALTAMENTE RECOMENDADO usar contas do WhatsApp Business** em vez do WhatsApp normal para integração, o WhatsApp normal pode apresentar inconsistências, desconexões, limitações e instabilidades durante o uso com a nossa API.

## Autenticação
- Endpoints regulares requerem um header 'token' com o token da instância
- Endpoints administrativos requerem um header 'admintoken'

## Estados da Instância
As instâncias podem estar nos seguintes estados:
- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado com sucesso

## Limites de Uso
- O servidor possui um limite máximo de instâncias conectadas
- Quando o limite é atingido, novas tentativas receberão erro 429
- Servidores gratuitos/demo podem ter restrições adicionais de tempo de vida

## Servidores
- **URL:** `https://{subdomain}.uazapi.com`
  - **Descrição:** Servidor da API uazapiGO

## Autenticação
### token
- **Tipo:** apiKey
- **In:** header
### admintoken
- **Tipo:** apiKey
- **In:** header
- **Descrição:** Token de administrador para endpoints administrativos

## Endpoints
### Tag: Admininstração
#### Criar Instancia
`POST /instance/create`

Cria uma nova instância do WhatsApp. Para criar uma instância você precisa:

1. Ter um admintoken válido
2. Enviar pelo menos o nome da instância
3. A instância será criada desconectada
4. Será gerado um token único para autenticação

Após criar a instância, guarde o token retornado pois ele será necessário
para todas as outras operações.

Estados possíveis da instância:

- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado

Campos administrativos (adminField01/adminField02) são opcionais e podem ser usados para armazenar metadados personalizados. 
OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api (via admin token) pode editá-los.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome da inst\u00e2ncia",
      "example": "minha-instancia"
    },
    "systemName": {
      "type": "string",
      "description": "Nome do sistema (opcional, padr\u00e3o 'uazapiGO' se n\u00e3o informado)",
      "example": "apilocal"
    },
    "adminField01": {
      "type": "string",
      "description": "Campo administrativo 1 para metadados personalizados (opcional)",
      "example": "custom-metadata-1"
    },
    "adminField02": {
      "type": "string",
      "description": "Campo administrativo 2 para metadados personalizados (opcional)",
      "example": "custom-metadata-2"
    }
  },
  "required": [
    "name"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Listar todas as instâncias
`GET /instance/all`

Retorna uma lista completa de todas as instâncias do sistema, incluindo:
- ID e nome de cada instância
- Status atual (disconnected, connecting, connected)
- Data de criação
- Última desconexão e motivo
- Informações de perfil (se conectado)

Requer permissões de administrador.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de instâncias retornada com sucesso |
| 401 | Token inválido ou expirado |
| 403 | Token de administrador inválido |
| 500 | Erro interno do servidor |

---
#### Atualizar campos administrativos
`POST /instance/updateAdminFields`

Atualiza os campos administrativos (adminField01/adminField02) de uma instância.

Campos administrativos são opcionais e podem ser usados para armazenar metadados personalizados. 
Estes campos são persistidos no banco de dados e podem ser utilizados para integrações com outros sistemas ou para armazenamento de informações internas.
OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api (via admin token) pode editá-los.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID da inst\u00e2ncia",
      "example": "inst_123456"
    },
    "adminField01": {
      "type": "string",
      "description": "Campo administrativo 1",
      "example": "clientId_456"
    },
    "adminField02": {
      "type": "string",
      "description": "Campo administrativo 2",
      "example": "integration_xyz"
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Campos atualizados com sucesso |
| 401 | Token de administrador inválido |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Ver Webhook Global
`GET /globalwebhook`

Retorna a configuração atual do webhook global, incluindo:
- URL configurada
- Eventos ativos
- Filtros aplicados
- Configurações adicionais

Exemplo de resposta:
```json
{
  "enabled": true,
  "url": "https://example.com/webhook",
  "events": ["messages", "messages_update"],
  "excludeMessages": ["wasSentByApi", "isGroupNo"],
  "addUrlEvents": true,
  "addUrlTypesMessages": true
}
```


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração atual do webhook global |
| 401 | Token de administrador não fornecido |
| 403 | Token de administrador inválido ou servidor demo |
| 404 | Webhook global não encontrado |

---
#### Configurar Webhook Global
`POST /globalwebhook`

Configura um webhook global que receberá eventos de todas as instâncias.

### 🚀 Configuração Simples (Recomendada)

**Para a maioria dos casos de uso**:
- Configure apenas URL e eventos desejados
- Modo simples por padrão (sem complexidade)
- **Recomendado**: Sempre use `"excludeMessages": ["wasSentByApi"]` para evitar loops
- **Exemplo**: `{"url": "https://webhook.cool/global", "events": ["messages", "connection"], "excludeMessages": ["wasSentByApi"]}`

### 🧪 Sites para Testes (ordenados por qualidade)

**Para testar webhooks durante desenvolvimento**:
1. **https://webhook.cool/** - ⭐ Melhor opção (sem rate limit, interface limpa)
2. **https://rbaskets.in/** - ⭐ Boa alternativa (confiável, baixo rate limit)
3. **https://webhook.site/** - ⚠️ Evitar se possível (rate limit agressivo)

### Funcionalidades Principais:
- Configuração de URL para recebimento de eventos
- Seleção granular de tipos de eventos
- Filtragem avançada de mensagens
- Parâmetros adicionais na URL

**Eventos Disponíveis**:
- `connection`: Alterações no estado da conexão
- `history`: Recebimento de histórico de mensagens
- `messages`: Novas mensagens recebidas
- `messages_update`: Atualizações em mensagens existentes
- `call`: Eventos de chamadas VoIP
- `contacts`: Atualizações na agenda de contatos
- `presence`: Alterações no status de presença
- `groups`: Modificações em grupos
- `labels`: Gerenciamento de etiquetas
- `chats`: Eventos de conversas
- `chat_labels`: Alterações em etiquetas de conversas
- `blocks`: Bloqueios/desbloqueios
- `sender`: Atualizações de campanhas, quando inicia, e quando completa

**Remover mensagens com base nos filtros**:
- `wasSentByApi`: Mensagens originadas pela API ⚠️ **IMPORTANTE:** Use sempre este filtro para evitar loops em automações
- `wasNotSentByApi`: Mensagens não originadas pela API
- `fromMeYes`: Mensagens enviadas pelo usuário
- `fromMeNo`: Mensagens recebidas de terceiros
- `isGroupYes`: Mensagens em grupos
- `isGroupNo`: Mensagens em conversas individuais

💡 **Prevenção de Loops Globais**: O webhook global recebe eventos de TODAS as instâncias. Se você tem automações que enviam mensagens via API, sempre inclua `"excludeMessages": ["wasSentByApi"]`. Caso prefira receber esses eventos, certifique-se de que sua automação detecta mensagens enviadas pela própria API para não criar loops infinitos em múltiplas instâncias.

**Parâmetros de URL**:
- `addUrlEvents` (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL.
  Exemplo: `https://api.example.com/webhook/{evento}`
- `addUrlTypesMessages` (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL.
  Exemplo: `https://api.example.com/webhook/{tipo_mensagem}`

**Combinações de Parâmetros**:
- Ambos ativos: `https://api.example.com/webhook/{evento}/{tipo_mensagem}`
  Exemplo real: `https://api.example.com/webhook/message/conversation`
- Apenas eventos: `https://api.example.com/webhook/message`
- Apenas tipos: `https://api.example.com/webhook/conversation`

**Notas Técnicas**:
1. Os parâmetros são adicionados na ordem: evento → tipo mensagem
2. A URL deve ser configurada para aceitar esses parâmetros dinâmicos
3. Funciona com qualquer combinação de eventos/mensagens


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL para receber os eventos",
      "example": "https://webhook.cool/global"
    },
    "events": {
      "type": "array",
      "description": "Lista de eventos monitorados",
      "items": {
        "type": "string",
        "enum": [
          "connection",
          "history",
          "messages",
          "messages_update",
          "newsletter_messages",
          "call",
          "contacts",
          "presence",
          "groups",
          "labels",
          "chats",
          "chat_labels",
          "blocks",
          "sender"
        ]
      },
      "example": [
        "messages",
        "connection"
      ]
    },
    "excludeMessages": {
      "type": "array",
      "description": "Filtros para excluir tipos de mensagens",
      "items": {
        "type": "string",
        "enum": [
          "wasSentByApi",
          "wasNotSentByApi",
          "fromMeYes",
          "fromMeNo",
          "isGroupYes",
          "isGroupNo"
        ]
      },
      "example": [
        "wasSentByApi"
      ]
    },
    "addUrlEvents": {
      "type": "boolean",
      "description": "Adiciona o tipo do evento como par\u00e2metro na URL.\n- `false` (padr\u00e3o): URL normal\n- `true`: Adiciona evento na URL (ex: `/webhook/message`)\n",
      "default": false
    },
    "addUrlTypesMessages": {
      "type": "boolean",
      "description": "Adiciona o tipo da mensagem como par\u00e2metro na URL.\n- `false` (padr\u00e3o): URL normal  \n- `true`: Adiciona tipo da mensagem (ex: `/webhook/conversation`)\n",
      "default": false
    }
  },
  "required": [
    "url",
    "events"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Webhook global configurado com sucesso |
| 400 | Payload inválido |
| 401 | Token de administrador não fornecido |
| 403 | Token de administrador inválido ou servidor demo |
| 500 | Erro interno do servidor |

---
#### Ver últimos erros do webhook global
`GET /globalwebhook/errors`

Retorna em memória os últimos 20 erros de entrega do webhook global.

Cada item inclui data/hora (`created`), URL de destino, evento, tipo do webhook
(`global`), payload tentado, número de tentativas, status HTTP final quando existir e a mensagem de erro.

Observações:
- O histórico fica apenas em memória e é perdido quando o processo reinicia.
- O endpoint exige `admintoken`.
- Útil para diagnosticar falhas do webhook global sem expor esses dados aos tokens das instâncias.
- O header `X-Webhook-Error-Capture-Started-At` informa desde quando a captura atual está valendo.

Exemplo de consulta:
```bash
curl -X GET "$BASE_URL/globalwebhook/errors" \
  -H "admintoken: SEU_ADMIN_TOKEN"
```


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Histórico global retornado com sucesso |
| 401 | Token de administrador não fornecido |
| 403 | Token de administrador inválido ou servidor demo |

---
#### Reiniciar a aplicação
`POST /admin/restart`

Reinicia toda a aplicação para forçar a reconexão de todas as instâncias de uma vez.

Use apenas em situações realmente necessárias, como instabilidades gerais.
Após o restart, os números entram em reconexão automática e não ficam desconectados permanentemente.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 202 | Reinicio agendado com sucesso |
| 500 | Erro interno do servidor ao agendar o reinicio |

---
### Tag: Instancia
#### Conectar instância ao WhatsApp
`POST /instance/connect`

Inicia o processo de conexão de uma instância ao WhatsApp. Este endpoint:
1. Requer o token de autenticação da instância
2. Recebe o número de telefone associado à conta WhatsApp
3. Gera um QR code caso não passe o campo `phone`
4. Ou Gera código de pareamento se passar o o campo `phone`
5. Atualiza o status da instância para "connecting"

O processo de conexão permanece pendente até que:
- O QR code seja escaneado no WhatsApp do celular, ou
- O código de pareamento seja usado no WhatsApp
- Timeout de 2 minutos para QRCode seja atingido ou 5 minutos para o código de pareamento

Use o endpoint /instance/status para monitorar o progresso da conexão.

Estados possíveis da instância:
- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado

Sincronização e armazenamento de mensagens:
- Todas as mensagens recebidas da Meta durante a sincronização da conexão (leitura do QR code) são enviadas no evento `history` do webhook.
- As mensagens dos últimos 7 dias são armazenadas no banco de dados e ficam acessíveis pelos endpoints: `POST /message/find` e `POST /chat/find`.
- Depois que a instância conecta, todas as mensagens enviadas ou recebidas são armazenadas no banco de dados.
- Mensagens mais antigas do que 7 dias são excluídas durante a madrugada.

Exemplo de requisição:
```json
{
  "phone": "5511999999999"
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "phone": {
      "type": "string",
      "description": "N\u00famero de telefone no formato internacional (ex: 5511999999999). Se informado, gera c\u00f3digo de pareamento. Se omitido, gera QR code.",
      "example": "5511999999999",
      "pattern": "^\\d{10,15}$"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 429 | Limite de conexões simultâneas atingido |
| 500 | Erro interno |

---
#### Desconectar instância
`POST /instance/disconnect`

Desconecta a conta do WhatsApp atualmente conectada, encerrando a sessão atual.
Esta operação:

- Encerra a conexão ativa

- Requer novo QR code para reconectar


Diferenças entre desconectar e hibernar:

- Desconectar: Encerra completamente a sessão, exigindo novo login

- Hibernar: Mantém a sessão ativa, apenas pausa a conexão


Use este endpoint para:

1. Encerrar completamente uma sessão

2. Forçar uma nova autenticação

3. Limpar credenciais da sessão atual

4. Reiniciar o processo de conexão


Estados possíveis após desconectar:

- `disconnected`: Desconectado do WhatsApp

- `connecting`: Em processo de reconexão (após usar /instance/connect)


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Reiniciar runtime da instância
`POST /instance/reset`

Solicita um reset controlado do runtime da instância atual.

Este endpoint é útil quando a sessão ficou presa, o envio não está progredindo
ou a instância precisa forçar uma tentativa de recuperação sem apagar o registro
da instância.

Comportamentos possíveis:
- inicia um novo reset quando a instância está apta
- informa que um reset já está em andamento
- informa que existe cooldown ativo entre resets
- retorna erro quando a sessão não pode ser recuperada ou quando a política de
  reconexão bloqueia a operação

A resposta sempre informa:
- `instanceId`: ID da instância autenticada
- `resetting`: se há reset em andamento no momento
- `queuedRecoveryAttempted`: se houve tentativa de recuperação da fila interna


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Reset aceito, já em andamento ou em cooldown |
| 400 | Payload JSON inválido |
| 401 | Token inválido, ausente ou cliente não encontrado |
| 403 | Reset bloqueado pela política de reconexão |
| 409 | Sessão atual não é reconectável por reset |
| 500 | Erro interno ao solicitar o reset |

---
#### Verificar status da instância
`GET /instance/status`

Retorna o status atual de uma instância, incluindo:
- Estado da conexão (disconnected, connecting, connected)
- QR code atualizado (se em processo de conexão)
- Código de pareamento (se disponível)
- Informações da última desconexão
- Detalhes completos da instância

Este endpoint é particularmente útil para:
1. Monitorar o progresso da conexão
2. Obter QR codes atualizados durante o processo de conexão
3. Verificar o estado atual da instância
4. Identificar problemas de conexão

Estados possíveis:
- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão (aguardando QR code ou código de pareamento)
- `connected`: Conectado e autenticado com sucesso


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Consultar limites atuais de novas conversas no WhatsApp
`GET /instance/wa_messages_limits`

Consulta o estado atual de limitação do WhatsApp para a conta atualmente conectada.

Este endpoint é útil para:
- diagnosticar erros de envio com `provider_code: 463`
- verificar se o WhatsApp indica que a conta atualmente conectada pode iniciar novas conversas
- exibir informações de suporte antes de campanhas ou envios de alto volume

A resposta consolida duas fontes internas do WhatsApp:
- `new_chat_message_capping`: limite de mensagens para iniciar novas conversas
- `reachout_timelock`: restrição temporária para iniciar novas conversas

Observações:
- este endpoint depende de sessão ativa e conectada
- se o WhatsApp não retornar os dados esperados, a resposta pode marcar os blocos como indisponíveis via `available: false` e `lookup_error`
- `message` descreve o estado atual da conta atualmente conectada
- `provider_message` detalha o motivo reportado pelo WhatsApp quando houver restrição ativa


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Diagnóstico atual dos limites de novas conversas da conta atualmente conectada |
| 401 | Token inválido ou ausente |
| 500 | Erro interno ao consultar os limites |

---
#### Atualizar nome da instância
`POST /instance/updateInstanceName`

Atualiza o nome de uma instância WhatsApp existente.
O nome não precisa ser único.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Novo nome para a inst\u00e2ncia",
      "example": "Minha Nova Inst\u00e2ncia 2024!@#"
    }
  },
  "required": [
    "name"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Deletar instância
`DELETE /instance`

Remove a instância do sistema.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Instância deletada com sucesso |
| 401 | Falha na autenticação |
| 404 | Instância não encontrada |
| 500 | Erro interno do servidor |

---
#### Buscar configurações de privacidade
`GET /instance/privacy`

Busca as configurações de privacidade atuais da conta do WhatsApp atualmente conectada.

**Importante - Diferença entre Status e Broadcast:**

- **Status**: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível", "Ocupado", texto personalizado)
- **Broadcast**: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)

**Limitação**: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração via API.

Retorna todas as configurações de privacidade como quem pode:
- Adicionar aos grupos
- Ver visto por último
- Ver status (recado embaixo do nome)
- Ver foto de perfil
- Receber confirmação de leitura
- Ver status online
- Fazer chamadas


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configurações de privacidade obtidas com sucesso |
| 401 | Token de autenticação inválido |
| 500 | Erro interno do servidor |

---
#### Alterar configurações de privacidade
`POST /instance/privacy`

Altera uma ou múltiplas configurações de privacidade da conta do WhatsApp atualmente conectada de forma otimizada.

**Importante - Diferença entre Status e Broadcast:**

- **Status**: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível", "Ocupado", texto personalizado)
- **Broadcast**: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)

**Limitação**: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração via API.

**Características:**
- ✅ **Eficiência**: Altera apenas configurações que realmente mudaram
- ✅ **Flexibilidade**: Pode alterar uma ou múltiplas configurações na mesma requisição
- ✅ **Feedback completo**: Retorna todas as configurações atualizadas

**Formato de entrada:**
```json
{
  "groupadd": "contacts",
  "last": "none",
  "status": "contacts"
}
```

**Tipos de privacidade disponíveis:**
- `groupadd`: Quem pode adicionar aos grupos
- `last`: Quem pode ver visto por último
- `status`: Quem pode ver status (recado embaixo do nome)
- `profile`: Quem pode ver foto de perfil
- `readreceipts`: Confirmação de leitura
- `online`: Quem pode ver status online
- `calladd`: Quem pode fazer chamadas

**Valores possíveis:**
- `all`: Todos
- `contacts`: Apenas contatos
- `contact_blacklist`: Contatos exceto bloqueados
- `none`: Ninguém
- `match_last_seen`: Corresponder ao visto por último (apenas para online)
- `known`: Números conhecidos (apenas para calladd)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupadd": {
      "type": "string",
      "enum": [
        "all",
        "contacts",
        "contact_blacklist",
        "none"
      ],
      "description": "Quem pode adicionar aos grupos. Valores - all, contacts, contact_blacklist, none"
    },
    "last": {
      "type": "string",
      "enum": [
        "all",
        "contacts",
        "contact_blacklist",
        "none"
      ],
      "description": "Quem pode ver visto por \u00faltimo. Valores - all, contacts, contact_blacklist, none"
    },
    "status": {
      "type": "string",
      "enum": [
        "all",
        "contacts",
        "contact_blacklist",
        "none"
      ],
      "description": "Quem pode ver status (recado embaixo do nome). Valores - all, contacts, contact_blacklist, none"
    },
    "profile": {
      "type": "string",
      "enum": [
        "all",
        "contacts",
        "contact_blacklist",
        "none"
      ],
      "description": "Quem pode ver foto de perfil. Valores - all, contacts, contact_blacklist, none"
    },
    "readreceipts": {
      "type": "string",
      "enum": [
        "all",
        "none"
      ],
      "description": "Confirma\u00e7\u00e3o de leitura. Valores - all, none"
    },
    "online": {
      "type": "string",
      "enum": [
        "all",
        "match_last_seen"
      ],
      "description": "Quem pode ver status online. Valores - all, match_last_seen"
    },
    "calladd": {
      "type": "string",
      "enum": [
        "all",
        "known"
      ],
      "description": "Quem pode fazer chamadas. Valores - all, known"
    }
  },
  "minProperties": 1,
  "additionalProperties": false
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração de privacidade alterada com sucesso |
| 400 | Dados de entrada inválidos |
| 401 | Token de autenticação inválido |
| 500 | Erro interno do servidor |

---
#### Atualizar status de presença da instância
`POST /instance/presence`

Atualiza o status de presença global da conta do WhatsApp atualmente conectada. Este endpoint permite:
1. Definir se a conta aparece como disponível ("online") ou indisponível
2. Controlar o status de presença para todos os contatos
3. Salvar o estado atual da presença para a conta conectada

Tipos de presença suportados:
- available: Marca a conta como disponível/online
- unavailable: Marca a conta como indisponível/offline

**Atenção**:
- O status de presença pode ser temporariamente alterado para "available" (online) em algumas situações internas da API, e com isso o visto por último também pode ser atualizado.
- Caso isso for um problema, considere alterar suas configurações de privacidade no WhatsApp para não mostrar o visto por último e/ou quem pode ver seu status "online".

**⚠️ Importante - Limitação do Presence "unavailable"**:
- **Quando a API é o único dispositivo ativo**: Confirmações de entrega/leitura (ticks cinzas/azuis) não são enviadas nem recebidas
- **Impacto**: Eventos `message_update` com status de entrega podem não ser recebidos
- **Solução**: Se precisar das confirmações, mantenha WhatsApp Web ou aplicativo móvel ativo ou use presence "available" 

Exemplo de requisição:
```json
{
  "presence": "available"
}
```

Exemplo de resposta:
```json
{
  "response": "Presence updated successfully"
}
```

Erros comuns:
- 401: Token inválido ou expirado
- 400: Valor de presença inválido
- 500: Erro ao atualizar presença


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "presence": {
      "type": "string",
      "description": "Status de presen\u00e7a da conta atualmente conectada",
      "enum": [
        "available",
        "unavailable"
      ],
      "example": "available"
    }
  },
  "required": [
    "presence"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Presença atualizada com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

---
#### Delay na fila de mensagens
`POST /instance/updateDelaySettings`

Configura o intervalo de tempo entre mensagens diretas (async=true).

### Detalhes
- Configuração aplicada apenas para mensagens diretas (não afeta campanhas)
- Delay mínimo (msg_delay_min): 0 ou mais segundos (0 = sem delay)
- Delay máximo (msg_delay_max): se menor que min, será ajustado para o mesmo valor de min
- Sistema ajusta automaticamente valores negativos para 0

### Exemplo
```json
{
  "msg_delay_min": 0,
  "msg_delay_max": 2
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "msg_delay_min": {
      "type": "integer",
      "format": "int64",
      "minimum": 0,
      "description": "Delay m\u00ednimo em segundos (0 = sem delay)",
      "example": 0
    },
    "msg_delay_max": {
      "type": "integer",
      "format": "int64",
      "minimum": 0,
      "description": "Delay m\u00e1ximo em segundos",
      "example": 2
    }
  },
  "required": [
    "msg_delay_min",
    "msg_delay_max"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

---
### Tag: CRM
#### Atualizar campos personalizados de leads
`POST /instance/updateFieldsMap`

Atualiza os campos personalizados (custom fields) de uma instância. 
Permite configurar até 20 campos personalizados para armazenamento de 
informações adicionais sobre leads.

Cada campo pode armazenar até 255 caracteres e aceita qualquer tipo de dado.

Campos disponíveis:
- lead_field01 a lead_field20

Exemplo de uso:
1. Armazenar informações adicionais sobre leads
2. Criar campos personalizados para integração com outros sistemas
3. Armazenar tags ou categorias personalizadas
4. Manter histórico de interações com o lead

Exemplo de requisição:
```json
{
  "lead_field01": "nome",
  "lead_field02": "email",
  "lead_field03": "telefone",
  "lead_field04": "cidade",
  "lead_field05": "estado",
  "lead_field06": "idade",
  "lead_field07": "interesses",
  "lead_field08": "origem",
  "lead_field09": "status",
  "lead_field10": "valor",
  "lead_field11": "observacoes",
  "lead_field12": "ultima_interacao",
  "lead_field13": "proximo_contato",
  "lead_field14": "vendedor",
  "lead_field15": "produto_interesse",
  "lead_field16": "fonte_captacao",
  "lead_field17": "score",
  "lead_field18": "tags",
  "lead_field19": "historico",
  "lead_field20": "custom"
}
```

Exemplo de resposta:
```json
{
  "success": true,
  "message": "Custom fields updated successfully",
  "instance": {
    "id": "r183e2ef9597845",
    "name": "minha-instancia",
    "fieldsMap": {
      "lead_field01": "nome",
      "lead_field02": "email",
      "lead_field03": "telefone",
      "lead_field04": "cidade",
      "lead_field05": "estado",
      "lead_field06": "idade",
      "lead_field07": "interesses",
      "lead_field08": "origem",
      "lead_field09": "status",
      "lead_field10": "valor",
      "lead_field11": "observacoes",
      "lead_field12": "ultima_interacao",
      "lead_field13": "proximo_contato",
      "lead_field14": "vendedor",
      "lead_field15": "produto_interesse",
      "lead_field16": "fonte_captacao",
      "lead_field17": "score",
      "lead_field18": "tags",
      "lead_field19": "historico",
      "lead_field20": "custom"
    }
  }
}
```

Erros comuns:
- 400: Campos inválidos ou payload mal formatado
- 401: Token inválido ou expirado
- 404: Instância não encontrada
- 500: Erro ao atualizar campos no banco de dados

Restrições:
- Cada campo pode ter no máximo 255 caracteres
- Campos vazios serão mantidos com seus valores atuais
- Apenas os campos enviados serão atualizados


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "lead_field01": {
      "type": "string",
      "description": "Campo personalizado 01",
      "maxLength": 255
    },
    "lead_field02": {
      "type": "string",
      "description": "Campo personalizado 02",
      "maxLength": 255
    },
    "lead_field03": {
      "type": "string",
      "description": "Campo personalizado 03",
      "maxLength": 255
    },
    "lead_field04": {
      "type": "string",
      "description": "Campo personalizado 04",
      "maxLength": 255
    },
    "lead_field05": {
      "type": "string",
      "description": "Campo personalizado 05",
      "maxLength": 255
    },
    "lead_field06": {
      "type": "string",
      "description": "Campo personalizado 06",
      "maxLength": 255
    },
    "lead_field07": {
      "type": "string",
      "description": "Campo personalizado 07",
      "maxLength": 255
    },
    "lead_field08": {
      "type": "string",
      "description": "Campo personalizado 08",
      "maxLength": 255
    },
    "lead_field09": {
      "type": "string",
      "description": "Campo personalizado 09",
      "maxLength": 255
    },
    "lead_field10": {
      "type": "string",
      "description": "Campo personalizado 10",
      "maxLength": 255
    },
    "lead_field11": {
      "type": "string",
      "description": "Campo personalizado 11",
      "maxLength": 255
    },
    "lead_field12": {
      "type": "string",
      "description": "Campo personalizado 12",
      "maxLength": 255
    },
    "lead_field13": {
      "type": "string",
      "description": "Campo personalizado 13",
      "maxLength": 255
    },
    "lead_field14": {
      "type": "string",
      "description": "Campo personalizado 14",
      "maxLength": 255
    },
    "lead_field15": {
      "type": "string",
      "description": "Campo personalizado 15",
      "maxLength": 255
    },
    "lead_field16": {
      "type": "string",
      "description": "Campo personalizado 16",
      "maxLength": 255
    },
    "lead_field17": {
      "type": "string",
      "description": "Campo personalizado 17",
      "maxLength": 255
    },
    "lead_field18": {
      "type": "string",
      "description": "Campo personalizado 18",
      "maxLength": 255
    },
    "lead_field19": {
      "type": "string",
      "description": "Campo personalizado 19",
      "maxLength": 255
    },
    "lead_field20": {
      "type": "string",
      "description": "Campo personalizado 20",
      "maxLength": 255
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso |
| 401 | Token inválido/expirado |
| 404 | Instância não encontrada |
| 500 | Erro interno |

---
#### Edita informações de lead
`POST /chat/editLead`

Atualiza as informações de lead associadas a um chat. Permite modificar status do ticket, 
atribuição de atendente, posição no kanban, tags e outros campos customizados.

As alterações são refletidas imediatamente no banco de dados e disparam eventos webhook/SSE
para manter a aplicação sincronizada.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Identificador do chat. Pode ser:\n- wa_chatid (ex: \"5511999999999@s.whatsapp.net\")\n- wa_fastid (ex: \"5511888888888:5511999999999\")\n",
      "example": "5511999999999@s.whatsapp.net"
    },
    "chatbot_disableUntil": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp UTC at\u00e9 quando o chatbot deve ficar desativado para este chat.\nUse 0 para reativar imediatamente.\n",
      "example": 1735686000
    },
    "lead_isTicketOpen": {
      "type": "boolean",
      "description": "Status do ticket associado ao lead.\n- true: Ticket est\u00e1 aberto/em atendimento\n- false: Ticket est\u00e1 fechado/resolvido\n",
      "example": true
    },
    "lead_assignedAttendant_id": {
      "type": "string",
      "description": "ID do atendente atribu\u00eddo ao lead.\nUse string vazia (\"\") para remover a atribui\u00e7\u00e3o.\n",
      "example": "att_123456"
    },
    "lead_kanbanOrder": {
      "type": "integer",
      "format": "int64",
      "description": "Posi\u00e7\u00e3o do card no quadro kanban.\nValores maiores aparecem primeiro.\n",
      "example": 1000
    },
    "lead_tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de tags associadas ao lead.\nTags inexistentes s\u00e3o criadas automaticamente.\nEnvie array vazio ([]) para remover todas as tags.\n",
      "example": [
        "vip",
        "suporte",
        "prioridade-alta"
      ]
    },
    "lead_name": {
      "type": "string",
      "description": "Nome principal do lead",
      "example": "Jo\u00e3o Silva"
    },
    "lead_fullName": {
      "type": "string",
      "description": "Nome completo do lead",
      "example": "Jo\u00e3o Silva Pereira"
    },
    "lead_email": {
      "type": "string",
      "format": "email",
      "description": "Email do lead",
      "example": "joao@exemplo.com"
    },
    "lead_personalid": {
      "type": "string",
      "description": "Documento de identifica\u00e7\u00e3o (CPF/CNPJ)\nApenas n\u00fameros ou formatado\n",
      "example": "123.456.789-00"
    },
    "lead_status": {
      "type": "string",
      "description": "Status do lead no funil de vendas",
      "example": "qualificado"
    },
    "lead_notes": {
      "type": "string",
      "description": "Anota\u00e7\u00f5es sobre o lead",
      "example": "Cliente interessado em plano premium"
    },
    "lead_field01": {
      "type": "string",
      "description": "Campo personalizado 1"
    },
    "lead_field02": {
      "type": "string",
      "description": "Campo personalizado 2"
    },
    "lead_field03": {
      "type": "string",
      "description": "Campo personalizado 3"
    },
    "lead_field04": {
      "type": "string",
      "description": "Campo personalizado 4"
    },
    "lead_field05": {
      "type": "string",
      "description": "Campo personalizado 5"
    },
    "lead_field06": {
      "type": "string",
      "description": "Campo personalizado 6"
    },
    "lead_field07": {
      "type": "string",
      "description": "Campo personalizado 7"
    },
    "lead_field08": {
      "type": "string",
      "description": "Campo personalizado 8"
    },
    "lead_field09": {
      "type": "string",
      "description": "Campo personalizado 9"
    },
    "lead_field10": {
      "type": "string",
      "description": "Campo personalizado 10"
    },
    "lead_field11": {
      "type": "string",
      "description": "Campo personalizado 11"
    },
    "lead_field12": {
      "type": "string",
      "description": "Campo personalizado 12"
    },
    "lead_field13": {
      "type": "string",
      "description": "Campo personalizado 13"
    },
    "lead_field14": {
      "type": "string",
      "description": "Campo personalizado 14"
    },
    "lead_field15": {
      "type": "string",
      "description": "Campo personalizado 15"
    },
    "lead_field16": {
      "type": "string",
      "description": "Campo personalizado 16"
    },
    "lead_field17": {
      "type": "string",
      "description": "Campo personalizado 17"
    },
    "lead_field18": {
      "type": "string",
      "description": "Campo personalizado 18"
    },
    "lead_field19": {
      "type": "string",
      "description": "Campo personalizado 19"
    },
    "lead_field20": {
      "type": "string",
      "description": "Campo personalizado 20"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lead atualizado com sucesso |
| 400 | Payload inválido |
| 404 | Chat não encontrado |
| 500 | Erro interno do servidor |

---
### Tag: Proxy
#### Obter configuração de proxy da instância
`GET /instance/proxy`

A uazapiGO opera com um proxy interno como padrão.
Observação: nossos IPs são brasileiros. Se você atende clientes internacionais, considere usar um proxy do país/região do seu cliente (via `proxy_url`).
Você pode:
  (1) continuar no proxy interno padrão;
  (2) usar um proxy próprio informando `proxy_url`. Se nada for definido, seguimos no proxy interno; ou
  (3) usar seu celular android como proxy instalando o aplicativo disponibilizado pela uazapi em https://github.com/uazapi/silver_proxy_apk (APK direto: https://github.com/uazapi/silver_proxy_apk/raw/refs/heads/main/silver_proxy.apk).

A resposta desse endpoint traz o estado atual do proxy e o último teste de conectividade.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração de proxy recuperada com sucesso |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao recuperar a configuração |

---
#### Configurar ou alterar o proxy
`POST /instance/proxy`

Permite habilitar ou trocar para:
- Um proxy próprio (`proxy_url`), usando sua infraestrutura ou o aplicativo de celular para proxy próprio.
- O proxy interno padrão (nenhum `proxy_url` enviado).

Se nada for enviado, seguimos no proxy interno. A URL é validada antes de salvar. A conexão pode ser reiniciada automaticamente para aplicar a mudança.

Opcional: você pode usar seu celular android como proxy instalando o aplicativo disponibilizado pela uazapi em https://github.com/uazapi/silver_proxy_apk (APK direto: https://github.com/uazapi/silver_proxy_apk/raw/refs/heads/main/silver_proxy.apk).


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "enable": {
      "type": "boolean",
      "description": "Define se o proxy deve ser habilitado; se `false`, remove o proxy atual",
      "default": true
    },
    "proxy_url": {
      "type": "string",
      "description": "URL do proxy a ser usado (obrigat\u00f3ria se `enable=true` e quiser usar um proxy pr\u00f3prio)",
      "example": "http://usuario:senha@ip:porta"
    }
  },
  "required": [
    "enable"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Proxy configurado com sucesso |
| 400 | Payload inválido ou falha na validação do proxy |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao configurar o proxy |

---
#### Remover o proxy configurado
`DELETE /instance/proxy`

Desativa e apaga o proxy personalizado, voltando ao comportamento padrão (proxy interno).
Pode reiniciar a conexão para aplicar a remoção.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração de proxy removida com sucesso |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao deletar a configuração de proxy |

---
### Tag: Perfil
#### Altera o nome do perfil do WhatsApp
`POST /profile/name`

Altera o nome de exibição do perfil da conta do WhatsApp atualmente conectada.

O endpoint realiza:
- Atualiza o nome do perfil usando o WhatsApp AppState
- Sincroniza a mudança com o servidor do WhatsApp
- Retorna confirmação da alteração

**Importante**: 
- A conta do WhatsApp deve estar conectada
- O nome será visível para todos os contatos
- Pode haver um limite de alterações por período (conforme WhatsApp)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "name"
  ],
  "properties": {
    "name": {
      "type": "string",
      "description": "Novo nome do perfil do WhatsApp",
      "example": "Minha Empresa - Atendimento",
      "maxLength": 25
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nome do perfil alterado com sucesso |
| 400 | Dados inválidos na requisição |
| 401 | Sem sessão ativa |
| 403 | Ação não permitida |
| 500 | Erro interno do servidor |

---
#### Altera a imagem do perfil do WhatsApp
`POST /profile/image`

Altera a imagem de perfil da conta do WhatsApp atualmente conectada.

O endpoint realiza:
- Atualiza a imagem do perfil usando 
- Processa a imagem (URL, base64 ou comando de remoção)
- Sincroniza a mudança com o servidor do WhatsApp
- Retorna confirmação da alteração

**Importante**: 
- A conta do WhatsApp deve estar conectada
- A imagem será visível para todos os contatos
- A imagem deve estar em formato JPEG e tamanho 640x640 pixels


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "image"
  ],
  "properties": {
    "image": {
      "type": "string",
      "description": "Imagem do perfil. Pode ser:\n- URL da imagem (http/https)\n- String base64 da imagem\n- \"remove\" ou \"delete\" para remover a imagem atual\n",
      "example": "https://picsum.photos/640/640.jpg",
      "oneOf": [
        {
          "description": "URL da imagem",
          "example": "https://picsum.photos/640/640.jpg"
        },
        {
          "description": "Imagem em base64",
          "example": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        },
        {
          "description": "Comando para remover imagem",
          "example": "remove"
        }
      ]
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Imagem do perfil alterada com sucesso |
| 400 | Dados inválidos na requisição |
| 401 | Sem sessão ativa |
| 403 | Ação não permitida |
| 413 | Imagem muito grande |
| 500 | Erro interno do servidor |

---
### Tag: Enviar Mensagem
#### Enviar mensagem de texto
`POST /send/text`

Envia uma mensagem de texto para um contato, grupo ou canal/newsletter.

## Recursos Específicos

- **Preview de links** com suporte a personalização automática ou customizada
- **Formatação básica** do texto
- **Substituição automática de placeholders** dinâmicos

## Envio para Newsletter

Para enviar texto para um canal, use o mesmo campo `number`, mas informe o JID completo do canal:
- Exemplo: `120363123456789012@newsletter`

```json
{
  "number": "120363123456789012@newsletter",
  "text": "Post publicado no canal"
}
```

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Preview de Links

### Preview Automático
```json
{
  "number": "5511999999999",
  "text": "Confira: https://exemplo.com",
  "linkPreview": true
}
```

### Preview Personalizado
```json
{
  "number": "5511999999999",
  "text": "Confira nosso site! https://exemplo.com",
  "linkPreview": true,
  "linkPreviewTitle": "Título Personalizado",
  "linkPreviewDescription": "Uma descrição personalizada do link",
  "linkPreviewImage": "https://exemplo.com/imagem.jpg",
  "linkPreviewLarge": true
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`) ou um ID de canal/newsletter (`@newsletter`).",
      "example": "5511999999999"
    },
    "text": {
      "type": "string",
      "description": "Texto da mensagem (aceita placeholders)",
      "example": "Ol\u00e1 {{name}}! Como posso ajudar?"
    },
    "linkPreview": {
      "type": "boolean",
      "description": "Ativa/desativa preview de links. Se true, procura automaticamente um link no texto para gerar preview.\n\nComportamento:\n- Se apenas linkPreview=true: gera preview autom\u00e1tico do primeiro link encontrado no texto\n- Se fornecidos campos personalizados (title, description, image): usa os valores fornecidos\n- Se campos personalizados parciais: combina com dados autom\u00e1ticos do link como fallback\n",
      "example": true
    },
    "linkPreviewTitle": {
      "type": "string",
      "description": "Define um t\u00edtulo personalizado para o preview do link",
      "example": "T\u00edtulo Personalizado"
    },
    "linkPreviewDescription": {
      "type": "string",
      "description": "Define uma descri\u00e7\u00e3o personalizada para o preview do link",
      "example": "Descri\u00e7\u00e3o personalizada do link"
    },
    "linkPreviewImage": {
      "type": "string",
      "description": "URL ou Base64 da imagem para usar no preview do link",
      "example": "https://exemplo.com/imagem.jpg"
    },
    "linkPreviewLarge": {
      "type": "boolean",
      "description": "Se true, gera um preview grande com upload da imagem. Se false, gera um preview pequeno sem upload",
      "example": true
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio, durante o atraso apacer\u00e1 'Digitando...'",
      "example": 1000
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": true
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna. \u00datil para alto volume de mensagens.",
      "example": false
    }
  },
  "required": [
    "number",
    "text"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagem enviada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 429 | Limite de requisições excedido |
| 500 | Erro interno do servidor |

---
#### Enviar mídia (imagem, vídeo, áudio ou documento)
`POST /send/media`

Envia diferentes tipos de mídia para um contato, grupo ou canal/newsletter. Suporta URLs ou arquivos base64.

## Tipos de Mídia Suportados
- **`image`**: Imagens (JPG preferencialmente)
- **`video`**: Vídeos (apenas MP4)
- **`videoplay`**: Vídeo com comportamento visual de autoplay/loop no WhatsApp
- **`document`**: Documentos (PDF, DOCX, XLSX, etc)
- **`audio`**: Áudio comum (MP3 ou OGG)
- **`myaudio`**: Mensagem de voz (alternativa ao PTT)
- **`ptt`**: Mensagem de voz (Push-to-Talk)
- **`ptv`**: Mensagem de vídeo (Push-to-Video)
- **`sticker`**: Figurinha/Sticker

## Recursos Específicos
- **Upload por URL ou base64**
- **Caption/legenda** opcional com suporte a placeholders
- **Nome personalizado** para documentos (`docName`)
- **Geração automática de thumbnails**
- **Compressão otimizada** conforme o tipo
- **`viewOnce`** recomendado para mídia compatível

## Envio para Newsletter

Para enviar mídia para um canal, use o mesmo campo `number`, mas informe o JID completo do canal:
- Exemplo: `120363123456789012@newsletter`

```json
{
  "number": "120363123456789012@newsletter",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg",
  "text": "Imagem publicada no canal"
}
```

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Exemplos Básicos

## Visualização Única (`viewOnce`)

O campo `viewOnce` é recomendado quando quiser mídia de visualização única e hoje produz efeito para os tipos:
`image`, `video`, `videoplay`, `ptv`, `audio`, `myaudio` e `ptt`.

Para `document`, `sticker` e demais endpoints de envio, o campo é ignorado silenciosamente.

### Imagem Simples
```json
{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg"
}
```

### Documento com Nome
```json
{
  "number": "5511999999999",
  "type": "document",
  "file": "https://exemplo.com/contrato.pdf",
  "docName": "Contrato.pdf",
  "text": "Segue o documento solicitado"
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`) ou um ID de canal/newsletter (`@newsletter`).",
      "example": "5511999999999"
    },
    "type": {
      "type": "string",
      "description": "Tipo de m\u00eddia (image, video, videoplay, document, audio, myaudio, ptt, ptv, sticker)",
      "enum": [
        "image",
        "video",
        "videoplay",
        "document",
        "audio",
        "myaudio",
        "ptt",
        "ptv",
        "sticker"
      ],
      "example": "image"
    },
    "file": {
      "type": "string",
      "description": "URL ou base64 do arquivo",
      "example": "https://exemplo.com/imagem.jpg"
    },
    "text": {
      "type": "string",
      "description": "Texto descritivo (caption) - aceita placeholders",
      "example": "Veja esta foto!"
    },
    "docName": {
      "type": "string",
      "description": "Nome do arquivo (apenas para documents)",
      "example": "relatorio.pdf"
    },
    "thumbnail": {
      "type": "string",
      "description": "URL ou base64 de thumbnail personalizado para v\u00eddeos e documentos",
      "example": "https://exemplo.com/thumb.jpg"
    },
    "mimetype": {
      "type": "string",
      "description": "MIME type do arquivo (opcional, detectado automaticamente)",
      "example": "application/pdf"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio, durante o atraso apacer\u00e1 'Digitando...' ou 'Gravando \u00e1udio...'",
      "example": 1000
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": true
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    },
    "viewOnce": {
      "type": "boolean",
      "description": "Recomendado para m\u00eddia com visualiza\u00e7\u00e3o \u00fanica em tipos compat\u00edveis (`image`, `video`, `videoplay`, `ptv`, `audio`, `myaudio`, `ptt`). Em tipos n\u00e3o compat\u00edveis, o campo \u00e9 ignorado silenciosamente.",
      "example": false
    }
  },
  "required": [
    "number",
    "type",
    "file"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mídia enviada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 413 | Arquivo muito grande |
| 415 | Formato de mídia não suportado |
| 500 | Erro interno do servidor |

---
#### Enviar cartão de contato (vCard)
`POST /send/contact`

Envia um cartão de contato (vCard) para um contato ou grupo.

## Recursos Específicos

- **vCard completo** com nome, telefones, organização, email e URL
- **Múltiplos números de telefone** (separados por vírgula)
- **Cartão clicável** no WhatsApp para salvar na agenda
- **Informações profissionais** (organização/empresa)

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Exemplo Básico
```json
{
  "number": "5511999999999",
  "fullName": "João Silva",
  "phoneNumber": "5511999999999,5511888888888",
  "organization": "Empresa XYZ",
  "email": "joao.silva@empresa.com",
  "url": "https://empresa.com/joao"
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "fullName": {
      "type": "string",
      "description": "Nome completo do contato",
      "example": "Jo\u00e3o Silva"
    },
    "phoneNumber": {
      "type": "string",
      "description": "N\u00fameros de telefone (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "organization": {
      "type": "string",
      "description": "Nome da organiza\u00e7\u00e3o/empresa",
      "example": "Empresa XYZ"
    },
    "email": {
      "type": "string",
      "description": "Endere\u00e7o de email",
      "example": "joao@empresa.com"
    },
    "url": {
      "type": "string",
      "description": "URL pessoal ou da empresa",
      "example": "https://empresa.com/joao"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio, durante o atraso apacer\u00e1 'Digitando...'",
      "example": 1000
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": true
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    }
  },
  "required": [
    "number",
    "fullName",
    "phoneNumber"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Cartão de contato enviado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 429 | Limite de requisições excedido |
| 500 | Erro interno do servidor |

---
#### Enviar localização geográfica
`POST /send/location`

Envia uma localização geográfica para um contato ou grupo.

## Recursos Específicos

- **Coordenadas precisas** (latitude e longitude obrigatórias)
- **Nome do local** para identificação
- **Endereço completo** para exibição detalhada
- **Mapa interativo** no WhatsApp para navegação
- **Pin personalizado** com nome do local

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Exemplo Básico
```json
{
  "number": "5511999999999",
  "name": "Maracanã",
  "address": "Av. Pres. Castelo Branco - Maracanã, Rio de Janeiro - RJ",
  "latitude": -22.912982815767986,
  "longitude": -43.23028153499254
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "name": {
      "type": "string",
      "description": "Nome do local",
      "example": "MASP"
    },
    "address": {
      "type": "string",
      "description": "Endere\u00e7o do local",
      "example": "Av. Paulista, 1578 - Bela Vista, S\u00e3o Paulo - SP"
    },
    "latitude": {
      "type": "number",
      "description": "Latitude (-90 a 90)",
      "example": -23.5616
    },
    "longitude": {
      "type": "number",
      "description": "Longitude (-180 a 180)",
      "example": -46.6562
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio, durante o atraso apacer\u00e1 'Digitando...'",
      "example": 1000
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": true
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    }
  },
  "required": [
    "number",
    "latitude",
    "longitude"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Localização enviada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 429 | Limite de requisições excedido |
| 500 | Erro interno do servidor |

---
#### Enviar atualização de presença
`POST /message/presence`

Envia uma atualização de presença para um contato ou grupo de forma **assíncrona**.

## 🔄 Comportamento Assíncrono:
- **Execução independente**: A presença é gerenciada em background, não bloqueia o retorno da API
- **Limite máximo**: 5 minutos de duração (300 segundos)
- **Tick de atualização**: Reenvia a presença a cada 10 segundos
- **Cancelamento automático**: Presença é cancelada automaticamente ao enviar uma mensagem para o mesmo chat

## 📱 Tipos de presença suportados:
- **composing**: Indica que você está digitando uma mensagem
- **recording**: Indica que você está gravando um áudio
- **paused**: Remove/cancela a indicação de presença atual

## ⏱️ Controle de duração:
- **Sem delay**: Usa limite padrão de 5 minutos
- **Com delay**: Usa o valor especificado (máximo 5 minutos)
- **Cancelamento**: Envio de mensagem cancela presença automaticamente

## 📋 Exemplos de uso:

### Digitar por 30 segundos:
```json
{
  "number": "5511999999999",
  "presence": "composing",
  "delay": 30000
}
```

### Gravar áudio por 1 minuto:
```json
{
  "number": "5511999999999",
  "presence": "recording",
  "delay": 60000
}
```

### Cancelar presença atual:
```json
{
  "number": "5511999999999",
  "presence": "paused"
}
```

### Usar limite máximo (5 minutos):
```json
{
  "number": "5511999999999",
  "presence": "composing"
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do destinat\u00e1rio no formato internacional (ex: 5511999999999)",
      "example": "5511999999999"
    },
    "presence": {
      "type": "string",
      "description": "Tipo de presen\u00e7a a ser enviada",
      "enum": [
        "composing",
        "recording",
        "paused"
      ],
      "example": "composing"
    },
    "delay": {
      "type": "integer",
      "description": "Dura\u00e7\u00e3o em milissegundos que a presen\u00e7a ficar\u00e1 ativa (m\u00e1ximo 5 minutos = 300000ms).\nSe n\u00e3o informado ou valor maior que 5 minutos, usa o limite padr\u00e3o de 5 minutos.\nA presen\u00e7a \u00e9 reenviada a cada 10 segundos durante este per\u00edodo.\n",
      "maximum": 300000,
      "example": 30000
    }
  },
  "required": [
    "number",
    "presence"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Presença atualizada com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

---
#### Enviar Stories (Status)
`POST /send/status`

Envia um story (status) com suporte para texto, imagem, vídeo e áudio.

**Suporte a campos de rastreamento**: Este endpoint também suporta `track_source` e `track_id` documentados na tag **"Enviar Mensagem"**.

## Tipos de Status
- text: Texto com estilo e cor de fundo
- image: Imagens com legenda opcional
- video: Vídeos com thumbnail e legenda
- audio: Áudio normal ou mensagem de voz (PTT)

## Cores de Fundo
- 1-3: Tons de amarelo
- 4-6: Tons de verde
- 7-9: Tons de azul
- 10-12: Tons de lilás
- 13: Magenta
- 14-15: Tons de rosa
- 16: Marrom claro
- 17-19: Tons de cinza (19 é o padrão)

## Fontes (para texto)
- 0: Padrão 
- 1-8: Estilos alternativos

## Limites
- Texto: Máximo 656 caracteres
- Imagem: JPG, PNG, GIF
- Vídeo: MP4, MOV
- Áudio: MP3, OGG, WAV (convertido para OGG/OPUS)

## Exemplo
```json
{
  "type": "text",
  "text": "Novidades chegando!",
  "background_color": 7,
  "font": 1
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "text",
        "image",
        "video",
        "audio",
        "myaudio",
        "ptt"
      ],
      "description": "Tipo do status",
      "example": "text"
    },
    "text": {
      "type": "string",
      "description": "Texto principal ou legenda",
      "example": "Novidades chegando!"
    },
    "background_color": {
      "type": "integer",
      "minimum": 1,
      "maximum": 19,
      "description": "C\u00f3digo da cor de fundo",
      "example": 7
    },
    "font": {
      "type": "integer",
      "minimum": 0,
      "maximum": 8,
      "description": "Estilo da fonte (apenas para type=text)",
      "example": 1
    },
    "file": {
      "type": "string",
      "description": "URL ou Base64 do arquivo de m\u00eddia",
      "example": "https://example.com/video.mp4"
    },
    "thumbnail": {
      "type": "string",
      "description": "URL ou Base64 da miniatura (opcional para v\u00eddeos)",
      "example": "https://example.com/thumb.jpg"
    },
    "mimetype": {
      "type": "string",
      "description": "MIME type do arquivo (opcional)",
      "example": "video/mp4"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio",
      "example": 1000
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": false
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    }
  },
  "required": [
    "type"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Status enviado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 500 | Erro interno do servidor |

---
#### Enviar menu interativo (botões, carrosel, lista ou enquete)
`POST /send/menu`

Este endpoint oferece uma interface unificada para envio de quatro tipos principais de mensagens interativas:
- Botões: Para ações rápidas e diretas
- Carrosel de Botões: Para uma lista horizontal de botões com imagens
- Listas: Para menus organizados em seções
- Enquetes: Para coleta de opiniões e votações

**Suporte a campos de rastreamento**: Este endpoint também suporta `track_source` e `track_id` documentados na tag **"Enviar Mensagem"**.

## Estrutura Base do Payload

Todas as requisições seguem esta estrutura base:

```json
{
  "number": "5511999999999",
  "type": "button|list|poll|carousel",
  "text": "Texto principal da mensagem",
  "choices": ["opções baseadas no tipo escolhido"],
  "footerText": "Texto do rodapé (opcional para botões e listas)",
  "listButton": "Texto do botão (para listas)",
  "selectableCount": "Número de opções selecionáveis (apenas para enquetes)"
}
```

## Tipos de Mensagens Interativas

### 1. Botões (type: "button")

Cria botões interativos com diferentes funcionalidades de ação.

#### Campos Específicos
- `footerText`: Texto opcional exibido abaixo da mensagem principal
- `choices`: Array de opções que serão convertidas em botões

#### Formatos de Botões
Cada botão pode ser configurado usando `|` (pipe) ou `\n` (quebra de linha) como separadores:

- **Botão de Resposta**: 
  - `"texto|id"` ou 
  - `"texto\nid"` ou 
  - `"texto"` (ID será igual ao texto)

- **Botão de Cópia**: 
  - `"texto|copy:código"` ou 
  - `"texto\ncopy:código"`

- **Botão de Chamada**: 
  - `"texto|call:+5511999999999"` ou 
  - `"texto\ncall:+5511999999999"`

- **Botão de URL**: 
  - `"texto|https://exemplo.com"` ou 
  - `"texto|url:https://exemplo.com"`

#### Botões com Imagem
Para adicionar uma imagem aos botões, use o campo `imageButton` no payload:

#### Exemplo com Imagem
```json
{
  "number": "5511999999999",
  "type": "button",
  "text": "Escolha um produto:",
  "imageButton": "https://exemplo.com/produto1.jpg",
  "choices": [
    "Produto A|prod_a",
    "Mais Info|https://exemplo.com/produto-a",
    "Produto B|prod_b",
    "Ligar|call:+5511999999999"
  ],
  "footerText": "Produtos em destaque"
}
```

> **Suporte**: O campo `imageButton` aceita URLs ou imagens em base64.

#### Exemplo Completo
```json
{
  "number": "5511999999999",
  "type": "button",
  "text": "Como podemos ajudar?",
  "choices": [
    "Suporte Técnico|suporte",
    "Fazer Pedido|pedido",
    "Nosso Site|https://exemplo.com",
    "Falar Conosco|call:+5511999999999"
  ],
  "footerText": "Escolha uma das opções abaixo"
}
```

#### Limitações e Compatibilidade
> **Importante**: Ao combinar botões de resposta com outros tipos (call, url, copy) na mesma mensagem, será exibido o aviso: "Não é possível exibir esta mensagem no WhatsApp Web. Abra o WhatsApp no seu celular para visualizá-la."

### 2. Listas (type: "list")

Cria menus organizados em seções com itens selecionáveis.

#### Campos Específicos
- `listButton`: Texto do botão que abre a lista
- `footerText`: Texto opcional do rodapé
- `choices`: Array com seções e itens da lista

#### Formato das Choices
- `"[Título da Seção]"`: Inicia uma nova seção
- `"texto|id|descrição"`: Item da lista com:
  - texto: Label do item
  - id: Identificador único, opcional
  - descrição: Texto descritivo adicional e opcional

#### Exemplo Completo
```json
{
  "number": "5511999999999",
  "type": "list",
  "text": "Catálogo de Produtos",
  "choices": [
    "[Eletrônicos]",
    "Smartphones|phones|Últimos lançamentos",
    "Notebooks|notes|Modelos 2024",
    "[Acessórios]",
    "Fones|fones|Bluetooth e com fio",
    "Capas|cases|Proteção para seu device"
  ],
  "listButton": "Ver Catálogo",
  "footerText": "Preços sujeitos a alteração"
}
```

### 3. Enquetes (type: "poll")

Cria enquetes interativas para votação.

#### Campos Específicos
- `selectableCount`: Número de opções que podem ser selecionadas (padrão: 1)
- `choices`: Array simples com as opções de voto

#### Exemplo Completo
```json
{
  "number": "5511999999999",
  "type": "poll",
  "text": "Qual horário prefere para atendimento?",
  "choices": [
    "Manhã (8h-12h)",
    "Tarde (13h-17h)",
    "Noite (18h-22h)"
  ],
  "selectableCount": 1
}
```

### 4. Carousel (type: "carousel")

Cria um carrossel de cartões com imagens e botões interativos.

#### Campos Específicos
- `choices`: Array com elementos do carrossel na seguinte ordem:
  - `[Texto do cartão]`: Texto do cartão entre colchetes
  - `{URL ou base64 da imagem}`: Imagem entre chaves
  - Botões do cartão (um por linha):
    - `"texto|copy:código"` para botão de copiar
    - `"texto|https://url"` para botão de link
    - `"texto|call:+número"` para botão de ligação

#### Exemplo Completo
```json
{
  "number": "5511999999999",
  "type": "carousel",
  "text": "Conheça nossos produtos",
  "choices": [
    "[Smartphone XYZ\nO mais avançado smartphone da linha]",
    "{https://exemplo.com/produto1.jpg}",
    "Copiar Código|copy:PROD123",
    "Ver no Site|https://exemplo.com/xyz",
    "Fale Conosco|call:+5511999999999",
    "[Notebook ABC\nO notebook ideal para profissionais]",
    "{https://exemplo.com/produto2.jpg}",
    "Copiar Código|copy:NOTE456",
    "Comprar Online|https://exemplo.com/abc",
    "Suporte|call:+5511988888888"
  ]
}
```

> **Nota**: Criamos outro endpoint para carrossel: `/send/carousel`, funciona da mesma forma, mas com outro formato de payload. Veja o que é mais fácil para você.

## Termos de uso

Os recursos de botões interativos e listas podem ser descontinuados a qualquer momento sem aviso prévio. Não nos responsabilizamos por quaisquer alterações ou indisponibilidade destes recursos.

### Alternativas e Compatibilidade

Considerando a natureza dinâmica destes recursos, nosso endpoint foi projetado para facilitar a migração entre diferentes tipos de mensagens (botões, listas e enquetes). 

Recomendamos criar seus fluxos de forma flexível, preparados para alternar entre os diferentes tipos.

Em caso de descontinuidade de algum recurso, você poderá facilmente migrar para outro tipo de mensagem apenas alterando o campo "type" no payload, mantendo a mesma estrutura de choices.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "type": {
      "type": "string",
      "description": "Tipo do menu (button, list, poll, carousel)",
      "enum": [
        "button",
        "list",
        "poll",
        "carousel"
      ],
      "example": "list"
    },
    "text": {
      "type": "string",
      "description": "Texto principal (aceita placeholders)",
      "example": "Escolha uma op\u00e7\u00e3o:"
    },
    "footerText": {
      "type": "string",
      "description": "Texto do rodap\u00e9 (opcional)",
      "example": "Menu de servi\u00e7os"
    },
    "listButton": {
      "type": "string",
      "description": "Texto do bot\u00e3o principal",
      "example": "Ver op\u00e7\u00f5es"
    },
    "selectableCount": {
      "type": "integer",
      "description": "N\u00famero m\u00e1ximo de op\u00e7\u00f5es selecion\u00e1veis (para enquetes)",
      "example": 1
    },
    "choices": {
      "type": "array",
      "description": "Lista de op\u00e7\u00f5es. Use [T\u00edtulo] para se\u00e7\u00f5es em listas",
      "items": {
        "type": "string"
      },
      "example": [
        "[Eletr\u00f4nicos]",
        "Smartphones|phones|\u00daltimos lan\u00e7amentos",
        "Notebooks|notes|Modelos 2024",
        "[Acess\u00f3rios]",
        "Fones|fones|Bluetooth e com fio",
        "Capas|cases|Prote\u00e7\u00e3o para seu device"
      ]
    },
    "imageButton": {
      "type": "string",
      "description": "URL da imagem para bot\u00f5es (recomendado para type: button)",
      "example": "https://exemplo.com/imagem-botao.jpg"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio, durante o atraso apacer\u00e1 'Digitando...'",
      "example": 1000
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    }
  },
  "required": [
    "number",
    "type",
    "text",
    "choices"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Menu enviado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 429 | Limite de requisições excedido |
| 500 | Erro interno do servidor |

---
#### Enviar carrossel de mídia com botões
`POST /send/carousel`

Este endpoint permite enviar um carrossel com imagens e botões interativos.
Funciona de maneira igual ao endpoint `/send/menu` com type: carousel, porém usando outro formato de payload.

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Estrutura do Payload

```json
{
  "number": "5511999999999",
  "text": "Texto principal",
  "carousel": [
    {
      "text": "Texto do cartão",
      "image": "URL da imagem",
      "buttons": [
        {
          "id": "resposta1",
          "text": "Texto do botão",
          "type": "REPLY"
        }
      ]
    }
  ],
  "delay": 1000,
  "readchat": true
}
```

## Tipos de Botões

- `REPLY`: Botão de resposta rápida
  - Quando clicado, envia o valor do id como resposta ao chat
  - O id será o texto enviado como resposta

- `URL`: Botão com link
  - Quando clicado, abre a URL especificada
  - O id deve conter a URL completa (ex: https://exemplo.com)

- `COPY`: Botão para copiar texto
  - Quando clicado, copia o texto para a área de transferência
  - O id será o texto que será copiado

- `CALL`: Botão para realizar chamada
  - Quando clicado, inicia uma chamada telefônica
  - O id deve conter o número de telefone

## Exemplo de Botões
```json
{
  "buttons": [
    {
      "id": "Sim, quero comprar!",
      "text": "Confirmar Compra",
      "type": "REPLY"
    },
    {
      "id": "https://exemplo.com/produto",
      "text": "Ver Produto",
      "type": "URL"
    },
    {
      "id": "CUPOM20",
      "text": "Copiar Cupom",
      "type": "COPY"
    },
    {
      "id": "5511999999999",
      "text": "Falar com Vendedor",
      "type": "CALL"
    }
  ]
}
```

## Exemplo Completo de Carrossel
```json
{
  "number": "5511999999999",
  "text": "Nossos Produtos em Destaque",
  "carousel": [
    {
      "text": "Smartphone XYZ\nO mais avançado smartphone da linha",
      "image": "https://exemplo.com/produto1.jpg",
      "buttons": [
        {
          "id": "SIM_COMPRAR_XYZ",
          "text": "Comprar Agora",
          "type": "REPLY"
        },
        {
          "id": "https://exemplo.com/xyz",
          "text": "Ver Detalhes",
          "type": "URL"
        }
      ]
    },
    {
      "text": "Cupom de Desconto\nGanhe 20% OFF em qualquer produto",
      "image": "https://exemplo.com/cupom.jpg",
      "buttons": [
        {
          "id": "DESCONTO20",
          "text": "Copiar Cupom",
          "type": "COPY"
        },
        {
          "id": "5511999999999",
          "text": "Falar com Vendedor",
          "type": "CALL"
        }
      ]
    }
  ],
  "delay": 0,
  "readchat": true
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "text": {
      "type": "string",
      "description": "Texto principal da mensagem",
      "example": "Nossos Produtos em Destaque"
    },
    "carousel": {
      "type": "array",
      "description": "Array de cart\u00f5es do carrossel",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "Texto do cart\u00e3o",
            "example": "Smartphone XYZ\nO mais avan\u00e7ado smartphone da linha"
          },
          "image": {
            "type": "string",
            "description": "URL da imagem (opcional)",
            "example": "https://exemplo.com/produto1.jpg"
          },
          "video": {
            "type": "string",
            "description": "URL do v\u00eddeo (alternativa \u00e0 imagem)",
            "example": "https://exemplo.com/produto1.mp4"
          },
          "document": {
            "type": "string",
            "description": "URL do documento (alternativa \u00e0 imagem)",
            "example": "https://exemplo.com/catalogo.pdf"
          },
          "filename": {
            "type": "string",
            "description": "Nome do arquivo para documentos",
            "example": "Catalogo.pdf"
          },
          "buttons": {
            "type": "array",
            "description": "Array de bot\u00f5es do cart\u00e3o",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "ID do bot\u00e3o",
                  "example": "buy_xyz"
                },
                "text": {
                  "type": "string",
                  "description": "Texto exibido no bot\u00e3o",
                  "example": "Comprar Agora"
                },
                "type": {
                  "type": "string",
                  "description": "Tipo do bot\u00e3o:\n* REPLY - O id ser\u00e1 enviado como resposta ao chat\n* URL - O id deve ser a URL completa que ser\u00e1 aberta\n* COPY - O id ser\u00e1 o texto copiado para \u00e1rea de transfer\u00eancia\n* CALL - O id deve ser o n\u00famero de telefone para a chamada\n",
                  "enum": [
                    "REPLY",
                    "URL",
                    "CALL",
                    "COPY"
                  ],
                  "example": "REPLY"
                }
              }
            }
          }
        },
        "required": [
          "text",
          "buttons"
        ]
      }
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio",
      "example": 1000
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "forward": {
      "type": "boolean",
      "description": "Marca a mensagem como encaminhada no WhatsApp",
      "example": false
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    }
  },
  "required": [
    "number",
    "text",
    "carousel"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Carrossel enviado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 500 | Erro interno do servidor |

---
#### Solicitar localização do usuário
`POST /send/location-button`

Este endpoint envia uma mensagem com um botão que solicita a localização do usuário.
Quando o usuário clica no botão, o WhatsApp abre a interface para compartilhar a localização atual.

## Campos Comuns

Este endpoint suporta todos os **campos opcionais comuns** documentados na tag **"Enviar Mensagem"**, incluindo:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `forward`, `track_source`, `track_id`, placeholders e envio para grupos.

## Estrutura do Payload

```json
{
  "number": "5511999999999",
  "text": "Por favor, compartilhe sua localização",
  "delay": 0,
  "readchat": true
}
```

## Exemplo de Uso

```json
{
  "number": "5511999999999",
  "text": "Para continuar o atendimento, clique no botão abaixo e compartilhe sua localização"
}
```

> **Nota**: O botão de localização é adicionado automaticamente à mensagem


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "text": {
      "type": "string",
      "description": "Texto da mensagem que ser\u00e1 exibida",
      "example": "Por favor, compartilhe sua localiza\u00e7\u00e3o"
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio",
      "example": 0
    },
    "readchat": {
      "type": "boolean",
      "description": "Se deve marcar a conversa como lida ap\u00f3s envio",
      "example": true
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca \u00faltimas mensagens recebidas como lidas",
      "example": true
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem para responder",
      "example": "3EB0538DA65A59F6D8A251"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros para mencionar (separados por v\u00edrgula)",
      "example": "5511999999999,5511888888888"
    },
    "async": {
      "type": "boolean",
      "description": "Se true, envia a mensagem de forma ass\u00edncrona via fila interna",
      "example": false
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento da mensagem",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID para rastreamento da mensagem (aceita valores duplicados)",
      "example": "msg_123456789"
    }
  },
  "required": [
    "number",
    "text"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Localização enviada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 500 | Erro interno do servidor |

---
#### Solicitar pagamento
`POST /send/request-payment`

Envia uma solicitação de pagamento com o botão nativo **"Revisar e pagar"** do WhatsApp.
O fluxo suporta PIX (estático, dinâmico ou desabilitado), boleto, link de pagamento e cartão,
combinando tudo em uma única mensagem interativa.

## Como funciona
- Define o valor em `amount` (BRL por padrão) e opcionalmente personaliza título, texto e nota adicional.
- Por padrão exige `pixKey`.
- O arquivo apontado por `fileUrl` é anexado como documento (boleto ou fatura em PDF, por exemplo).
- `paymentLink` habilita o botão externo.



## Campos comuns
Este endpoint também suporta os campos padrão: `delay`, `readchat`, `readmessages`, `replyid`,
`mentions`, `track_source`, `track_id` e `async`.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "title": {
      "type": "string",
      "description": "T\u00edtulo que aparece no cabe\u00e7alho do fluxo",
      "example": "Detalhes do pedido"
    },
    "text": {
      "type": "string",
      "description": "Mensagem exibida no corpo do fluxo",
      "example": "Pedido #123 pronto para pagamento"
    },
    "footer": {
      "type": "string",
      "description": "Texto do rodap\u00e9 da mensagem",
      "example": "Loja Exemplo"
    },
    "itemName": {
      "type": "string",
      "description": "Nome do item principal listado no fluxo",
      "example": "Assinatura Plano Ouro"
    },
    "invoiceNumber": {
      "type": "string",
      "description": "Identificador ou n\u00famero da fatura",
      "example": "PED-123"
    },
    "amount": {
      "type": "number",
      "format": "float",
      "description": "Valor da cobran\u00e7a (em BRL por padr\u00e3o)",
      "example": 199.9
    },
    "pixKey": {
      "type": "string",
      "description": "Chave PIX est\u00e1tico (CPF/CNPJ/telefone/email/EVP)",
      "example": "123e4567-e89b-12d3-a456-426614174000"
    },
    "pixType": {
      "type": "string",
      "description": "Tipo da chave PIX (`CPF`, `CNPJ`, `PHONE`, `EMAIL`, `EVP`). Padr\u00e3o `EVP`",
      "example": "EVP"
    },
    "pixName": {
      "type": "string",
      "description": "Nome do recebedor exibido no fluxo (padr\u00e3o usa o nome do perfil da inst\u00e2ncia)",
      "example": "Loja Exemplo"
    },
    "paymentLink": {
      "type": "string",
      "description": "URL externa para checkout (somente dominios homologados; veja lista acima)",
      "example": "https://pagamentos.exemplo.com/checkout/abc"
    },
    "fileUrl": {
      "type": "string",
      "description": "URL ou caminho (base64) do documento a ser anexado (ex.: boleto PDF)",
      "example": "https://cdn.exemplo.com/boleto-123.pdf"
    },
    "fileName": {
      "type": "string",
      "description": "Nome do arquivo exibido no WhatsApp ao anexar `fileUrl`",
      "example": "boleto-123.pdf"
    },
    "boletoCode": {
      "type": "string",
      "description": "Linha digit\u00e1vel do boleto (habilita o m\u00e9todo boleto automaticamente)",
      "example": "34191.79001 01043.510047 91020.150008 5 91070026000"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem que ser\u00e1 respondida"
    },
    "mentions": {
      "type": "string",
      "description": "N\u00fameros mencionados separados por v\u00edrgula"
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio (exibe \"digitando...\" no WhatsApp)"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca o chat como lido ap\u00f3s enviar a mensagem"
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca mensagens recentes como lidas ap\u00f3s o envio"
    },
    "async": {
      "type": "boolean",
      "description": "Enfileira o envio para processamento ass\u00edncrono"
    },
    "track_source": {
      "type": "string",
      "description": "Origem de rastreamento (ex.: chatwoot, crm-interno)"
    },
    "track_id": {
      "type": "string",
      "description": "Identificador de rastreamento (aceita valores duplicados)"
    }
  },
  "required": [
    "number",
    "amount"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Solicitação de pagamento enviada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 500 | Erro interno do servidor |

---
#### Enviar botão PIX
`POST /send/pix-button`

Envia um botão nativo do WhatsApp que abre para pagamento PIX com a chave informada.
O usuário visualiza o detalhe do recebedor, nome e chave.

## Regras principais
- `pixType` aceita: `CPF`, `CNPJ`, `PHONE`, `EMAIL`, `EVP` (case insensitive)
- `pixName` padrão: `"Pix"` quando não informado - nome de quem recebe o pagamento


## Campos comuns
Este endpoint herda os campos opcionais padronizados da tag **"Enviar Mensagem"**:
`delay`, `readchat`, `readmessages`, `replyid`, `mentions`, `track_source`, `track_id` e `async`.

## Exemplo de payload
```json
{
  "number": "5511999999999",
  "pixType": "EVP",
  "pixKey": "123e4567-e89b-12d3-a456-426614174000",
  "pixName": "Loja Exemplo"
}
```


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat para o qual a mensagem ser\u00e1 enviada. Pode ser um n\u00famero de telefone em formato internacional, um ID de grupo (`@g.us`), um ID de usu\u00e1rio (com `@s.whatsapp.net` ou `@lid`).",
      "example": "5511999999999"
    },
    "pixType": {
      "type": "string",
      "description": "Tipo da chave PIX. Valores aceitos: CPF, CNPJ, PHONE, EMAIL ou EVP",
      "example": "EVP"
    },
    "pixKey": {
      "type": "string",
      "description": "Valor da chave PIX (CPF/CNPJ/telefone/email/EVP)",
      "example": "123e4567-e89b-12d3-a456-426614174000"
    },
    "pixName": {
      "type": "string",
      "description": "Nome exibido como recebedor do PIX (padr\u00e3o \"Pix\" se vazio)",
      "example": "Loja Exemplo"
    },
    "async": {
      "type": "boolean",
      "description": "Enfileira o envio para processamento ass\u00edncrono"
    },
    "delay": {
      "type": "integer",
      "description": "Atraso em milissegundos antes do envio (exibe \"digitando...\" no WhatsApp)"
    },
    "readchat": {
      "type": "boolean",
      "description": "Marca o chat como lido ap\u00f3s enviar a mensagem"
    },
    "readmessages": {
      "type": "boolean",
      "description": "Marca mensagens recentes como lidas ap\u00f3s o envio"
    },
    "replyid": {
      "type": "string",
      "description": "ID da mensagem que ser\u00e1 respondida"
    },
    "mentions": {
      "type": "string",
      "description": "Lista de n\u00fameros mencionados separados por v\u00edrgula"
    },
    "track_source": {
      "type": "string",
      "description": "Origem de rastreamento (ex.: chatwoot, crm-interno)"
    },
    "track_id": {
      "type": "string",
      "description": "Identificador de rastreamento (aceita valores duplicados)"
    }
  },
  "required": [
    "number",
    "pixType",
    "pixKey"
  ],
  "example": {
    "number": "5511999999999",
    "pixType": "EVP",
    "pixKey": "123e4567-e89b-12d3-a456-426614174000",
    "pixName": "Loja Exemplo"
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Botão PIX enviado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 500 | Erro interno do servidor |

---
### Tag: Mensagem Async
#### Consultar fila async de envio direto
`GET /message/async`

Retorna um resumo simples da fila de envio `async=true` da instância atual autenticada.

Este endpoint cobre apenas a fila interna de envio direto assíncrono. Ele **não** representa:
- campanhas do sender (`/sender/*`)
- filas de envio em massa

A resposta padrão foi pensada para clientes:
- `status`: visão resumida da fila (`idle`, `queued`, `processing`, `waiting_connection`, `resetting`)
- `pending`: quantidade total estimada de mensagens pendentes
- `processingNow`: indica se o worker está ocupando um job neste momento
- `acceptingNewMessages`: indica se a fila aceita novos envios async
- `sessionReady`: indica se a sessão WhatsApp está pronta para envio
- `resetting`: indica se a fila está pausada por reset/clear


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Resumo da fila async |
| 401 | Token inválido ou ausente |
| 500 | Erro interno ao consultar a fila async |

---
#### Limpar fila async de envio direto
`DELETE /message/async`

Cancela toda a fila de envio `async=true` da instância e marca as mensagens pendentes como `Canceled`.

Este endpoint atua apenas na fila interna de envio direto assíncrono. Ele **não** afeta:
- campanhas do sender (`/sender/*`)
- mensagens já enviadas com sucesso
- mensagens em massa agendadas

O fluxo executado é:
1. pausa o worker interno da fila async
2. drena jobs pendentes em memória e overflow
3. marca backlog persistido em `Queued` como `Canceled`
4. libera a fila para novos envios async

Use este endpoint quando houver backlog preso, fila acumulada ou quando você quiser abortar todos os envios assíncronos ainda não concluídos.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Fila async limpa com sucesso |
| 401 | Token inválido ou ausente |
| 409 | A fila não pôde ser limpa porque a instância está em reset ou havia envio em progresso que não drenou a tempo |
| 500 | Erro interno ao limpar a fila async |

---
### Tag: Ações na mensagem e Buscar
#### Baixar arquivo de uma mensagem
`POST /message/download`

Baixa o arquivo associado a uma mensagem de mídia (imagem, vídeo, áudio, documento ou sticker).

## Parâmetros

- **id** (string, obrigatório): ID da mensagem
- **return_base64** (boolean, default: false): Retorna arquivo em base64
- **generate_mp3** (boolean, default: true): Para áudios, define formato de retorno
  - `true`: Retorna MP3
  - `false`: Retorna OGG
- **return_link** (boolean, default: true): Retorna URL pública do arquivo
- **transcribe** (boolean, default: false): Transcreve áudios para texto
- **openai_apikey** (string, opcional): Chave OpenAI para transcrição
  - Se não informada, usa a chave salva na instância
  - Se informada, atualiza e salva na instância para próximas chamadas
- **download_quoted** (boolean, default: false): Baixa mídia da mensagem citada
  - Útil para baixar conteúdo original de status do WhatsApp
  - Quando uma mensagem é resposta a um status, permite baixar a mídia do status original
  - **Contextualização**: Ao baixar a mídia citada, você identifica o contexto da conversa
    - Exemplo: Se alguém responde a uma promoção, baixando a mídia você saberá que a pergunta é sobre aquela promoção específica

## Exemplos

### Baixar áudio como MP3:
```json
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "generate_mp3": true
}
```

### Transcrever áudio:
```json
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "transcribe": true
}
```

### Apenas base64 (sem salvar):
```json
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "return_base64": true,
  "return_link": false
}
```

### Baixar mídia de status (mensagem citada):
```json
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "download_quoted": true
}
```
*Útil quando o cliente responde a uma promoção/status - você baixa a mídia original para entender sobre qual produto/oferta ele está perguntando.*

## Resposta

```json
{
  "fileURL": "https://api.exemplo.com/files/arquivo.mp3",
  "mimetype": "audio/mpeg",
  "base64Data": "UklGRkj...",
  "transcription": "Texto transcrito"
}
```

**Nota**: 
- Por padrão, se não definido o contrário:
  1. áudios são retornados como MP3. 
  2. E todos os pedidos de download são retornados com URL pública.
- Transcrição requer chave OpenAI válida. A chave pode ser configurada uma vez na instância e será reutilizada automaticamente.
- Retenção de mídia: mantemos as mídias no nosso storage por 2 dias. Após 2 dias, elas são removidas na limpeza automática e o link retornado deixa de ficar disponível. Para voltar a disponibilizar a mídia, é necessário refazer o download pelo endpoint. Se o cliente solicitar novamente, a mídia será baixada do CDN da Meta, o que pode aumentar o tempo de resposta. Enquanto estiver no nosso storage, a resposta tende a ser mais rápida.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID da mensagem contendo o arquivo",
      "example": "7EB0F01D7244B421048F0706368376E0"
    },
    "return_base64": {
      "type": "boolean",
      "description": "Se verdadeiro, retorna o conte\u00fado em base64",
      "default": false
    },
    "generate_mp3": {
      "type": "boolean",
      "description": "Para \u00e1udios, define formato de retorno (true=MP3, false=OGG)",
      "default": true
    },
    "return_link": {
      "type": "boolean",
      "description": "Salva e retorna URL p\u00fablica do arquivo",
      "default": true
    },
    "transcribe": {
      "type": "boolean",
      "description": "Se verdadeiro, transcreve \u00e1udios para texto",
      "default": false
    },
    "openai_apikey": {
      "type": "string",
      "description": "Chave da API OpenAI para transcri\u00e7\u00e3o (opcional)",
      "example": "sk-..."
    },
    "download_quoted": {
      "type": "boolean",
      "description": "Se verdadeiro, baixa m\u00eddia da mensagem citada ao inv\u00e9s da mensagem principal",
      "default": false
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Successful file download |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---
#### Buscar mensagens em um chat
`POST /message/find`

Busca mensagens com múltiplos filtros disponíveis. Este endpoint permite:

1. **Busca por ID específico**: Use `id` para encontrar uma mensagem exata
2. **Filtrar por chat**: Use `chatid` para mensagens de uma conversa específica
3. **Filtrar por rastreamento**: Use `track_source` e `track_id` para mensagens com dados de tracking
4. **Limitar resultados**: Use `limit` para controlar quantas mensagens retornar
5. **Ordenação**: Resultados ordenados por data (mais recentes primeiro)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID espec\u00edfico da mensagem para busca exata",
      "example": "user123:r3EB0538"
    },
    "chatid": {
      "type": "string",
      "description": "ID do chat no formato internacional",
      "example": "5511999999999@s.whatsapp.net"
    },
    "track_source": {
      "type": "string",
      "description": "Origem do rastreamento para filtrar mensagens",
      "example": "chatwoot"
    },
    "track_id": {
      "type": "string",
      "description": "ID de rastreamento para filtrar mensagens",
      "example": "msg_123456789"
    },
    "limit": {
      "type": "integer",
      "description": "Numero maximo de mensagens a retornar (padrao 100)",
      "minimum": 1,
      "default": 100,
      "example": 20
    },
    "offset": {
      "type": "integer",
      "description": "Deslocamento para paginacao (0 retorna as mensagens mais recentes)",
      "default": 0
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de mensagens encontradas com metadados de paginacao |
| 400 | Parametros invalidos |
| 401 | Token invalido ou expirado |
| 404 | Chat nao encontrado |
| 500 | Erro interno do servidor |

---
#### Solicitar histórico sob demanda de um chat
`POST /message/history-sync`

Solicita ao WhatsApp um sync sob demanda de mensagens antigas de um chat.

Regras:
- envie `number`
- `count` é opcional e limitado a 100
- `messageid` é opcional; quando informado, a API usa essa mensagem como referência para buscar mensagens mais antigas do chat

Observação:
- **Importante:** a recuperação pode só acontecer depois de abrir o WhatsApp no celular ou deixá-lo ativo em segundo plano
- `messageid` define a mensagem de referência para carregar histórico anterior
- esse campo não serve para buscar essa mensagem específica
- o histórico é buscado para trás a partir da mensagem de referência informada
- se você quiser recuperar apenas uma mensagem específica `X`, informe como `messageid` a mensagem logo depois de `X` e use `count=1`
- se `messageid` não for informado, a API usa a mensagem mais antiga conhecida localmente desse chat como referência para buscar histórico anterior
- as mensagens retornam depois via webhook/SSE em eventos do tipo `history` e também ficam disponíveis em `/message/find`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "messageid": {
      "type": "string",
      "description": "ID da mensagem de refer\u00eancia usada para buscar mensagens mais antigas do chat",
      "example": "3EB01234567890ABCDEF"
    },
    "number": {
      "type": "string",
      "description": "JID completo do chat",
      "example": "5511999999999@s.whatsapp.net"
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Quantidade desejada de mensagens no sync",
      "example": 20
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Solicitação de history sync enviada com sucesso |
| 400 | Payload inválido ou âncora insuficiente |
| 500 | Erro interno ao solicitar o history sync |

---
#### Marcar mensagens como lidas
`POST /message/markread`

Marca uma ou mais mensagens como lidas. Este endpoint permite:
1. Marcar múltiplas mensagens como lidas de uma vez
2. Atualizar o status de leitura no WhatsApp
3. Sincronizar o status de leitura entre dispositivos

Exemplo de requisição básica:
```json
{
  "id": [
    "62AD1AD844E518180227BF68DA7ED710",
    "ECB9DE48EB41F77BFA8491BFA8D6EF9B"  
  ]
}
```

Exemplo de resposta:
```json
{
  "success": true,
  "message": "Messages marked as read",
  "markedMessages": [
    {
      "id": "62AD1AD844E518180227BF68DA7ED710",
      "timestamp": 1672531200000
    },
    {
      "id": "ECB9DE48EB41F77BFA8491BFA8D6EF9B",
      "timestamp": 1672531300000
    }
  ]
}
```

Parâmetros disponíveis:
- id: Lista de IDs das mensagens a serem marcadas como lidas

Erros comuns:
- 401: Token inválido ou expirado
- 400: Lista de IDs vazia ou inválida
- 404: Uma ou mais mensagens não encontradas
- 500: Erro ao marcar mensagens como lidas


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "array",
      "description": "Lista de IDs das mensagens a serem marcadas como lidas",
      "items": {
        "type": "string"
      },
      "example": [
        "62AD1AD844E518180227BF68DA7ED710",
        "ECB9DE48EB41F77BFA8491BFA8D6EF9B"
      ]
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Messages successfully marked as read |
| 400 | Invalid request payload or missing required fields |
| 401 | Unauthorized - invalid or missing token |
| 500 | Server error while processing the request |

---
#### Enviar reação a uma mensagem
`POST /message/react`

Envia uma reação (emoji) a uma mensagem específica. Este endpoint permite:

1. Adicionar ou remover reações em mensagens

2. Usar qualquer emoji Unicode válido

3. Reagir a mensagens em chats individuais ou grupos

4. Remover reações existentes

5. Verificar o status da reação enviada


Tipos de reações suportados:

- Qualquer emoji Unicode válido (👍, ❤️, 😂, etc)

- String vazia para remover reação


Exemplo de requisição básica:

```json

{
  "number": "5511999999999@s.whatsapp.net",
  "text": "👍",
  "id": "3EB0538DA65A59F6D8A251"
}

```


Exemplo de requisição para remover reação:

```json

{
  "number": "5511999999999@s.whatsapp.net",
  "text": "",
  "id": "3EB0538DA65A59F6D8A251"
}

```


Exemplo de resposta:

```json

{
  "success": true,
  "message": "Reaction sent",
  "reaction": {
    "id": "3EB0538DA65A59F6D8A251",
    "emoji": "👍",
    "timestamp": 1672531200000,
    "status": "sent"
  }
}

```


Exemplo de resposta ao remover reação:

```json

{
  "success": true,
  "message": "Reaction removed",
  "reaction": {
    "id": "3EB0538DA65A59F6D8A251",
    "emoji": null,
    "timestamp": 1672531200000,
    "status": "removed"
  }
}

```


Parâmetros disponíveis:

- number: Número do chat no formato internacional (ex:
5511999999999@s.whatsapp.net)

- text: Emoji Unicode da reação (ou string vazia para remover reação)

- id: ID da mensagem que receberá a reação


Erros comuns:

- 401: Token inválido ou expirado

- 400: Número inválido ou emoji não suportado

- 404: Mensagem não encontrada

- 500: Erro ao enviar reação


Limitações:

- Só é possível reagir a mensagens enviadas por outros usuários

- Não é possível reagir a mensagens antigas (mais de 7 dias)

- O mesmo usuário só pode ter uma reação ativa por mensagem


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do chat no formato internacional",
      "example": "5511999999999@s.whatsapp.net"
    },
    "text": {
      "type": "string",
      "description": "Emoji Unicode da rea\u00e7\u00e3o (ou string vazia para remover rea\u00e7\u00e3o)",
      "example": "\ud83d\udc4d"
    },
    "id": {
      "type": "string",
      "description": "ID da mensagem que receber\u00e1 a rea\u00e7\u00e3o",
      "example": "3EB0538DA65A59F6D8A251"
    }
  },
  "required": [
    "number",
    "text",
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Reação enviada com sucesso |
| 400 | Erro nos dados da requisição |
| 401 | Não autorizado |
| 404 | Mensagem não encontrada |
| 500 | Erro interno do servidor |

---
#### Apagar Mensagem Para Todos
`POST /message/delete`

Apaga uma mensagem para todos os participantes da conversa.

### Funcionalidades:
- Apaga mensagens em conversas individuais ou grupos
- Funciona com mensagens enviadas pelo usuário ou recebidas
- Atualiza o status no banco de dados
- Envia webhook de atualização

**Notas Técnicas**:
1. O ID da mensagem pode ser fornecido em dois formatos:
   - ID completo (contém ":"): usado diretamente
   - ID curto: concatenado com o owner para busca
2. Gera evento webhook do tipo "messages_update"
3. Atualiza o status da mensagem para "Deleted"
4. Para newsletters/canais, use `POST /newsletter/messages/delete`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID da mensagem a ser apagada"
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagem apagada com sucesso |
| 400 | Payload inválido ou ID de chat/sender inválido |
| 401 | Token não fornecido |
| 404 | Mensagem não encontrada |
| 500 | Erro interno do servidor ou sessão não iniciada |

---
#### Edita uma mensagem enviada
`POST /message/edit`

Edita o conteúdo de uma mensagem já enviada usando a funcionalidade nativa do WhatsApp.

O endpoint realiza:
- Busca a mensagem original no banco de dados usando o ID fornecido
- Edita o conteúdo da mensagem para o novo texto no WhatsApp
- Gera um novo ID para a mensagem editada
- Retorna objeto de mensagem completo seguindo o padrão da API
- Dispara eventos SSE/Webhook automaticamente

**Importante**: 
- Só é possível editar mensagens enviadas pela própria instância
- A mensagem deve existir no banco de dados
- O ID pode ser fornecido no formato completo (owner:messageid) ou apenas messageid
- A mensagem deve estar dentro do prazo permitido pelo WhatsApp para edição
- Para newsletters/canais, use `POST /newsletter/messages/edit`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "id",
    "text"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "ID \u00fanico da mensagem que ser\u00e1 editada (formato owner:messageid ou apenas messageid)",
      "example": "3A12345678901234567890123456789012"
    },
    "text": {
      "type": "string",
      "description": "Novo conte\u00fado de texto da mensagem",
      "example": "Texto editado da mensagem"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagem editada com sucesso |
| 400 | Dados inválidos na requisição |
| 401 | Sem sessão ativa |
| 404 | Mensagem não encontrada |
| 500 | Erro interno do servidor |

---
#### Fixa ou desafixa uma mensagem
`POST /message/pin`

Fixa ou desafixa uma mensagem específica usando a funcionalidade nativa do WhatsApp.

O endpoint realiza:
- Busca a mensagem original no banco de dados usando o ID fornecido
- Envia a ação de fixar ou desafixar a mensagem no WhatsApp
- Funciona em conversas individuais e grupos
- Gera um novo ID para o evento de pin/unpin
- Retorna objeto de mensagem completo seguindo o padrão da API
- Dispara eventos SSE/Webhook automaticamente

**Importante**:
- O ID pode ser fornecido no formato completo (`owner:messageid`) ou apenas `messageid`
- Em conversas `1:1`, a ação é suportada normalmente
- Em grupos, a permissão depende da configuração do WhatsApp do grupo (`apenas admins` ou `qualquer membro`)
- O backend não valida localmente se a instância é admin do grupo; a decisão final é do WhatsApp
- Newsletters/canais não são suportados neste endpoint
- Se `pin` não for enviado, o valor padrão é `true`
- Ao fixar mensagem, `duration` aceita dias (`1`, `7` ou `30`)
- Se `duration` não for enviado ou vier com qualquer outro valor, o backend usa `30` dias
- Ao desafixar (`pin: false`), `duration` é ignorado


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "id"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "ID \u00fanico da mensagem alvo (formato `owner:messageid` ou apenas `messageid`)",
      "example": "3A12345678901234567890123456789012"
    },
    "pin": {
      "type": "boolean",
      "default": true,
      "description": "Define se a mensagem deve ser fixada (`true`) ou desafixada (`false`)",
      "example": true
    },
    "duration": {
      "type": "integer",
      "default": 30,
      "description": "Dura\u00e7\u00e3o do pin em dias. Valores aceitos: `1`, `7` ou `30`. Qualquer outro valor cai para `30`.",
      "example": 7
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Ação de fixar/desafixar mensagem enviada com sucesso |
| 400 | Dados inválidos na requisição ou operação não suportada |
| 401 | Sem sessão ativa ou token inválido |
| 404 | Mensagem não encontrada |
| 500 | Erro interno do servidor ou erro retornado pelo WhatsApp |

---
### Tag: Grupos e Comunidades
#### Criar um novo grupo
`POST /group/create`

Cria um novo grupo no WhatsApp com participantes iniciais.

### Detalhes
- Requer autenticação via token da instância
- Os números devem ser fornecidos sem formatação (apenas dígitos)

### Limitações
- Mínimo de 1 participante além do criador
  
### Comportamento
- Retorna informações detalhadas do grupo criado
- Inclui lista de participantes adicionados com sucesso/falha


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome do grupo",
      "minLength": 1,
      "maxLength": 100,
      "example": "uazapiGO grupo"
    },
    "participants": {
      "type": "array",
      "description": "Lista de n\u00fameros de telefone dos participantes iniciais",
      "items": {
        "type": "string",
        "description": "N\u00famero de telefone sem formata\u00e7\u00e3o"
      },
      "minItems": 1,
      "maxItems": 50,
      "example": [
        "5521987905995",
        "5511912345678"
      ]
    }
  },
  "required": [
    "name",
    "participants"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Grupo criado com sucesso |
| 400 | Erro de payload inválido |
| 500 | Erro interno do servidor |

---
#### Obter informações detalhadas de um grupo
`POST /group/info`

Recupera informações completas de um grupo do WhatsApp, incluindo:
- Detalhes do grupo
- Participantes
- Configurações
- Link de convite (opcional)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo (JID)",
      "example": "120363153742561022@g.us"
    },
    "getInviteLink": {
      "type": "boolean",
      "description": "Recuperar link de convite do grupo",
      "default": false,
      "example": true
    },
    "getRequestsParticipants": {
      "type": "boolean",
      "description": "Recuperar lista de solicita\u00e7\u00f5es pendentes de participa\u00e7\u00e3o",
      "default": false,
      "example": false
    },
    "force": {
      "type": "boolean",
      "description": "For\u00e7ar atualiza\u00e7\u00e3o, ignorando cache",
      "default": false,
      "example": false
    }
  },
  "required": [
    "groupjid"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações do grupo obtidas com sucesso |
| 400 | Código de convite inválido ou mal formatado |
| 404 | Grupo não encontrado ou link de convite expirado |
| 500 | Erro interno do servidor |

---
#### Obter informações de um grupo pelo código de convite
`POST /group/inviteInfo`

Retorna informações detalhadas de um grupo usando um código de convite ou URL completo do WhatsApp.

Esta rota permite:
- Recuperar informações básicas sobre um grupo antes de entrar
- Validar um link de convite
- Obter detalhes como nome do grupo, número de participantes e restrições de entrada


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "invitecode": {
      "type": "string",
      "description": "C\u00f3digo de convite ou URL completo do grupo.\nPode ser um c\u00f3digo curto ou a URL completa do WhatsApp.\n",
      "examples": [
        "IYnl5Zg9bUcJD32rJrDzO7",
        "https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7"
      ]
    }
  },
  "required": [
    "invitecode"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações do grupo obtidas com sucesso |
| 400 | Código de convite inválido ou mal formatado |
| 404 | Grupo não encontrado ou link de convite expirado |
| 500 | Erro interno do servidor |

---
#### Entrar em um grupo usando código de convite
`POST /group/join`

Permite entrar em um grupo do WhatsApp usando um código de convite ou URL completo. 

Características:
- Suporta código de convite ou URL completo
- Valida o código antes de tentar entrar no grupo
- Retorna informações básicas do grupo após entrada bem-sucedida
- Trata possíveis erros como convite inválido ou expirado


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "invitecode"
  ],
  "properties": {
    "invitecode": {
      "type": "string",
      "description": "C\u00f3digo de convite ou URL completo do grupo. \nFormatos aceitos:\n- C\u00f3digo completo: \"IYnl5Zg9bUcJD32rJrDzO7\"\n- URL completa: \"https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7\"\n",
      "example": "https://chat.whatsapp.com/IYnl5Zg9bUcJD32rJrDzO7",
      "minLength": 10,
      "maxLength": 50
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Entrada no grupo realizada com sucesso |
| 400 | Código de convite inválido |
| 403 | Usuário já está no grupo ou não tem permissão para entrar |
| 500 | Erro interno do servidor |

---
#### Sair de um grupo
`POST /group/leave`

Remove o usuário atual de um grupo específico do WhatsApp.

Requisitos:
- O usuário deve estar conectado a uma instância válida
- O usuário deve ser um membro do grupo

Comportamentos:
- Se o usuário for o último administrador, o grupo será dissolvido
- Se o usuário for um membro comum, será removido do grupo


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo (JID)\n- Formato: n\u00famero@g.us\n- Exemplo v\u00e1lido: 120363324255083289@g.us\n",
      "example": "120363324255083289@g.us",
      "pattern": "^\\d+@g\\.us$"
    }
  },
  "required": [
    "groupjid"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Saída do grupo realizada com sucesso |
| 400 | Erro de payload inválido |
| 500 | Erro interno do servidor ou falha na conexão |

---
#### Listar todos os grupos
`GET /group/list`

Retorna uma lista com todos os grupos disponíveis para a conta do WhatsApp atualmente conectada.

Recursos adicionais:
- Suporta atualização forçada do cache de grupos
- Recupera informações detalhadas de grupos conectados


**Parâmetros:**
| Nome | Local | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| force | query | boolean | Não | Se definido como `true`, força a atualização do cache de grupos.
Útil para garantir que as informações mais recentes sejam recuperadas.

Comportamentos:
- `false` (padrão): Usa informações em cache
- `true`: Busca dados atualizados diretamente do WhatsApp
 |
| noparticipants | query | boolean | Não | Se definido como `true`, retorna a lista de grupos sem incluir os participantes.
Útil para otimizar a resposta quando não há necessidade dos dados dos participantes.

Comportamentos:
- `false` (padrão): Retorna grupos com lista completa de participantes
- `true`: Retorna grupos sem incluir os participantes
 |

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de grupos recuperada com sucesso |
| 500 | Erro interno do servidor ao recuperar grupos |

---
#### Listar todos os grupos com filtros e paginacao
`POST /group/list`

Retorna uma lista com todos os grupos disponiveis para a conta do WhatsApp atualmente conectada, com opcoes de filtros e paginacao via corpo (POST).
A rota GET continua para quem prefere a listagem direta sem paginacao.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "description": "Quantidade maxima de resultados por pagina (padrao 50, maximo 1000)",
      "default": 50
    },
    "offset": {
      "type": "integer",
      "description": "Deslocamento base zero",
      "default": 0
    },
    "search": {
      "type": "string",
      "description": "Texto para filtrar grupos por nome/JID"
    },
    "force": {
      "type": "boolean",
      "default": false,
      "description": "Se definido como `true`, forca a atualizacao do cache de grupos.\nUtil para garantir que as informacoes mais recentes sejam recuperadas.\n"
    },
    "noParticipants": {
      "type": "boolean",
      "default": false,
      "description": "Se definido como `true`, retorna a lista de grupos sem incluir os participantes.\nUtil para otimizar a resposta quando nao ha necessidade dos dados dos participantes.\n"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de grupos recuperada com sucesso |
| 500 | Erro interno do servidor ao recuperar grupos |

---
#### Resetar código de convite do grupo
`POST /group/resetInviteCode`

Gera um novo código de convite para o grupo, invalidando o código de convite anterior. 
Somente administradores do grupo podem realizar esta ação.

Principais características:
- Invalida o link de convite antigo
- Cria um novo link único
- Retorna as informações atualizadas do grupo


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo (JID)",
      "example": "120363308883996631@g.us"
    }
  },
  "required": [
    "groupjid"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Código de convite resetado com sucesso |
| 400 | Erro de validação |
| 403 | Usuário sem permissão |
| 500 | Erro interno do servidor |

---
#### Configurar permissões de envio de mensagens no grupo
`POST /group/updateAnnounce`

Define as permissões de envio de mensagens no grupo, permitindo restringir o envio apenas para administradores.

Quando ativado (announce=true):
- Apenas administradores podem enviar mensagens
- Outros participantes podem apenas ler
- Útil para anúncios importantes ou controle de spam

Quando desativado (announce=false):
- Todos os participantes podem enviar mensagens
- Configuração padrão para grupos normais

Requer que o usuário seja administrador do grupo para fazer alterações.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo no formato xxxx@g.us",
      "example": "120363339858396166@g.us"
    },
    "announce": {
      "type": "boolean",
      "description": "Controla quem pode enviar mensagens no grupo",
      "example": true
    }
  },
  "required": [
    "groupjid",
    "announce"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração atualizada com sucesso |
| 401 | Token de autenticação ausente ou inválido |
| 403 | Usuário não é administrador do grupo |
| 404 | Grupo não encontrado |
| 500 | Erro interno do servidor ou falha na API do WhatsApp |

---
#### Atualizar descrição do grupo
`POST /group/updateDescription`

Altera a descrição (tópico) do grupo WhatsApp especificado.
Requer que o usuário seja administrador do grupo.
A descrição aparece na tela de informações do grupo e pode ser visualizada por todos os participantes.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "groupjid",
    "description"
  ],
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "JID (ID) do grupo no formato xxxxx@g.us",
      "example": "120363339858396166@g.us",
      "pattern": "^[0-9]+@g\\.us$"
    },
    "description": {
      "type": "string",
      "description": "Nova descri\u00e7\u00e3o/t\u00f3pico do grupo",
      "example": "Grupo oficial de suporte",
      "maxLength": 512
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Descrição atualizada com sucesso |
| 401 | Token inválido ou ausente |
| 403 | Usuário não é administrador do grupo |
| 404 | Grupo não encontrado |
| 413 | Descrição excede o limite máximo permitido |

---
#### Atualizar imagem do grupo
`POST /group/updateImage`

Altera a imagem do grupo especificado. A imagem pode ser enviada como URL ou como string base64.

Requisitos da imagem:
- Formato: JPEG
- Resolução máxima: 640x640 pixels
- Imagens maiores ou diferente de JPEG não são aceitas pelo WhatsApp

Para remover a imagem atual, envie "remove" ou "delete" no campo image.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "JID do grupo",
      "example": "120363308883996631@g.us"
    },
    "image": {
      "type": "string",
      "description": "URL da imagem, string base64 ou \"remove\"/\"delete\" para remover.\nA imagem deve estar em formato JPEG e ter resolu\u00e7\u00e3o m\u00e1xima de 640x640.\n",
      "examples": [
        "https://example.com/image.jpg",
        "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "remove"
      ]
    }
  },
  "required": [
    "groupjid",
    "image"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Imagem atualizada com sucesso |
| 400 | Erro nos parâmetros da requisição |
| 401 | Token inválido ou expirado |
| 403 | Usuário não é administrador do grupo |
| 413 | Imagem muito grande |
| 415 | Formato de imagem inválido |

---
#### Configurar permissão de edição do grupo
`POST /group/updateLocked`

Define se apenas administradores podem editar as informações do grupo. 
Quando bloqueado (locked=true), apenas administradores podem alterar nome, descrição, 
imagem e outras configurações do grupo. Quando desbloqueado (locked=false), 
qualquer participante pode editar as informações.

Importante:
- Requer que o usuário seja administrador do grupo
- Afeta edições de nome, descrição, imagem e outras informações do grupo
- Não controla permissões de adição de membros


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo (JID)",
      "example": "120363308883996631@g.us"
    },
    "locked": {
      "type": "boolean",
      "description": "Define permiss\u00f5es de edi\u00e7\u00e3o:\n- true = apenas admins podem editar infos do grupo\n- false = qualquer participante pode editar infos do grupo\n",
      "example": true
    }
  },
  "required": [
    "groupjid",
    "locked"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação realizada com sucesso |
| 403 | Usuário não é administrador do grupo |
| 404 | Grupo não encontrado |

---
#### Atualizar nome do grupo
`POST /group/updateName`

Altera o nome de um grupo do WhatsApp. Apenas administradores do grupo podem realizar esta operação.
O nome do grupo deve seguir as diretrizes do WhatsApp e ter entre 1 e 25 caracteres.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "groupjid",
    "name"
  ],
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "Identificador \u00fanico do grupo no formato JID",
      "example": "120363339858396166@g.us"
    },
    "name": {
      "type": "string",
      "description": "Novo nome para o grupo",
      "example": "Grupo de Suporte",
      "minLength": 1,
      "maxLength": 25
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nome do grupo atualizado com sucesso |
| 400 | Erro de validação na requisição |
| 401 | Token de autenticação ausente ou inválido |
| 403 | Usuário não é administrador do grupo |
| 404 | Grupo não encontrado |
| 500 | Erro interno do servidor |

---
#### Gerenciar participantes do grupo
`POST /group/updateParticipants`

Gerencia participantes do grupo através de diferentes ações:
- Adicionar ou remover participantes
- Promover ou rebaixar administradores
- Aprovar ou rejeitar solicitações pendentes

Requer que o usuário seja administrador do grupo para executar as ações.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "groupjid": {
      "type": "string",
      "description": "JID (identificador) do grupo",
      "example": "120363308883996631@g.us"
    },
    "action": {
      "type": "string",
      "description": "A\u00e7\u00e3o a ser executada:\n- add: Adicionar participantes ao grupo\n- remove: Remover participantes do grupo\n- promote: Promover participantes a administradores\n- demote: Remover privil\u00e9gios de administrador\n- approve: Aprovar solicita\u00e7\u00f5es pendentes de entrada\n- reject: Rejeitar solicita\u00e7\u00f5es pendentes de entrada\n",
      "enum": [
        "add",
        "remove",
        "promote",
        "demote",
        "approve",
        "reject"
      ],
      "example": "promote"
    },
    "participants": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de n\u00fameros de telefone ou JIDs dos participantes.\nPara n\u00fameros de telefone, use formato internacional sem '+' ou espa\u00e7os.\n",
      "example": [
        "5521987654321",
        "5511999887766"
      ]
    }
  },
  "required": [
    "groupjid",
    "action",
    "participants"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Sucesso na operação |
| 400 | Erro nos parâmetros da requisição |
| 403 | Usuário não é administrador do grupo |
| 500 | Erro interno do servidor |

---
#### Criar uma comunidade
`POST /community/create`

Cria uma nova comunidade no WhatsApp. Uma comunidade é uma estrutura que permite agrupar múltiplos grupos relacionados sob uma única administração. 

A comunidade criada inicialmente terá apenas o grupo principal (announcements), e grupos adicionais podem ser vinculados posteriormente usando o endpoint `/community/updategroups`.

**Observações importantes:**
- O número que cria a comunidade torna-se automaticamente o administrador
- A comunidade terá um grupo principal de anúncios criado automaticamente


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome da comunidade",
      "example": "Comunidade do Bairro"
    }
  },
  "required": [
    "name"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Comunidade criada com sucesso |
| 400 | Erro na requisição |
| 401 | Token inválido ou não fornecido |
| 403 | Sem permissão para criar comunidades |
| 429 | Limite de criação de comunidades atingido |
| 500 | Erro interno do servidor |

---
#### Gerenciar grupos em uma comunidade
`POST /community/editgroups`

Adiciona ou remove grupos de uma comunidade do WhatsApp. Apenas administradores da comunidade podem executar estas operações.

## Funcionalidades
- Adicionar múltiplos grupos simultaneamente a uma comunidade
- Remover grupos de uma comunidade existente
- Suporta operações em lote

## Limitações
- Os grupos devem existir previamente
- A comunidade deve existir e o usuário deve ser administrador
- Grupos já vinculados não podem ser adicionados novamente
- Grupos não vinculados não podem ser removidos

## Ações Disponíveis
- `add`: Adiciona os grupos especificados à comunidade
- `remove`: Remove os grupos especificados da comunidade


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "community",
    "action",
    "groupjids"
  ],
  "properties": {
    "community": {
      "type": "string",
      "description": "JID (identificador \u00fanico) da comunidade",
      "example": "120363153742561022@g.us"
    },
    "action": {
      "type": "string",
      "enum": [
        "add",
        "remove"
      ],
      "description": "Tipo de opera\u00e7\u00e3o a ser realizada:\n* add - Adiciona grupos \u00e0 comunidade\n* remove - Remove grupos da comunidade\n"
    },
    "groupjids": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[0-9]+@g.us$"
      },
      "minItems": 1,
      "description": "Lista de JIDs dos grupos para adicionar ou remover",
      "example": [
        "120363324255083289@g.us",
        "120363308883996631@g.us"
      ]
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação realizada com sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Usuário não é administrador da comunidade |

---
### Tag: Newsletters e Canais
#### Criar canal
`POST /newsletter/create`

Cria um novo canal/newsletter no WhatsApp.

Observações:
- `name` é obrigatório
- `picture` é opcional
- `picture` aceita URL HTTP/HTTPS, base64 puro ou data URI
- imagens acima de 1 MB são rejeitadas


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "name"
  ],
  "properties": {
    "name": {
      "type": "string",
      "example": "Canal de Promo\u00e7\u00f5es"
    },
    "description": {
      "type": "string",
      "example": "Ofertas e novidades da loja"
    },
    "picture": {
      "type": "string",
      "description": "URL, base64 puro ou data URI da imagem do canal.",
      "example": "https://example.com/newsletter.png"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Canal criado com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao criar o canal |

---
#### Listar canais inscritos
`GET /newsletter/list`

Retorna os canais/newsletters já inscritos pela conta do WhatsApp atualmente conectada.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de canais recuperada com sucesso |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao listar canais |

---
#### Buscar informações de um canal
`POST /newsletter/info`

Busca os detalhes de um canal/newsletter pelo `id` numérico ou pelo `jid`.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID num\u00e9rico do canal. Se informado sem dom\u00ednio, ser\u00e1 convertido para `@newsletter`.",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "description": "JID completo do canal.",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações do canal recuperadas com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao consultar o canal |

---
#### Buscar canal por link-chave de convite
`POST /newsletter/link`

Busca as informações de um canal a partir da chave de convite.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "key"
  ],
  "properties": {
    "key": {
      "type": "string",
      "description": "Chave do convite do canal.",
      "example": "AbCdEfGhIjKlMn"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações do canal recuperadas com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao consultar o convite |

---
#### Assinar live updates temporários de um canal
`POST /newsletter/subscribe`

Assina temporariamente os live updates internos do WhatsApp para um canal.

Observação:
- esta rota retorna apenas a duração da assinatura temporária
- isso não cria um novo evento de webhook


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Assinatura criada com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao assinar updates |

---
#### Buscar mensagens de um canal
`POST /newsletter/messages`

Busca diretamente no WhatsApp os posts/mensagens de um canal (newsletter).

Esta rota não depende de mensagens salvas localmente e é útil para:
- carregar o histórico recente de posts de um canal
- paginar mensagens anteriores usando `beforeid`
- consumir conteúdo de newsletters sem persistência em banco

Identificação do canal:
- envie `id` com o identificador numérico do canal; o backend converte para `@newsletter`
- ou envie `jid` completo no formato `1234567890@newsletter`

Observações:
- `count` controla quantos posts retornar
- use preferencialmente `beforeid`
- `beforeid` pagina para trás a partir de um `serverid`
- o retorno vem no campo `response`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID num\u00e9rico do canal. Se informado sem dom\u00ednio, ser\u00e1 convertido para `@newsletter`.",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "description": "JID completo do canal.",
      "example": "120363123456789012@newsletter"
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade de mensagens/posts a buscar.",
      "example": 20
    },
    "beforeid": {
      "type": "integer",
      "minimum": 1,
      "description": "Retorna mensagens anteriores ao `serverid` informado.\nUse para pagina\u00e7\u00e3o retroativa.\n",
      "example": 12345
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagens do canal recuperadas com sucesso |
| 400 | Payload inválido ou ID/JID do canal inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao consultar mensagens do canal no WhatsApp |

---
#### Editar mensagem recente de um canal
`POST /newsletter/messages/edit`

Edita o conteúdo de um post recente de newsletter diretamente no WhatsApp.

Esta rota:
- nao depende de mensagens salvas localmente
- busca a mensagem recente do canal via WhatsApp/whatsmeow
- localiza o post por `messageid` ou `serverid`
- edita apenas tipos suportados (`text`, `image`, `video`, `document`)

Observações:
- use `jid` ou `id` para identificar o canal
- envie ao menos um entre `messageid` e `serverid`
- envie `text` com o novo conteúdo/legenda
- `count` e `maxpages` controlam a janela de busca no canal


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "text"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "ID num\u00e9rico do canal. Se informado sem dom\u00ednio, ser\u00e1 convertido para `@newsletter`.",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "description": "JID completo do canal.",
      "example": "120363123456789012@newsletter"
    },
    "messageid": {
      "type": "string",
      "description": "ID l\u00f3gico da mensagem no canal.",
      "example": "3EB0B4302B3A8A52F7A1"
    },
    "serverid": {
      "type": "integer",
      "minimum": 1,
      "description": "Identificador sequencial do post no canal.",
      "example": 12345
    },
    "text": {
      "type": "string",
      "description": "Novo texto ou nova legenda do post.",
      "example": "Post atualizado"
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade de mensagens buscadas por p\u00e1gina ao localizar o post.",
      "example": 100
    },
    "maxpages": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade m\u00e1xima de p\u00e1ginas buscadas ao localizar o post.",
      "example": 5
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagem do canal editada com sucesso |
| 400 | Payload inválido, mensagem não editável, mensagem alvo não identificada ou canal inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 404 | Mensagem do canal não encontrada na janela recente consultada |
| 500 | Erro interno ao consultar ou editar a mensagem do canal |

---
#### Deletar mensagem recente de um canal
`POST /newsletter/messages/delete`

Apaga um post recente de newsletter diretamente no WhatsApp.

Esta rota:
- nao depende de mensagens salvas localmente
- revoga o post no canal usando o WhatsApp/whatsmeow
- aceita localizar o post por `messageid` ou `serverid`

Observações:
- use `jid` ou `id` para identificar o canal
- envie ao menos um entre `messageid` e `serverid`
- `count` e `maxpages` controlam a janela de busca no canal


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID num\u00e9rico do canal. Se informado sem dom\u00ednio, ser\u00e1 convertido para `@newsletter`.",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "description": "JID completo do canal.",
      "example": "120363123456789012@newsletter"
    },
    "messageid": {
      "type": "string",
      "description": "ID l\u00f3gico da mensagem no canal.",
      "example": "3EB0B4302B3A8A52F7A1"
    },
    "serverid": {
      "type": "integer",
      "minimum": 1,
      "description": "Identificador sequencial do post no canal.",
      "example": 12345
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade de mensagens buscadas por p\u00e1gina ao localizar o post.",
      "example": 100
    },
    "maxpages": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade m\u00e1xima de p\u00e1ginas buscadas ao localizar o post.",
      "example": 5
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagem do canal deletada com sucesso |
| 400 | Payload inválido ou canal inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 404 | Mensagem do canal não encontrada na janela recente consultada |
| 500 | Erro interno ao consultar ou deletar a mensagem do canal |

---
#### Buscar updates de mensagens de um canal
`POST /newsletter/updates`

Consulta diretamente no WhatsApp os updates de posts já existentes de um canal.

Esta rota é diferente de `/newsletter/messages`:
- `/newsletter/messages` retorna o conteúdo dos posts
- `/newsletter/updates` retorna mudanças posteriores nos posts, especialmente métricas

Esta rota também não é um evento de webhook:
- não existe webhook `newsletter_messages_update`
- para views e reactions de canais, consulte `/newsletter/updates` sob demanda

Casos de uso:
- atualizar contadores de `views` de posts já carregados
- atualizar `reactionCounts` de posts do canal
- consultar sob demanda os mesmos tipos de métricas que chegam nos live updates internos do WhatsApp

Observações:
- use preferencialmente `afterid`
- `afterid` filtra updates depois de um `serverid`
- `since` filtra pelo momento do update
- `since` aceita timestamp em segundos ou milissegundos
- o retorno vem no campo `response`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID num\u00e9rico do canal. Se informado sem dom\u00ednio, ser\u00e1 convertido para `@newsletter`.",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "description": "JID completo do canal.",
      "example": "120363123456789012@newsletter"
    },
    "count": {
      "type": "integer",
      "minimum": 1,
      "description": "Quantidade m\u00e1xima de updates retornados.",
      "example": 50
    },
    "afterid": {
      "type": "integer",
      "minimum": 1,
      "description": "Retorna apenas updates posteriores ao `serverid` informado.",
      "example": 12345
    },
    "since": {
      "type": "integer",
      "description": "Timestamp de corte.\n- Se maior que `1000000000000`, \u00e9 interpretado como milissegundos.\n- Caso contr\u00e1rio, \u00e9 interpretado como segundos.\n",
      "example": 1710000000
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Updates de mensagens do canal recuperados com sucesso |
| 400 | Payload inválido ou ID/JID do canal inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao consultar updates do canal no WhatsApp |

---
#### Marcar posts do canal como visualizados
`POST /newsletter/viewed`

Marca um ou mais posts do canal como visualizados usando `serverid`.

Observações:
- envie `serverids` com uma lista de posts


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "serverids": {
      "type": "array",
      "items": {
        "type": "integer"
      },
      "example": [
        12345,
        12346
      ]
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Posts marcados como visualizados |
| 400 | Payload inválido ou faltando `serverids` |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao marcar visualização |

---
#### Reagir a um post do canal
`POST /newsletter/reaction`

Envia, altera ou remove uma reação de um post do canal.

Observações:
- `serverid` identifica o post alvo
- `reaction` define o emoji
- envie `reaction` vazio para remover a reação
- `reactionmessageid` é opcional; se omitido, o WhatsApp gera o ID da reação


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "serverid": {
      "type": "integer",
      "example": 12345
    },
    "reaction": {
      "type": "string",
      "example": "\ud83d\udd25"
    },
    "reactionmessageid": {
      "type": "string",
      "example": "3EB0AABBCCDD"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Reação aplicada com sucesso |
| 400 | Payload inválido ou faltando `serverid` |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao reagir ao post |

---
#### Seguir canal
`POST /newsletter/follow`

Segue um canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Canal seguido com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao seguir canal |

---
#### Deixar de seguir canal
`POST /newsletter/unfollow`

Deixa de seguir um canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Canal removido dos seguidos com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao deixar de seguir canal |

---
#### Silenciar canal
`POST /newsletter/mute`

Ativa o mute de um canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Canal silenciado com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao silenciar canal |

---
#### Remover mute do canal
`POST /newsletter/unmute`

Remove o mute de um canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mute removido com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao remover mute do canal |

---
#### Deletar canal
`POST /newsletter/delete`

Remove/deleta um canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Canal deletado com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao deletar o canal |

---
#### Atualizar foto do canal
`POST /newsletter/picture`

Atualiza a imagem do canal/newsletter.

Observações:
- `picture` aceita URL HTTP/HTTPS, base64 puro ou data URI
- imagens acima de 1 MB são rejeitadas


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "picture"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "picture": {
      "type": "string",
      "example": "https://example.com/newsletter.png"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Foto do canal atualizada com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao atualizar a foto do canal |

---
#### Atualizar nome do canal
`POST /newsletter/name`

Atualiza o nome do canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "name"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "name": {
      "type": "string",
      "example": "Canal de Promo\u00e7\u00f5es VIP"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nome atualizado com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao atualizar o nome do canal |

---
#### Atualizar descrição do canal
`POST /newsletter/description`

Atualiza a descrição do canal/newsletter.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "description": {
      "type": "string",
      "example": "Atualiza\u00e7\u00f5es, ofertas e novidades"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Descrição atualizada com sucesso |
| 400 | Payload inválido ou ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao atualizar a descrição do canal |

---
#### Atualizar configurações do canal
`POST /newsletter/settings`

Atualiza configurações do canal/newsletter.

Atualmente, esta rota controla `reactionCodes`.

Valores aceitos:
- `all`
- `basic`
- `none`
- `blocklist`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "reactionCodes"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "reactionCodes": {
      "type": "string",
      "example": "basic"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configurações atualizadas com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao atualizar configurações do canal |

---
#### Pesquisar canais públicos
`POST /newsletter/search`

Pesquisa canais/newsletters públicos no diretório do WhatsApp.

Observações:
- use `after` para buscar a próxima página
- `countryCodes` filtra por países
- `view` e `searchText` são opcionais


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "example": 20
    },
    "view": {
      "type": "string",
      "example": "RECOMMENDED"
    },
    "countryCodes": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "example": [
        "BR"
      ]
    },
    "searchText": {
      "type": "string",
      "example": "promo"
    },
    "after": {
      "type": "string",
      "example": "YXJyYXljb25uZWN0aW9uOjE5"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Pesquisa executada com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao pesquisar canais |

---
#### Convidar admin do canal
`POST /newsletter/admin/invite`

Convida um telefone para virar administrador do canal.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "phone"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "phone": {
      "type": "string",
      "example": "5511999999999"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Convite enviado com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao convidar admin |

---
#### Aceitar convite de admin do canal
`POST /newsletter/admin/accept`

Aceita um convite pendente de administrador do canal.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Convite aceito com sucesso |
| 400 | ID/JID inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao aceitar convite de admin |

---
#### Remover admin do canal
`POST /newsletter/admin/remove`

Remove um administrador do canal usando o telefone dele.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "phone"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "phone": {
      "type": "string",
      "example": "5511999999999"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Admin removido com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao remover admin |

---
#### Revogar convite de admin do canal
`POST /newsletter/admin/revoke`

Revoga um convite pendente de administrador do canal usando o telefone do convidado.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "phone"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "phone": {
      "type": "string",
      "example": "5511999999999"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Convite revogado com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao revogar convite |

---
#### Transferir dono do canal
`POST /newsletter/owner/transfer`

Transfere a propriedade do canal para outro telefone.

Observações:
- `phone` é obrigatório
- `quitAdmin=true` remove o dono anterior da posição de admin após a transferência


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "phone"
  ],
  "properties": {
    "id": {
      "type": "string",
      "example": "120363123456789012"
    },
    "jid": {
      "type": "string",
      "example": "120363123456789012@newsletter"
    },
    "phone": {
      "type": "string",
      "example": "5511999999999"
    },
    "quitAdmin": {
      "type": "boolean",
      "example": false
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Transferência solicitada com sucesso |
| 400 | Payload inválido |
| 401 | Instância não autenticada ou cliente não encontrado |
| 500 | Erro interno ao transferir ownership do canal |

---
### Tag: Webhooks e SSE
#### Ver Webhook da Instância
`GET /webhook`

Retorna a configuração atual do webhook da instância, incluindo:
- URL configurada
- Eventos ativos
- Filtros aplicados
- Configurações adicionais

Exemplo de resposta:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "enabled": true,
    "url": "https://example.com/webhook",
    "events": ["messages", "messages_update"],
    "excludeMessages": ["wasSentByApi", "isGroupNo"],
    "addUrlEvents": true,
    "addUrlTypesMessages": true
  },
  {
    "id": "987fcdeb-51k3-09j8-x543-864297539100",
    "enabled": true,
    "url": "https://outro-endpoint.com/webhook",
    "events": ["connection", "presence"],
    "excludeMessages": [],
    "addUrlEvents": false,
    "addUrlTypesMessages": false
  }
]
```

A resposta é sempre um array, mesmo quando há apenas um webhook configurado.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração do webhook retornada com sucesso |
| 401 | Token inválido ou não fornecido |
| 500 | Erro interno do servidor |

---
#### Configurar Webhook da Instância
`POST /webhook`

Gerencia a configuração de webhooks para receber eventos em tempo real da instância.
Permite gerenciar múltiplos webhooks por instância através do campo ID e action.

### 🚀 Modo Simples (Recomendado)

**Uso mais fácil - sem complexidade de IDs**:
- Não inclua `action` nem `id` no payload
- Gerencia automaticamente um único webhook por instância
- Cria novo ou atualiza o existente automaticamente
- **Recomendado**: Sempre use `"excludeMessages": ["wasSentByApi"]` para evitar loops
- **Exemplo**: `{"url": "https://meusite.com/webhook", "events": ["messages"], "excludeMessages": ["wasSentByApi"]}`

### 🧪 Sites para Testes (ordenados por qualidade)

**Para testar webhooks durante desenvolvimento**:
1. **https://webhook.cool/** - ⭐ Melhor opção (sem rate limit, interface limpa)
2. **https://rbaskets.in/** - ⭐ Boa alternativa (confiável, baixo rate limit)
3. **https://webhook.site/** - ⚠️ Evitar se possível (rate limit agressivo)

### ⚙️ Modo Avançado (Para múltiplos webhooks)

**Para usuários que precisam de múltiplos webhooks por instância**:

💡 **Dica**: Mesmo precisando de múltiplos webhooks, considere usar `addUrlEvents` no modo simples.
Um único webhook pode receber diferentes tipos de eventos em URLs específicas 
(ex: `/webhook/message`, `/webhook/connection`), eliminando a necessidade de múltiplos webhooks.

1. **Criar Novo Webhook**:
   - Use `action: "add"`
   - Não inclua `id` no payload
   - O sistema gera ID automaticamente

2. **Atualizar Webhook Existente**:
   - Use `action: "update"`
   - Inclua o `id` do webhook no payload
   - Todos os campos serão atualizados

3. **Remover Webhook**:
   - Use `action: "delete"`
   - Inclua apenas o `id` do webhook
   - Outros campos são ignorados



### Eventos Disponíveis
- `connection`: Alterações no estado da conexão
- `history`: Recebimento de histórico de mensagens
- `messages`: Novas mensagens recebidas
- `messages_update`: Atualizações em mensagens existentes
- `newsletter_messages`: Novos posts/mensagens de canais do WhatsApp
  Para views e reactions de canais, use a rota `/newsletter/updates`.
- `call`: Eventos de chamadas VoIP
- `contacts`: Atualizações na agenda de contatos
- `presence`: Alterações no status de presença
- `groups`: Modificações em grupos
- `labels`: Gerenciamento de etiquetas
- `chats`: Eventos de conversas
- `chat_labels`: Alterações em etiquetas de conversas
- `blocks`: Bloqueios/desbloqueios
- `sender`: Atualizações de campanhas, quando inicia, e quando completa

**Remover mensagens com base nos filtros**:
- `wasSentByApi`: Mensagens originadas pela API ⚠️ **IMPORTANTE:** Use sempre este filtro para evitar loops em automações
- `wasNotSentByApi`: Mensagens não originadas pela API
- `fromMeYes`: Mensagens enviadas pelo usuário
- `fromMeNo`: Mensagens recebidas de terceiros
- `isGroupYes`: Mensagens em grupos
- `isGroupNo`: Mensagens em conversas individuais

💡 **Prevenção de Loops**: Se você tem automações que enviam mensagens via API, sempre inclua `"excludeMessages": ["wasSentByApi"]` no seu webhook. Caso prefira receber esses eventos, certifique-se de que sua automação detecta mensagens enviadas pela própria API para não criar loops infinitos.

**Ações Suportadas**:
- `add`: Registrar novo webhook
- `delete`: Remover webhook existente

**Parâmetros de URL**:
- `addUrlEvents` (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL.
  Exemplo: `https://api.example.com/webhook/{evento}`
- `addUrlTypesMessages` (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL.
  Exemplo: `https://api.example.com/webhook/{tipo_mensagem}`

**Combinações de Parâmetros**:
- Ambos ativos: `https://api.example.com/webhook/{evento}/{tipo_mensagem}`
  Exemplo real: `https://api.example.com/webhook/message/conversation`
- Apenas eventos: `https://api.example.com/webhook/message`
- Apenas tipos: `https://api.example.com/webhook/conversation`

**Notas Técnicas**:
1. Os parâmetros são adicionados na ordem: evento → tipo mensagem
2. A URL deve ser configurada para aceitar esses parâmetros dinâmicos
3. Funciona com qualquer combinação de eventos/mensagens


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID \u00fanico do webhook (necess\u00e1rio para update/delete)",
      "example": "123e4567-e89b-12d3-a456-426614174000"
    },
    "enabled": {
      "type": "boolean",
      "description": "Habilita/desabilita o webhook",
      "example": true
    },
    "url": {
      "type": "string",
      "description": "URL para receber os eventos",
      "example": "https://example.com/webhook"
    },
    "events": {
      "type": "array",
      "description": "Lista de eventos monitorados",
      "items": {
        "type": "string",
        "enum": [
          "connection",
          "history",
          "messages",
          "messages_update",
          "newsletter_messages",
          "call",
          "contacts",
          "presence",
          "groups",
          "labels",
          "chats",
          "chat_labels",
          "blocks",
          "sender"
        ]
      }
    },
    "excludeMessages": {
      "type": "array",
      "description": "Filtros para excluir tipos de mensagens",
      "items": {
        "type": "string",
        "enum": [
          "wasSentByApi",
          "wasNotSentByApi",
          "fromMeYes",
          "fromMeNo",
          "isGroupYes",
          "isGroupNo"
        ]
      }
    },
    "addUrlEvents": {
      "type": "boolean",
      "description": "Adiciona o tipo do evento como par\u00e2metro na URL.\n- `false` (padr\u00e3o): URL normal\n- `true`: Adiciona evento na URL (ex: `/webhook/message`)\n",
      "default": false
    },
    "addUrlTypesMessages": {
      "type": "boolean",
      "description": "Adiciona o tipo da mensagem como par\u00e2metro na URL.\n- `false` (padr\u00e3o): URL normal  \n- `true`: Adiciona tipo da mensagem (ex: `/webhook/conversation`)\n",
      "default": false
    },
    "action": {
      "type": "string",
      "description": "A\u00e7\u00e3o a ser executada:\n- add: criar novo webhook\n- update: atualizar webhook existente (requer id)\n- delete: remover webhook (requer apenas id)\nSe n\u00e3o informado, opera no modo simples (\u00fanico webhook)\n",
      "enum": [
        "add",
        "update",
        "delete"
      ]
    }
  },
  "required": [
    "url"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Webhook configurado ou atualizado com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou não fornecido |
| 500 | Erro interno do servidor |

---
#### Ver últimos erros do webhook local
`GET /webhook/errors`

Retorna em memória os últimos 20 erros de envio dos webhooks locais da instância autenticada.

Cada item inclui data/hora (`created`), URL de destino, evento, tipo do webhook
(`local`), payload tentado, número de tentativas, status HTTP final quando existir e a mensagem de erro.

Observações:
- O histórico fica apenas em memória e é perdido quando o processo reinicia.
- O endpoint usa o mesmo `token` da instância.
- Retorna apenas falhas dos webhooks locais da própria instância.
- Falhas do webhook global ficam disponíveis separadamente em `/globalwebhook/errors` com `admintoken`.
- O header `X-Webhook-Error-Capture-Started-At` informa desde quando a captura atual está valendo.

Exemplo de consulta:
```bash
curl -X GET "$BASE_URL/webhook/errors" \
  -H "token: SUA_INSTANCIA_TOKEN"
```


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Histórico retornado com sucesso |
| 401 | Token inválido ou não fornecido |

---
#### Server-Sent Events (SSE)
`GET /sse`

Receber eventos em tempo real via Server-Sent Events (SSE)

### Funcionalidades Principais:
- Configuração de URL para recebimento de eventos
- Seleção granular de tipos de eventos
- Filtragem avançada de mensagens
- Parâmetros adicionais na URL
- Gerenciamento múltiplo de webhooks

**Eventos Disponíveis**:
- `connection`: Alterações no estado da conexão
- `history`: Recebimento de histórico de mensagens
- `messages`: Novas mensagens recebidas
- `messages_update`: Atualizações em mensagens existentes
- `call`: Eventos de chamadas VoIP
- `contacts`: Atualizações na agenda de contatos
- `presence`: Alterações no status de presença
- `groups`: Modificações em grupos
- `labels`: Gerenciamento de etiquetas
- `chats`: Eventos de conversas
- `chat_labels`: Alterações em etiquetas de conversas
- `blocks`: Bloqueios/desbloqueios


Estabelece uma conexão persistente para receber eventos em tempo real. Este
endpoint:

1. Requer autenticação via token

2. Mantém uma conexão HTTP aberta com o cliente

3. Envia eventos conforme ocorrem no servidor

4. Suporta diferentes tipos de eventos

Exemplo de uso:

```javascript

const eventSource = new
EventSource('/sse?token=SEU_TOKEN&events=chats,messages');


eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Novo evento:', data);
};


eventSource.onerror = function(error) {
  console.error('Erro na conexão SSE:', error);
};

```


Estrutura de um evento:

```json

{
  "type": "message",
  "data": {
    "id": "3EB0538DA65A59F6D8A251",
    "from": "5511999999999@s.whatsapp.net",
    "to": "5511888888888@s.whatsapp.net",
    "text": "Olá!",
    "timestamp": 1672531200000
  }
}

```

**Parâmetros:**
| Nome | Local | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| token | query | string | Sim | Token de autenticação da instância |
| events | query | string | Sim | Tipos de eventos a serem recebidos. Suporta dois formatos:
- Separados por vírgula: `?events=chats,messages`
- Parâmetros repetidos: `?events=chats&events=messages`
 |
| excludeMessages | query | string | Não | Tipos de mensagens a serem excluídas do evento `messages`. Suporta dois formatos:
- Separados por vírgula: `?excludeMessages=poll,reaction`
- Parâmetros repetidos: `?excludeMessages=poll&excludeMessages=reaction`
 |

---
### Tag: Mensagem em massa
#### Criar nova campanha (Simples)
`POST /sender/simple`

Cria uma nova campanha de envio com configurações básicas

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "numbers",
    "type",
    "delayMin",
    "delayMax",
    "scheduled_for"
  ],
  "properties": {
    "numbers": {
      "type": "array",
      "description": "Lista de n\u00fameros para envio",
      "items": {
        "type": "string"
      },
      "example": [
        "5511999999999@s.whatsapp.net"
      ]
    },
    "type": {
      "type": "string",
      "description": "Tipo da mensagem",
      "enum": [
        "text",
        "image",
        "video",
        "videoplay",
        "audio",
        "document",
        "contact",
        "location",
        "list",
        "button",
        "poll",
        "carousel"
      ]
    },
    "folder": {
      "type": "string",
      "description": "Nome da campanha de envio",
      "example": "Campanha Janeiro"
    },
    "delayMin": {
      "type": "integer",
      "description": "Delay m\u00ednimo entre mensagens em segundos",
      "minimum": 1,
      "example": 10
    },
    "delayMax": {
      "type": "integer",
      "description": "Delay m\u00e1ximo entre mensagens em segundos",
      "minimum": 1,
      "example": 30
    },
    "scheduled_for": {
      "type": "integer",
      "description": "Timestamp em milissegundos ou minutos a partir de agora para agendamento",
      "example": 1706198400000
    },
    "info": {
      "type": "string",
      "description": "Informa\u00e7\u00f5es adicionais sobre a campanha"
    },
    "delay": {
      "type": "integer",
      "description": "Delay fixo entre mensagens (opcional)"
    },
    "mentions": {
      "type": "string",
      "description": "Men\u00e7\u00f5es na mensagem em formato JSON"
    },
    "text": {
      "type": "string",
      "description": "Texto da mensagem"
    },
    "linkPreview": {
      "type": "boolean",
      "description": "Habilitar preview de links em mensagens de texto. O preview ser\u00e1 gerado automaticamente a partir da URL contida no texto."
    },
    "linkPreviewTitle": {
      "type": "string",
      "description": "T\u00edtulo personalizado para o preview do link (opcional)"
    },
    "linkPreviewDescription": {
      "type": "string",
      "description": "Descri\u00e7\u00e3o personalizada para o preview do link (opcional)"
    },
    "linkPreviewImage": {
      "type": "string",
      "description": "URL ou dados base64 da imagem para o preview do link (opcional)"
    },
    "linkPreviewLarge": {
      "type": "boolean",
      "description": "Se deve usar preview grande ou pequeno (opcional, padr\u00e3o false)"
    },
    "file": {
      "type": "string",
      "description": "URL da m\u00eddia ou arquivo (quando type \u00e9 image, video, audio, document, etc.)"
    },
    "docName": {
      "type": "string",
      "description": "Nome do arquivo (quando type \u00e9 document)"
    },
    "fullName": {
      "type": "string",
      "description": "Nome completo (quando type \u00e9 contact)"
    },
    "phoneNumber": {
      "type": "string",
      "description": "N\u00famero do telefone (quando type \u00e9 contact)"
    },
    "organization": {
      "type": "string",
      "description": "Organiza\u00e7\u00e3o (quando type \u00e9 contact)"
    },
    "email": {
      "type": "string",
      "description": "Email (quando type \u00e9 contact)"
    },
    "url": {
      "type": "string",
      "description": "URL (quando type \u00e9 contact)"
    },
    "latitude": {
      "type": "number",
      "description": "Latitude (quando type \u00e9 location)"
    },
    "longitude": {
      "type": "number",
      "description": "Longitude (quando type \u00e9 location)"
    },
    "name": {
      "type": "string",
      "description": "Nome do local (quando type \u00e9 location)"
    },
    "address": {
      "type": "string",
      "description": "Endere\u00e7o (quando type \u00e9 location)"
    },
    "footerText": {
      "type": "string",
      "description": "Texto do rodap\u00e9 (quando type \u00e9 list, button, poll ou carousel)"
    },
    "buttonText": {
      "type": "string",
      "description": "Texto do bot\u00e3o (quando type \u00e9 list, button, poll ou carousel)"
    },
    "listButton": {
      "type": "string",
      "description": "Texto do bot\u00e3o da lista (quando type \u00e9 list)"
    },
    "selectableCount": {
      "type": "integer",
      "description": "Quantidade de op\u00e7\u00f5es selecion\u00e1veis (quando type \u00e9 poll)"
    },
    "choices": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de op\u00e7\u00f5es (quando type \u00e9 list, button, poll ou carousel). Para carousel, use formato espec\u00edfico com [texto], {imagem} e bot\u00f5es"
    },
    "imageButton": {
      "type": "string",
      "description": "URL da imagem para o bot\u00e3o (quando type \u00e9 button)"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | campanha criada com sucesso |
| 400 | Erro nos parâmetros da requisição |
| 401 | Erro de autenticação |
| 409 | Conflito - campanha já existe |
| 500 | Erro interno do servidor |

---
#### Criar envio em massa avançado
`POST /sender/advanced`

Cria um novo envio em massa com configurações avançadas, permitindo definir
múltiplos destinatários e mensagens com delays personalizados.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "delayMin": {
      "type": "integer",
      "description": "Delay m\u00ednimo entre mensagens (segundos)",
      "minimum": 0,
      "example": 3
    },
    "delayMax": {
      "type": "integer",
      "description": "Delay m\u00e1ximo entre mensagens (segundos)",
      "minimum": 0,
      "example": 6
    },
    "info": {
      "type": "string",
      "description": "Descri\u00e7\u00e3o ou informa\u00e7\u00e3o sobre o envio em massa",
      "example": "Campanha de lan\u00e7amento"
    },
    "scheduled_for": {
      "type": "integer",
      "description": "Timestamp em milissegundos (date unix) ou minutos a partir de agora para agendamento",
      "example": 1
    },
    "messages": {
      "type": "array",
      "description": "Lista de mensagens a serem enviadas",
      "items": {
        "type": "object",
        "required": [
          "number",
          "type"
        ],
        "properties": {
          "number": {
            "type": "string",
            "description": "ID do chat ou n\u00famero do destinat\u00e1rio.",
            "example": "5511999999999"
          },
          "type": {
            "type": "string",
            "enum": [
              "text",
              "image",
              "document",
              "audio",
              "ptt",
              "myaudio",
              "sticker",
              "video",
              "videoplay",
              "contact",
              "location",
              "poll",
              "list",
              "button",
              "carousel"
            ],
            "description": "Tipo da mensagem:\n- text: Mensagem de texto\n- image: Imagem\n- document: Documento/arquivo\n- audio: \u00c1udio\n- ptt: Mensagem de voz\n- myaudio: \u00c1udio (op\u00e7\u00e3o alternativa)\n- sticker: Figurinha\n- video: V\u00eddeo\n- videoplay: V\u00eddeo com autoplay/loop no WhatsApp\n- contact: Contato\n- location: Localiza\u00e7\u00e3o\n- poll: Enquete\n- list: Lista de op\u00e7\u00f5es\n- button: Bot\u00f5es interativos\n- carousel: Carrossel de cart\u00f5es com imagens e bot\u00f5es\n"
          },
          "text": {
            "type": "string",
            "description": "Texto da mensagem (quando type \u00e9 \"text\") ou legenda para m\u00eddia"
          },
          "file": {
            "type": "string",
            "description": "URL da m\u00eddia (quando type \u00e9 image, video, audio, document, etc)"
          },
          "docName": {
            "type": "string",
            "description": "Nome do arquivo (quando type \u00e9 document)"
          },
          "linkPreview": {
            "type": "boolean",
            "description": "Se deve gerar preview de links (quando type \u00e9 text). O preview ser\u00e1 gerado automaticamente a partir da URL contida no texto."
          },
          "linkPreviewTitle": {
            "type": "string",
            "description": "T\u00edtulo personalizado para o preview do link (opcional)"
          },
          "linkPreviewDescription": {
            "type": "string",
            "description": "Descri\u00e7\u00e3o personalizada para o preview do link (opcional)"
          },
          "linkPreviewImage": {
            "type": "string",
            "description": "URL ou dados base64 da imagem para o preview do link (opcional)"
          },
          "linkPreviewLarge": {
            "type": "boolean",
            "description": "Se deve usar preview grande ou pequeno (opcional, padr\u00e3o false)"
          },
          "fullName": {
            "type": "string",
            "description": "Nome completo (quando type \u00e9 contact)"
          },
          "phoneNumber": {
            "type": "string",
            "description": "N\u00famero do telefone (quando type \u00e9 contact)"
          },
          "organization": {
            "type": "string",
            "description": "Organiza\u00e7\u00e3o (quando type \u00e9 contact)"
          },
          "email": {
            "type": "string",
            "description": "Email (quando type \u00e9 contact)"
          },
          "url": {
            "type": "string",
            "description": "URL (quando type \u00e9 contact)"
          },
          "latitude": {
            "type": "number",
            "description": "Latitude (quando type \u00e9 location)"
          },
          "longitude": {
            "type": "number",
            "description": "Longitude (quando type \u00e9 location)"
          },
          "name": {
            "type": "string",
            "description": "Nome do local (quando type \u00e9 location)"
          },
          "address": {
            "type": "string",
            "description": "Endere\u00e7o (quando type \u00e9 location)"
          },
          "footerText": {
            "type": "string",
            "description": "Texto do rodap\u00e9 (quando type \u00e9 list, button, poll ou carousel)"
          },
          "buttonText": {
            "type": "string",
            "description": "Texto do bot\u00e3o (quando type \u00e9 list, button, poll ou carousel)"
          },
          "listButton": {
            "type": "string",
            "description": "Texto do bot\u00e3o da lista (quando type \u00e9 list)"
          },
          "selectableCount": {
            "type": "integer",
            "description": "Quantidade de op\u00e7\u00f5es selecion\u00e1veis (quando type \u00e9 poll)"
          },
          "choices": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Lista de op\u00e7\u00f5es (quando type \u00e9 list, button, poll ou carousel). Para carousel, use formato espec\u00edfico com [texto], {imagem} e bot\u00f5es"
          },
          "imageButton": {
            "type": "string",
            "description": "URL da imagem para o bot\u00e3o (quando type \u00e9 button)"
          }
        }
      }
    }
  },
  "required": [
    "messages"
  ],
  "example": {
    "delayMin": 3,
    "delayMax": 6,
    "info": "teste avan\u00e7ado",
    "scheduled_for": 1,
    "messages": [
      {
        "number": "5511999999999",
        "type": "text",
        "text": "First message"
      },
      {
        "number": "5511999999999",
        "type": "button",
        "text": "Promo\u00e7\u00e3o Especial!\nConfira nossas ofertas incr\u00edveis",
        "footerText": "V\u00e1lido at\u00e9 31/12/2024",
        "imageButton": "https://exemplo.com/banner-promocao.jpg",
        "choices": [
          "Ver Ofertas|https://loja.exemplo.com/ofertas",
          "Falar com Vendedor|reply:vendedor",
          "Copiar Cupom|copy:PROMO2024"
        ]
      },
      {
        "number": "5511999999999",
        "type": "list",
        "text": "Escolha sua categoria preferida:",
        "listButton": "Ver Categorias",
        "choices": [
          "[Eletr\u00f4nicos]",
          "Smartphones|eletronicos_smartphones",
          "Notebooks|eletronicos_notebooks",
          "[Roupas]",
          "Camisetas|roupas_camisetas",
          "Sapatos|roupas_sapatos"
        ]
      },
      {
        "number": "5511999999999",
        "type": "document",
        "file": "https://example.com/doc.pdf",
        "docName": "Documento.pdf"
      },
      {
        "number": "5511999999999",
        "type": "carousel",
        "text": "Conhe\u00e7a nossos produtos",
        "choices": [
          "[Smartphone XYZ\nO mais avan\u00e7ado smartphone da linha]",
          "{https://exemplo.com/produto1.jpg}",
          "Copiar C\u00f3digo|copy:PROD123",
          "Ver no Site|https://exemplo.com/xyz",
          "[Notebook ABC\nO notebook ideal para profissionais]",
          "{https://exemplo.com/produto2.jpg}",
          "Copiar C\u00f3digo|copy:NOTE456",
          "Comprar Online|https://exemplo.com/abc"
        ]
      }
    ]
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Mensagens adicionadas à fila com sucesso |
| 400 | Erro nos parâmetros da requisição |
| 401 | Não autorizado - token inválido ou ausente |
| 500 | Erro interno do servidor |

---
#### Controlar campanha de envio em massa
`POST /sender/edit`

Permite controlar campanhas de envio de mensagens em massa através de diferentes ações:

## Ações Disponíveis:

**🛑 stop** - Pausar campanha
- Pausa uma campanha ativa ou agendada
- Altera o status para "paused" 
- Use quando quiser interromper temporariamente o envio
- Mensagens já enviadas não são afetadas

**▶️ continue** - Continuar campanha  
- Retoma uma campanha pausada
- Altera o status para "scheduled"
- Use para continuar o envio após pausar uma campanha
- Não funciona em campanhas já concluídas ("done")

**🗑️ delete** - Deletar campanha
- Remove completamente a campanha
- Deleta apenas mensagens NÃO ENVIADAS (status "scheduled")
- Mensagens já enviadas são preservadas no histórico
- Operação é executada de forma assíncrona

## Status de Campanhas:
- **scheduled**: Agendada para envio
- **sending**: Enviando mensagens  
- **paused**: Pausada pelo usuário
- **done**: Concluída (não pode ser alterada)
- **deleting**: Sendo deletada (operação em andamento)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "string",
      "description": "Identificador \u00fanico da campanha de envio",
      "example": "folder_123"
    },
    "action": {
      "type": "string",
      "enum": [
        "stop",
        "continue",
        "delete"
      ],
      "description": "A\u00e7\u00e3o a ser executada na campanha:\n- **stop**: Pausa a campanha (muda para status \"paused\")\n- **continue**: Retoma campanha pausada (muda para status \"scheduled\") \n- **delete**: Remove campanha e mensagens n\u00e3o enviadas (ass\u00edncrono)\n",
      "example": "stop"
    }
  },
  "required": [
    "folder_id",
    "action"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Ação realizada com sucesso |
| 400 | Requisição inválida |

---
#### Limpar mensagens enviadas
`POST /sender/cleardone`

Inicia processo de limpeza de mensagens antigas em lote que já foram enviadas com sucesso. Por padrão, remove mensagens mais antigas que 7 dias.

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "hours": {
      "type": "integer",
      "description": "Quantidade de horas para manter mensagens. Mensagens mais antigas que esse valor ser\u00e3o removidas.",
      "example": 168,
      "default": 168
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Limpeza iniciada com sucesso |

---
#### Limpar toda fila de mensagens
`DELETE /sender/clearall`

Remove todas as mensagens da fila de envio em massa, incluindo mensagens pendentes e já enviadas.
Esta é uma operação irreversível.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Fila de mensagens limpa com sucesso |
| 401 | Não autorizado - token inválido ou ausente |
| 500 | Erro interno do servidor |

---
#### Listar campanhas de envio
`GET /sender/listfolders`

Retorna as campanhas de envio em massa da instância atual, ordenadas das mais recentes
para as mais antigas.

Se a instância não possuir owner associado, a API retorna uma lista vazia.


**Parâmetros:**
| Nome | Local | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| status | query | string | Não | Filtro de status desejado. O backend atual retorna todas as pastas do owner e
pode ignorar esse parâmetro dependendo da implementação da fila.
 |

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de campanhas retornada com sucesso |
| 500 | Erro interno do servidor |

---
#### Listar mensagens de uma campanha
`POST /sender/listmessages`

Retorna a lista de mensagens de uma campanha específica, com opções de filtro por status e paginação

**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "folder_id": {
      "type": "string",
      "description": "ID da campanha a ser consultada"
    },
    "messageStatus": {
      "type": "string",
      "enum": [
        "Scheduled",
        "Sent",
        "Failed"
      ],
      "description": "Status das mensagens para filtrar"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "default": 1000,
      "description": "Quantidade maxima de itens por pagina"
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "default": 0,
      "description": "Deslocamento base zero para paginacao"
    }
  },
  "required": [
    "folder_id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de mensagens retornada com sucesso |
| 400 | Requisição inválida |
| 500 | Erro interno do servidor |

---
### Tag: Bloqueios
#### Bloqueia ou desbloqueia contato do WhatsApp
`POST /chat/block`

Bloqueia ou desbloqueia um contato do WhatsApp. Contatos bloqueados não podem enviar mensagens 
para a instância e a instância não pode enviar mensagens para eles.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do WhatsApp no formato internacional (ex. 5511999999999)",
      "example": "5511999999999"
    },
    "block": {
      "type": "boolean",
      "description": "True para bloquear, False para desbloquear",
      "example": true
    }
  },
  "required": [
    "number",
    "block"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação realizada com sucesso |
| 401 | Não autorizado - token inválido |
| 404 | Contato não encontrado |
| 500 | Erro do servidor ao processar a requisição |

---
#### Lista contatos bloqueados
`GET /chat/blocklist`

Retorna a lista completa de contatos que foram bloqueados pela instância.
Esta lista é atualizada em tempo real conforme contatos são bloqueados/desbloqueados.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de contatos bloqueados recuperada com sucesso |
| 401 | Token inválido ou não fornecido |
| 500 | Erro interno do servidor ou instância não conectada |

---
### Tag: Etiquetas
#### Gerencia labels de um chat
`POST /chat/labels`

Atualiza as labels associadas a um chat específico. Este endpoint oferece três modos de operação:

1. **Definir todas as labels** (labelids): Define o conjunto completo de labels para o chat, substituindo labels existentes
2. **Adicionar uma label** (add_labelid): Adiciona uma única label ao chat sem afetar as existentes
3. **Remover uma label** (remove_labelid): Remove uma única label do chat sem afetar as outras

**Importante**: Use apenas um dos três parâmetros por requisição. Labels inexistentes serão rejeitadas.

As labels devem ser fornecidas no formato id ou labelid encontradas na função get labels.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do chat ou grupo",
      "example": "5511999999999"
    },
    "labelids": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de IDs das labels a serem aplicadas ao chat (define todas as labels)",
      "example": [
        "10",
        "20"
      ]
    },
    "add_labelid": {
      "type": "string",
      "description": "ID da label a ser adicionada ao chat",
      "example": "10"
    },
    "remove_labelid": {
      "type": "string",
      "description": "ID da label a ser removida do chat",
      "example": "20"
    }
  },
  "required": [
    "number"
  ],
  "oneOf": [
    {
      "required": [
        "labelids"
      ]
    },
    {
      "required": [
        "add_labelid"
      ]
    },
    {
      "required": [
        "remove_labelid"
      ]
    }
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Labels atualizadas com sucesso |
| 400 | Erro na requisição |
| 404 | Chat não encontrado |

---
#### Criar, editar ou deletar etiqueta
`POST /label/edit`

Cria, edita ou deleta uma etiqueta da instância.

Regras de uso:
- Para editar uma etiqueta existente, envie o `labelid` real da etiqueta.
- Para criar uma nova etiqueta, envie `labelid: "new"` com `delete: false`.
  O backend irá gerar o próximo `labelid` numérico disponível para a instância.
- Para deletar uma etiqueta existente, envie o `labelid` real com `delete: true`.

Observações:
- A resposta de sucesso retorna `"Label created"` para criação e `"Label edited"` para edição.
- Para descobrir o `labelid` final criado, consulte `GET /labels` após a operação
  ou consuma o webhook/evento de labels da instância.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "labelid": {
      "type": "string",
      "description": "ID da etiqueta.\n\nUse o ID real para editar/deletar uma etiqueta existente.\nUse `\"new\"` para criar uma nova etiqueta quando `delete` for `false`.\n",
      "example": "25"
    },
    "name": {
      "type": "string",
      "description": "Novo nome da etiqueta",
      "example": "responder editado"
    },
    "color": {
      "type": "integer",
      "description": "C\u00f3digo num\u00e9rico da nova cor (0-19)",
      "minimum": 0,
      "maximum": 19,
      "example": 2
    },
    "delete": {
      "type": "boolean",
      "description": "Indica se a etiqueta deve ser deletada",
      "example": false
    }
  },
  "required": [
    "labelid"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação concluída com sucesso |
| 400 | Payload inválido |
| 500 | Erro interno do servidor ou sessão inválida |

---
#### Buscar todas as etiquetas
`GET /labels`

Retorna a lista completa de etiquetas da instância.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de etiquetas retornada com sucesso |
| 500 | Erro interno do servidor |

---
#### Recarregar etiquetas do WhatsApp
`POST /labels/refresh`

Faz uma nova leitura das etiquetas no WhatsApp antes de retornar a lista atualizada.

Uso recomendado:
- tente primeiro com `force=false`
- se isso não trouxer as etiquetas corretamente, tente `force=true`
- use `force=true` apenas como tentativa de correção, porque ele faz uma recarga mais pesada


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "force": {
      "type": "boolean",
      "default": false,
      "description": "Tente primeiro com `false`.\nUse `true` apenas quando a recarga padr\u00e3o n\u00e3o funcionar bem,\npois esse modo faz uma nova leitura mais completa das etiquetas.\n",
      "example": false
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de etiquetas recarregada com sucesso |
| 409 | O reload não pôde ser executado porque o history sync ainda está em andamento |
| 500 | Erro interno do servidor |

---
### Tag: Chats
#### Deleta chat
`POST /chat/delete`

Deleta ou limpa um chat e/ou suas mensagens do WhatsApp e/ou banco de dados.
Você pode escolher:
- Deletar o chat do WhatsApp
- Limpar a conversa no WhatsApp
- Deletar o chat do banco de dados
- Deletar apenas as mensagens do banco de dados
- Qualquer combinação das opções acima
Observação:
- Se clearChatWhatsApp e deleteChatWhatsApp forem true, o clear tem prioridade.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do chat no formato internacional.\nPara grupos use o ID completo do grupo.\n",
      "example": "5511999999999"
    },
    "deleteChatDB": {
      "type": "boolean",
      "description": "Se true, deleta o chat do banco de dados",
      "default": false,
      "example": true
    },
    "deleteMessagesDB": {
      "type": "boolean",
      "description": "Se true, deleta todas as mensagens do chat do banco de dados",
      "default": false,
      "example": true
    },
    "deleteChatWhatsApp": {
      "type": "boolean",
      "description": "Se true, deleta o chat do WhatsApp.\nPara grupos, esta opera\u00e7\u00e3o n\u00e3o \u00e9 permitida e o chat ser\u00e1 apenas limpo.\n",
      "default": false,
      "example": true
    },
    "clearChatWhatsApp": {
      "type": "boolean",
      "description": "Se true, limpa a conversa do chat no WhatsApp (sem sair do chat).\nFunciona para grupos e conversas individuais.\n",
      "default": false,
      "example": true
    }
  },
  "required": [
    "number"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação realizada com sucesso |
| 400 | Erro nos parâmetros da requisição |
| 401 | Token inválido ou não fornecido |
| 404 | Chat não encontrado |
| 500 | Erro interno do servidor |

---
#### Arquivar/desarquivar chat
`POST /chat/archive`

Altera o estado de arquivamento de um chat do WhatsApp.
- Quando arquivado, o chat é movido para a seção de arquivados no WhatsApp
- A ação é sincronizada entre todos os dispositivos conectados
- Não afeta as mensagens ou o conteúdo do chat


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "number",
    "archive"
  ],
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do telefone (formato E.164) ou ID do grupo",
      "example": "5511999999999"
    },
    "archive": {
      "type": "boolean",
      "description": "true para arquivar, false para desarquivar",
      "example": true
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Chat arquivado/desarquivado com sucesso |
| 400 | Dados da requisição inválidos |
| 401 | Token de autenticação ausente ou inválido |
| 500 | Erro ao executar a operação |

---
#### Marcar chat como lido/não lido
`POST /chat/read`

Atualiza o status de leitura de um chat no WhatsApp.

Quando um chat é marcado como lido:
- O contador de mensagens não lidas é zerado
- O indicador visual de mensagens não lidas é removido
- O remetente recebe confirmação de leitura (se ativado)

Quando marcado como não lido:
- O chat aparece como pendente de leitura
- Não afeta as confirmações de leitura já enviadas


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "number",
    "read"
  ],
  "properties": {
    "number": {
      "type": "string",
      "description": "Identificador do chat no formato:\n- Para usu\u00e1rios: [n\u00famero]@s.whatsapp.net (ex: 5511999999999@s.whatsapp.net)\n- Para grupos: [id-grupo]@g.us (ex: 123456789-987654321@g.us)\n",
      "example": "5511999999999@s.whatsapp.net"
    },
    "read": {
      "type": "boolean",
      "description": "- true: marca o chat como lido\n- false: marca o chat como n\u00e3o lido\n"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Status de leitura atualizado com sucesso |
| 401 | Token de autenticação ausente ou inválido |
| 404 | Chat não encontrado |
| 500 | Erro ao atualizar status de leitura |

---
#### Silenciar chat
`POST /chat/mute`

Silencia notificações de um chat por um período específico. 
As opções de silenciamento são:
* 0 - Remove o silenciamento
* 8 - Silencia por 8 horas
* 168 - Silencia por 1 semana (168 horas)
* -1 - Silencia permanentemente


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "number",
    "muteEndTime"
  ],
  "properties": {
    "number": {
      "type": "string",
      "description": "ID do chat no formato 123456789@s.whatsapp.net ou 123456789-123456@g.us",
      "example": "5511999999999@s.whatsapp.net"
    },
    "muteEndTime": {
      "type": "integer",
      "description": "Dura\u00e7\u00e3o do silenciamento:\n* 0 = Remove silenciamento\n* 8 = Silencia por 8 horas\n* 168 = Silencia por 1 semana\n* -1 = Silencia permanentemente\n",
      "enum": [
        0,
        8,
        168,
        -1
      ],
      "example": 8
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Chat silenciado com sucesso |
| 400 | Duração inválida ou formato de número incorreto |
| 401 | Token inválido ou ausente |
| 404 | Chat não encontrado |

---
#### Fixar/desafixar chat
`POST /chat/pin`

Fixa ou desafixa um chat no topo da lista de conversas. Chats fixados permanecem 
no topo mesmo quando novas mensagens são recebidas em outros chats.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do chat no formato internacional completo (ex: \"5511999999999\") \nou ID do grupo (ex: \"123456789-123456@g.us\")\n",
      "example": "5511999999999"
    },
    "pin": {
      "type": "boolean",
      "description": "Define se o chat deve ser fixado (true) ou desafixado (false)\n",
      "example": true
    }
  },
  "required": [
    "number",
    "pin"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Chat fixado/desafixado com sucesso |
| 400 | Erro na requisição |
| 401 | Não autorizado |

---
#### Busca chats com filtros
`POST /chat/find`

Busca chats com diversos filtros e ordenação. Suporta filtros em todos os campos do chat, 
paginação e ordenação customizada.

Operadores de filtro:
- `~` : LIKE (contém)
- `!~` : NOT LIKE (não contém)
- `!=` : diferente
- `>=` : maior ou igual
- `>` : maior que
- `<=` : menor ou igual
- `<` : menor que
- Sem operador: LIKE (contém)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "operator": {
      "type": "string",
      "enum": [
        "AND",
        "OR"
      ],
      "default": "AND",
      "description": "Operador l\u00f3gico entre os filtros"
    },
    "sort": {
      "type": "string",
      "description": "Campo para ordena\u00e7\u00e3o (+/-campo). Ex -wa_lastMsgTimestamp"
    },
    "limit": {
      "type": "integer",
      "description": "Quantidade m\u00e1xima de resultados a retornar",
      "default": 20
    },
    "offset": {
      "type": "integer",
      "description": "N\u00famero de registros a pular (para pagina\u00e7\u00e3o)",
      "default": 0
    },
    "wa_fastid": {
      "type": "string"
    },
    "wa_chatid": {
      "type": "string"
    },
    "wa_archived": {
      "type": "boolean"
    },
    "wa_contactName": {
      "type": "string"
    },
    "wa_name": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "wa_isBlocked": {
      "type": "boolean"
    },
    "wa_isGroup": {
      "type": "boolean"
    },
    "wa_isGroup_admin": {
      "type": "boolean"
    },
    "wa_isGroup_announce": {
      "type": "boolean"
    },
    "wa_isGroup_member": {
      "type": "boolean"
    },
    "wa_isPinned": {
      "type": "boolean"
    },
    "wa_label": {
      "type": "string",
      "description": "ID da label aplicada ao chat. Use o valor retornado por `/labels`, n\u00e3o o nome da etiqueta."
    },
    "wa_notes": {
      "type": "string"
    },
    "lead_tags": {
      "type": "string"
    },
    "lead_isTicketOpen": {
      "type": "boolean"
    },
    "lead_assignedAttendant_id": {
      "type": "string"
    },
    "lead_status": {
      "type": "string"
    }
  },
  "example": {
    "operator": "AND",
    "sort": "-wa_lastMsgTimestamp",
    "limit": 50,
    "offset": 0,
    "wa_isGroup": true,
    "lead_status": "~novo",
    "wa_label": "10",
    "wa_notes": "~vip"
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de chats encontrados |

---
#### Consultar notas internas do chat
`POST /chat/notes`

Retorna `wa_notes` de um chat usando apenas os dados já persistidos localmente.

Casos de uso:
- ler a anotação local já persistida no chat
- consultar notas mesmo durante reconexão da sessão do WhatsApp

Regras:
- envie `number`
- para recarregar do WhatsApp, use `/chat/notes/refresh`


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "JID completo do chat",
      "example": "5511999999999@s.whatsapp.net"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nota do chat retornada com sucesso |
| 400 | Payload inválido |
| 404 | Chat não encontrado |
| 500 | Erro interno ao consultar a nota local |

---
#### Recarregar notas internas do chat no WhatsApp
`POST /chat/notes/refresh`

Faz uma nova leitura das notas internas do chat no WhatsApp antes de retornar o valor atualizado.

Uso recomendado:
- tente primeiro com `force=false`
- se isso não atualizar a nota corretamente, tente `force=true`
- use `force=true` apenas como tentativa de correção, porque ele faz uma recarga mais pesada


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "JID completo do chat",
      "example": "5511999999999@s.whatsapp.net"
    },
    "force": {
      "type": "boolean",
      "description": "Tente primeiro com `false`.\nUse `true` apenas quando a recarga padr\u00e3o n\u00e3o funcionar bem,\npois esse modo faz uma nova leitura mais completa das notas.\n",
      "default": false,
      "example": false
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nota do chat recarregada com sucesso |
| 400 | Payload inválido |
| 404 | Chat não encontrado após o reload |
| 409 | O reload não pode ser executado porque o history sync inicial ainda está em andamento |
| 500 | Erro interno ao recarregar a nota |

---
#### Editar notas internas do chat
`POST /chat/notes/edit`

Atualiza `wa_notes` de um chat via app state do WhatsApp e persiste o resultado localmente.

Regras:
- envie `number`
- envie `notes` como campo principal
- envie string vazia para limpar a nota do chat


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "JID completo do chat",
      "example": "5511999999999@s.whatsapp.net"
    },
    "notes": {
      "type": "string",
      "description": "Conte\u00fado da nota a persistir no chat",
      "example": "Cliente prefere contato no per\u00edodo da tarde"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Nota atualizada com sucesso |
| 400 | Payload inválido |
| 404 | Chat não encontrado |
| 409 | A edição não pode ser executada porque o history sync inicial ainda está em andamento |
| 500 | Erro interno ao atualizar a nota |

---
### Tag: Contatos
#### Retorna lista de contatos do WhatsApp
`GET /contacts`

Retorna a lista de contatos do WhatsApp conforme o filtro informado em `contactScope`.

O endpoint realiza:
- Busca todos os contatos armazenados
- Filtra para contatos da agenda, fora da agenda ou todos
- Usa `address_book` como padrao quando `contactScope` nao for informado
- Retorna dados formatados incluindo JID e informações de nome


**Parâmetros:**
| Nome | Local | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| contactScope | query | string | Não | Define se a busca retorna apenas contatos da agenda, apenas fora da agenda ou todos os contatos conhecidos. |

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de contatos retornada com sucesso |
| 401 | Sem sessão ativa |
| 500 | Erro interno do servidor |

---
#### Listar todos os contatos com paginacao
`POST /contacts/list`

Retorna uma lista paginada de contatos da conta do WhatsApp atualmente conectada.
Use este endpoint (POST) para controlar `limit` e `offset` via corpo da requisicao.
O campo `contactScope` permite escolher entre contatos da agenda, fora da agenda ou todos os contatos conhecidos.
A rota GET `/contacts` continua disponivel para quem prefere a lista completa sem paginacao.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "description": "Quantidade maxima de resultados por pagina (padrao 100, maximo 1000)",
      "default": 100
    },
    "offset": {
      "type": "integer",
      "description": "Deslocamento base zero para paginacao",
      "default": 0
    },
    "contactScope": {
      "type": "string",
      "description": "Define se a busca retorna apenas contatos da agenda, apenas fora da agenda ou todos os contatos conhecidos.",
      "enum": [
        "address_book",
        "outside_address_book",
        "all"
      ],
      "default": "address_book"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de contatos recuperada com sucesso |
| 401 | Token nao fornecido ou invalido |
| 500 | Erro interno do servidor ao recuperar contatos |

---
#### Adiciona um contato à agenda
`POST /contact/add`

Adiciona um novo contato à agenda do celular.

O endpoint realiza:
- Adiciona o contato à agenda usando o WhatsApp
- Usa o campo 'name' tanto para o nome completo quanto para o primeiro nome
- Salva as informações do contato na agenda do WhatsApp
- Retorna informações do contato adicionado


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "number",
    "name"
  ],
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero de telefone no formato internacional com c\u00f3digo do pa\u00eds obrigat\u00f3rio. \nPara Brasil, deve come\u00e7ar com 55. Aceita varia\u00e7\u00f5es com/sem s\u00edmbolo +, \ncom/sem par\u00eanteses, com/sem h\u00edfen e com/sem espa\u00e7os. Tamb\u00e9m aceita formato \nJID do WhatsApp (@s.whatsapp.net). N\u00e3o aceita contatos comerciais (@lid) \nnem grupos (@g.us).\n",
      "examples": [
        "+55 (21) 99999-9999",
        "+55 21 99999-9999",
        "+55 21 999999999",
        "+5521999999999",
        "5521999999999",
        "5521999999999@s.whatsapp.net"
      ]
    },
    "name": {
      "type": "string",
      "description": "Nome completo do contato (ser\u00e1 usado como primeiro nome e nome completo)",
      "example": "Jo\u00e3o Silva"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Contato adicionado com sucesso |
| 400 | Dados inválidos na requisição |
| 401 | Sem sessão ativa |
| 500 | Erro interno do servidor |

---
#### Remove um contato da agenda
`POST /contact/remove`

Remove um contato da agenda do celular.

O endpoint realiza:
- Remove o contato da agenda usando o WhatsApp AppState
- Atualiza a lista de contatos sincronizada
- Retorna confirmação da remoção


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "number"
  ],
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero de telefone no formato internacional com c\u00f3digo do pa\u00eds obrigat\u00f3rio. \nPara Brasil, deve come\u00e7ar com 55. Aceita varia\u00e7\u00f5es com/sem s\u00edmbolo +, \ncom/sem par\u00eanteses, com/sem h\u00edfen e com/sem espa\u00e7os. Tamb\u00e9m aceita formato \nJID do WhatsApp (@s.whatsapp.net). N\u00e3o aceita contatos comerciais (@lid) \nnem grupos (@g.us).\n",
      "examples": [
        "+55 (21) 99999-9999",
        "+55 21 99999-9999",
        "+55 21 999999999",
        "+5521999999999",
        "5521999999999",
        "5521999999999@s.whatsapp.net"
      ]
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Contato removido com sucesso |
| 400 | Dados inválidos na requisição |
| 401 | Sem sessão ativa |
| 404 | Contato não encontrado |
| 500 | Erro interno do servidor |

---
#### Obter Detalhes Completos
`POST /chat/details`

Retorna informações **completas** sobre um contato ou chat, incluindo **todos os campos disponíveis** do modelo Chat.

### Funcionalidades:
- **Retorna chat completo**: Todos os campos do modelo Chat (mais de 60 campos)
- **Busca informações para contatos individuais e grupos**
- **URLs de imagem em dois tamanhos**: preview (menor) ou full (original)
- **Combina informações de diferentes fontes**: WhatsApp, contatos salvos, leads
- **Atualiza automaticamente dados desatualizados** no banco

> No fluxo operacional da Festa com IA, este endpoint é a principal fonte para capturar a melhor URL da foto do cliente e persistir em `clients.profile_photo_url` no Postgres local.

### Campos Retornados:
- **Informações básicas**: id, wa_fastid, wa_chatid, owner, name, phone
- **Dados do WhatsApp**: wa_name, wa_contactName, wa_archived, wa_isBlocked, etc.
- **Dados de lead/CRM**: lead_name, lead_email, lead_status, lead_field01-20, etc.
- **Informações de grupo**: wa_isGroup, wa_isGroup_admin, wa_isGroup_announce, etc.
- **Chatbot**: chatbot_summary, chatbot_lastTrigger_id, chatbot_disableUntil, etc.
- **Configurações**: wa_muteEndTime, wa_isPinned, wa_unreadCount, etc.

**Comportamento**:
- Para contatos individuais:
  - Busca nome verificado do WhatsApp
  - Verifica nome salvo nos contatos
  - Formata número internacional
  - Calcula grupos em comum
- Para grupos:
  - Busca nome do grupo
  - Verifica status de comunidade


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do telefone ou ID do grupo",
      "example": "5511999999999"
    },
    "preview": {
      "type": "boolean",
      "description": "Controla o tamanho da imagem de perfil retornada:\n- `true`: Retorna imagem em tamanho preview (menor, otimizada para listagens)\n- `false` (padr\u00e3o): Retorna imagem em tamanho full (resolu\u00e7\u00e3o original, maior qualidade)\n",
      "default": false
    }
  },
  "required": [
    "number"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações completas do chat retornadas com sucesso |
| 400 | Payload inválido ou número inválido |
| 401 | Token não fornecido |
| 500 | Erro interno do servidor ou sessão não iniciada |

---
#### Verificar Números no WhatsApp
`POST /chat/check`

Verifica se números fornecidos estão registrados no WhatsApp e retorna informações detalhadas.

### Funcionalidades:
- Verifica múltiplos números simultaneamente
- Suporta números individuais e IDs de grupo
- Retorna nome verificado quando disponível
- Identifica grupos e comunidades
- Verifica subgrupos de comunidades

**Comportamento específico**:
- Para números individuais:
  - Verifica registro no WhatsApp
  - Retorna nome verificado se disponível
  - Normaliza formato do número
- Para grupos:
  - Verifica existência
  - Retorna nome do grupo
  - Retorna id do grupo de anúncios se buscado por id de comunidade


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "numbers": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Lista de n\u00fameros ou IDs de grupo para verificar",
      "example": [
        "5511999999999",
        "123456789@g.us"
      ]
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Resultado da verificação |
| 400 | Payload inválido ou sem números |
| 401 | Sem sessão ativa |
| 500 | Erro interno do servidor |

---
### Tag: Respostas Rápidas
#### Criar, atualizar ou excluir resposta rápida
`POST /quickreply/edit`

Gerencia templates de respostas rápidas para agilizar o atendimento. Suporta mensagens de texto e mídia.

- Para criar: não inclua o campo `id`
- Para atualizar: inclua o `id` existente
- Para excluir: defina `delete: true` e inclua o `id`

Observação: Templates originados do WhatsApp (onWhatsApp=true) não podem ser modificados ou excluídos.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "required": [
    "shortCut",
    "type"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "Necess\u00e1rio para atualiza\u00e7\u00f5es/exclus\u00f5es, omitir para cria\u00e7\u00e3o",
      "example": "rb9da9c03637452"
    },
    "delete": {
      "type": "boolean",
      "description": "Definir como true para excluir o template",
      "default": false
    },
    "shortCut": {
      "type": "string",
      "description": "Atalho para acesso r\u00e1pido ao template",
      "example": "saudacao1"
    },
    "type": {
      "type": "string",
      "enum": [
        "text",
        "audio",
        "myaudio",
        "ptt",
        "document",
        "video",
        "image"
      ],
      "description": "Tipo da mensagem"
    },
    "text": {
      "type": "string",
      "description": "Obrigat\u00f3rio para mensagens do tipo texto",
      "example": "Ol\u00e1! Como posso ajudar hoje?"
    },
    "file": {
      "type": "string",
      "description": "URL ou Base64 para tipos de m\u00eddia",
      "example": "https://exemplo.com/arquivo.pdf"
    },
    "docName": {
      "type": "string",
      "description": "Nome do arquivo opcional para tipo documento",
      "example": "apresentacao.pdf"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Operação concluída com sucesso |
| 400 | Requisição inválida (erro de validação) |
| 403 | Não é possível modificar template originado do WhatsApp |
| 404 | Template não encontrado |
| 500 | Erro no servidor |

---
#### Listar todas as respostas rápidas
`GET /quickreply/showall`

Retorna todas as respostas rápidas cadastradas para a instância autenticada

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Lista de respostas rápidas |
| 500 | Erro no servidor |

---
### Tag: Chamadas
#### Iniciar chamada de voz
`POST /call/make`

Inicia uma chamada de voz para um contato específico. Este endpoint permite:
1. Iniciar chamadas de voz para contatos
2. Funciona apenas com números válidos do WhatsApp
3. O contato receberá uma chamada de voz

**Nota**: O telefone do contato tocará normalmente, mas ao contato atender, ele não ouvirá nada, e você também não ouvirá nada. 
Este endpoint apenas inicia a chamada, não estabelece uma comunicação de voz real.

**Opcional**: Use `call_duration` para definir por quantos segundos a chamada deve tocar.
Após esse período a chamada é encerrada automaticamente, sem precisar chamar `/call/reject`.

Exemplo de requisição:
```json
{
  "number": "5511999999999",
  "call_duration": 15
}
```

Exemplo de resposta:
```json
{
  "response": "Call successful"
}
```

Erros comuns:
- 401: Token inválido ou expirado
- 400: Número inválido ou ausente
- 500: Erro ao iniciar chamada


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "number": {
      "type": "string",
      "description": "N\u00famero do contato no formato internacional (ex: 5511999999999)",
      "example": "5511999999999"
    },
    "call_duration": {
      "type": "integer",
      "description": "Dura\u00e7\u00e3o da chamada em segundos (opcional). Ap\u00f3s esse tempo a chamada \u00e9 encerrada automaticamente.",
      "example": 15
    }
  },
  "required": [
    "number"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Chamada iniciada com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

---
#### Rejeitar chamada recebida
`POST /call/reject`

Rejeita uma chamada recebida do WhatsApp.

O body pode ser enviado vazio `{}`. Os campos `number` e `id` são opcionais e podem ser usados para especificar uma chamada específica.

Exemplo de requisição (recomendado):
```json
{}
```

Exemplo de requisição com campos opcionais:
```json
{
  "number": "5511999999999",
  "id": "ABEiGmo8oqkAcAKrBYQAAAAA_1"
}
```

Exemplo de resposta:
```json
{
  "response": "Call rejected"
}
```

Erros comuns:
- 401: Token inválido ou expirado
- 400: Número inválido
- 500: Erro ao rejeitar chamada


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "example": {},
  "properties": {
    "number": {
      "type": "string",
      "description": "(Opcional) N\u00famero do contato no formato internacional (ex: 5511999999999)"
    },
    "id": {
      "type": "string",
      "description": "(Opcional) ID \u00fanico da chamada a ser rejeitada"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Chamada rejeitada com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor |

---
### Tag: Integração Chatwoot
#### Obter configuração do Chatwoot
`GET /chatwoot/config`

Retorna a configuração atual da integração com Chatwoot para a instância.

### Funcionalidades:
- Retorna todas as configurações do Chatwoot incluindo credenciais
- Mostra status de habilitação da integração
- Útil para verificar configurações atuais antes de fazer alterações


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração obtida com sucesso |
| 401 | Token inválido/expirado |
| 500 | Erro interno do servidor |

---
#### Atualizar configuração do Chatwoot
`PUT /chatwoot/config`

Atualiza a configuração da integração com Chatwoot para a instância.

### Funcionalidades:
- Configura todos os parâmetros da integração Chatwoot
- Reinicializa automaticamente o cliente Chatwoot quando habilitado
- Retorna URL do webhook para configurar no Chatwoot
- Sincronização bidirecional de mensagens novas entre WhatsApp e Chatwoot
- Sincronização automática de contatos (nome e telefone)
- Atualização automática LID → PN (Local ID para Phone Number)
- Sistema de nomes inteligentes com til (~)

### Configuração no Chatwoot:
1. Após configurar via API, use a URL retornada no webhook settings da inbox no Chatwoot
2. Configure como webhook URL na sua inbox do Chatwoot
3. A integração ficará ativa e sincronizará mensagens e contatos automaticamente

### 🏷️ Sistema de Nomes Inteligentes:
- **Nomes com til (~)**: São atualizados automaticamente quando o contato modifica seu nome no WhatsApp
- **Nomes específicos**: Para definir um nome fixo, remova o til (~) do nome no Chatwoot
- **Exemplo**: "~João Silva" será atualizado automaticamente, "João Silva" (sem til) permanecerá fixo
- **Atualização LID→PN**: Contatos migram automaticamente de Local ID para Phone Number quando disponível
- **Sem duplicação**: Durante a migração LID→PN, não haverá duplicação de conversas
- **Respostas nativas**: Todas as respostas dos agentes aparecem nativamente no Chatwoot

### 🚧 AVISO IMPORTANTE - INTEGRAÇÃO BETA:
- **Fase Beta**: Esta integração está em fase de desenvolvimento e testes
- **Uso por conta e risco**: O usuário assume total responsabilidade pelo uso
- **Recomendação**: Teste em ambiente não-produtivo antes de usar em produção
- **Suporte limitado**: Funcionalidades podem mudar sem aviso prévio

### ⚠️ Limitações Conhecidas:
- **Sincronização de histórico**: Não implementada - apenas mensagens novas são sincronizadas


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "enabled": {
      "type": "boolean",
      "description": "Habilitar/desabilitar integra\u00e7\u00e3o com Chatwoot",
      "example": true
    },
    "url": {
      "type": "string",
      "description": "URL base da inst\u00e2ncia Chatwoot (sem barra final)",
      "example": "https://app.chatwoot.com"
    },
    "access_token": {
      "type": "string",
      "description": "Token de acesso da API Chatwoot (obtido em Profile Settings > Access Token)",
      "example": "pXXGHHHyJPYHYgWHJHYHgJjj"
    },
    "account_id": {
      "type": "integer",
      "format": "int64",
      "description": "ID da conta no Chatwoot (vis\u00edvel na URL da conta)",
      "example": 1
    },
    "inbox_id": {
      "type": "integer",
      "format": "int64",
      "description": "ID da inbox no Chatwoot (obtido nas configura\u00e7\u00f5es da inbox)",
      "example": 5
    },
    "ignore_groups": {
      "type": "boolean",
      "description": "Ignorar mensagens de grupos do WhatsApp na sincroniza\u00e7\u00e3o",
      "example": false
    },
    "sign_messages": {
      "type": "boolean",
      "description": "Assinar mensagens enviadas para WhatsApp com identifica\u00e7\u00e3o do agente",
      "example": true
    },
    "create_new_conversation": {
      "type": "boolean",
      "description": "Sempre criar nova conversa ao inv\u00e9s de reutilizar conversas existentes",
      "example": false
    }
  },
  "required": [
    "enabled",
    "url",
    "access_token",
    "account_id",
    "inbox_id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Configuração atualizada com sucesso |
| 400 | Dados inválidos no body da requisição |
| 401 | Token inválido/expirado |
| 500 | Erro interno ao salvar configuração |

---
### Tag: Business
#### Obter o perfil comercial
`POST /business/get/profile`

Retorna o perfil comercial da conta do WhatsApp Business atualmente conectada.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "jid": {
      "type": "string",
      "description": "JID do perfil comercial a consultar",
      "example": "5511999999999@s.whatsapp.net"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Perfil comercial recuperado com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao recuperar o perfil comercial |

---
#### Obter as categorias de negócios
`GET /business/get/categories`

Retorna as categorias de negócios disponíveis.


**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Categorias de negócios recuperadas com sucesso |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao recuperar as categorias de negócios |

---
#### Atualizar o perfil comercial
`POST /business/update/profile`

Atualiza os dados do perfil comercial da conta do WhatsApp Business atualmente conectada.
Todos os campos são opcionais; apenas os enviados serão atualizados.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "Nova descri\u00e7\u00e3o do perfil comercial.",
      "example": "Loja de eletr\u00f4nicos e acess\u00f3rios"
    },
    "address": {
      "type": "string",
      "description": "Novo endere\u00e7o do perfil comercial.",
      "example": "Rua das Flores, 123 - Centro"
    },
    "email": {
      "type": "string",
      "description": "Novo email do perfil comercial.",
      "example": "contato@empresa.com"
    }
  }
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Todos os campos enviados foram atualizados |
| 207 | Sucesso parcial — ao menos um campo falhou |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Falha total — nenhum campo foi atualizado |

---
#### Listar os produtos do catálogo
`POST /business/catalog/list`

Lista uma página de produtos do catálogo de um perfil comercial no WhatsApp.

Observações:
- envie apenas `jid` para buscar a primeira página
- a paginação pública usa o campo `after`
- copie exatamente o valor retornado em `response.Paging.After` e envie na próxima chamada
- o valor de `after` é um token opaco: não tente decodificar ou modificar
- a integração atual retorna até 10 produtos por chamada
- o retorno espelha as structs atuais da camada `whatsmeow`, então os campos de `response` usam nomes em maiúsculas (`Products`, `Paging`, etc.)


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "jid": {
      "type": "string",
      "description": "JID do cat\u00e1logo a consultar",
      "example": "5511999999999@s.whatsapp.net"
    },
    "after": {
      "type": "string",
      "description": "Token da pr\u00f3xima p\u00e1gina. Use exatamente o valor retornado em `response.Paging.After`.",
      "example": "Q1VSU09SX1BST1hJTUFfUEFHSU5B"
    }
  },
  "required": [
    "jid"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Produtos do catálogo recuperados com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao recuperar os produtos do catálogo |

---
#### Obter informações de um produto do catálogo
`POST /business/catalog/info`

Retorna as informações de um produto específico do catálogo.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "jid": {
      "type": "string",
      "description": "JID do cat\u00e1logo a consultar",
      "example": "5511999999999@s.whatsapp.net"
    },
    "id": {
      "type": "string",
      "description": "O ID do produto."
    }
  },
  "required": [
    "jid",
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Informações do produto recuperadas com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao recuperar as informações do produto |

---
#### Deletar um produto do catálogo
`POST /business/catalog/delete`

Deleta um produto específico do catálogo.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "O ID do produto."
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Produto deletado com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao deletar o produto |

---
#### Mostrar um produto do catálogo
`POST /business/catalog/show`

Mostra um produto específico do catálogo.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "O ID do produto."
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Produto mostrado com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao mostrar o produto |

---
#### Ocultar um produto do catálogo
`POST /business/catalog/hide`

Oculta um produto específico do catálogo.


**Corpo da Requisição (Request Body):**
- **Content-Type:** `application/json`
  - **Estrutura:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "O ID do produto."
    }
  },
  "required": [
    "id"
  ]
}
```

**Respostas:**
| Código | Descrição |
| :--- | :--- |
| 200 | Produto ocultado com sucesso |
| 400 | Requisição inválida |
| 401 | Token inválido ou expirado |
| 500 | Erro interno do servidor ao ocultar o produto |

---
## Modelos de Dados (Schemas)
### Instance
Representa uma instância do WhatsApp
```json
{
  "type": "object",
  "description": "Representa uma inst\u00e2ncia do WhatsApp",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico gerado automaticamente"
    },
    "token": {
      "type": "string",
      "description": "Token de autentica\u00e7\u00e3o da inst\u00e2ncia"
    },
    "status": {
      "type": "string",
      "description": "Status atual da conex\u00e3o"
    },
    "paircode": {
      "type": "string",
      "description": "C\u00f3digo de pareamento"
    },
    "qrcode": {
      "type": "string",
      "description": "QR Code em base64 para autentica\u00e7\u00e3o"
    },
    "name": {
      "type": "string",
      "description": "Nome da inst\u00e2ncia"
    },
    "profileName": {
      "type": "string",
      "description": "Nome do perfil WhatsApp"
    },
    "profilePicUrl": {
      "type": "string",
      "format": "uri",
      "description": "URL da foto do perfil"
    },
    "isBusiness": {
      "type": "boolean",
      "description": "Indica se \u00e9 uma conta business"
    },
    "plataform": {
      "type": "string",
      "description": "Plataforma de origem (iOS/Android/Web)"
    },
    "systemName": {
      "type": "string",
      "description": "Nome do sistema operacional"
    },
    "owner": {
      "type": "string",
      "description": "Propriet\u00e1rio da inst\u00e2ncia"
    },
    "current_presence": {
      "type": "string",
      "description": "Status atual de presen\u00e7a da inst\u00e2ncia (campo n\u00e3o persistido)",
      "enum": [
        "available",
        "unavailable"
      ],
      "example": "available"
    },
    "lastDisconnect": {
      "type": "string",
      "format": "date-time",
      "description": "Data/hora da \u00faltima desconex\u00e3o"
    },
    "lastDisconnectReason": {
      "type": "string",
      "description": "Motivo da \u00faltima desconex\u00e3o"
    },
    "adminField01": {
      "type": "string",
      "description": "Campo administrativo 01"
    },
    "adminField02": {
      "type": "string",
      "description": "Campo administrativo 02"
    },
    "openai_apikey": {
      "type": "string",
      "description": "Chave da API OpenAI"
    },
    "chatbot_enabled": {
      "type": "boolean",
      "description": "Habilitar chatbot autom\u00e1tico"
    },
    "chatbot_ignoreGroups": {
      "type": "boolean",
      "description": "Ignorar mensagens de grupos"
    },
    "chatbot_stopConversation": {
      "type": "string",
      "description": "Palavra-chave para parar conversa"
    },
    "chatbot_stopMinutes": {
      "type": "integer",
      "description": "Por quanto tempo ficar\u00e1 pausado o chatbot ao usar stop conversation"
    },
    "chatbot_stopWhenYouSendMsg": {
      "type": "integer",
      "description": "Por quanto tempo ficar\u00e1 pausada a conversa quando voc\u00ea enviar mensagem manualmente"
    },
    "fieldsMap": {
      "type": "object",
      "description": "Mapa de campos customizados da inst\u00e2ncia (quando presente)",
      "additionalProperties": true
    },
    "currentTime": {
      "type": "string",
      "description": "Hor\u00e1rio atual retornado pelo backend"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Data de cria\u00e7\u00e3o da inst\u00e2ncia"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Data da \u00faltima atualiza\u00e7\u00e3o"
    }
  },
  "example": {
    "id": "i91011ijkl",
    "token": "abc123xyz",
    "status": "connected",
    "paircode": "1234-5678",
    "qrcode": "data:image/png;base64,iVBORw0KGg...",
    "name": "Inst\u00e2ncia Principal",
    "profileName": "Loja ABC",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBusiness": true,
    "plataform": "Android",
    "systemName": "uazapi",
    "owner": "user@example.com",
    "lastDisconnect": "2025-01-24T14:00:00Z",
    "lastDisconnectReason": "Network error",
    "adminField01": "custom_data",
    "openai_apikey": "sk-...xyz",
    "chatbot_enabled": true,
    "chatbot_ignoreGroups": true,
    "chatbot_stopConversation": "parar",
    "chatbot_stopMinutes": 60,
    "created": "2025-01-24T14:00:00Z",
    "updated": "2025-01-24T14:30:00Z",
    "currentPresence": "available"
  }
}
```

### Webhook
Configuração completa de webhook com filtros e opções avançadas
```json
{
  "type": "object",
  "description": "Configura\u00e7\u00e3o completa de webhook com filtros e op\u00e7\u00f5es avan\u00e7adas",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico gerado automaticamente"
    },
    "enabled": {
      "type": "boolean",
      "description": "Webhook ativo/inativo",
      "default": false
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL de destino dos eventos"
    },
    "events": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "connection",
          "history",
          "messages",
          "messages_update",
          "newsletter_messages",
          "call",
          "contacts",
          "presence",
          "groups",
          "labels",
          "chats",
          "chat_labels",
          "blocks",
          "sender"
        ]
      },
      "description": "Tipos de eventos monitorados"
    },
    "addUrlTypesMessages": {
      "type": "boolean",
      "description": "Incluir na URLs o tipo de mensagem",
      "default": false
    },
    "addUrlEvents": {
      "type": "boolean",
      "description": "Incluir na URL o nome do evento",
      "default": false
    },
    "excludeMessages": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "wasSentByApi",
          "wasNotSentByApi",
          "fromMeYes",
          "fromMeNo",
          "isGroupYes",
          "isGroupNo"
        ]
      },
      "description": "Filtros para excluir tipos de mensagens"
    }
  },
  "required": [
    "url",
    "events"
  ],
  "example": {
    "id": "wh_9a8b7c6d5e",
    "enabled": true,
    "url": "https://webhook.cool/example",
    "events": [
      "messages",
      "newsletter_messages",
      "connection"
    ],
    "addUrlTypesMessages": false,
    "addUrlEvents": false,
    "excludeMessages": []
  }
}
```

### Chat
Representa uma conversa/chamado no sistema
```json
{
  "type": "object",
  "description": "Representa uma conversa/chamado no sistema",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID \u00fanico da conversa (r + 7 bytes aleat\u00f3rios em hex)"
    },
    "wa_fastid": {
      "type": "string",
      "description": "Identificador r\u00e1pido do WhatsApp"
    },
    "wa_chatid": {
      "type": "string",
      "description": "ID completo do chat no WhatsApp"
    },
    "wa_chatlid": {
      "type": "string",
      "description": "LID do chat no WhatsApp (quando dispon\u00edvel)"
    },
    "wa_archived": {
      "type": "boolean",
      "description": "Indica se o chat est\u00e1 arquivado",
      "default": false
    },
    "wa_contactName": {
      "type": "string",
      "description": "Nome salvo nos contatos pelo dono da conta/inst\u00e2ncia.\nS\u00f3 existe quando o n\u00famero estiver salvo na agenda/contatos.\n",
      "default": ""
    },
    "wa_name": {
      "type": "string",
      "description": "Nome definido pelo usu\u00e1rio no perfil do WhatsApp (\"push name\").\nVem do perfil do contato e pode n\u00e3o estar dispon\u00edvel dependendo do contexto ou da origem dos dados.\n",
      "default": ""
    },
    "name": {
      "type": "string",
      "description": "Nome resolvido pelo sistema como fallback.\nNormalmente consolida o melhor valor dispon\u00edvel entre dados internos, nome vindo do WhatsApp e nome salvo nos contatos.\nPor isso, costuma ter maior chance de vir preenchido.\n",
      "default": ""
    },
    "image": {
      "type": "string",
      "description": "URL da imagem do chat",
      "default": ""
    },
    "imagePreview": {
      "type": "string",
      "description": "URL da miniatura da imagem; no fluxo operacional é usada como primeira opção para salvar `clients.profile_photo_url`",
      "default": ""
    },
    "wa_ephemeralExpiration": {
      "type": "integer",
      "format": "int64",
      "description": "Tempo de expira\u00e7\u00e3o de mensagens ef\u00eameras",
      "default": 0
    },
    "wa_isBlocked": {
      "type": "boolean",
      "description": "Indica se o contato est\u00e1 bloqueado",
      "default": false
    },
    "wa_isGroup": {
      "type": "boolean",
      "description": "Indica se \u00e9 um grupo",
      "default": false
    },
    "wa_isGroup_admin": {
      "type": "boolean",
      "description": "Indica se o usu\u00e1rio \u00e9 admin do grupo",
      "default": false
    },
    "wa_isGroup_announce": {
      "type": "boolean",
      "description": "Indica se \u00e9 um grupo somente an\u00fancios",
      "default": false
    },
    "wa_isGroup_community": {
      "type": "boolean",
      "description": "Indica se \u00e9 uma comunidade",
      "default": false
    },
    "wa_isGroup_member": {
      "type": "boolean",
      "description": "Indica se \u00e9 membro do grupo",
      "default": false
    },
    "wa_isPinned": {
      "type": "boolean",
      "description": "Indica se o chat est\u00e1 fixado",
      "default": false
    },
    "wa_label": {
      "type": "array",
      "description": "Labels do chat",
      "items": {
        "type": "string"
      }
    },
    "wa_notes": {
      "type": "string",
      "description": "Anota\u00e7\u00f5es internas do chat sincronizadas via app state",
      "default": ""
    },
    "wa_lastMessageTextVote": {
      "type": "string",
      "description": "Texto/voto da \u00faltima mensagem",
      "default": ""
    },
    "wa_lastMessageType": {
      "type": "string",
      "description": "Tipo da \u00faltima mensagem",
      "default": ""
    },
    "wa_lastMsgTimestamp": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp da \u00faltima mensagem",
      "default": 0
    },
    "wa_lastMessageSender": {
      "type": "string",
      "description": "Remetente da \u00faltima mensagem",
      "default": ""
    },
    "wa_muteEndTime": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp do fim do silenciamento",
      "default": 0
    },
    "owner": {
      "type": "string",
      "description": "Dono da inst\u00e2ncia",
      "default": ""
    },
    "wa_unreadCount": {
      "type": "integer",
      "format": "int64",
      "description": "Contador de mensagens n\u00e3o lidas",
      "default": 0
    },
    "phone": {
      "type": "string",
      "description": "N\u00famero de telefone",
      "default": ""
    },
    "common_groups": {
      "type": "string",
      "description": "Grupos em comum separados por v\u00edrgula, formato: (nome_grupo)id_grupo",
      "default": "",
      "example": "Grupo Fam\u00edlia(120363123456789012@g.us),Trabalho(987654321098765432@g.us)"
    },
    "lead_name": {
      "type": "string",
      "description": "Nome do lead",
      "default": ""
    },
    "lead_fullName": {
      "type": "string",
      "description": "Nome completo do lead",
      "default": ""
    },
    "lead_email": {
      "type": "string",
      "description": "Email do lead",
      "default": ""
    },
    "lead_personalid": {
      "type": "string",
      "description": "Documento de identifica\u00e7\u00e3o",
      "default": ""
    },
    "lead_status": {
      "type": "string",
      "description": "Status do lead",
      "default": ""
    },
    "lead_tags": {
      "type": "array",
      "description": "Tags do lead",
      "items": {
        "type": "string"
      }
    },
    "lead_notes": {
      "type": "string",
      "description": "Anota\u00e7\u00f5es sobre o lead",
      "default": ""
    },
    "lead_isTicketOpen": {
      "type": "boolean",
      "description": "Indica se tem ticket aberto",
      "default": false
    },
    "lead_assignedAttendant_id": {
      "type": "string",
      "description": "ID do atendente respons\u00e1vel",
      "default": ""
    },
    "lead_kanbanOrder": {
      "type": "integer",
      "format": "int64",
      "description": "Ordem no kanban",
      "default": 0
    },
    "lead_field01": {
      "type": "string",
      "default": ""
    },
    "lead_field02": {
      "type": "string",
      "default": ""
    },
    "lead_field03": {
      "type": "string",
      "default": ""
    },
    "lead_field04": {
      "type": "string",
      "default": ""
    },
    "lead_field05": {
      "type": "string",
      "default": ""
    },
    "lead_field06": {
      "type": "string",
      "default": ""
    },
    "lead_field07": {
      "type": "string",
      "default": ""
    },
    "lead_field08": {
      "type": "string",
      "default": ""
    },
    "lead_field09": {
      "type": "string",
      "default": ""
    },
    "lead_field10": {
      "type": "string",
      "default": ""
    },
    "lead_field11": {
      "type": "string",
      "default": ""
    },
    "lead_field12": {
      "type": "string",
      "default": ""
    },
    "lead_field13": {
      "type": "string",
      "default": ""
    },
    "lead_field14": {
      "type": "string",
      "default": ""
    },
    "lead_field15": {
      "type": "string",
      "default": ""
    },
    "lead_field16": {
      "type": "string",
      "default": ""
    },
    "lead_field17": {
      "type": "string",
      "default": ""
    },
    "lead_field18": {
      "type": "string",
      "default": ""
    },
    "lead_field19": {
      "type": "string",
      "default": ""
    },
    "lead_field20": {
      "type": "string",
      "default": ""
    },
    "chatbot_agentResetMemoryAt": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp do \u00faltimo reset de mem\u00f3ria",
      "default": 0
    },
    "chatbot_lastTrigger_id": {
      "type": "string",
      "description": "ID do \u00faltimo gatilho executado",
      "default": ""
    },
    "chatbot_lastTriggerAt": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp do \u00faltimo gatilho",
      "default": 0
    },
    "chatbot_disableUntil": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp at\u00e9 quando chatbot est\u00e1 desativado",
      "default": 0
    }
  }
}
```

### Message
Representa uma mensagem trocada no sistema
```json
{
  "type": "object",
  "description": "Representa uma mensagem trocada no sistema",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico interno da mensagem (formato r + 7 caracteres hex aleat\u00f3rios)"
    },
    "messageid": {
      "type": "string",
      "description": "ID original da mensagem no provedor"
    },
    "chatid": {
      "type": "string",
      "description": "ID da conversa relacionada"
    },
    "sender": {
      "type": "string",
      "description": "ID do remetente da mensagem"
    },
    "senderName": {
      "type": "string",
      "description": "Nome exibido do remetente"
    },
    "isGroup": {
      "type": "boolean",
      "description": "Indica se \u00e9 uma mensagem de grupo",
      "default": false
    },
    "fromMe": {
      "type": "boolean",
      "description": "Indica se a mensagem foi enviada pelo usu\u00e1rio",
      "default": false
    },
    "messageType": {
      "type": "string",
      "description": "Tipo de conte\u00fado da mensagem"
    },
    "source": {
      "type": "string",
      "description": "Plataforma de origem da mensagem"
    },
    "messageTimestamp": {
      "type": "integer",
      "description": "Timestamp original da mensagem em milissegundos",
      "default": 0
    },
    "status": {
      "type": "string",
      "description": "Status do ciclo de vida da mensagem.\nExemplos comuns: `Queued`, `Canceled`, `Failed`, `Sent`, `Delivered`, `Read`.\n"
    },
    "text": {
      "type": "string",
      "description": "Texto original da mensagem",
      "default": ""
    },
    "quoted": {
      "type": "string",
      "description": "ID da mensagem citada/respondida",
      "default": ""
    },
    "edited": {
      "type": "string",
      "description": "Hist\u00f3rico de edi\u00e7\u00f5es da mensagem",
      "default": ""
    },
    "reaction": {
      "type": "string",
      "description": "ID da mensagem reagida",
      "default": ""
    },
    "vote": {
      "type": "string",
      "description": "Dados de vota\u00e7\u00e3o de enquete e listas",
      "default": ""
    },
    "convertOptions": {
      "type": "string",
      "description": "Convers\u00e3o de op\u00e7\u00f5es da mensagem, lista, enquete e bot\u00f5es",
      "default": ""
    },
    "buttonOrListid": {
      "type": "string",
      "description": "ID do bot\u00e3o ou item de lista selecionado",
      "default": ""
    },
    "owner": {
      "type": "string",
      "description": "Dono da mensagem",
      "default": ""
    },
    "error": {
      "type": "string",
      "description": "Mensagem de erro caso o envio tenha falhado",
      "default": ""
    },
    "content": {
      "description": "Conte\u00fado bruto da mensagem (JSON serializado ou texto)",
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": true
        },
        {
          "type": "string",
          "description": "Texto bruto quando n\u00e3o for JSON"
        }
      ]
    },
    "wasSentByApi": {
      "type": "boolean",
      "description": "Indica se a mensagem foi enviada via API"
    },
    "sendFunction": {
      "type": "string",
      "description": "Fun\u00e7\u00e3o usada para enviar a mensagem (quando enviada via API)"
    },
    "sendPayload": {
      "description": "Payload enviado (texto/JSON serializado)",
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": true
        },
        {
          "type": "string",
          "description": "Texto bruto quando n\u00e3o for JSON"
        }
      ]
    },
    "fileURL": {
      "type": "string",
      "description": "URL ou refer\u00eancia de arquivo da mensagem"
    },
    "send_folder_id": {
      "type": "string",
      "description": "Pasta associada ao envio (quando aplic\u00e1vel)"
    },
    "track_source": {
      "type": "string",
      "description": "Origem de rastreamento"
    },
    "track_id": {
      "type": "string",
      "description": "ID de rastreamento (pode repetir)"
    },
    "ai_metadata": {
      "type": "object",
      "description": "Metadados do processamento por IA",
      "properties": {
        "agent_id": {
          "type": "string",
          "description": "ID do agente de IA respons\u00e1vel"
        },
        "request": {
          "type": "object",
          "description": "Dados da requisi\u00e7\u00e3o \u00e0 API de IA",
          "properties": {
            "messages": {
              "type": "array",
              "description": "Hist\u00f3rico de mensagens enviadas para a API"
            },
            "tools": {
              "type": "array",
              "description": "Ferramentas dispon\u00edveis para o agente"
            },
            "options": {
              "type": "object",
              "description": "Op\u00e7\u00f5es de configura\u00e7\u00e3o da API",
              "properties": {
                "model": {
                  "type": "string"
                },
                "temperature": {
                  "type": "number"
                },
                "maxTokens": {
                  "type": "integer"
                },
                "topP": {
                  "type": "number"
                },
                "frequencyPenalty": {
                  "type": "number"
                },
                "presencePenalty": {
                  "type": "number"
                }
              }
            }
          }
        },
        "response": {
          "type": "object",
          "description": "Resposta da API de IA",
          "properties": {
            "choices": {
              "type": "array",
              "description": "Resultados retornados pela API"
            },
            "toolResults": {
              "type": "array",
              "description": "Resultados da execu\u00e7\u00e3o de ferramentas"
            },
            "error": {
              "type": "string",
              "description": "Mensagem de erro, se houver"
            }
          }
        }
      }
    },
    "sender_pn": {
      "type": "string",
      "description": "JID PN resolvido do remetente (quando dispon\u00edvel)"
    },
    "sender_lid": {
      "type": "string",
      "description": "LID original do remetente (quando dispon\u00edvel)"
    }
  }
}
```

### Label
Representa uma etiqueta/categoria no sistema
```json
{
  "type": "object",
  "description": "Representa uma etiqueta/categoria no sistema",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico da etiqueta"
    },
    "name": {
      "type": "string",
      "description": "Nome da etiqueta"
    },
    "color": {
      "type": "integer",
      "description": "\u00cdndice num\u00e9rico da cor (0-19)",
      "minimum": 0,
      "maximum": 19,
      "example": 2
    },
    "colorHex": {
      "type": "string",
      "description": "Cor hexadecimal correspondente ao \u00edndice",
      "enum": [
        "#ff9484",
        "#64c4ff",
        "#fed428",
        "#dfaef0",
        "#9ab6c1",
        "#56ccb4",
        "#fe9dfe",
        "#d3a91f",
        "#6f7bcf",
        "#d8e651",
        "#01d0e2",
        "#ffc5c7",
        "#92ceac",
        "#f64847",
        "#00a1f2",
        "#83e421",
        "#ffae04",
        "#b4ebff",
        "#9ba6ff",
        "#9568cf"
      ],
      "example": "#fed428"
    },
    "labelid": {
      "type": "string",
      "description": "ID da label no WhatsApp (quando sincronizada)"
    },
    "owner": {
      "type": "string",
      "description": "Dono da etiqueta"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Data de cria\u00e7\u00e3o"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Data da \u00faltima atualiza\u00e7\u00e3o"
    }
  },
  "example": {
    "id": "l121314mnop",
    "name": "Cliente VIP",
    "color": 2,
    "colorHex": "#fed428",
    "created": "2025-01-24T14:35:00.000Z",
    "updated": "2025-01-24T15:00:00.000Z"
  }
}
```

### Attendant
Modelo de atendente do sistema
```json
{
  "type": "object",
  "description": "Modelo de atendente do sistema",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico gerado automaticamente"
    },
    "name": {
      "type": "string",
      "description": "Nome do atendente",
      "default": ""
    },
    "phone": {
      "type": "string",
      "description": "N\u00famero de telefone",
      "default": ""
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Endere\u00e7o de e-mail",
      "default": ""
    },
    "department": {
      "type": "string",
      "description": "Departamento de atua\u00e7\u00e3o",
      "default": ""
    },
    "customField01": {
      "type": "string",
      "description": "Campo personaliz\u00e1vel 01",
      "default": ""
    },
    "customField02": {
      "type": "string",
      "description": "Campo personaliz\u00e1vel 02",
      "default": ""
    },
    "owner": {
      "type": "string",
      "description": "Respons\u00e1vel pelo cadastro",
      "default": ""
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Data de cria\u00e7\u00e3o autom\u00e1tica"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Data de atualiza\u00e7\u00e3o autom\u00e1tica"
    }
  },
  "example": {
    "id": "r1234abcd",
    "name": "Jo\u00e3o da Silva",
    "phone": "+5511999999999",
    "email": "joao@empresa.com",
    "department": "Suporte T\u00e9cnico",
    "customField01": "Turno: Manh\u00e3",
    "customField02": "N\u00edvel: 2",
    "owner": "admin",
    "created": "2025-01-24T13:52:19.000Z",
    "updated": "2025-01-24T13:52:19.000Z"
  }
}
```

### MessageQueueFolder
Pasta para organização de campanhas de mensagens em massa
```json
{
  "type": "object",
  "description": "Pasta para organiza\u00e7\u00e3o de campanhas de mensagens em massa",
  "properties": {
    "id": {
      "type": "string",
      "description": "Identificador \u00fanico"
    },
    "info": {
      "type": "string",
      "description": "Informa\u00e7\u00f5es adicionais sobre a pasta"
    },
    "status": {
      "type": "string",
      "description": "Status atual da pasta",
      "example": "ativo"
    },
    "scheduled_for": {
      "type": "integer",
      "format": "int64",
      "description": "Timestamp Unix para execu\u00e7\u00e3o agendada"
    },
    "delayMax": {
      "type": "integer",
      "format": "int64",
      "description": "Atraso m\u00e1ximo entre mensagens em milissegundos"
    },
    "delayMin": {
      "type": "integer",
      "format": "int64",
      "description": "Atraso m\u00ednimo entre mensagens em milissegundos"
    },
    "log_delivered": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem de mensagens entregues"
    },
    "log_failed": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem de mensagens com falha"
    },
    "log_played": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem de mensagens reproduzidas (para \u00e1udio/v\u00eddeo)"
    },
    "log_read": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem de mensagens lidas"
    },
    "log_sucess": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem de mensagens enviadas com sucesso"
    },
    "log_total": {
      "type": "integer",
      "format": "int64",
      "description": "Contagem total de mensagens"
    },
    "owner": {
      "type": "string",
      "description": "Identificador do propriet\u00e1rio da inst\u00e2ncia"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Data e hora de cria\u00e7\u00e3o"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Data e hora da \u00faltima atualiza\u00e7\u00e3o"
    }
  }
}
```

### QuickReply

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "ID \u00fanico da resposta r\u00e1pida"
    },
    "onWhatsApp": {
      "type": "boolean",
      "description": "Indica se a resposta veio do WhatsApp (n\u00e3o pode ser editada/exclu\u00edda)",
      "default": false
    },
    "docName": {
      "type": "string",
      "description": "Nome de documento associado (quando aplic\u00e1vel)",
      "default": ""
    },
    "file": {
      "type": "string",
      "description": "Caminho ou conte\u00fado do arquivo associado",
      "default": ""
    },
    "shortCut": {
      "type": "string",
      "description": "Atalho para acionar a resposta"
    },
    "text": {
      "type": "string",
      "description": "Conte\u00fado da mensagem pr\u00e9-definida"
    },
    "type": {
      "type": "string",
      "description": "Tipo da resposta r\u00e1pida (texto/documento/outros)"
    },
    "owner": {
      "type": "string",
      "description": "Dono da resposta r\u00e1pida"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "Data de cria\u00e7\u00e3o"
    },
    "updated": {
      "type": "string",
      "format": "date-time",
      "description": "Data da \u00faltima atualiza\u00e7\u00e3o"
    }
  },
  "required": [
    "shortCut",
    "text"
  ]
}
```

### Group
Representa um grupo/conversa coletiva
```json
{
  "type": "object",
  "description": "Representa um grupo/conversa coletiva",
  "properties": {
    "JID": {
      "type": "string",
      "format": "jid",
      "description": "Identificador \u00fanico do grupo",
      "example": "jid8@g.us"
    },
    "OwnerJID": {
      "type": "string",
      "format": "jid",
      "description": "JID do propriet\u00e1rio do grupo",
      "example": "1232@s.whatsapp.net"
    },
    "OwnerPN": {
      "type": "string",
      "format": "jid",
      "description": "N\u00famero/LID do propriet\u00e1rio (quando dispon\u00edvel)"
    },
    "Name": {
      "type": "string",
      "description": "Nome do grupo",
      "example": "Grupo de Suporte"
    },
    "NameSetAt": {
      "type": "string",
      "format": "date-time",
      "description": "Data da \u00faltima altera\u00e7\u00e3o do nome"
    },
    "NameSetBy": {
      "type": "string",
      "format": "jid",
      "description": "JID do usu\u00e1rio que definiu o nome"
    },
    "NameSetByPN": {
      "type": "string",
      "format": "jid",
      "description": "LID/PN de quem definiu o nome"
    },
    "Topic": {
      "type": "string",
      "description": "Descri\u00e7\u00e3o do grupo"
    },
    "TopicID": {
      "type": "string",
      "description": "ID interno da descri\u00e7\u00e3o"
    },
    "TopicSetAt": {
      "type": "string",
      "format": "date-time",
      "description": "Data da \u00faltima altera\u00e7\u00e3o da descri\u00e7\u00e3o"
    },
    "TopicSetBy": {
      "type": "string",
      "format": "jid",
      "description": "JID de quem alterou a descri\u00e7\u00e3o"
    },
    "TopicSetByPN": {
      "type": "string",
      "format": "jid",
      "description": "LID/PN de quem alterou a descri\u00e7\u00e3o"
    },
    "TopicDeleted": {
      "type": "boolean",
      "description": "Indica se a descri\u00e7\u00e3o foi apagada"
    },
    "IsLocked": {
      "type": "boolean",
      "description": "Indica se apenas administradores podem editar informa\u00e7\u00f5es do grupo\n- true = apenas admins podem editar\n- false = todos podem editar\n",
      "example": true
    },
    "IsAnnounce": {
      "type": "boolean",
      "description": "Indica se apenas administradores podem enviar mensagens"
    },
    "AnnounceVersionID": {
      "type": "string",
      "description": "Vers\u00e3o da configura\u00e7\u00e3o de an\u00fancios"
    },
    "IsEphemeral": {
      "type": "boolean",
      "description": "Indica se as mensagens s\u00e3o tempor\u00e1rias"
    },
    "DisappearingTimer": {
      "type": "integer",
      "description": "Tempo em segundos para desaparecimento de mensagens",
      "minimum": 0
    },
    "IsIncognito": {
      "type": "boolean",
      "description": "Indica se o grupo \u00e9 incognito"
    },
    "IsParent": {
      "type": "boolean",
      "description": "Indica se \u00e9 um grupo pai (comunidade)"
    },
    "IsJoinApprovalRequired": {
      "type": "boolean",
      "description": "Indica se requer aprova\u00e7\u00e3o para novos membros"
    },
    "LinkedParentJID": {
      "type": "string",
      "format": "jid",
      "description": "JID da comunidade vinculada"
    },
    "IsDefaultSubGroup": {
      "type": "boolean",
      "description": "Indica se \u00e9 um subgrupo padr\u00e3o da comunidade"
    },
    "DefaultMembershipApprovalMode": {
      "type": "string",
      "description": "Modo padr\u00e3o de aprova\u00e7\u00e3o de membros (quando comunidade)"
    },
    "GroupCreated": {
      "type": "string",
      "format": "date-time",
      "description": "Data de cria\u00e7\u00e3o do grupo"
    },
    "CreatorCountryCode": {
      "type": "string",
      "description": "C\u00f3digo do pa\u00eds do criador"
    },
    "ParticipantVersionID": {
      "type": "string",
      "description": "Vers\u00e3o da lista de participantes"
    },
    "Participants": {
      "type": "array",
      "items": {
        "$ref": "#/GroupParticipant"
      },
      "description": "Lista de participantes do grupo"
    },
    "MemberAddMode": {
      "type": "string",
      "enum": [
        "admin_add",
        "all_member_add"
      ],
      "description": "Modo de adi\u00e7\u00e3o de novos membros"
    },
    "AddressingMode": {
      "type": "string",
      "enum": [
        "pn",
        "lid"
      ],
      "description": "Endere\u00e7amento preferido do grupo"
    },
    "OwnerCanSendMessage": {
      "type": "boolean",
      "description": "Verifica se \u00e9 poss\u00edvel voc\u00ea enviar mensagens"
    },
    "OwnerIsAdmin": {
      "type": "boolean",
      "description": "Verifica se voc\u00ea adminstrador do grupo"
    },
    "DefaultSubGroupId": {
      "type": "string",
      "description": "Se o grupo atual for uma comunidade, nesse campo mostrar\u00e1 o ID do subgrupo de avisos"
    },
    "invite_link": {
      "type": "string",
      "description": "Link de convite para entrar no grupo"
    },
    "request_participants": {
      "type": "string",
      "description": "Lista de solicita\u00e7\u00f5es de entrada, separados por v\u00edrgula"
    }
  }
}
```

### GroupParticipant
Participante de um grupo
```json
{
  "type": "object",
  "description": "Participante de um grupo",
  "properties": {
    "JID": {
      "type": "string",
      "format": "jid",
      "description": "Identificador do participante"
    },
    "LID": {
      "type": "string",
      "format": "jid",
      "description": "Identificador local do participante"
    },
    "PhoneNumber": {
      "type": "string",
      "format": "jid",
      "description": "N\u00famero do participante (quando dispon\u00edvel)"
    },
    "IsAdmin": {
      "type": "boolean",
      "description": "Indica se \u00e9 administrador"
    },
    "IsSuperAdmin": {
      "type": "boolean",
      "description": "Indica se \u00e9 super administrador"
    },
    "DisplayName": {
      "type": "string",
      "description": "Nome exibido no grupo (para usu\u00e1rios an\u00f4nimos)"
    },
    "Error": {
      "type": "integer",
      "description": "C\u00f3digo de erro ao adicionar participante",
      "minimum": 0
    },
    "AddRequest": {
      "type": "object",
      "description": "Informa\u00e7\u00f5es da solicita\u00e7\u00e3o de entrada",
      "properties": {
        "Code": {
          "type": "string",
          "description": "C\u00f3digo da solicita\u00e7\u00e3o"
        },
        "Expiration": {
          "type": "string",
          "format": "date-time",
          "description": "Data de expira\u00e7\u00e3o da solicita\u00e7\u00e3o"
        }
      }
    }
  }
}
```

### WebhookEvent

```json
{
  "type": "object",
  "required": [
    "event",
    "instance",
    "data"
  ],
  "properties": {
    "event": {
      "type": "string",
      "enum": [
        "message",
        "status",
        "presence",
        "group",
        "connection"
      ],
      "description": "Tipo do evento recebido"
    },
    "instance": {
      "type": "string",
      "description": "ID da inst\u00e2ncia que gerou o evento"
    },
    "data": {
      "type": "object",
      "description": "Payload do evento enviado pelo webhook. O formato varia conforme o tipo do evento\n(messages, messages_update, connection, presence, etc) e segue o que o backend envia\nem `callHook` (map[string]interface{}). Consulte os exemplos de cada evento espec\u00edfico.\n",
      "additionalProperties": true
    }
  }
}
```
