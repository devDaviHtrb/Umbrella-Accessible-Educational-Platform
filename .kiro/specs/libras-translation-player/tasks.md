# Implementation Plan: Libras Translation Player

## Overview

Este plano reflete a arquitetura ATUAL do `design.md`: o avatar 3D real de Libras é renderizado **ao vivo** pelo player oficial `vlibras-player-webjs` (Unity/WebGL, LGPLv3) embutido em uma `react-native-webview`; o player de vídeo nativo é o **relógio mestre**; o disparo do avatar ocorre por **transição de cue** do SRT normalizado; e há **fallback** para vídeo mais legenda quando a WebView ou os serviços online do VLibras falham.

A linguagem de implementação é TypeScript, conforme os contratos e exemplos do design.

Reutilização (NÃO recriar): o `packages/pipeline` já entrega `parseAndNormalizeSrt` (clamp 815400→814681, 719 ms), `inspectMedia` (ffprobe), `transcodeOriginal` (ffmpeg H.264/AAC), `createManifestWithFallback`/`writePackage` e o harness e2e `runRealMedia`. No app, já existem `data/packageRepository.ts`, `player/controller.ts`, `player/videoRefPlayer.ts` e `player/LibrasTranslationPlayer.tsx`, com `react`, `react-native`, `react-native-video`, `@types/react` e `react-native-webview@13.12.5` instalados. Este plano descreve apenas o trabalho que falta ou os ajustes sobre o que já existe, sem apagar o caminho legado (composição offline), que deixa de ser o caminho principal.

Tarefas de teste são sub-tarefas opcionais marcadas com `*` e derivam das Correctness Properties do design. Fronteiras de conformidade (player oficial sob LGPLv3, allowlist de origem, sem automatizar o VLibras Vídeo, sem Widget/Hand Talk, texto de cue apenas) estão refletidas nas tarefas da WebView, da bridge e do player.

## Tasks

- [x] 1. Atualizar tipos de domínio e manifesto para schemaVersion 3
  - [x] 1.1 Estender os contratos de domínio para o avatar em tempo real
    - Em `packages/pipeline/src/domain/types.ts` adicionar `AvatarRuntimeState` (`idle|loading|ready|translating|playing|error`), ampliar `AvatarMode` com `"realtime-webview-prototype"`, adicionar `AvatarRuntimeConfig` (`playerBundleUri`, `avatarName`, `defaultSpeed`, `requiresOnlineServices: true`, `licenseReviewId`) e manter o `index` em `TranscriptCue` conforme o design
    - Adicionar a `TranslationManifest` o `schemaVersion: 3`, `avatarRuntime?: AvatarRuntimeConfig` e restringir `variants` à variante `original`; estender `PlaybackSnapshot` com `avatarRuntimeState` e `activeCueId`; preservar os tipos legados sem removê-los
    - Adicionar as interfaces `AvatarBridge`, `CueScheduler`, `VLibrasWebPlayer` e os tipos de mensagem `AppToWebMessage`/`WebToAppMessage` do design
    - _Requirements: 1.5, 12.1, 12.4_

  - [ ]* 1.2 Escrever testes de forma dos novos tipos e type-guards
    - Validar `avatarAvailable === true` sse e somente se `avatarRuntime` válido com `licenseReviewId`; validar `schemaVersion === 3` e ausência de variante de avatar
    - _Requirements: 12.2, 12.4_

