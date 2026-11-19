# � Umbrella — Plataforma Educacional Acessível

> **Educação para todos, sem barreiras.**

Umbrella é uma plataforma educacional construída para promover inclusão, acessibilidade e aprendizado personalizado para pessoas com deficiências sensoriais, motoras e neurodivergências.

Com abordagem _mobile-first_, a Umbrella reúne recursos de acessibilidade, ensino online (cursos, módulos, atividades e aulas gravadas), mensagens em tempo real e um tutor de IA numa experiência única para **alunos** e **professores**.

---

## 📑 Sumário

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack de tecnologias](#-stack-de-tecnologias)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Arquitetura do backend](#-arquitetura-do-backend)
- [Arquitetura do frontend](#-arquitetura-do-frontend-umbrellaapp)
- [Pipeline do VLibras](#-pipeline-do-vlibras-tradução-em-libras)
- [Como rodar](#️-como-rodar)
- [Configuração de ambiente](#-configuração-de-ambiente)
- [Apresentação / demo por túnel](#-apresentação--demo-por-túnel)
- [Perfis e papéis de usuário](#-perfis-e-papéis-de-usuário)
- [Camada de acesso a dados (Spring Data JPA)](#️-camada-de-acesso-a-dados-spring-data-jpa)
- [Equipe](#-equipe)
- [Status](#-status)

---

## 🔭 Visão geral

Muitos sistemas educacionais ainda deixam de lado estudantes com diferentes necessidades físicas, sensoriais ou cognitivas. A Umbrella nasceu para mudar isso: tornar o aprendizado mais adaptável, mais humano e mais acessível para todos.

A plataforma tem dois lados:

- **Área do aluno** — descobre e se matricula em cursos, acompanha módulos e atividades, assiste a aulas gravadas (com apoio em Libras), conversa por mensagens e usa o tutor de IA.
- **Área do professor** — cria e gerencia cursos (com capa/foto), módulos, materiais, atividades e questões; acompanha alunos matriculados; corrige entregas **questão por questão**; e publica aulas gravadas.

---

## 🚀 Funcionalidades

### 🎓 Ensino

- Catálogo de cursos com busca, categorias e matrícula
- Cursos com **capa/imagem** (upload via Cloudinary)
- Módulos, materiais de apoio (documentos, slides, imagens, planilhas, vídeos)
- Atividades do tipo **quiz** (múltipla escolha) e **entrega/discursiva**
- **Aulas gravadas** — o professor envia videoaulas (inclusive em Libras) vinculadas a um módulo
- Agenda de estudos com lembretes e eventos

### 👩‍🏫 Área do professor

- Criação e edição de cursos, módulos, materiais e atividades
- Construtor de questões (alternativas de múltipla escolha ou questão discursiva)
- **Lista de alunos matriculados** por curso
- **Correção questão por questão**: vê a resposta de cada aluno, marca certo/errado, atribui nota por questão e o total é somado automaticamente
- Criação de categorias de curso

### ♿ Acessibilidade em primeiro lugar

- Modo de alto contraste e ajustes de aparência
- Fontes e tamanhos de interface personalizáveis
- Leitura em voz alta (text-to-speech) do conteúdo das telas
- Filtros para **daltonismo** (color-blind)
- Integração com **VLibras** (tradução para Libras) nas aulas gravadas

### 🤖 Tutor de IA

- Conversa com tutor baseado em **Google Gemini**
- Histórico de conversas por aluno
- Suporte de estudo personalizado

### 💬 Comunicação

- Mensagens em tempo real via **WebSocket (STOMP)**
- Conversas por curso e conversas pessoais (aluno ↔ professor / instrutores)
- Histórico de conversas persistido (consultável ao reabrir a conversa)
- Indicador de status de conexão e reconexão automática
- **Notificações** in-app e **push** no celular (via Expo push token)

---

## 🧱 Stack de tecnologias

### Backend

- **Java 21** + **Spring Boot 3.5**
- Spring Web, Spring WebFlux, **Spring Security** (JWT via `jjwt`)
- **Spring Data JPA** / Hibernate
- **Spring WebSocket** (mensageria STOMP)
- **Cloudinary** (armazenamento de imagens/vídeos)
- **springdoc-openapi** (Swagger UI)
- Bancos: **PostgreSQL** (produção) e **H2 em memória** (desenvolvimento/demo)
- Build: **Maven** (wrapper `mvnw` incluído)

### Frontend (`umbrellaApp`)

- **React Native** com **Expo (SDK 57/58)** e **Expo Router**
- **TypeScript**
- **axios** para a API REST
- Cliente **STOMP/WebSocket** próprio (sem libs externas) para o chat
- **expo-image-picker**, **expo-document-picker**, **expo-speech**, entre outros
- Alvos: **Android, iOS e Web**

### Integrações / IA

- **Google Gemini** (tutor de IA)
- **VLibras** (avatar de Libras)

---

## 📁 Estrutura do projeto

```
Umbrella-Accessible-Educational-Platform/   (raiz)
├── backend/
│   └── umbrella_api/              API Spring Boot (Java 21)
│       ├── src/main/java/com/umbrella_api/
│       │   ├── common/            config (CORS, Security, WebSocket), segurança, infra
│       │   └── modules/           módulos de domínio (ver abaixo)
│       ├── src/main/resources/    application.yaml e perfis (h2/postgres/prod)
│       ├── pom.xml
│       ├── mvnw / mvnw.cmd         Maven wrapper
│       ├── docker-compose.yml
│       └── dockerfile
├── frontend/
│   ├── umbrellaApp/               App Expo/React Native (aluno e professor)
│   │   ├── app/                   rotas (Expo Router): (tabs), professor/, login, signup
│   │   ├── components/            UI, cursos, professor, mensagens, tutor, acessibilidade
│   │   ├── hooks/                 hooks de API, auth, preferências, chat
│   │   ├── services/              axios + socket do chat
│   │   ├── constants/ types/ utils/
│   │   └── .env                   configuração da URL da API
│   └── umbrellaWeb/               (web)
├── docs/                          documentação e diagramas
├── libras-player/                 protótipo standalone do player de Libras (referência)
├── start-demo.bat / stop-demo.bat scripts de apresentação (túnel Cloudflare)
├── start-demo.ps1 / run-backend.ps1 / run-frontend.ps1
└── README.md
```

---

## 🏗 Arquitetura do backend

O backend é organizado por **módulos de domínio** em `com.umbrella_api.modules`. Abaixo estão **todos** os módulos existentes:

| Módulo           | Base de rota                | Responsabilidade                                                                                                                 |
| :--------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **auth**         | `/api/auth`                 | Registro e login com **JWT**. O registro aceita o campo `role`.                                                                  |
| **user**         | `/api/public/users`         | Perfil e dados do usuário.                                                                                                       |
| **course**       | `/api/public/courses`       | Cursos, módulos, matrículas, categorias (subjects) e listagem de alunos matriculados.                                            |
| **activity**     | `/api/public/courses/...`   | Atividades, questões, alternativas (múltipla escolha) e redações (discursivas).                                                  |
| **submissions**  | `/api/public/courses/...`   | Entregas dos alunos e respostas por questão — base da **correção questão por questão**.                                          |
| **ai** (tutor)   | `/api/public/tutor`         | Tutor de IA com **Google Gemini**, criação de chats e histórico de conversas.                                                    |
| **schedule**     | `/api/schedule`             | Agenda: eventos, aulas, lembretes e vínculos usuário↔evento.                                                                     |
| **storage**      | `/api/logged/storage`       | Upload e consulta de arquivos (imagens, vídeos, documentos) via Cloudinary.                                                      |
| **message**      | `/api/logged/messages`      | **Histórico** de mensagens persistidas (pessoais e por curso); o envio em tempo real é pelo WebSocket.                           |
| **notification** | `/api/logged/notifications` | Notificações in-app (listar, contagem de não lidas, marcar lida/todas) e registro de **Expo push token** para notificações push. |
| **FileDb**       | —                           | Integração de baixo nível com o **Cloudinary** (upload/exclusão de recursos). Sem endpoints REST próprios.                       |
| **utils**        | —                           | Utilitários internos, incluindo um `WebClient` para chamadas HTTP externas (ex.: Gemini). Sem endpoints REST.                    |

### Pacote `common` (infraestrutura transversal)

| Subpacote           | Conteúdo                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------------ |
| `common/config`     | Configurações de **CORS**, **Spring Security** e **WebSocket (STOMP)**.                                             |
| `common/security`   | Filtro e serviço de **JWT**, `CustomUserDetails` e `CustomUserDetailsService`.                                      |
| `common/WebSocket`  | Interceptador de autenticação do WebSocket (valida o JWT no handshake STOMP).                                       |
| `common/infra`      | Tratador global de exceções (`GlobalExceptionHandler`) e `Scheduler` (tarefa agendada que limpa eventos expirados). |
| `common/dto`        | DTOs genéricos de resposta (`GenericResponse`, `ExceptionResponse`).                                                |
| `common/Exceptions` | Exceções de domínio (ex.: `FileStorageException`).                                                                  |

> **Mensageria em tempo real:** o chat usa o endpoint STOMP `/ws` (SockJS). O envio é por WebSocket e o histórico é consultado pelo módulo **message**.

> **Documentação da API:** com o backend no ar, a UI do Swagger fica disponível em `/swagger-ui/index.html` e o OpenAPI JSON em `/v3/api-docs` (springdoc-openapi).

---

## 📱 Arquitetura do frontend (`umbrellaApp`)

App **Expo / React Native** em **TypeScript**, com roteamento por arquivos (**Expo Router**) e alvos Android, iOS e Web. A organização por pastas:

### Rotas (`app/`) — Expo Router

| Caminho                            | Descrição                                                                                                 |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `app/_layout.tsx`                  | Layout raiz: provedores (auth, preferências, chat), tema e fontes.                                        |
| `app/login.tsx`, `app/signUp.tsx`  | Autenticação (entrar e cadastrar).                                                                        |
| `app/(tabs)/`                      | Área do **aluno** em abas: início/painel, cursos, agenda, tutor, ajustes.                                 |
| `app/(tabs)/courses/`              | Catálogo, detalhe do curso, aula gravada, mensagens e chat, atividade.                                    |
| `app/professor/`                   | Área do **professor**: lista de cursos, criar curso, aulas gravadas, tutor, ajustes.                      |
| `app/professor/course/[courseId]/` | Visão geral do curso e telas de módulos, materiais, atividades, questões, **alunos & entregas** e edição. |

### Componentes (`components/`)

| Pasta                             | Conteúdo                                                                                                                                              |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/`                             | Biblioteca base: botões, cartões, campos, badges, modal, texto, ícones.                                                                               |
| `layout/`                         | Cabeçalho, barra inferior, container de tela, leitura em voz alta, logo, filtros de daltonismo.                                                       |
| `courses/`                        | Cartão de curso, hero, acordeão de módulos, grade de materiais.                                                                                       |
| `professor/`                      | Formulários de curso/módulo/material/atividade, construtor de questões, linha de aluno, **correção questão por questão**, formulário de aula gravada. |
| `messages/`                       | Bolha de mensagem, linha de conversa, badge de conexão.                                                                                               |
| `tutor/`                          | Chat do tutor de IA, cabeçalho, histórico de conversas.                                                                                               |
| `recorded/`                       | Painel do VLibras para aulas gravadas.                                                                                                                |
| `agenda/`, `painel/`, `settings/` | Agenda/lembretes, painel do aluno, tela de ajustes/preferências.                                                                                      |

### Hooks (`hooks/`)

- `hooks/api/` — acesso à API REST por domínio: `auth`, `user`, `courses`, `professor`, `activities`, `aiTutor`, `schedule`, `storage`, `messages`, `notifications`, além de `core` (instância axios `useUmbrellaApi`).
- `hooks/messages/` — contexto do chat (estado das conversas sobre o socket STOMP).
- `hooks/notifications/` — notificações e registro de push token.
- `hooks/preferences/` — preferências de acessibilidade (contraste, fontes, TTS, daltonismo).
- `use-vlibras.ts`, `use-focus-data.ts`, `use-submit.ts` — VLibras, carregamento com refetch ao focar a tela, e submissão de formulários.

### Serviços, tipos e utilitários

- `services/umbrellaApi.ts` — instância **axios** com a `baseURL` vinda do `.env`.
- `services/chat-socket.ts` + `utils/stomp.ts` — cliente **STOMP/WebSocket próprio** (sem libs externas) para o chat em tempo real, com reconexão automática.
- `constants/` — tema, rotas, opções de professor, preferências, config do VLibras.
- `types/`, `utils/` — tipos de domínio e utilitários (arquivos, datas, validações, JWT, etc.).

> A URL da API é lida de `EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL` (ver [Configuração de ambiente](#-configuração-de-ambiente)).

---

## 🧏 Pipeline do VLibras (tradução em Libras)

Nas **aulas gravadas**, a plataforma gera legendas a partir do vídeo e usa o avatar do VLibras para sinalizar em Libras enquanto o vídeo toca. O fluxo ponta a ponta:

```
Vídeo (Cloudinary)
      │
      ▼
Worker Python (transformer)  ──► baixa o MP4
      │
      ▼
Whisper  ──► transcreve o áudio em português (SRT bruto)
      │
      ▼
Gemini   ──► (1) corrige a legenda   → legenda NORMAL
             (2) adapta/simplifica   → legenda LIBRAS (estrutura de Libras)
      │
      ▼
Frontend ──► WebView roda o vídeo + avatar VLibras usando a legenda LIBRAS
```

### Worker de legendas (`backend/umbrella_api/transformer/`)

Serviço **Python / FastAPI**, interno à rede do Docker, acionado pelo backend Java.

| Arquivo            | Papel                                                                                                                                                                     |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server.py`        | Worker HTTP. `POST /generate` recebe `{ videoUrl, geminiKey? }`, baixa o MP4 da URL (Cloudinary) e devolve `{ normal, libras }` (dois SRTs). `GET /health` para checagem. |
| `subtitle_core.py` | Lógica: transcreve com **Whisper** (modelo `small`, idioma PT) e gera as duas legendas com o **Gemini** (`gemini-2.5-flash`).                                             |
| `main.py`          | CLI para rodar o fluxo localmente, fora do worker HTTP.                                                                                                                   |
| `requirements.txt` | `openai-whisper`, `google-genai`, FastAPI, entre outros.                                                                                                                  |

**As duas legendas geradas:**

- **Normal** — o Gemini revisa o SRT do Whisper (corrige ortografia/erros de transcrição) mantendo numeração e códigos de tempo.
- **Libras** — o Gemini reescreve o texto na **estrutura da Libras** (ordem direta, frases curtas, sem conectivos desnecessários), cobrindo o vídeo inteiro e podendo reagrupar blocos para dar tempo de sinalização. É essa legenda simplificada que o avatar sinaliza.

### Reprodução no app (`umbrellaApp`)

- O vídeo toca dentro de uma **WebView** (`react-native-webview`).
- O avatar do VLibras vem de um bundle **servido estaticamente pelo backend** em `src/main/resources/static/vlibras/`. O front monta a URL em `services/umbrellaApi.ts` (`AVATAR_BUNDLE_URI` = `<origem-do-servidor>/vlibras/index.html`).
- Enquanto o vídeo roda, a legenda **Libras** (SRT simplificado) alimenta o avatar, que sinaliza o texto de cada bloco no tempo correspondente.
- O VLibras sinaliza o **texto** da legenda — não interpreta o áudio diretamente.
- Apoio no front: `components/recorded/vlibras-panel.tsx`, `hooks/use-vlibras.ts`, `constants/vlibras.ts`.

> **Chave do Gemini:** o worker usa a chave do corpo da requisição **ou** da variável `GEMINI_API_KEY`. É um serviço interno (sem autenticação própria), acionado apenas pelo backend dentro da rede do Docker.

> **Nota:** a pasta `libras-player/` na raiz é um **protótipo/histórico** de uma pipeline mais elaborada de geração de avatar e **não** faz parte do fluxo em produção descrito acima.

---

## ▶️ Como rodar

### Opção A — Docker (API + Postgres)

```bash
cd backend/umbrella_api
docker compose up --build
```

Sobe a API na porta **8080**.

### Opção B — Localmente com H2 (sem banco externo)

Ideal para desenvolvimento e demonstrações: o banco **H2 em memória** sobe junto com a aplicação (os dados são reiniciados a cada boot).

```bash
cd backend/umbrella_api
./mvnw spring-boot:run        # Linux/macOS
.\mvnw.cmd spring-boot:run    # Windows
```

A API responde em `http://localhost:8080` (prefixo `/api`).

### App (Expo)

```bash
cd frontend/umbrellaApp
npm install
npx expo start            # escolha Android / iOS / Web
npx expo start --web      # abre direto no navegador (porta 8081)
```

Configure `frontend/umbrellaApp/.env` apontando a API (veja abaixo).

---

## 🔧 Configuração de ambiente

### Backend — `backend/umbrella_api/.env`

| Variável                                                   | Descrição                                                                             |
| :--------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `DB_URL`                                                   | URL JDBC do banco (ex.: `jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1` ou a URL do Postgres). |
| `DB_USER` / `DB_PASS`                                      | Credenciais do banco.                                                                 |
| `JWT_SECRET`                                               | Segredo de assinatura do token JWT.                                                   |
| `GEMINI_API_KEY`                                           | Chave da API do Google Gemini (tutor de IA).                                          |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Credenciais do Cloudinary (upload de mídia).                                          |

O perfil ativo é definido em `src/main/resources/application.yaml` (`spring.profiles.active`), com perfis `h2`, `postgres` e `prod` disponíveis.

> ⚠️ **Segurança:** não versione credenciais reais. Mantenha chaves em variáveis de ambiente e troque qualquer chave que tenha sido exposta.

### Frontend — `frontend/umbrellaApp/.env`

```env
EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL="http://localhost:8080/api/"
EXPO_PUBLIC_REQUEST_TIME_OUT="20000"
```

Aponte `EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL` para o backend: um IP na mesma rede (`http://192.168.x.x:8080/api/`) ou uma URL pública de túnel.

---

## 🎬 Apresentação / demo por túnel

Para expor a aplicação rodando localmente a alguém remoto (ex.: gravar um vídeo) **sem hospedar**, há scripts prontos que sobem tudo e criam túneis públicos via **Cloudflare Tunnel** (`cloudflared`).

```bat
start-demo.bat    :: sobe API + Expo Web + 2 túneis, cria o professor e mostra as URLs
stop-demo.bat     :: encerra API, Expo e túneis
```

O `start-demo.bat`:

1. Sobe a **API Java** (H2 em memória) e espera ela ficar pronta.
2. Cria automaticamente uma **conta de professor** (o H2 zera a cada reinício).
3. Cria um túnel público para a API e **ajusta o `.env` do front** com essa URL.
4. Sobe o **Expo Web** e cria um túnel público para ele.
5. Grava as URLs e o login em **`demo-urls.txt`** e abre o arquivo.

**Pré-requisito:** `cloudflared` instalado (binário em `~/cloudflared/cloudflared.exe`).

**Conta de professor criada automaticamente na demo:**

- Email: `professor@umbrella.com`
- Senha: `professor123`

> As URLs do Cloudflare são aleatórias e mudam a cada execução (plano gratuito). O CORS do backend libera `*.trycloudflare.com` além de `localhost` para a demo funcionar.

---

## � Perfis e papéis de usuário

Os papéis (`UserRole`) são:

| Papel          | Descrição                                      |
| :------------- | :--------------------------------------------- |
| `ROLE_USER`    | Aluno (padrão no registro).                    |
| `ROLE_TEACHER` | Professor — acessa a área de gestão de cursos. |
| `ROLE_ADMIN`   | Administrador.                                 |

O registro (`POST /api/auth/register`) aceita o campo `role`; quando omitido, o usuário é criado como `ROLE_USER`. A criação/gestão de **categorias de curso** é responsabilidade de administradores.

---

## 🛠️ Camada de acesso a dados (Spring Data JPA)

O backend usa **Spring Data JPA** para persistência. Estendendo `JpaRepository`, os serviços ganham um conjunto padronizado de métodos sem código repetitivo.

| Método                  | Parâmetros    | Retorno       | Descrição                                           |
| :---------------------- | :------------ | :------------ | :-------------------------------------------------- |
| **`save`**              | `T entity`    | `T`           | Persiste um novo registro ou atualiza um existente. |
| **`saveAll`**           | `Iterable<T>` | `List<T>`     | Inserção/atualização em lote.                       |
| **`findById`**          | `ID id`       | `Optional<T>` | Busca um registro pela chave primária.              |
| **`existsById`**        | `ID id`       | `boolean`     | Verifica se um registro existe.                     |
| **`findAll`**           | —             | `List<T>`     | Lista todos os registros.                           |
| **`findAll(Pageable)`** | `Pageable`    | `Page<T>`     | Busca paginada.                                     |
| **`count`**             | —             | `long`        | Total de registros.                                 |
| **`deleteById`**        | `ID id`       | `void`        | Remove um registro pelo identificador.              |
| **`flush`**             | —             | `void`        | Sincroniza mudanças imediatamente com o banco.      |

> **Nota de arquitetura:** todos os repositórios são interfaces. O Spring Data JPA gera a implementação em tempo de execução, mantendo o backend limpo e focado na lógica de negócio.

---

## 👥 Equipe

<table>
<tr>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764204984/Imagem_do_WhatsApp_de_2025-11-26_%C3%A0_s_21.32.00_7af69407_cfzuh6.jpg" width="140"/><br>

### Davi Henrique Teixeira Ribeiro

**Chief Executive Officer (CEO)**
**Chief Product Officer (CPO)**
**Chief Technology Officer (CTO)**
**Head of Documentation**

</td>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764214860/Users_photos/po35oymuxiwmrj7xz9fo.png" width="140"/><br>

### Artur Henrique Lima Regadas

**Backend Engineer**
**Software Development Analyst**

</td>

<td align="center">
<img src="https://res.cloudinary.com/dnet6nodm/image/upload/v1764205172/Imagem_do_WhatsApp_de_2025-11-26_%C3%A0_s_21.59.20_5e4bafc0_d2r7sp.jpg" width="140"/><br>

### Gabriel Nascimento Correia

**Chief Operations Officer (COO)**
**DevOps Engineer**
**Database Administrator**
**Information Security Analyst**

</td>

<td align="center">
<img src="https://via.placeholder.com/150" width="140"/><br>

### Mayza Khiara de Oliveira Santos

**Chief Design Officer (CDO)**
**Frontend Engineer**
**UI/UX Designer**

</td>

</tr>
</table>

A Umbrella combina visão executiva, tecnologia, design, operações e inovação para criar um novo padrão de educação acessível.
