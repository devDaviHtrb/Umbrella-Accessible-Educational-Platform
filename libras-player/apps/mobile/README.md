# @libras/mobile

App React Native (Expo) do **Libras Translation Player**: reproduz a variante
`original` em um player de vídeo nativo (relógio mestre) com o avatar 3D de
Libras renderizado ao vivo pelo player oficial `vlibras-player-webjs` embutido
em uma `react-native-webview`, e legendas SRT como fallback.

## Importante: Expo Go NÃO funciona (use um development build)

O app depende de **módulos nativos de terceiros** — `react-native-video`
(`RCTVideo`) e `react-native-webview`. O **Expo Go não inclui** esses módulos,
então nele o app quebra com `View config not found for component RCTVideo`.

Para rodar no celular é preciso um **development build** (um app nativo que
inclui esses módulos). O caminho recomendado, sem instalar o Android SDK, é o
**EAS Build** (compila na nuvem e gera um APK). Ver a seção "Rodar no celular
com EAS Build" abaixo.

No **navegador (web)** o app roda sem build nativo (o vídeo usa `<video>` HTML),
útil para validar vídeo + legendas rapidamente.

## Executar o app

O app roda com **Expo SDK 52** (React Native 0.76, React 18.3). Os comandos são
scripts do workspace `@libras/mobile` e devem ser executados a partir da raiz do
monorepo:

```bash
# Navegador (react-native-web) — não precisa de build nativo:
npm run web -w @libras/mobile

# Metro dev server (para um development build já instalado no device/emulador):
npm run start -w @libras/mobile
```

## Rodar no celular com EAS Build

Gera um APK nativo (com vídeo + avatar) na nuvem da Expo. Não requer Android SDK
instalado localmente. Comandos a partir de `apps/mobile`:

```bash
cd apps/mobile

# 1. Instale o eas-cli (uma vez), faça login (cria/usa sua conta Expo gratuita)
npm i -g eas-cli
eas login

# 2. Vincule o projeto à sua conta (cria o projectId no app.json na 1a vez)
eas init

# 3. Gere o APK de desenvolvimento (perfil "development" do eas.json)
eas build --platform android --profile development
```

Ao terminar, o EAS mostra uma URL/QR para baixar o APK. Instale-o no celular
(precisa permitir "instalar de fontes desconhecidas"). Depois:

```bash
# Com o APK instalado, suba o Metro e abra o app pelo dev build:
npm run start -w @libras/mobile
```

No app, ajuste o campo **"Origem de dev"** para o IP do seu PC na rede
(ex.: `http://192.168.0.104:8787`) — `localhost` no celular aponta para o
próprio celular, não para o PC. Mantenha o `serve-package.mjs` rodando no PC
(ver seção do servidor abaixo) e o celular na mesma rede Wi‑Fi.

Perfis disponíveis em `eas.json`: `development` (dev client, APK),
`preview` (APK standalone, sem Metro) e `production` (app-bundle para loja).
Para um APK que roda sem o Metro conectado, use `--profile preview`.

### Emulador Android (alternativa, requer Android Studio/SDK)

Com o Android SDK instalado e um emulador aberto:

```bash
npm run android -w @libras/mobile   # ou: npx expo run:android (build local)
```

No emulador, use `http://10.0.2.2:8787` como origem de dev.
- **Web**: tecle `w`, ou use `npm run web -w @libras/mobile`.

### Entry points e build

- `index.js` é o **entry do app** (`registerRootComponent(App)` de `expo`) e é o
  `"main"` do `package.json`. Ele é propositalmente separado de `src/index.ts`,
  que é o **barrel da biblioteca** consumido pelo pipeline/`tsc`.
- `App.tsx` é a raiz do app e monta a `DemoScreen` (tarefa 10.2).
- `src/demo/DemoScreen.tsx` carrega um manifesto **schemaVersion 3** local e
  renderiza o `LibrasTranslationPlayer`. Ele depende de runtime só do app
  (`expo-asset`, `fetch` do RN), então fica **fora** do `tsc -b` da biblioteca:
  `tsconfig.json` exclui `src/demo` e o `tsconfig.app.json` o type-checa.
- `npm run build -w @libras/mobile` (`tsc -b`) continua compilando apenas a
  biblioteca em `src/` (sem `src/demo`) — o shell Expo (`App.tsx`/`index.js`) e
  a `DemoScreen` ficam fora do build do CI. Para type-check do shell + demo:
  `tsc -p tsconfig.app.json --noEmit`.

### Bundler (Metro) e o bundle do avatar

`metro.config.js` faz duas coisas relevantes:

