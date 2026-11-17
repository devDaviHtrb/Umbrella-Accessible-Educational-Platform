# Tarefas — Integração do Player de Libras no Umbrella

## Fase 0 — Investigação e conserto do upload (desbloqueio)

- [x] 0.1 Mapear a rota real de upload/listagem que o app usa vs. o backend
  - DIAGNÓSTICO (causa do upload quebrado): o app chamava `storage/upload`
    (→ `/api/storage/upload`) e `public/storage/module/{id}`, mas o controller
    está em `/api/logged/storage` e NÃO expunha a listagem por módulo. Rotas
    erradas → upload 404 e vídeos nunca apareciam.
  - _Requisitos: 1.2, 1.5, 6.1_
- [x] 0.2 Elevar limite de upload no backend
  - `application.yaml`: 10MB → 512MB (file) / 520MB (request).
  - _Requisitos: 1.3_
- [x] 0.3 Consertar o upload de vídeo ponta a ponta (sem tela nova)
  - Backend: adicionado `GET /api/logged/storage/module/{moduleId}` expondo
    `getFilesByModuleId`. Front: rotas corrigidas para `logged/storage/upload`
    e `logged/storage/module/{id}` em useProfessorCourses, useRecordedLessons,
    useModuleMaterials e useUser (com fallback legado). Limite de vídeo no app
    elevado para 512MB (casando com o backend).
  - _Requisitos: 1.2, 1.4, 1.5_

## Fase 1 — Transformer (Python por CLI)

- [x] 1.1 Parametrizar `transformer/main.py` por argumentos
  - `main.py <video_path> <gemini_key> <out_dir>`; sem constantes fixas;
    stdout `NORMAL_SRT=`/`LIBRAS_SRT=` (caminhos absolutos); erro → stderr +
    exit != 0; logs do processo vão para stderr (não poluem o contrato stdout).
  - _Requisitos: 2.2, 2.3, 2.7_
- [x] 1.2 `requirements.txt` + nota de pré-requisitos (ffmpeg, whisper)
  - _Requisitos: 5.3_

## Fase 2 — Backend: entidade e geração de legendas

DECISÃO Docker (revisada): em vez de subprocesso no container Java (sem Python)
ou inchar a imagem Java com torch, criei um **serviço `transformer` separado**
no docker-compose (imagem Python + ffmpeg + whisper) com um endpoint interno
`POST /generate`. O backend o chama assíncrono. Respeita "automatizado"; a
"API" é um worker interno trivial, não uma API pública do produto.

- [x] 2.1 Entidade `Subtitle` + enums + `SubtitleRepository`
  - `SubtitleKind{NORMAL,LIBRAS}`, `SubtitleStatus{PROCESSING,READY,FAILED}`,
    `Subtitle` (kind/status/url/fileDbId/content/error/@ManyToOne Video),
    `SubtitleRepository` com `findByVideoId`/`findByVideoIdAndKind`.
  - _Requisitos: 3.1, 6.2_
- [x] 2.2 Config de async + propriedades do transformer
  - `@EnableAsync` na app; `TransformerProperties` (`transformer.*` com
    defaults); chave Gemini reusada de `GeminiData.api().key()`.
  - _Requisitos: 2.1, 2.7, 5.1, 5.2_
- [x] 2.3 `SubtitleGenerationService.generateForVideo` (@Async)
  - Marca 2 legendas PROCESSING; chama o worker (`WebClient POST /generate`
    com videoUrl+geminiKey, timeout); salva READY com SRT inline; em erro marca
    FAILED (sem derrubar upload). Worker Python (server.py/subtitle_core.py)
    baixa o MP4, Whisper + Gemini, devolve os 2 SRTs.
  - _Requisitos: 2.1–2.6, 3.1_
- [x] 2.4 Gatilho pós-upload em `StorageServiceProvider.upload`
  - Após salvar `Video`, agenda `generateForVideo` via
    `TransactionSynchronization.afterCommit` (worker vê a linha commitada).
  - _Requisitos: 2.1_
- [x] 2.5 Endpoints de legenda
  - `GET /video/{id}/subtitles` (`VideoWithSubtitlesDto`);
    `POST /video/{id}/subtitles/regenerate`; `POST /video/{id}/subtitles`
    (fallback manual: normal+libras). Todos `@PreAuthorize("isAuthenticated()")`.
  - _Requisitos: 3.2, 3.3, 3.4, 2.6_
