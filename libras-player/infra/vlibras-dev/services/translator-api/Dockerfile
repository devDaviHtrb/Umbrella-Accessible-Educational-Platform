# =============================================================================
# infra/vlibras-dev/services/translator-api/Dockerfile
# -----------------------------------------------------------------------------
# !!! AMBIENTE NAO-PRODUCAO / NON-PRODUCTION PROTOTYPE !!!
#
# Serviço: VLibras Translator API (ponto de entrada HTTP; expõe /healthz).
# Base pública oficial: spbgovbr-vlibras/vlibras-translator-api (LGPLv3).
#
# ---------------------------------------------------------------------------
# HONESTIDADE DE ESCOPO (leia antes de assumir que a stack real sobe):
#
#   O código-fonte exato da stack legada (Ubuntu 18.04 + Node.js 10) e a
#   disponibilidade pública de imagens/artefatos NÃO estão garantidos neste
#   ambiente. A build real a partir do repositório oficial não pôde ser
#   verificada aqui. Portanto, por padrão, este Dockerfile constrói um
#   STUB DE PROTÓTIPO: um pequeno servidor HTTP que responde ao health check
#   esperado pelo docker-compose (/healthz). Isso torna `docker compose
#   build`/`up` DETERMINÍSTICO e local, sem depender de artefatos externos
#   possivelmente indisponíveis.
#
#   O STUB **NÃO** executa a tradução real para Libras. Ele existe apenas para
#   validar a topologia da stack (rede isolada, dependências, health check
#   consumível pelo Provider_Adapter). Ver legacy-assessment.md.
#
#   A seção "BUILD REAL (LEGADA)" abaixo documenta — comentada — como seria a
#   build do serviço real e por que ela permanece não-produção
#   (Requirements 19.1, 19.2, 19.3, 19.4).
# ---------------------------------------------------------------------------

# =============================================================================
# BUILD REAL (LEGADA) — DOCUMENTAÇÃO, NÃO ATIVA
# -----------------------------------------------------------------------------
# A stack original assume Ubuntu 18.04 + Node.js 10, hoje fora de suporte. Uma
# build real honesta clonaria o repositório oficial público e instalaria as
# dependências. Mantida COMENTADA porque não pôde ser verificada aqui e porque
# a modernização (Node LTS, multi-stage, pin de versões, varredura de
# vulnerabilidades) é pré-requisito antes de qualquer reconsideração de
# produção (ver legacy-assessment.md).
#
#   # Modernização mínima recomendada: Node LTS em vez de Node 10 legado.
#   FROM node:20-bookworm-slim AS legacy-real-build
#   WORKDIR /app
#   RUN apt-get update \
#    && apt-get install -y --no-install-recommends git ca-certificates curl \
#    && rm -rf /var/lib/apt/lists/*
#   # Pin por tag/commit específico após revisão de licença LGPLv3 (Req 18.1):
#   ARG VLIBRAS_TRANSLATOR_API_REF=main
#   RUN git clone --depth 1 --branch "${VLIBRAS_TRANSLATOR_API_REF}" \
#         https://github.com/spbgovbr-vlibras/vlibras-translator-api.git .
#   RUN npm ci --omit=dev || npm install --omit=dev
#   EXPOSE 5000
#   CMD ["npm", "start"]
#
# NOTA: habilitar a build real exige (a) confirmar a disponibilidade pública e
# o layout do repositório, (b) aprovação da revisão de licença LGPLv3, e (c) o
# hardening listado em legacy-assessment.md. Até lá, segue o stub.
# =============================================================================

# =============================================================================
# STUB DE PROTÓTIPO (ATIVO) — NÃO-PRODUÇÃO
# -----------------------------------------------------------------------------
# Servidor HTTP mínimo, sem dependências externas de npm, que responde ao
# health check. Usa apenas o runtime Node LTS e o módulo `http` nativo.
# =============================================================================
FROM node:20-bookworm-slim

LABEL com.vvli.environment="non-production" \
      com.vvli.usage="internal-nonproduction-prototype" \
      com.vvli.component="vlibras-translator-api" \
      com.vvli.artifact-kind="prototype-stub" \
      com.vvli.do-not-deploy-to-production="true"

# curl é usado pelo healthcheck do docker-compose (CMD-SHELL curl .../healthz).
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY stub-server.js /app/stub-server.js

# Porta interna do serviço HTTP (alinhada ao docker-compose).
ENV PORT=5000 \
    HEALTHCHECK_PATH=/healthz \
    VLIBRAS_ARTIFACT_KIND=prototype-stub
EXPOSE 5000

# Health check interno (complementa o do compose). Mantém o stub determinístico.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT}${HEALTHCHECK_PATH}" || exit 1

CMD ["node", "/app/stub-server.js"]