- **Monorepo/workspaces**: adiciona a raiz do repo a `watchFolders` e resolve
  módulos também a partir do `node_modules` hoisteado na raiz.
- **Assets do avatar**: registra `.unityweb`, `.data`, `.wasm` e `.html` como
  assets para que o bundle Unity/WebGL do `vlibras-player-webjs` em
  `assets/vlibras/` (ver `app.json` → `assetBundlePatterns`) seja empacotado em
  vez de tratado como código-fonte.

O `app.json` inclui `assets/vlibras/**/*` em `assetBundlePatterns` e aplica o
plugin `react-native-video`. `react-native-webview` não exige plugin de config.

### Apontar para o pacote servido

A tela demo (tarefa 10.2) consome o pacote **schemaVersion 3** gerado pela
tarefa 11.1 e servido pelo `scripts/serve-package.mjs` (ver seção abaixo). O
bundle do avatar é empacotado localmente pelo Metro via `assets/vlibras/` e não
precisa ser servido por HTTP.

## Servir o pacote local em dev (tarefa 11.2)

A tela demo (tarefa 10.2) consome um pacote **schemaVersion 3** gerado pela
tarefa 11.1 (`runRealMediaV3` em `packages/pipeline/src/e2e/runRealMedia.ts`),
escrito em:

```
packages/pipeline/.e2e-out/media/chocolate-from-cacao/v3/
  manifest.json              (schemaVersion 3, avatarRuntime)
  original.mp4               (H.264/AAC)
  transcript.normalized.srt  (267 cues, cue final clampeado, 719 ms)
  avatar-runtime.json        (Avatar_Runtime_Config)
  checksums.sha256
```

Para servir esse diretório por HTTP durante o desenvolvimento, use o servidor
estático em Node puro (sem dependências externas):

```bash
# Gera o pacote (precisa de ffmpeg/ffprobe) — tarefa 11.1
node packages/pipeline/dist/e2e/<cli-do-harness>   # runRealMediaV3

# Serve o pacote gerado (default: .e2e-out/.../v3, porta 8787)
node apps/mobile/scripts/serve-package.mjs

# Ou aponte para outro diretório/porta:
node apps/mobile/scripts/serve-package.mjs <packageDir> <port>
PACKAGE_DIR=/abs/path PORT=8787 node apps/mobile/scripts/serve-package.mjs
```

O servidor loga a URL base e as rotas ao iniciar. Origem e rotas:

| Rota                                              | Conteúdo                                | Content-Type           |
| ------------------------------------------------- | --------------------------------------- | ---------------------- |
| `http://localhost:8787/manifest.json`             | manifesto schemaVersion 3               | `application/json`     |
| `http://localhost:8787/original.mp4`              | vídeo H.264/AAC (suporta **Range**/206) | `video/mp4`            |
| `http://localhost:8787/transcript.normalized.srt` | legendas normalizadas                   | `application/x-subrip` |
| `http://localhost:8787/avatar-runtime.json`       | `Avatar_Runtime_Config`                 | `application/json`     |
| `http://localhost:8787/checksums.sha256`          | integridade                             | `text/plain`           |
| `http://localhost:8787/vlibras/index.html`        | bundle do avatar (se presente)          | `text/html`            |

Características relevantes para o app:

- **Range requests (206 Partial Content)** em `original.mp4`, essencial para o
  streaming do vídeo nativo.
- **CORS liberado** (`Access-Control-Allow-Origin: *`) para o app/WebView
  buscarem o manifesto cross-origin em dev.
- `GET` e `HEAD`; `Cache-Control: no-store` para refletir pacotes regerados.

### Bundle do avatar

O avatar oficial (`vlibras-player-webjs`, LGPLv3) é **empacotado localmente** no
app em `apps/mobile/assets/vlibras/` (tarefa 3.1) e carregado pelo bundler do
Expo via `index.html` — ele não precisa vir deste servidor. Por conveniência ao
prototipar fora do bundler, `serve-package.mjs` também expõe esse diretório sob
`/vlibras/` quando ele existe. Os artefatos estritamente necessários daqui são
`manifest.json`, `original.mp4` e `transcript.normalized.srt`.

### Descompasso HTTP × HTTPS (a resolver na tarefa 10.2)

`HttpsTranslationPackageRepository`
(`apps/mobile/src/data/packageRepository.ts`) **exige `https://`** e resolve o
manifesto como `{baseUrl}/{mediaId}/{revision}/manifest.json`. O servidor de dev
fala **HTTP puro** e serve o manifesto na **raiz** (`/manifest.json`), portanto
ele **não** é compatível de forma direta com esse repositório — de propósito.

