// =============================================================================
// infra/vlibras-dev/services/translator-api/stub-server.js
// -----------------------------------------------------------------------------
// !!! STUB DE PROTOTIPO / NON-PRODUCTION PLACEHOLDER !!!
//
// Servidor HTTP minimo, SEM dependencias externas (apenas o modulo `http`
// nativo do Node). NAO executa a traducao real para Libras.
//
// Proposito: tornar `docker compose up` DETERMINISTICO para validar a
// topologia do Local_Dev_Environment (rede isolada, dependencias saudaveis,
// health check consumivel pelo Provider_Adapter em /healthz).
//
// A build real do servico (repositorio publico oficial LGPLv3) esta
// documentada, comentada, no Dockerfile. Ver legacy-assessment.md.
// Requirements: 9.3 (health check), 19.1, 19.4 (nao-producao).
// =============================================================================

'use strict';

const http = require('http');

const PORT = parseInt(process.env.PORT || '5000', 10);
const HEALTHCHECK_PATH = process.env.HEALTHCHECK_PATH || '/healthz';
const COMPONENT = process.env.VLIBRAS_COMPONENT || 'vlibras-translator-api';

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

  // Health check esperado pelo docker-compose e pelo Provider_Adapter.
  if (url === HEALTHCHECK_PATH || url === '/healthz' || url === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      component: COMPONENT,
      // Marcacao HONESTA: isto e um stub, nao o servico real de traducao.
      artifactKind: 'prototype-stub',
      environment: 'non-production',
      usage: 'internal-nonproduction-prototype',
      realTranslation: false,
      note:
        'Stub de prototipo nao-producao. NAO executa traducao real para Libras. ' +
        'A build do servico real esta documentada (comentada) no Dockerfile. ' +
        'Ver legacy-assessment.md.',
    });
  }

  // Qualquer outra rota: 501 explicito para nao fingir que a API real existe.
  return sendJson(res, 501, {
    status: 'not-implemented',
    component: COMPONENT,
    artifactKind: 'prototype-stub',
    message:
      'Este endpoint NAO esta implementado neste stub de prototipo. Apenas ' +
      HEALTHCHECK_PATH +
      ' responde. A API real (LGPLv3) nao foi incluida/verificada. ' +
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

// Encerramento limpo para que `docker compose down` seja rapido/terminavel.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
}