- [x] 2. Ajustar a geração de manifesto para o modelo em tempo real
  - [x] 2.1 Adicionar caminho de manifesto `realtime-webview-prototype`
    - Em `packages/pipeline/src/package/createManifest.ts` adicionar `createRealtimeManifest(original, transcriptUri, avatarRuntime | null)` que referencia só a variante original e o SRT normalizado, marca `avatarAvailable` verdadeiro sse e somente se houver `avatarRuntime` com `licenseReviewId`, e usa `avatarMode: "unavailable"` com motivo registrado quando ausente
    - Não referenciar nenhuma variante de avatar pré-renderizada; manter `createManifestWithFallback` legado intacto; escrever `avatar-runtime.json` junto ao pacote e registrar seu hash em `checksums.sha256`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 2.2 Escrever property test de disponibilidade coerente
    - **Property 7: Disponibilidade coerente**
    - **Validates: Requirements 12.2, 12.3**

  - [ ]* 2.3 Escrever property test de fallback total do pacote
    - **Property 8: Fallback total**
    - **Validates: Requirements 13.1**

- [x] 3. Empacotar o bundle oficial vlibras-player-webjs na WebView
  - [x] 3.1 Obter e incluir o bundle oficial sob LGPLv3
    - Baixar/clonar `spbgovbr-vlibras/vlibras-player-webjs` para `apps/mobile/assets/vlibras/` incluindo `vlibras-player.js`, `UnityLoader.js` e `target/` (`playerweb.data.unityweb`, `playerweb.wasm.code.unityweb`, `playerweb.wasm.framework.unityweb`, `playerweb.json`)
    - Incluir `apps/mobile/assets/vlibras/LICENSE` e um `NOTICE` com atribuição, origem (URL do repositório oficial) e aviso LGPLv3; registrar o `licenseReviewId` usado pelo `avatarRuntime`
    - _Requirements: 15.1, 18.1, 18.2, 18.3_

  - [x] 3.2 Criar a página HTML bridge que instancia o player
    - Em `apps/mobile/assets/vlibras/index.html` instanciar `new VLibras.Player({ target: { name, path } })`, chamar `load(el)` e expor a bridge `postMessage`: tratar `init`/`cue`/`pause`/`stop`/`setSpeed`/`changeAvatar` e reemitir `load`/`gloss:start`/`gloss:end`/`animation:progress`/`animation:end`/`error` para o app
    - Carregar apenas assets locais e as origens do VLibras sob allowlist; não embutir VLibras Widget nem Hand Talk; não emitir áudio
    - _Requirements: 8.1, 8.2, 8.6, 15.4_

- [x] 4. Implementar o CueScheduler dirigido pelo relógio do vídeo
  - [x] 4.1 Implementar `resolveCueAt` e `onCueChange`
    - Em `apps/mobile/src/player/cueScheduler.ts` implementar `resolveCueAt(cues, positionMs)` puro retornando o único cue com `startMs <= positionMs < endMs` ou `null`, e `onCueChange` emitindo transição somente quando o cue ativo muda a partir da posição do vídeo
    - Reposicionar coerentemente após seek; nunca redefinir a posição do vídeo
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ]* 4.2 Escrever property test de vídeo como relógio mestre
    - **Property 3: Vídeo como relógio mestre**
    - **Validates: Requirements 1.1, 1.3**

  - [ ]* 4.3 Escrever testes unitários do scheduler
    - Cobrir intervalos sem fala (`null`), transições e reposicionamento por seek
    - _Requirements: 6.3, 6.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar a AvatarBridge app↔WebView
  - [x] 6.1 Implementar a serialização e o disparo por transição de cue
    - Em `apps/mobile/src/player/avatarBridge.ts` implementar `AvatarBridge` (`init`, `sendCue`, `pause`, `stop`, `onMessage`) serializando `AppToWebMessage` via `postMessage` e desserializando `WebToAppMessage`
    - Garantir exatamente uma `sendCue` por transição de cue quando o avatar está habilitado; não disparar tradução em intervalo sem fala; derivar texto somente de cues temporizados do SRT normalizado
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 6.2_

  - [x] 6.2 Implementar `handleAvatarRuntimeFailure` (fallback de runtime)
    - Ao receber `error` da WebView, marcar `automaticAvatarAvailable=false`, manter vídeo e áudio sem interrupção e acionar legendas SRT, sem depender do avatar nem dos serviços online no playback
    - _Requirements: 7.4, 8.4, 8.5, 13.2, 13.4_

  - [ ]* 6.3 Escrever property test de disparo por transição de cue
    - **Property 4: Disparo por transição de cue**
    - **Validates: Requirements 7.1, 6.2, 6.3**

  - [ ]* 6.4 Escrever property test de fallback de runtime
    - **Property 6: Fallback de runtime**
    - **Validates: Requirements 7.4, 8.4, 13.2**

