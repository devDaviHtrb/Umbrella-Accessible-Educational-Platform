// =============================================================================
// infra/vlibras-dev/services/text-core/stub-server.js
// -----------------------------------------------------------------------------
// !!! STUB DE PROTOTIPO / NON-PRODUCTION PLACEHOLDER !!!
//
// Servidor HTTP minimo, SEM dependencias externas (apenas o modulo `http`
// nativo do Node). NAO executa a geracao real de glosa Libras.
//
// Proposito: tornar `docker compose up` DETERMINISTICO para validar a
// topologia do Local_Dev_Environment. Responde ao /healthz.
// A build real (repositorio publico oficial) esta documentada, comentada, no
// Dockerfile. Ver legacy-assessment.md. Requirements: 19.1, 19.4.
// =============================================================================

'use strict';

const http = require('http');

const PORT = parseInt(process.env.PORT || '5001', 10);
const HEALTHCHECK_PATH = process.env.HEALTHCHECK_PATH || '/healthz';
const COMPONENT = process.env.VLIBRAS_COMPONENT || 'vlibras-text-core';

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === HEALTHCHECK_PATH || url === '/healthz' || url === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      component: COMPONENT,
      artifactKind: 'prototype-stub',
      environment: 'non-production',
      usage: 'internal-nonproduction-prototype',
      realTranslation: false,
      note:
        'Stub de prototipo nao-producao. NAO executa geracao real de glosa. ' +
        'A build do servico real esta documentada (comentada) no Dockerfile. ' +
        'Ver legacy-assessment.md.',
    });
  }

  return sendJson(res, 501, {
    status: 'not-implemented',
    component: COMPONENT,
    artifactKind: 'prototype-stub',
    message:
      'Este endpoint NAO esta implementado neste stub de prototipo. Apenas ' +
      HEALTHCHECK_PATH +
      ' responde. O servico real nao foi incluido/verificado. ' +
      'Ver legacy-assessment.md.',
  });
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(
    `[${COMPONENT}] STUB de prototipo (NAO-PRODUCAO) ouvindo em 0.0.0.0:${PORT}` +
      ` | health: ${HEALTHCHECK_PATH} | NAO executa traducao real.`
  );
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
}
