# Design — Integração do Player de Libras no Umbrella

## Visão geral

Três camadas se unem em torno do modelo de dados existente do Umbrella
(`Courses → Modules → FileMetaData → {Video|RawFile|Image}`):

```
Professor (app)                Backend (Spring Boot)                 Transformer (Python)
──────────────                 ─────────────────────                ────────────────────
1. upload MP4  ───────────►  StorageController.upload
                               └─ salva Video + FileMetaData (módulo)
                               └─ dispara @Async geração de legendas ──► ProcessBuilder:
                                                                           python main.py <video> <key> <out>
                               ◄── 2 SRTs (normal, libras) ────────────────┘ (Whisper + Gemini)
                               └─ sobe SRTs ao Cloudinary + salva Subtitle(normal/libras)
                               └─ marca estado READY

Aluno (app)
──────────
3. abre aula  ───────────►  GET .../video/{id}/subtitles
                               ◄── { videoUrl, normal:{url,status}, libras:{url,status} }
   LibrasLessonPlayer:
     - <Video> MP4 (relógio-mestre, áudio)
     - caption = legenda normal (parse SRT no cliente)
     - WebView VLibras = legenda libras (fila + speed já prontos)
```

Decisão-chave (ADR-1, revisada para Docker): **worker Python separado.** O
backend roda em Docker num container só-Java (`eclipse-temurin:21-jre`), sem
Python/Whisper/ffmpeg, então `ProcessBuilder("python")` não funcionaria ali.
Instalar Whisper+torch na imagem Java a tornaria enorme (vários GB) e faria a
transcrição competir por CPU/RAM com a API. Portanto: um **serviço `transformer`
no docker-compose** (imagem Python com ffmpeg + whisper) expõe um endpoint
mínimo interno (`POST /generate`), e o backend Java o chama de forma
**assíncrona** após o upload. Isso isola o peso do Whisper e mantém a imagem
Java limpa. O endpoint é trivial e interno à rede do compose (não é uma API
pública nova do produto). O `main.py` (Whisper + 2 prompts Gemini) vira a lógica
chamada por esse endpoint, mas continua rodável como CLI para testes. Fallback:
upload manual dos 2 SRTs quando o worker não responde.

Decisão-chave (ADR-2): **reaproveitar o player de Libras já construído**
(`apps/mobile`), mas **reescrever o componente** para Expo SDK 58/RN 0.88/React
19 do `umbrellaApp`. O núcleo reaproveitado sem mudança de lógica: o
`index.html` do avatar (fila anti-sobreposição, `setSpeed`, descompressão
síncrona), o parser SRT→cues, o cueScheduler e a bridge app⇄WebView. O
componente React é portado para o design system do Umbrella.

Decisão-chave (ADR-3): **legendas como entidade própria `Subtitle`** (não como
`RawFile` genérico), para carregar `type` (normal|libras), `status`
(PROCESSING|READY|FAILED) e o vínculo com `Video`. Evolui via `ddl-auto=update`.

---

## Backend (Spring Boot)

### Modelo de dados — nova entidade `Subtitle`
Pacote `modules/storage/model` (fica junto de `Video`/`RawFile`).

```java
@Entity @Table(name = "subtitles")
class Subtitle {
  Long id;
  @Enumerated(STRING) SubtitleKind kind;      // NORMAL | LIBRAS
  @Enumerated(STRING) SubtitleStatus status;  // PROCESSING | READY | FAILED
  String url;        // URL pública do .srt no Cloudinary (quando READY)
  String fileDbId;   // public_id Cloudinary (para delete)
  @Column(columnDefinition="text") String content; // SRT inline (fallback/consulta)
  String error;      // mensagem quando FAILED
  @ManyToOne Video video;  // video_id
}
```
`SubtitleKind { NORMAL, LIBRAS }`, `SubtitleStatus { PROCESSING, READY, FAILED }`.
Repositório `SubtitleRepository extends JpaRepository<Subtitle,Long>` com
`findByVideoId(Long)` e `findByVideoIdAndKind(...)`.

### Serviço de legendas — `SubtitleGenerationService`
Pacote novo `modules/subtitle` (controller + service + infra), ou dentro de
`storage`. Responsável por orquestrar a geração.

