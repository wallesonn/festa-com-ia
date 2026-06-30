# Estratégia de Localização — Profissionais

Este documento registra a estratégia consolidada para armazenar localização de profissionais e preparar o projeto para recursos futuros de distância, busca por proximidade, rotas, áreas de entrega e automações baseadas em localização.

## Objetivo

Permitir que o profissional informe opcionalmente a localização do estabelecimento de forma simples, mantendo dados suficientes para usos futuros como:

- cálculo de distância entre cliente e profissional
- busca de profissionais próximos
- ordenação por proximidade
- definição de raio ou área de atendimento
- geração de rotas
- automações de entrega ou retirada

## Estratégia de Dados

Começamos simples, sem PostGIS e sem busca espacial avançada.

A modelagem de dados armazena o endereço unificado e as coordenadas em `festa-com-ia-professionals`:

| Campo | Tipo | Obrigatório | Uso |
|-------|------|-------------|-----|
| `location_street` | `text` | não | Endereço unificado do estabelecimento (preenchido via Places ou GPS) |
| `location_latitude` | `double precision` | não | latitude para cálculo de distância |
| `location_longitude` | `double precision` | não | longitude para cálculo de distância |
| `location_updated_at` | `timestamptz` | não | data da última atualização da localização |

*Nota: Os campos legados `location_state` e `location_city` foram descontinuados na interface para simplificar a digitação do usuário e unificados no `location_street` completo fornecido pelas APIs do Google.*

## UX baseada em Google Places Autocomplete

Na tela `/perfil`, a localização é opcional e utiliza os seguintes fluxos:

- **Google Places Autocomplete**: Um único campo de input onde o usuário começa a digitar e o sistema sugere endereços estruturados fornecidos pelo Google Places.
- **Captura por GPS**: Botão "Usar minha localização atual (GPS)" que obtém as coordenadas do navegador e preenche o endereço correspondente por extenso usando geolocalização reversa.
- **Geocodificação Automática**: Ao selecionar um endereço sugerido, as coordenadas (latitude e longitude) são calculadas no backend e salvas instantaneamente de forma transparente para o usuário.

## Arquitetura das APIs (Google Maps Platform)

Para garantir segurança da chave de API e otimização de banda, todas as chamadas externas do Google Maps Platform são intermediadas por rotas internas do Next.js (Server-side):

1. **`GET /api/places/autocomplete`**: Recebe o texto de busca, consulta a API do Google Places com restrição regional para o Brasil (`components=country:br`), e retorna sugestões estruturadas.
2. **`GET /api/geocode`**: Converte a string de endereço selecionada em latitude/longitude geográficas.
3. **`GET /api/reverse-geocode`**: Recebe coordenadas GPS (`lat`, `lon`) e realiza a engenharia reversa para encontrar o endereço legível correspondente.

## Proteção e Variáveis de Ambiente no Docker

A chave do Google Maps (`GOOGLE_MAPS_API_KEY`) é protegida de duas formas cruciais:

1. **Sem vazamento no client-side**: A chave só existe no servidor (lida através de `process.env.GOOGLE_MAPS_API_KEY`). O frontend faz chamadas apenas para as nossas rotas `/api/*`.
2. **Orquestração de Container**: O arquivo `docker-compose.yml` mapeia a variável global para que o Portainer / VPS injete o segredo diretamente no container do Node.js.
3. **Segurança de IP (Google Cloud Console)**: Recomenda-se configurar a chave com restrições de IP (apenas permitindo o IP público da VPS) e de API (restringindo apenas para *Geocoding API* e *Places API*).

## Busca por distância no futuro

Na primeira versão, a distância pode ser calculada no backend usando latitude e longitude com fórmula de Haversine.

Fluxo futuro:

1. obter localização do cliente por GPS ou endereço
2. converter para latitude/longitude quando necessário
3. buscar profissionais com coordenadas preenchidas
4. calcular distância até cada profissional
5. filtrar por raio, por exemplo 5 km, 10 km, 25 km ou 50 km
6. ordenar os resultados por menor distância

## Evolução futura com PostGIS

Quando o volume de profissionais crescer ou a busca por proximidade virar funcionalidade central, a modelagem pode evoluir para PostGIS.

Campos possíveis no futuro:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "festa-com-ia-professionals"
ADD COLUMN location_geography geography(Point, 4326);
```

Com PostGIS, será possível usar funções como:

- `ST_DWithin` para filtrar profissionais dentro de um raio
- `ST_Distance` para ordenar por distância real
- índices espaciais para melhorar performance
