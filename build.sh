#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ] || [ -z "${1:-}" ]; then
  echo "❌ Uso: ./build.sh <version>"
  echo "   Exemplo: ./build.sh v1.2.8"
  exit 1
fi

VERSION=$1

if [ -f .env ]; then
  set -a
  source .env
  set +a
elif [ -f .env.build ]; then
  set -a
  source .env.build
  set +a
else
  echo "❌ Arquivo .env não encontrado."
  echo "   Copie .env.example para .env e preencha os valores."
  exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ] || [ -z "${NEXT_PUBLIC_SITE_URL:-}" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e NEXT_PUBLIC_SITE_URL são obrigatórios no .env"
  exit 1
fi

echo "🔨 Building: ${DOCKER_IMAGE}:${VERSION} (linux/amd64)"
docker buildx build --platform linux/amd64 --no-cache --progress=plain \
  -t "${DOCKER_IMAGE}:${VERSION}" \
  -t "${DOCKER_IMAGE}:latest" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  --push \
  .

echo ""
echo "✅ Build + push concluídos com sucesso! A imagem foi enviada para o registry sem erros."
echo "   📦 Imagem : ${DOCKER_IMAGE}:${VERSION}"
echo "   🏷️  Latest : ${DOCKER_IMAGE}:latest"
echo "   🚀 Para atualizar a produção, rode: docker pull ${DOCKER_IMAGE}:${VERSION}"
