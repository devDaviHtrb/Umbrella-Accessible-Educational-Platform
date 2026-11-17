# Requirements Document

## Introduction

Esta feature entrega um player React Native que reproduz `video.webm` (transcodificado para `original.mp4`) acompanhado de uma janela de avatar 3D de Libras renderizada **ao vivo** pelo player oficial open-source `vlibras-player-webjs` (Unity/WebGL, LGPLv3) embutido em uma WebView (`react-native-webview`). O avatar é tratado explicitamente como protótipo experimental: tradução automática por avatar não equivale a pessoa intérprete humana e não recebe selo de conformidade linguística ou de acessibilidade.

Os requisitos derivam do design aprovado (`design.md`), que é a fonte de verdade. A arquitetura central: o player de vídeo nativo é o **relógio mestre** (posição, play/pause/seek e áudio); a cada transição de cue do SRT normalizado, o app envia o texto do cue para a WebView traduzir e animar em tempo real. A sincronização avatar×fala é **aproximada** por natureza da tradução automática, e isso é documentado explicitamente. O playback depende de serviços online do VLibras (tradução texto→glosa e dicionário de sinais); havendo falha da WebView ou indisponibilidade desses serviços, o app recorre a vídeo mais legenda.

Os requisitos cobrem: o player nativo com variante única e áudio único; habilitar/desabilitar o avatar ao vivo (mostrar/ocultar WebView) sem mover o vídeo; o parser e a normalização do SRT real (`subtitles.txt`, 267 cues) com clamp do cue final de 815.400 ms para 814.681 ms e registro da divergência de 719 ms; a inspeção de mídia e a transcodificação para `original.mp4` H.264/AAC; o agendamento por transição de cue dirigido pelo relógio do vídeo; a bridge app↔WebView via `postMessage`; a dependência de serviços online do VLibras com tratamento de offline/erro; o manifesto versionado e imutável referenciando sempre a variante original, o SRT normalizado e a configuração de avatar em tempo real; o fallback total para vídeo mais legenda; a divulgação permanente de tradução automática experimental; as fronteiras de uso autorizado (uso permitido do player oficial `vlibras-player-webjs` sob LGPLv3 em WebView, sem automatizar o VLibras Vídeo e sem incorporar o VLibras Widget ou o Hand Talk Plugin para simular integração); e os requisitos não-funcionais de segurança, privacidade e licenciamento. A composição offline de MP4 de avatar, a geração via API auto-hospedada, a análise de encaixe temporal para render e a stack legada conteinerizada ficam **fora do escopo do caminho principal** (modo legado opcional).

## Glossary

- **Pipeline**: Subsistema offline que inspeciona a mídia, normaliza o SRT, transcodifica a variante original e produz o pacote de tradução. Nunca executa durante o playback.
- **SRT_Normalizer**: Componente do Pipeline que parseia, ordena e limita cues do SRT preservando o texto.
- **Media_Inspector**: Componente do Pipeline que valida MIME, codecs, dimensões, duração e integridade da mídia de entrada.
- **Transcoder**: Componente do Pipeline que produz MP4 H.264/AAC a partir da fonte.
- **Package_Builder**: Componente do Pipeline que monta o Manifest imutável com a variante original, o SRT normalizado e a configuração de avatar em tempo real.
- **Manifest**: Arquivo `manifest.json` versionado e imutável que descreve a variante original, o transcript, a disponibilidade de avatar em tempo real, a proveniência e a divulgação.
- **Player**: Aplicativo React Native com player de vídeo nativo que carrega o Manifest e reproduz a variante original.
- **Native_Video_Player**: Player de vídeo nativo (`react-native-video`) que reproduz vídeo/áudio e atua como relógio mestre de reprodução.
- **Original_Variant**: Variante de mídia `original.mp4` (H.264/AAC) transcodificada da fonte, sem avatar embutido.
- **CueScheduler**: Componente do Player que resolve o cue ativo a partir da posição do Native_Video_Player e emite transições de cue.
- **AvatarBridge**: Componente do Player que serializa mensagens entre o app e a WebView via `postMessage` (envia texto de cue, recebe eventos de animação e erro).
- **WebView_Host**: Contêiner `react-native-webview` que carrega a página HTML do VLibras_Web_Player sob allowlist de origem.
- **VLibras_Web_Player**: Player oficial open-source `vlibras-player-webjs` (Unity/WebGL, LGPLv3) que anima o avatar 3D ao vivo dentro da WebView.
- **Online_Services**: Serviços online do VLibras consumidos em runtime pelo VLibras_Web_Player, incluindo tradução texto→glosa e dicionário de sinais.
- **Avatar_Runtime_Config**: Configuração que descreve o bundle do VLibras_Web_Player, o avatar, a velocidade padrão, a dependência de serviços online e o identificador de revisão de licença.
- **Fallback**: Estado em que não há configuração de avatar válida, ou a WebView/Online_Services falham, e o Player reproduz apenas a Original_Variant com legendas SRT.
- **Disclosure**: Aviso permanente e legível de que a tradução por avatar é automática, experimental e não equivalente a intérprete humano.