- `@Async void generateForVideo(Long videoId)`:
  1. Cria (ou reusa) `Subtitle(NORMAL)` e `Subtitle(LIBRAS)` com `PROCESSING`.
  2. Baixa o MP4 (da `Video.url` do Cloudinary) para um arquivo temporário.
  3. `ProcessBuilder(pythonExe, mainPy, videoPath, geminiKey, outDir)` — executa
     e espera (timeout configurável). Lê stdout/stderr para log.
  4. Lê os dois SRTs gerados (`*_corrigido.srt`, `*_libras.srt`).
  5. Sobe cada SRT ao Cloudinary (resourceType raw) e preenche `url`/`fileDbId`/
     `content`; marca `READY`. Em erro: `FAILED` + `error`, sem derrubar upload.
- Precisa de `@EnableAsync` (classe de config) e um `TaskExecutor` simples.
- Config (ligação com o transformer), lida de `application.yaml`/`.env`:
  ```yaml
  transformer:
    python: ${PYTHON_BIN:python}
    script: ${TRANSFORMER_MAIN:.../transformer/main.py}
    workdir: ${TRANSFORMER_WORKDIR:...}
    timeoutSeconds: ${TRANSFORMER_TIMEOUT:1800}
  ```
  Chave Gemini: reusar `gemini.api.key` (já existe no `.env`).

### Gatilho pós-upload
Em `StorageServiceProvider.upload(...)`, após salvar um `Video` com `moduleId`
(ou um caminho dedicado para "aula"), chamar
`subtitleGenerationService.generateForVideo(video.getId())`. Como é `@Async`, o
upload retorna imediatamente (Requisito 2.1).

### Endpoints (seguem `/api/logged/storage`, `@PreAuthorize("isAuthenticated()")`)
- `GET /video/{id}/subtitles` → `VideoWithSubtitlesDto`:
  ```
  { videoId, videoUrl, duration,
    normal: { status, url } | null,
    libras: { status, url } | null }
  ```
- `POST /video/{id}/subtitles/regenerate` → redispara a geração (admin/teacher).
- `POST /video/{id}/subtitles` (fallback manual): multipart com os 2 SRTs,
  para quando o Python não está disponível (Requisito 2.6).
- DTOs `record` com `fromEntity`, no padrão do projeto.

### Conserto do upload de vídeo
Investigar e corrigir o que impede o upload hoje. Suspeitas fundamentadas:
- **Limite 10 MB** em `application.yaml`
  (`spring.servlet.multipart.max-file-size/max-request-size`) — elevar para um
  valor compatível com vídeo (ex. 500 MB) e ajustar o mesmo no proxy/Cloudinary
  se houver. (Requisito 1.3)
- **Rota divergente**: o app chama `public/storage/module/{id}` e
  `storage/upload`, mas o controller está em `/api/logged/storage`. Alinhar a
  base URL/rota de upload e a listagem de materiais por módulo que o app usa
  (`useRecordedLessons`, `useProfessorCourses`). Confirmar e corrigir a que
  estiver quebrada, sem duplicar endpoints.
- Garantir CORS/limite coerentes para dispositivo físico.

### Transformer (`transformer/main.py`)
Modificar para aceitar **argumentos de CLI** em vez de constantes fixas:
`main.py <video_path> <gemini_key> <out_dir>`. Mantém Whisper + os dois prompts.
Escreve `<base>_corrigido.srt` e `<base>_libras.srt` em `out_dir` e imprime os
caminhos no stdout (para o Java localizar). Adicionar `requirements.txt`
(openai-whisper, google-genai) e nota de ffmpeg.

---

## Frontend (`umbrellaApp`, Expo SDK 58)

### Dependências novas
- `react-native-webview` (avatar VLibras).
- Player de vídeo: `expo-video` (recomendado no SDK 58) **ou** `react-native-video`.
  Decisão: **`expo-video`**, por ser o player de 1ª classe do Expo nessa versão
  e evitar autolinking manual. (Confirmar API de posição/seek p/ relógio-mestre.)

### Assets do avatar
Copiar o bundle do avatar (o `index.html` + `vlibras-player.js` + `target/` já
desenvolvidos) para `umbrellaApp/assets/vlibras/`. Servi-lo via a mesma
abordagem já validada (o `.js`/`.html` como arquivos estáticos). Como o umbrella
não tem o `serve-package.mjs`, o bundle do avatar será carregado por uma URL
(Cloudinary ou um host estático) OU empacotado; decidir na task conforme o que
funciona no SDK 58 (o aprendizado de `apps/mobile` é que Metro recusa `.js` como
asset, então provavelmente uma URL hospedada).

