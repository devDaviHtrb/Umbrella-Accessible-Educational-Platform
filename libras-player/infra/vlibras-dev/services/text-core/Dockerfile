# =============================================================================
# infra/vlibras-dev/services/text-core/Dockerfile
# -----------------------------------------------------------------------------
# !!! AMBIENTE NAO-PRODUCAO / NON-PRODUCTION PROTOTYPE !!!
#
# Serviço: VLibras Text Core (tradução Português -> glosa Libras).
# Base pública oficial: spbgovbr-vlibras/vlibras-translator-text-core.
#
# ---------------------------------------------------------------------------
# HONESTIDADE DE ESCOPO:
#   O código-fonte exato da stack legada (Ubuntu 18.04 + Node.js 10) e a
#   disponibilidade de artefatos NÃO estão garantidos e não puderam ser
#   verificados aqui. Por padrão, este Dockerfile constrói um STUB DE
#   PROTÓTIPO (servidor HTTP mínimo que responde /healthz) para tornar
#   `docker compose build`/`up` determinístico. O STUB **NÃO** executa a
#   geração real de glosa. Ver legacy-assessment.md.
#   (Requirements 19.1, 19.2, 19.3, 19.4.)
# ---------------------------------------------------------------------------

# =============================================================================
# BUILD REAL (LEGADA) — DOCUMENTAÇÃO, NÃO ATIVA
# -----------------------------------------------------------------------------
#   # Modernização mínima recomendada: Node LTS em vez de Node 10 legado.
#   FROM node:20-bookworm-slim AS legacy-real-build
#   WORKDIR /app
#   RUN apt-get update \
#    && apt-get install -y --no-install-recommends git ca-certificates curl \
#    && rm -rf /var/lib/apt/lists/*
#   # Pin por tag/commit após revisão de licenças (modelos/dicionários, Req 18.2):
#   ARG VLIBRAS_TEXT_CORE_REF=main
#   RUN git clone --depth 1 --branch "${VLIBRAS_TEXT_CORE_REF}" \
#         https://github.com/spbgovbr-vlibras/vlibras-translator-text-core.git .
#   RUN npm ci --omit=dev || npm install --omit=dev
#   EXPOSE 5001
#   CMD ["npm", "start"]
#
# NOTA: dicionários/modelos linguísticos exigem revisão de licenças e permissões
# próprias (Req 18.2) e o hardening de legacy-assessment.md. Até lá, segue o stub.
# =============================================================================

# =============================================================================
# STUB DE PROTÓTIPO (ATIVO) — NÃO-PRODUÇÃO
# =============================================================================
FROM node:20-bookworm-slim

LABEL com.vvli.environment="non-production" \
      com.vvli.usage="internal-nonproduction-prototype" \
      com.vvli.component="vlibras-text-core" \
      com.vvli.artifact-kind="prototype-stub" \
      com.vvli.do-not-deploy-to-production="true"

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY stub-server.js /app/stub-server.js

ENV PORT=5001 \
    HEALTHCHECK_PATH=/healthz \
    VLIBRAS_COMPONENT=vlibras-text-core \
    VLIBRAS_ARTIFACT_KIND=prototype-stub
EXPOSE 5001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT}${HEALTHCHECK_PATH}" || exit 1

CMD ["node", "/app/stub-server.js"]