## Requirements

### Requirement 1: Reprodução nativa com variante única e relógio mestre

**User Story:** As a usuário do aplicativo, I want reproduzir o vídeo em um player React Native nativo que seja o relógio mestre, so that eu assista ao conteúdo com um único decodificador de áudio e com a reprodução controlada pelo vídeo.

#### Acceptance Criteria

1. WHEN o Player carrega um Manifest válido, THE Native_Video_Player SHALL reproduzir a Original_Variant como variante de mídia ativa.
2. WHILE a Original_Variant está em reprodução, THE Player SHALL manter no máximo uma instância de mídia emitindo áudio, que é o Native_Video_Player.
3. WHEN o usuário aciona play, pause ou seek, THE Native_Video_Player SHALL aplicar a operação e refletir o novo estado no snapshot de reprodução.
4. THE Native_Video_Player SHALL reproduzir a Original_Variant codificada em H.264 para vídeo e AAC para áudio.
5. THE Native_Video_Player SHALL atuar como relógio mestre, fornecendo a posição de reprodução que dirige o CueScheduler.

### Requirement 2: Habilitar e desabilitar o avatar ao vivo preservando a reprodução

**User Story:** As a usuário do aplicativo, I want habilitar ou desabilitar o avatar de Libras ao vivo, so that eu assista com ou sem o avatar sem perder minha posição nem interromper o vídeo.

#### Acceptance Criteria

1. WHERE o Manifest contém `avatarRuntime` válido, THE Player SHALL permitir ao usuário habilitar ou desabilitar o avatar automático.
2. WHEN o usuário habilita o avatar, THE Player SHALL exibir a WebView_Host e preservar a posição e o estado de play ou pause do Native_Video_Player.
3. WHEN o usuário desabilita o avatar, THE Player SHALL ocultar a WebView_Host, enviar `stop` ao VLibras_Web_Player e preservar a posição e o estado de play ou pause do Native_Video_Player.
4. IF a habilitação do avatar ao vivo falha, THEN THE Player SHALL recorrer ao Fallback e manter a reprodução do vídeo.
5. WHERE a variante de avatar ao vivo está indisponível, THE Player SHALL reproduzir a Original_Variant com legendas SRT e informar que o avatar automático está indisponível.

### Requirement 3: Parsing e normalização do SRT

**User Story:** As a operador do pipeline, I want parsear e normalizar o SRT real, so that os cues fiquem ordenados, válidos e dentro da duração da mídia preservando o texto original.

#### Acceptance Criteria

