# =============================================================================
# infra/vlibras-dev/services/video-core/Dockerfile
# -----------------------------------------------------------------------------
# !!! AMBIENTE NAO-PRODUCAO / NON-PRODUCTION PROTOTYPE !!!
#
# Serviço: VLibras Video Core (geração/composição do avatar 3D).
#
# NOTA DE CONFORMIDADE: este core local faz parte do protótipo auto-hospedado
# e isolado. NÃO automatiza o serviço público "VLibras Vídeo" (Requirement 15.3)
# nem incorpora Widget/Hand Talk em WebView (Requirement 15.4).
#
# ---------------------------------------------------------------------------
# HONESTIDADE DE ESCOPO:
#   O código-fonte exato, os avatares/modelos 3D e a disponibilidade de
#   artefatos NÃO estão garantidos e não puderam ser verificados aqui. A
#   renderização real de avatar exige toolchain pesada (ex.: engine 3D/GPU) e
#   ativos licenciados. Por padrão, este Dockerfile constrói um STUB DE
#   PROTÓTIPO (servidor HTTP mínimo que responde /healthz) para tornar
#   `docker compose build`/`up` determinístico. O STUB **NÃO** renderiza avatar.
#   Ver legacy-assessment.md. (Requirements 19.1, 19.2, 19.3, 19.4.)
# ---------------------------------------------------------------------------

# =============================================================================
# BUILD REAL (LEGADA) — DOCUMENTAÇÃO, NÃO ATIVA
# -----------------------------------------------------------------------------
#   # A renderização real tende a exigir base com dependências gráficas/3D,
#   # ativos de avatar licenciados (Req 18.2) e, possivelmente, GPU. Isto NÃO é
#   # um `npm start` trivial e permanece não-produção até o hardening completo.
#   FROM node:20-bookworm-slim AS legacy-real-build
#   WORKDIR /app
#   RUN apt-get update \
#    && apt-get install -y --no-install-recommends git ca-certificates curl \
#       # + toolchain de renderização (engine 3D / libs gráficas) conforme o
#       #   serviço real exigir — a confirmar na modernização.
#    && rm -rf /var/lib/apt/lists/*
#   ARG VLIBRAS_VIDEO_CORE_REF=main
#   # Clonar o repositório público do Video Core após confirmar disponibilidade
#   # e revisão de licenças de código E de ativos (avatares/modelos, Req 18.2).
#   # RUN git clone --depth 1 --branch "${VLIBRAS_VIDEO_CORE_REF}" <repo-publico> .
#   # RUN npm ci --omit=dev || npm install --omit=dev
#   EXPOSE 5002
#   CMD ["npm", "start"]
#
# NOTA: habilitar a build real exige confirmar o repositório/ativos públicos,
# aprovar revisões de licença (código e avatares/modelos) e o hardening de
# legacy-assessment.md. Até lá, segue o stub.
# =============================================================================

# =============================================================================
# STUB DE PROTÓTIPO (ATIVO) — NÃO-PRODUÇÃO
# =============================================================================
FROM node:20-bookworm-slim

LABEL com.vvli.environment="non-production" \
      com.vvli.usage="internal-nonproduction-prototype" \
      com.vvli.component="vlibras-video-core" \
      com.vvli.artifact-kind="prototype-stub" \
      com.vvli.do-not-deploy-to-production="true"

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY stub-server.js /app/stub-server.js

ENV PORT=5002 \
    HEALTHCHECK_PATH=/healthz \
    VLIBRAS_COMPONENT=vlibras-video-core \
    VLIBRAS_ARTIFACT_KIND=prototype-stub
EXPOSE 5002

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT}${HEALTHCHECK_PATH}" || exit 1

CMD ["node", "/app/stub-server.js"]