### Núcleo portado de `apps/mobile` (lógica inalterada)
- `player/srt.ts` — `parseAndNormalizeSrt` (ou equivalente mínimo) para gerar
  cues da legenda normal (caption) e da legenda libras (envio ao avatar).
- `player/cueScheduler.ts` — resolve cue ativo pela posição do vídeo.
- `player/avatarBridge.ts` — serialização app⇄WebView (init/cue/setSpeed/stop,
  com reset de de-dup e a fila de cues já resolvida no `index.html`).

### Componente `LibrasLessonPlayer` (novo, com design Umbrella)
- Props: `videoUrl`, `normalSubtitleUrl`, `librasSubtitleUrl`, `playerBundleUri`,
  `avatarSpeed`.
- Layout: dentro de `ScreenContainer`/`Card`, usando `UmbrellaText`, `Colors`,
  `Spacing`, `Radius`, `IconSymbol` (padrão do `VLibrasPanel`).
- `<VideoView>` (expo-video) = relógio-mestre e única fonte de áudio.
- Caption: cue ativo da legenda **normal** sobre o vídeo.
- Avatar: `<WebView>` sobreposta carregando o bundle; recebe os cues da legenda
  **libras**; `AVATAR_ORIGIN_WHITELIST` e handlers de erro → fallback.
- Fallback: se WebView falha/indisponível, usa `VLibrasPanel` em estado
  `failed`/`unavailable` e mantém vídeo + caption (Requisito 4.6).

### Integração na tela de aula (`app/(tabs)/courses/lesson.tsx`)
- Buscar o material/vídeo da aula e, por `GET /video/{id}/subtitles`, as duas
  legendas e seus estados (hook `useLessonSubtitles`).
- Substituir o `Card` "Vídeo original" + botão "Abrir vídeo" (hoje abre no
  navegador) por `<LibrasLessonPlayer>`; manter o cabeçalho e o `VLibrasPanel`
  como invólucro de status quando apropriado.
- Estados: `PROCESSING` → indicar "gerando legendas…"; `READY` → player
  completo; `FAILED` → vídeo + aviso.
- Evoluir `hooks/use-vlibras.ts` para refletir o estado real (ready/failed) em
  vez de sempre `unavailable`.

### Upload de vídeo (conserto, sem tela nova)
- `components/professor/file-dropzone.tsx` / `utils/pick-documents.ts` /
  `constants/material-files.ts`: restringir vídeos a **somente MP4**
  (`video/mp4`, extensão `.mp4`) na validação (Requisito 1.1).
- `useProfessorCourses.createMaterial`: garantir `resourceType=video`,
  `moduleId`, multipart e `onUploadProgress` corretos contra a rota real do
  backend corrigida. Mensagens de erro claras (Requisito 1.4).

---

## Fluxos e invariantes

- **Relógio-mestre**: o vídeo dita a posição; `cueScheduler.update(pos)` resolve
  o cue; o avatar só reage. Nunca o avatar move o vídeo (Requisito 4.4).
- **Áudio único**: só o `<VideoView>`; a WebView não emite som (Requisito 4.5).
- **Assíncrono + estados**: upload responde na hora; legendas transitam
  `PROCESSING → READY/FAILED`; o app faz polling leve ou re-fetch ao focar.
- **Não regressão**: entidades novas só adicionam colunas/tabelas; rotas novas
  não colidem com as existentes.

## Riscos e honestidade

- **Whisper é pesado** (modelo ~500 MB, minutos de CPU). Em produção/Docker isso
  é problemático; aqui é aceitável para demo. Documentado. Alternativa futura:
  mover a transcrição para um worker dedicado.
- **Bundle do avatar no SDK 58**: a forma de servir o `.js`/`.html` pode exigir
  host externo (como já aprendido). A task validará em runtime.
- **expo-video vs react-native-video**: se a API de posição do expo-video não
  der o controle de relógio-mestre necessário, cair para react-native-video.
- **Subprocesso Python a partir do Java**: caminhos, encoding e ambiente variam
  por SO; toda a ligação é configurável e falha de forma controlada.
```