- [x] 2.6 Worker Python + Docker
  - `transformer/{subtitle_core,server,main}.py` + `requirements.txt` +
    `Dockerfile`; serviço `transformer` no docker-compose; `transformer.*` em
    `application.yaml`/`.env`.
  - _Requisitos: 2.3, 5.1, 5.2_

## Fase 3 — Frontend: dependências e núcleo portado

- [x] 3.1 Instalar `react-native-webview` e `expo-video` no `umbrellaApp`
  - `npx expo install` ok; config plugin `expo-video` adicionado.
  - _Requisitos: 4.1, 4.3_
- [x] 3.2 Servir o bundle do avatar pelo backend
  - DECISÃO: em vez de empacotar no app (Metro recusa `.js` como asset),
    o bundle vai em `backend/.../resources/static/vlibras/` e é servido pelo
    Spring em `{origin}/vlibras/index.html` (liberado no SecurityConfig).
  - _Requisitos: 4.3_
- [x] 3.3 Portar núcleo de lógica (SRT parse, cueScheduler, avatarBridge)
  - `components/recorded/libras-player/{srt,cueScheduler,avatarBridge}.ts`.
  - _Requisitos: 4.2, 4.3, 4.4_

## Fase 4 — Frontend: player e integração na aula

- [x] 4.1 Componente `LibrasLessonPlayer` com design Umbrella
  - `expo-video` (relógio-mestre, 50ms) + caption (legenda normal) + WebView
    avatar (legenda libras, reenvio no load, setSpeed) + fallback;
    `Card/UmbrellaText/Colors/Spacing/IconSymbol`.
  - _Requisitos: 4.1–4.7_
- [x] 4.2 Hook `useLessonSubtitles` (busca vídeo + legendas + estados)
  - `GET logged/storage/video/{id}/subtitles`; polling enquanto PROCESSING.
  - _Requisitos: 3.2, 3.3, 4.7_
- [x] 4.3 Integrar em `app/(tabs)/courses/lesson.tsx`
  - Player embutido no lugar de "Abrir vídeo"; estados loading/PROCESSING;
    `VLibrasPanel` reflete o estado real da legenda Libras. `videoId` propagado
    via params (recorded.tsx) e DTO (`FileMetaDataResponseDto.videoId`).
  - _Requisitos: 4.1, 4.6, 4.7_

## Fase 5 — Upload: somente MP4

- [x] 5.1 Restringir seleção de vídeo a MP4 no app
  - `constants/material-files.ts`: regra `videos` já era `mp4`/`video/mp4`
    apenas (mantida). Limite de vídeo elevado para 512MB (casa com o backend).
  - _Requisitos: 1.1_

## Fase 6 — Configuração, docs e verificação

- [x] 6.1 `.env`/`application.yaml`: ligar backend ⇄ transformer ⇄ Gemini
  - `transformer.baseUrl`/`timeoutSeconds` em yaml; `TRANSFORMER_BASE_URL`/
    `TRANSFORMER_TIMEOUT` no `.env`; `GEMINI_API_KEY` reusada pelo worker
    (env_file no compose). Worker acessível em `http://transformer:8000`.
  - _Requisitos: 5.1, 5.2, 5.4_
- [x] 6.2 Documentação de execução ponta a ponta
  - `README-integracao.md`: fluxo, componentes, pré-requisitos, como rodar
    (docker compose + expo), limitação do Whisper e do avatar.
  - _Requisitos: 5.3_
- [x] 6.3 Verificação
  - Backend `mvnw compile` OK; frontend `tsc --noEmit` sem erros nos arquivos
    da integração (restantes são pré-existentes). NÃO verificado em runtime:
    Whisper no Docker e avatar Unity no dispositivo (dependem de ambiente).
  - _Requisitos: todos_

## Notas
- Ordem recomendada: Fase 0 (desbloqueio) → 1 → 2 → 5 (rápida) → 3 → 4 → 6.
- Riscos ativos: Whisper pesado; forma de servir o bundle do avatar no SDK 58;
  expo-video vs react-native-video; subprocesso Python multiplataforma.