1. WHEN o SRT_Normalizer recebe o texto SRT e a duração da mídia, THE SRT_Normalizer SHALL produzir cues ordenados de forma estável por início, fim e índice de origem.
2. THE SRT_Normalizer SHALL garantir que todo cue publicado satisfaça `0 <= startMs < endMs <= durationMs`.
3. THE SRT_Normalizer SHALL preservar o texto de cada cue após a normalização de fins de linha.
4. WHEN o cue final termina em 815.400 ms e a duração da mídia é 814.681 ms, THE SRT_Normalizer SHALL limitar o fim do cue final a 814.681 ms e registrar a divergência de 719 ms.
5. IF um cue apresenta divergência temporal além da tolerância de clamp configurada, THEN THE SRT_Normalizer SHALL falhar a validação com erro bloqueante em vez de ajustar silenciosamente.
6. IF o texto SRT não é parseável, THEN THE SRT_Normalizer SHALL retornar um erro bloqueante de SRT inválido.

### Requirement 4: Inspeção de mídia na entrada

**User Story:** As a operador do pipeline, I want inspecionar a mídia de entrada, so that o pipeline só prossiga com uma fonte válida e esperada.

#### Acceptance Criteria

1. WHEN o Media_Inspector recebe a mídia de entrada, THE Media_Inspector SHALL validar MIME, codecs, dimensões e duração.
2. THE Media_Inspector SHALL registrar a duração medida da mídia em milissegundos.
3. IF a duração medida difere do valor esperado de 814.681 ms além da tolerância configurada, THEN THE Media_Inspector SHALL retornar um erro bloqueante de divergência de duração.
4. THE Media_Inspector SHALL calcular e registrar o hash SHA-256 da mídia de entrada.

### Requirement 5: Transcodificação da variante original

**User Story:** As a operador do pipeline, I want transcodificar a fonte para um formato nativo único, so that o player reproduza um único MP4 compatível sem deriva entre decodificadores.

#### Acceptance Criteria

1. THE Transcoder SHALL produzir a Original_Variant em MP4 H.264 para vídeo e AAC para áudio.
2. THE Transcoder SHALL preservar o áudio da fonte sem alteração de timing na Original_Variant produzida.
3. THE Transcoder SHALL registrar a duração da Original_Variant em milissegundos.

### Requirement 6: Agendamento por transição de cue dirigido pelo relógio do vídeo

**User Story:** As a usuário do aplicativo, I want que o avatar seja acionado pelas transições de cue conforme a posição do vídeo, so that cada fala temporizada seja traduzida no momento aproximado em que é falada.

#### Acceptance Criteria

1. WHEN a posição do Native_Video_Player avança, THE CueScheduler SHALL resolver o cue ativo somente a partir dos timestamps do SRT normalizado.
2. WHEN o cue ativo muda e o avatar está habilitado, THE CueScheduler SHALL acionar exatamente uma mensagem de cue para a AvatarBridge por transição.
3. WHILE a posição está em um intervalo sem fala, THE CueScheduler SHALL abster-se de acionar nova tradução.
4. WHEN o usuário executa seek, THE CueScheduler SHALL reposicionar o cue ativo coerentemente com a nova posição do Native_Video_Player.
5. THE CueScheduler SHALL derivar o cue ativo exclusivamente da posição do Native_Video_Player, sem redefinir a posição do vídeo.

### Requirement 7: Bridge app↔WebView para o avatar ao vivo

**User Story:** As a desenvolvedor do app, I want uma bridge que troque mensagens com a WebView, so that o texto do cue seja enviado ao player web e os eventos de animação e erro sejam recebidos.

#### Acceptance Criteria

1. WHEN o CueScheduler aciona uma transição de cue com avatar habilitado, THE AvatarBridge SHALL enviar ao VLibras_Web_Player, via `postMessage`, o identificador e o texto do cue para tradução.
2. THE AvatarBridge SHALL derivar o texto enviado somente de cues temporizados do SRT normalizado.
3. WHEN o VLibras_Web_Player emite eventos de carregamento, início de glosa, progresso, fim de animação ou erro, THE AvatarBridge SHALL entregar cada evento ao Player.
4. IF a AvatarBridge recebe um evento de erro do VLibras_Web_Player, THEN THE Player SHALL tratar o avatar como indisponível e recorrer ao Fallback sem interromper o vídeo.
5. WHEN o usuário aciona pause, stop ou alteração de velocidade, THE AvatarBridge SHALL propagar a operação correspondente ao VLibras_Web_Player.

