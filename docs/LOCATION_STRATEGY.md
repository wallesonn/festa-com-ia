# Estratégia de Localização — Profissionais

Este documento registra a estratégia inicial para armazenar localização de profissionais e preparar o projeto para recursos futuros de distância, busca por proximidade, rotas, áreas de entrega e automações baseadas em localização.

## Objetivo

Permitir que o profissional informe opcionalmente a localização do estabelecimento de forma simples, mantendo dados suficientes para usos futuros como:

- cálculo de distância entre cliente e profissional
- busca de profissionais próximos
- ordenação por proximidade
- definição de raio ou área de atendimento
- geração de rotas
- automações de entrega ou retirada

## Estratégia inicial

Começar simples, sem PostGIS e sem busca espacial avançada.

A primeira implementação deve armazenar dois tipos de informação:

- endereço legível para humanos
- coordenadas numéricas para cálculo

Campos sugeridos em `festa-com-ia-professionals`:

| Campo | Tipo sugerido | Obrigatório | Uso |
|-------|---------------|-------------|-----|
| `location_state` | `text` | não | estado/UF do estabelecimento |
| `location_city` | `text` | não | cidade do estabelecimento |
| `location_street` | `text` | não | rua, número, bairro e complemento |
| `location_latitude` | `double precision` | não | latitude para cálculo de distância |
| `location_longitude` | `double precision` | não | longitude para cálculo de distância |
| `location_updated_at` | `timestamptz` | não | data da última atualização da localização |

## Por que salvar endereço e coordenadas

O endereço textual é útil para exibição, edição pelo usuário e confirmação visual.

As coordenadas são necessárias para cálculos confiáveis de distância e busca por proximidade. O sistema não deve depender apenas de estado, cidade ou rua para funcionalidades como encontrar profissionais próximos.

## UX recomendada

Na tela `/perfil`, a localização deve ser opcional e apresentada como uma seção separada.

Fluxos recomendados:

- botão para usar localização atual do navegador
- campos manuais para estado, cidade e endereço completo
- opção de converter endereço em coordenadas
- indicação clara de que a localização é opcional
- mensagem explicando que esses dados poderão ajudar em entrega, retirada e busca por profissionais próximos

## Integração com geocoding

Para começar com baixo custo, usar um serviço gratuito como Nominatim/OpenStreetMap, respeitando limites de uso.

A integração não deve ser chamada diretamente do frontend. O ideal é criar rotas internas no Next.js, por exemplo:

- `GET /api/geocode` para converter endereço em latitude/longitude
- `GET /api/reverse-geocode` para converter latitude/longitude em endereço

Essas rotas internas devem permitir aplicar cache, rate limit, tratamento de erro e troca futura de fornecedor sem alterar o frontend.

## Cuidados com API gratuita

Serviços gratuitos de geocoding podem ter limites rígidos de uso. Para evitar bloqueios:

- evitar chamadas a cada tecla digitada
- executar geocoding apenas por ação explícita do usuário
- usar debounce quando necessário
- armazenar coordenadas no banco após validação
- evitar geocodificar repetidamente o mesmo endereço
- considerar cache por endereço normalizado

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

## Decisão atual

A decisão atual é começar simples:

- salvar localização como dados opcionais no perfil profissional
- manter endereço dividido em estado, cidade e endereço completo
- salvar latitude e longitude como números
- preparar a documentação e o modelo para futura busca por proximidade
- adiar PostGIS até que a busca espacial seja realmente necessária
