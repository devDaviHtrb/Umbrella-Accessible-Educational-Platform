# Requisitos — Integração do Player de Libras no Umbrella

## Introdução

Integrar, na plataforma educacional **Umbrella**, um player de aula acessível que
reproduz o vídeo do curso com **duas legendas**: a legenda normal (texto em
português, exibida como caption) e a legenda de **Libras** (interpretada ao vivo
por um avatar VLibras numa WebView). As legendas são geradas automaticamente a
partir do áudio do vídeo (Whisper → transcrição; Gemini → legenda normal
corrigida e legenda Libras simplificada) e armazenadas no banco de dados. O
upload de vídeo (fluxo do professor, hoje quebrado) é reaproveitado e consertado.

Três peças a unir:
1. **Player de Libras** com a cara do Umbrella, no lugar da aula (`lesson.tsx`).
2. **Geração automática de legendas** disparada após o upload do vídeo
   (`transformer/main.py` chamado pelo backend Java como subprocesso).
3. **Upload de vídeo no curso** consertado (somente MP4) + armazenamento das
   legendas no banco.

Stacks reais (não alteráveis): backend **Spring Boot 3.5 / Java 21 / PostgreSQL /
Cloudinary**; frontend **Expo SDK 58 / React Native 0.88 / React 19 /
expo-router**; transformer **Python (openai-whisper + google-genai)**.

---

## Requisito 1 — Upload de vídeo no curso (somente MP4)

**História:** Como professor, quero enviar o vídeo MP4 de uma aula para um módulo
de um curso, para que ele fique disponível aos alunos com legendas e Libras.

### Critérios de aceitação
1. QUANDO o professor seleciona um arquivo que não é MP4, ENTÃO o app DEVE
   rejeitar a seleção com mensagem clara, aceitando apenas `video/mp4` (`.mp4`).
2. QUANDO o professor envia um MP4 válido com título e módulo, ENTÃO o sistema
   DEVE armazenar o vídeo (Cloudinary + `Video`/`FileMetaData` ligado ao módulo)
   e retornar sucesso, reaproveitando o fluxo de upload existente.
3. O backend DEVE aceitar o tamanho de um vídeo real (limite de upload elevado
   acima dos 10 MB atuais).
4. QUANDO o upload falha, ENTÃO o app DEVE exibir o erro e NÃO deixar registro
   órfão (o rollback de Cloudinary/DB existente é preservado).
5. O fluxo consertado DEVE continuar usando a tela e o formulário existentes
   (`new-recorded.tsx` / `RecordedLessonForm`), sem criar uma tela paralela.

## Requisito 2 — Geração automática das duas legendas

**História:** Como professor, quero que as legendas (normal e Libras) sejam
geradas automaticamente a partir do áudio do vídeo, sem passo manual.

### Critérios de aceitação
1. QUANDO um vídeo é enviado com sucesso, ENTÃO o backend DEVE disparar, de forma
   **assíncrona**, a geração das legendas (sem bloquear a resposta do upload).
2. A geração DEVE: baixar o MP4, transcrever o áudio em PT (Whisper) e produzir
   **duas** legendas SRT via Gemini: `normal` (corrigida) e `libras`
   (simplificada), conforme os prompts de `transformer/main.py`.
3. O backend DEVE invocar a lógica Python como **subprocesso** (sem criar uma API
   HTTP nova), passando o caminho do vídeo, a chave do Gemini e a pasta de saída.
4. QUANDO a geração conclui, ENTÃO as duas legendas DEVEM ser persistidas no
   banco, vinculadas ao vídeo, com um campo que distingue `normal` de `libras`.
5. ENQUANTO a geração está em andamento, o estado DEVE ser consultável
   (ex.: `PROCESSING` → `READY`/`FAILED`), para o app refletir o progresso.
6. SE o Python/Whisper não estiver disponível no ambiente, ENTÃO a geração DEVE
   falhar de forma controlada (estado `FAILED`, mensagem), sem derrubar o upload,
   e DEVE existir um caminho de fallback para enviar os SRTs manualmente.
7. A chave do Gemini DEVE vir de configuração (`.env`/`application.yaml`), nunca
   fixa no código.

## Requisito 3 — Armazenamento e recuperação das legendas

**História:** Como app, quero obter o vídeo e suas duas legendas por um endpoint,
para renderizar o player completo.

### Critérios de aceitação
1. O sistema DEVE persistir cada legenda com: conteúdo/URL do SRT, tipo
   (`normal`|`libras`), vínculo com o vídeo e estado de processamento.
2. O backend DEVE expor um endpoint autenticado que, dado o vídeo (ou material),
   retorna a URL do MP4 e as URLs/estados das duas legendas.
3. QUANDO uma legenda ainda não foi gerada, ENTÃO o endpoint DEVE indicar o
   estado (`PROCESSING`/`FAILED`/`READY`) em vez de 404 silencioso.
4. As legendas DEVEM ser recuperáveis pelo app como texto SRT (para parse de
   cues no cliente), por URL pública (Cloudinary) ou pelo backend.

## Requisito 4 — Player de Libras na aula, com a cara do Umbrella

**História:** Como aluno, quero assistir à aula com o vídeo, a legenda em texto e
a tradução em Libras por avatar, tudo dentro do app, com o visual do Umbrella.

### Critérios de aceitação
1. A tela de aula (`app/(tabs)/courses/lesson.tsx`) DEVE reproduzir o MP4
   embutido (não abrir no navegador externo), com o design system do Umbrella
   (`ScreenContainer`, `Card`, `UmbrellaText`, `Colors`, `Spacing`, Lexend).
2. A **legenda normal** DEVE ser exibida como caption sincronizada com o vídeo.
3. A **legenda Libras** DEVE alimentar o avatar **VLibras** numa WebView (o
   `index.html`/bundle já desenvolvido), com a fila anti-sobreposição e o
   controle de velocidade já implementados.
4. O vídeo DEVE ser o relógio-mestre; o avatar reage ao vídeo e nunca o move.
5. O áudio DEVE vir apenas do vídeo nativo; a WebView do avatar não emite áudio.
6. QUANDO o avatar/WebView falha ou está indisponível, ENTÃO o player DEVE cair
   para "vídeo + legenda" sem quebrar, exibindo um aviso (reusar `VLibrasPanel`).
7. O player DEVE aparecer apenas quando houver vídeo; QUANDO as legendas ainda
   estão `PROCESSING`, ENTÃO exibir estado de carregamento coerente.

## Requisito 5 — Configuração e ambiente

**História:** Como desenvolvedor, quero um `.env` e documentação que liguem o
backend ao transformer e ao Gemini, para rodar o fluxo de ponta a ponta.

### Critérios de aceitação
1. DEVE existir um `.env` (ou entradas no existente) ligando o backend ao
   executável Python, ao `main.py` e à `GEMINI_API_KEY`.
2. A localização do Python/`main.py`/pasta de trabalho DEVE ser configurável.
3. DEVE haver documentação de pré-requisitos (Python, openai-whisper, ffmpeg) e
   de como rodar, incluindo a limitação de desempenho do Whisper.
4. O CORS e a base URL do app DEVEM permitir o dispositivo acessar o backend.

## Requisito 6 — Não regressão

### Critérios de aceitação
1. As telas, rotas e fluxos existentes do Umbrella NÃO DEVEM quebrar.
2. Entidades novas DEVEM evoluir o schema via Hibernate `ddl-auto=update` sem
   remover/renomear colunas existentes.
3. O código novo DEVE seguir os padrões do projeto (módulos por feature, DTOs
   `record` com `fromEntity`, `@PreAuthorize`, design system no front).