Este script não reescreve o repositório. Para dev local, a tela demo (tarefa
10.2) deve carregar o manifesto por um `fetch` HTTP direto à origem local (ou
via uma flag/override de origem só de dev) em vez de passar pelo
`HttpsTranslationPackageRepository`. Fechar essa lacuna é responsabilidade da
tarefa 10.2; a tarefa 11.2 apenas serve os bytes e documenta o descompasso.

## Tela demo (tarefa 10.2) e teste de ponta a ponta

`src/demo/DemoScreen.tsx` é a tela que o `App.tsx` monta. Ela:

- busca o manifesto **schemaVersion 3** por `fetch` HTTP direto à origem de dev
  (`DEV_PACKAGE_ORIGIN = http://localhost:8787`, manifesto em
  `${origin}/manifest.json`) — resolvendo o descompasso HTTP × HTTPS
  documentado na tarefa 11.2, **sem** usar o `HttpsTranslationPackageRepository`
  (que exige `https://` e o layout `{baseUrl}/{mediaId}/{revision}/`);
- reescreve as URIs do manifesto (`original.mp4` e `transcript.normalized.srt`)
  para **absolutas** na mesma origem de dev quando vierem relativas — o
  `serve-package.mjs` serve esses arquivos na raiz, então viram
  `${origin}/original.mp4` e `${origin}/transcript.normalized.srt`;
- passa o manifesto adaptado ao `LibrasTranslationPlayer` pela prop `manifest`;
- resolve o `avatarRuntime.playerBundleUri` para o bundle local do avatar
  empacotado pelo Metro via
  `Asset.fromModule(require("../../assets/vlibras/index.html")).uri`
  (`expo-asset`). O `require` de `.html` depende do `assetExts` da tarefa 10.1
  (que já inclui `html`). **Honestidade/limitação:** se o bundler não resolver o
  `.html` em algum setup, a tela cai no fallback `${origin}/vlibras/index.html`
  (o `serve-package.mjs` também expõe o bundle sob `/vlibras/`), garantindo uma
  URI para a WebView; e o próprio player cai para legendas se a WebView falhar;
- exibe estados de **carregando** e **erro**, e campos para configurar a
  **origem de dev** e o **media id** (recarrega ao confirmar/sair do campo).

Os controles de **play/pause/seek**, o **toggle do avatar** e o **fallback de
legendas** já vivem dentro do `LibrasTranslationPlayer`; a `DemoScreen` só monta
o player e permite trocar a origem/mediaId.

### Rodar de ponta a ponta

1. **Gerar o pacote** (tarefa 11.1 — precisa de `ffmpeg`/`ffprobe` no PATH).
   Produz `.e2e-out/media/chocolate-from-cacao/v3/` com `manifest.json`
   (schemaVersion 3), `original.mp4`, `transcript.normalized.srt` e
   `avatar-runtime.json`:

   ```bash
   npm run build -w @libras/pipeline
   node packages/pipeline/dist/e2e/runRealMedia.js   # runRealMediaV3
   ```

2. **Servir o pacote** por HTTP local (default: porta 8787):

   ```bash
   node apps/mobile/scripts/serve-package.mjs
   ```

3. **Iniciar o app** e abrir no web ou no emulador:

   ```bash
   npm run start -w @libras/mobile
   # tecle `w` (web) ou `a` (Android), ou:
   npm run web -w @libras/mobile
   ```

   - **Web (react-native-web)**: `http://localhost:8787` funciona direto.
   - **Android emulador**: `localhost` aponta para o próprio device; troque a
     origem na tela demo para `http://10.0.2.2:8787`.
   - **Dispositivo físico (Expo Go)**: use o IP da máquina na LAN, ex.:
     `http://192.168.x.x:8787`.

4. **Habilitar o avatar e observar o fallback.** Toque em "Avatar: desligado"
   para habilitar; a WebView carrega o player oficial `vlibras-player-webjs` e,
   a cada transição de cue, envia o texto para tradução ao vivo. Se os serviços
   online do VLibras estiverem indisponíveis (ou a WebView falhar), o player
   mantém **vídeo + legendas SRT** e mostra o aviso de indisponibilidade — o
   avatar nunca interrompe o vídeo (Requisitos 7.4, 8.4, 13.2).

> **Honestidade sobre a verificação de runtime:** abrir no emulador, a WebView
> carregar de fato o avatar Unity/WebGL e os serviços online responderem dependem
> de ambiente e rede e **não** foram verificados aqui. A tela foi montada e
> type-checada (`tsc -p tsconfig.app.json --noEmit`); `npm run build` e
> `npm run lint` do monorepo seguem verdes, com a `DemoScreen` fora do `tsc -b`
> da biblioteca.
