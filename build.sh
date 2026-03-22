#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-v1.0.0}

if [ -f .env.build ]; then
  set -a
  source .env.build
  set +a
else
  echo "❌ Arquivo .env.build não encontrado."
  echo "   Copie .env.build.example para .env.build e preencha os valores."
  exit 1
fi

echo "🔨 Building: ${DOCKER_IMAGE}:${VERSION} (linux/amd64)"
docker buildx build --platform linux/amd64 --no-cache --progress=plain \
  -t "${DOCKER_IMAGE}:${VERSION}" \
  -t "${DOCKER_IMAGE}:latest" \
  --push \
  .

echo ""
echo "✅ Build e push concluídos com sucesso!"
echo "   📦 Imagem : ${DOCKER_IMAGE}:${VERSION}"
echo "   🏷️  Latest : ${DOCKER_IMAGE}:latest"
echo "   🚀 Para atualizar a produção, rode: docker pull ${DOCKER_IMAGE}:${VERSION}"