- [x] 7. Adaptar o LibrasPlayerController para a nova arquitetura
  - [x] 7.1 Reescrever a seleção de variante e o controle do avatar ao vivo
    - Em `apps/mobile/src/player/controller.ts` manter a variante `original` como única fonte de áudio/vídeo e substituir a troca de variante por `setAutomaticAvatar(enabled)` que mostra/oculta a WebView e envia `init`/`stop` à bridge preservando posição e play/pause do vídeo
    - Estender `getSnapshot` com `avatarRuntimeState` e `activeCueId`; garantir áudio só do player nativo; nunca mover o vídeo a partir do avatar
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 9.2_

  - [x] 7.2 Conectar o CueScheduler e a AvatarBridge ao controlador
    - Alimentar `resolveCueAt` com a posição do `NativeMediaPlayer` (via progress) e, em `onCueChange`, chamar `bridge.sendCue` quando habilitado; propagar `pause`/`stop`/`setSpeed` à bridge
    - _Requirements: 6.1, 6.5, 7.5, 9.1, 9.3_

  - [ ]* 7.3 Escrever property test de áudio único
    - **Property 9: Áudio único**
    - **Validates: Requirements 1.2, 8.6**

  - [ ]* 7.4 Escrever testes do controlador
    - Cobrir habilitar/desabilitar avatar sem mover o vídeo, snapshot com `activeCueId`/`avatarRuntimeState` e fallback ao erro da bridge
    - _Requirements: 2.2, 2.3, 7.4_

- [x] 8. Atualizar o componente LibrasTranslationPlayer
  - [x] 8.1 Renderizar vídeo nativo + WebView sobreposta + legendas + disclosure
    - Em `apps/mobile/src/player/LibrasTranslationPlayer.tsx` renderizar `react-native-video` como relógio mestre e uma `react-native-webview` carregando `assets/vlibras/index.html` quando o avatar está habilitado; fiar a bridge e o scheduler
    - Exibir legendas SRT e a Disclosure permanente e legível; toggle de avatar quando `avatarAvailable`; exibir aviso de indisponibilidade e legendas no Fallback; não embutir Widget/Hand Talk
    - _Requirements: 2.1, 2.4, 2.5, 8.1, 13.3, 14.1, 14.2, 15.4_

  - [ ]* 8.2 Escrever property test de disclosure
    - **Property 10: Divulgação**
    - **Validates: Requirements 14.1, 14.2**

  - [ ]* 8.3 Escrever testes do componente
    - Cobrir render do toggle, fallback com legendas e presença permanente da disclosure
    - _Requirements: 2.4, 2.5, 13.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Tornar o app executável com Expo
  - [x] 10.1 Inicializar o app Expo em apps/mobile
    - Adicionar `apps/mobile/App.tsx`, `apps/mobile/index.ts` (entry `registerRootComponent`), `apps/mobile/app.json` (ou `app.config.ts`), `apps/mobile/metro.config.js` e `apps/mobile/babel.config.js`; incluir `assets/vlibras/` no bundler e habilitar `expo start`/web/Android
    - Ajustar `package.json` do app com scripts `start`/`android`/`web` e dependências Expo necessárias, reutilizando `react-native-video` e `react-native-webview`
    - _Requirements: 1.1_

  - [x] 10.2 Implementar a tela demo com manifesto local
    - Em `apps/mobile/src/demo/DemoScreen.tsx` carregar um manifesto schemaVersion 3 local apontando `original.mp4`/`video.webm` + `transcript.normalized.srt` e `avatarRuntime` para o bundle local, renderizando `LibrasTranslationPlayer`
    - Montar a `DemoScreen` em `App.tsx` para testar play/pause/seek, toggle de avatar e fallback
    - _Requirements: 2.1, 2.2, 8.1_