### Requirement 8: Avatar ao vivo via WebView e dependência de serviços online

**User Story:** As a usuário do aplicativo, I want que o avatar real seja renderizado ao vivo pelo player oficial do VLibras, so that eu veja o avatar 3D sem depender de uma variante de avatar pré-renderizada.

#### Acceptance Criteria

1. THE WebView_Host SHALL carregar a página HTML que instancia o VLibras_Web_Player sob allowlist de origem.
2. THE WebView_Host SHALL abster-se de carregar scripts de terceiros não autorizados e de embutir o VLibras Widget ou o Hand Talk Plugin.
3. WHILE o avatar está habilitado, THE VLibras_Web_Player SHALL consumir os Online_Services para tradução texto→glosa e dicionário de sinais.
4. IF os Online_Services estão indisponíveis ou o dispositivo está offline, THEN THE Player SHALL recorrer ao Fallback e informar que o avatar automático está indisponível.
5. IF a WebView_Host falha ao carregar o VLibras_Web_Player, THEN THE Player SHALL tratar o avatar como indisponível e manter a reprodução do vídeo.
6. THE WebView_Host SHALL abster-se de emitir áudio concorrente, mantendo o áudio originado somente do Native_Video_Player.

### Requirement 9: Sincronização aproximada e honesta

**User Story:** As a usuário do aplicativo, I want entender que o avatar segue a fala de forma aproximada, so that eu não interprete a animação como sincronização quadro-a-quadro certificada.

#### Acceptance Criteria

1. THE Player SHALL conduzir a animação do avatar seguindo o texto do cue com latência admitida, sem afirmar casamento quadro-a-quadro entre avatar e fala.
2. WHILE o avatar está habilitado, THE Player SHALL manter o Native_Video_Player como relógio mestre, de modo que a animação do avatar não altere a posição do vídeo.
3. WHILE a posição está em um intervalo sem fala, THE Player SHALL manter o avatar em pose ociosa ou no estado anterior, sem deslocar cues posteriores.

### Requirement 12: Manifesto versionado e imutável

**User Story:** As a operador do pipeline, I want produzir um manifesto versionado e imutável, so that o aplicativo carregue um pacote consistente e auditável.

#### Acceptance Criteria

1. THE Manifest SHALL referenciar sempre a Original_Variant e o transcript SRT normalizado.
2. THE Manifest SHALL marcar `avatarAvailable` como verdadeiro se e somente se contiver uma Avatar_Runtime_Config válida com identificador de revisão de licença registrado.
3. WHEN não há Avatar_Runtime_Config válida, THE Package_Builder SHALL criar o Manifest com `avatarMode` igual a `unavailable` e registrar o motivo.
4. THE Manifest SHALL abster-se de referenciar qualquer variante de avatar pré-renderizada.
5. THE Pipeline SHALL publicar revisões de pacote como artefatos imutáveis em caminhos versionados.
6. THE Pipeline SHALL registrar hashes SHA-256 de cada artefato do pacote.
7. THE Pipeline SHALL abster-se de publicar configuração de avatar parcial ou incompleta.

### Requirement 13: Fallback total para vídeo e legenda

**User Story:** As a usuário do aplicativo, I want receber um pacote reproduzível mesmo sem avatar ao vivo, so that eu sempre tenha vídeo e legendas disponíveis.

#### Acceptance Criteria

1. IF nenhuma Avatar_Runtime_Config válida está configurada, THEN THE Pipeline SHALL produzir um pacote contendo a Original_Variant e o SRT normalizado com `avatarAvailable` igual a falso.
2. IF a WebView_Host ou os Online_Services falham em runtime, THEN THE Player SHALL recorrer ao Fallback sem interromper a reprodução do vídeo.
3. WHILE o aplicativo está em Fallback, THE Player SHALL exibir legendas SRT e informar que o avatar está indisponível.
4. THE Fallback SHALL funcionar sem depender do VLibras_Web_Player nem dos Online_Services em tempo de reprodução.

