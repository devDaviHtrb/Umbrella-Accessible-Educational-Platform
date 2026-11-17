# Integração do Player de Libras no Umbrella — como roda

Une três peças: **upload de vídeo** (consertado), **geração automática de
legendas** (normal + Libras) e o **player acessível** na tela de aula do app.

## Visão geral do fluxo

```
Professor → app (upload MP4) → backend salva Video (Cloudinary)
                                 └─ após commit, @Async →
                                    worker transformer (Docker, Python)
                                      baixa MP4 → Whisper (transcrição PT)
                                      → Gemini (legenda normal + legenda Libras)
                                    ← backend salva 2x Subtitle (READY)
Aluno → app abre aula → GET /video/{id}/subtitles
       LibrasLessonPlayer: vídeo (expo-video) + caption (legenda normal)
                           + avatar VLibras em WebView (legenda Libras)
```

## Componentes

### Backend (`backend/umbrella_api`, Spring Boot)
- Entidade `Subtitle` (`NORMAL`/`LIBRAS`, `PROCESSING`/`READY`/`FAILED`),
  ligada a `Video`. Schema criado automaticamente (ddl-auto=update).
- `SubtitleGenerationService` (`@Async`): após o upload do vídeo, chama o worker
  `transformer` (`POST /generate`) e salva os 2 SRTs. Em erro → `FAILED`.
- Endpoints (em `/api/logged/storage`):
  - `GET /video/{id}/subtitles` — vídeo + 2 legendas + estados (app).
  - `POST /video/{id}/subtitles/regenerate` — redispara a geração.
  - `POST /video/{id}/subtitles?normal=..&libras=..` — fallback manual.
  - `GET /module/{moduleId}` — lista materiais (corrigia o upload quebrado).
- Bundle do avatar servido em `/vlibras/index.html` (static), liberado no
  `SecurityConfig`.
- Limite de upload elevado para 512MB (`application.yaml`).

### Worker (`backend/umbrella_api/transformer`, Python)
- `subtitle_core.py` — Whisper (transcrição) + 2 prompts Gemini (lógica).
- `server.py` — worker HTTP (`/generate`, `/health`) chamado pelo backend.
- `main.py` — CLI equivalente, para teste manual.
- `Dockerfile` — Python 3.11 + ffmpeg + whisper/torch + fastapi.
- Serviço `transformer` no `docker-compose.yml`.

### Frontend (`frontend/umbrellaApp`, Expo SDK 58)
- `components/recorded/libras-player/` — `LibrasLessonPlayer` (expo-video +
  WebView) e o núcleo portado (`srt`, `cueScheduler`, `avatarBridge`).
- `hooks/api/courses/useLessonSubtitles.ts` — busca vídeo+legendas com polling.
- `app/(tabs)/courses/lesson.tsx` — player embutido no lugar de "Abrir vídeo".
- Upload de vídeo (fluxo do professor) corrigido: rotas `logged/storage/*`.

## Pré-requisitos

- **Docker + Docker Compose** (backend, postgres e worker sobem juntos).
- **Chave Gemini** em `backend/umbrella_api/.env` (`GEMINI_API_KEY`) — já
  presente; troque pela sua se necessário.
- A primeira build do worker baixa **torch + modelo Whisper** (vários GB) — é
  demorada. A transcrição de cada vídeo leva **minutos** e usa bastante CPU.

## Como rodar

### 1. Backend + worker (Docker)
```
cd Umbrella-Accessible-Educational-Platform/backend/umbrella_api
docker compose up --build
```
Sobe `app` (8080), `postgres` (5432) e `transformer` (8000). A primeira vez
demora pela build do worker.

Teste o worker: `GET http://localhost:8000/health` → `{"status":"ok"}`.

### 2. App (Expo)
```
cd Umbrella-Accessible-Educational-Platform/frontend/umbrellaApp
npx expo start
```
Confirme em `.env` a `EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL` apontando para o IP
da máquina do backend (ex. `http://192.168.0.x:8080/api/`), para o celular
alcançar o backend e o bundle do avatar (`/vlibras/index.html`).

### 3. Fluxo ponta a ponta
1. Como professor, envie um **MP4** numa aula/módulo.
2. O backend dispara a geração; as legendas ficam `PROCESSING`.
3. Abra a aula no app: a tela mostra "Preparando acessibilidade" e atualiza
   sozinha quando as legendas ficarem `READY`.
4. O player reproduz o vídeo com a **caption** (legenda normal) e o **avatar**
   VLibras (legenda Libras).

## Limitações e honestidade

- **Desempenho do Whisper**: a transcrição é o gargalo (minutos/vídeo, CPU
  alta). O modelo é `small`; trocar por `base`/`tiny` acelera com menos
  qualidade (editar `subtitle_core._get_model`).
- **Avatar VLibras (Unity/WebGL)** depende dos serviços online do VLibras e da
  capacidade da WebView do aparelho; se falhar, o player cai para
  "vídeo + caption" automaticamente.
- **Sincronia do avatar é aproximada** (latência de tradução ao vivo), com fila
  anti-sobreposição e velocidade ajustável (`avatarSpeed`).
- **Legendas guardadas inline** (`Subtitle.content`); publicar no Cloudinary é
  uma extensão futura (campos `url`/`fileDbId` já existem).

## Verificação feita

- Backend: `mvnw compile` OK (todas as classes novas compilam).
- Frontend: `tsc --noEmit` sem erros nos arquivos da integração (erros
  remanescentes são pré-existentes em telas não tocadas).
- NÃO verificado em runtime nesta etapa: a execução real do Whisper no Docker e
  a renderização do avatar Unity no dispositivo (dependem de ambiente/hardware).