- [x] 11. Produzir e servir o pacote local de teste
  - [x] 11.1 Gerar o pacote schemaVersion 3 a partir dos arquivos reais
    - Em `packages/pipeline/src/e2e/runRealMedia.ts` adicionar/ajustar um caminho que reutilize `inspectMedia`, `parseAndNormalizeSrt`, `transcodeOriginal` e `createRealtimeManifest` para emitir `original.mp4` + `manifest.json` (schemaVersion 3) + `transcript.normalized.srt` + `avatar-runtime.json` a partir de `video.webm`/`subtitles.txt`
    - Verificar 267 cues, clamp do cue final e registro dos 719 ms; falhar em qualquer violação de integridade
    - _Requirements: 3.4, 5.1, 12.1, 12.5, 12.6_

  - [x] 11.2 Servir o pacote localmente para o app em dev
    - Adicionar `apps/mobile/scripts/serve-package.mjs` (servidor estático HTTP com range requests) servindo o diretório do pacote gerado e documentar a origem usada pelo `packageRepository`
    - _Requirements: 12.5_

  - [ ]* 11.3 Escrever teste de integração com os arquivos reais
    - Verificar os 267 cues, clamp, 719 ms e geração do manifesto schemaVersion 3 com `avatarRuntime`
    - _Requirements: 3.4, 12.1_

- [x] 12. Tratamento de rede/offline/erro do avatar
  - [x] 12.1 Implementar detecção de offline e indisponibilidade de serviços
    - Em `apps/mobile/src/player/avatarRuntime.ts` mapear `error`/timeout da WebView e ausência de rede para estado `error` do avatar, acionar `handleAvatarRuntimeFailure` e informar indisponibilidade mantendo vídeo + legendas
    - Restringir a comunicação ao envio de texto de cue; aplicar allowlist de origem e HTTPS; não acessar endpoints inferidos nem automatizar o VLibras Vídeo
    - _Requirements: 8.3, 8.4, 13.2, 13.3, 15.2, 15.3, 15.5, 17.1, 17.2, 17.4_

  - [ ]* 12.2 Escrever property test de sincronização aproximada e honesta
    - **Property 5: Sincronização aproximada e honesta**
    - **Validates: Requirements 9.1, 9.3, 14.1**

  - [ ]* 12.3 Escrever property test de uso autorizado e licença
    - **Property 11: Sem automação de serviços proibidos**
    - **Validates: Requirements 15.3, 15.4, 15.5**

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos; tarefas de property test referenciam a propriedade do design e a cláusula validada.
- O caminho legado (composição offline de `prototype-avatar.mp4`, gateway/provedor e stack Docker) permanece no repositório como modo legado opcional e não é alterado por este plano.
- Reutilização: o pipeline de SRT/mídia/transcodificação e os módulos atuais do app são adaptados, não recriados.
- O bundle `vlibras-player-webjs` é LGPLv3: atribuição, NOTICE e modo de distribuição compatível são obrigatórios antes de habilitar o avatar.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.2", "4.2", "4.3", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "6.2", "6.3", "7.1"] },
    { "id": 3, "tasks": ["6.4", "7.2", "11.1"] },
    { "id": 4, "tasks": ["7.3", "7.4", "8.1", "11.2"] },
    { "id": 5, "tasks": ["8.2", "8.3", "10.1", "11.3", "12.1"] },
    { "id": 6, "tasks": ["10.2", "12.2", "12.3"] }
  ]
}
```