### Requirement 14: Divulgação de tradução automática experimental

**User Story:** As a usuário do aplicativo, I want ser informado de que o avatar é automático e experimental, so that eu não confunda a saída com interpretação humana certificada.

#### Acceptance Criteria

1. WHILE o avatar está em reprodução, THE Player SHALL exibir a Disclosure de que a tradução é automática, experimental e não equivalente a intérprete humano.
2. THE Player SHALL abster-se de rotular a saída do avatar como interpretação humana ou como Libras certificada.
3. THE Manifest SHALL incluir a Disclosure como atributo permanente do pacote.

### Requirement 15: Fronteiras de uso autorizado

**User Story:** As a responsável pela conformidade, I want restringir o sistema ao uso autorizado das fontes oficiais, so that nenhuma chamada ocorra fora do uso permitido.

#### Acceptance Criteria

1. THE Player SHALL usar somente o player oficial VLibras_Web_Player, carregando seus assets e target conforme a documentação oficial e a licença LGPLv3.
2. THE WebView_Host SHALL carregar apenas origens da allowlist e abster-se de descobrir ou chamar endpoints privados.
3. THE Player SHALL abster-se de automatizar o serviço hospedado VLibras Vídeo para publicar esta produção.
4. THE Player SHALL abster-se de incorporar o VLibras Widget ou o Hand Talk Plugin para simular integração nativa.
5. WHILE o aplicativo está em reprodução, THE Player SHALL restringir a comunicação ao envio de texto de cue ao VLibras_Web_Player e abster-se de acessar endpoints inferidos.

### Requirement 17: Segurança e privacidade

**User Story:** As a responsável pela segurança, I want proteger dados e restringir a superfície de rede, so that o sistema trate conteúdo de forma segura.

#### Acceptance Criteria

1. WHEN o Player conduz a tradução do avatar, THE Player SHALL enviar aos Online_Services somente o texto de cue necessário à geração.
2. THE WebView_Host SHALL carregar recursos somente via HTTPS e sob allowlist de origem.
3. WHERE assets são baixados em runtime, THE Player SHALL aplicar verificação de integridade quando aplicável.
4. THE Player SHALL aplicar política de retenção e minimização de dados sobre o texto enviado aos Online_Services.

### Requirement 18: Licenciamento e revisão de direitos

**User Story:** As a responsável jurídico, I want cumprir o licenciamento das fontes oficiais, so that o uso dos ativos permaneça conforme.

#### Acceptance Criteria

1. THE Pipeline SHALL exigir aprovação de revisão da licença LGPLv3 do VLibras_Web_Player antes de habilitar o avatar ao vivo.
2. THE Player SHALL cumprir a LGPLv3 do VLibras_Web_Player quanto a atribuição, manutenção de avisos de licença e modo de distribuição do bundle embarcado.
3. THE Pipeline SHALL registrar o identificador de revisão de direitos dos avatares e do dicionário na Avatar_Runtime_Config antes de habilitar o avatar ao vivo.

### Requirement 20: Modos legados fora de escopo

**User Story:** As a responsável técnico, I want declarar explicitamente os caminhos legados fora de escopo, so that nenhuma pilha descartada entre no caminho principal desta entrega.

#### Acceptance Criteria

1. THE Pipeline SHALL abster-se de compor offline qualquer variante de avatar pré-renderizada (`prototype-avatar.mp4`) no caminho principal.
2. THE Pipeline SHALL abster-se de gerar avatar via API VLibras Translator auto-hospedada no caminho principal, tratando essa opção como modo legado opcional não construído nesta entrega.
3. THE Pipeline SHALL abster-se de depender da stack legada conteinerizada (Ubuntu 18.04, Node.js 10, MongoDB, Redis, RabbitMQ) no caminho principal.
4. WHERE um modo legado for reconsiderado no futuro, THE Pipeline SHALL exigir revisão de licenças, modernização de runtimes, imagens reproduzíveis, varredura de vulnerabilidades e hardening antes de qualquer uso de produção.
