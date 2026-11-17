# infra/vlibras-dev — Local_Dev_Environment

Ambiente de desenvolvimento local **NÃO-PRODUÇÃO** para a VLibras Translator API
auto-hospedada e suas dependências de serviço. Serve exclusivamente para avaliar
a geração de avatar de Libras em modo `internal-nonproduction-prototype`.

> ⚠️ **AVISO DE NÃO-PRODUÇÃO**
>
> Esta stack **não** deve ser implantada em produção, não contém credenciais
> reais nem conteúdo sensível, e roda em uma rede Docker dedicada e isolada da
> rede de produção. A tradução por avatar é **automática e experimental** e não
> equivale a intérprete humano certificado.
>
> _Requirements: 8.1, 8.2, 9.1, 9.2, 9.4, 19.1, 19.4._

## Componentes

| Serviço                  | Papel                                              | Porta interna | Porta local (host)     |
| ------------------------ | -------------------------------------------------- | ------------- | ---------------------- |
| `vlibras-translator-api` | API de tradução; expõe o **health check**          | 5000          | `TRANSLATOR_API_PORT`  |
| `vlibras-text-core`      | Tradução Português → glosa Libras                  | 5001          | interno (apenas rede)  |
| `vlibras-video-core`     | Geração/composição do avatar 3D                    | 5002          | interno (apenas rede)  |
| `mongodb`                | Persistência                                       | 27017         | `MONGO_PORT`           |
| `redis`                  | Cache / filas                                      | 6379          | `REDIS_PORT`           |
| `rabbitmq`               | Mensageria entre API e cores (UI em 15672)         | 5672 / 15672  | `RABBITMQ_*_PORT`      |

Todos os serviços rodam na rede dedicada `vlibras-dev-net` e recebem labels
`com.vvli.environment=non-production` para marcação explícita.

## Pré-requisitos

- Docker e Docker Compose v2 (`docker compose`, não `docker-compose`).
- `curl` disponível dentro da imagem da API para o health check (tratado no
  Dockerfile da tarefa 12.2).

## Configuração

1. Copie o arquivo de variáveis de ambiente de exemplo e ajuste **apenas**
   valores de desenvolvimento:

   ```bash
   # Linux/macOS
   cp .env.example .env
   ```

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

2. Os valores padrão já são **placeholders de DEV** (`dev_placeholder_change_me`).
   **Nunca** substitua por credenciais reais de produção. Tokens de produto real
   pertencem a um secret manager no backend, fora deste repositório, do app e do
   manifesto (Requirement 17.1).

## Subir / derrubar (após a tarefa 12.2)

```bash
# Validar a sintaxe do compose (não requer imagens):
docker compose config

# Subir a stack (requer os Dockerfiles da tarefa 12.2):
docker compose up -d

# Acompanhar logs da API:
docker compose logs -f vlibras-translator-api

# Derrubar e limpar volumes locais:
docker compose down -v
```

> **Importante:** `docker compose up` ainda **não** funciona apenas com este
> arquivo. Os serviços de aplicação (`vlibras-translator-api`, `vlibras-text-core`,
> `vlibras-video-core`) usam `build:` apontando para Dockerfiles em
> `./services/<serviço>/Dockerfile`, que serão criados na **tarefa 12.2**. Até
> lá, há `TODO(12.2)` explícitos no `docker-compose.yml`. O arquivo é
> **sintaticamente válido** (verificável com `docker compose config`).

## Health check (consumível pelo Provider_Adapter)

A VLibras Translator API expõe um endpoint de verificação de saúde usado pelo
adaptador (`AvatarTranslationProvider.healthCheck()`) para confirmar
disponibilidade e autorização antes de qualquer geração.

- **URL local:** `http://localhost:5000/healthz`
  (ou `http://localhost:${TRANSLATOR_API_PORT}/healthz`)
- **Dentro da rede Docker:** `http://vlibras-translator-api:5000/healthz`

Verificação manual:

```bash
curl -fsS http://localhost:5000/healthz
```

Quando o ambiente **não está em execução** ou o endpoint **não responde**, o
`Avatar_Gateway`/`Provider_Adapter` deve tratar o provedor como **indisponível**
e o pipeline recorre ao fallback (vídeo original + legendas). Esse comportamento
é implementado na tarefa 12.3.

_Requirements: 9.3, 9.5._

## Licenciamento

- A **VLibras Translator API** baseia-se no repositório público oficial
  [`spbgovbr-vlibras/vlibras-translator-api`](https://github.com/spbgovbr-vlibras/vlibras-translator-api),
  licenciado sob **LGPLv3**. O uso neste ambiente exige **aprovação de revisão da
  licença LGPLv3** antes de habilitar a API (Requirement 18.1).
- O **Text Core**
  ([`spbgovbr-vlibras/vlibras-translator-text-core`](https://github.com/spbgovbr-vlibras/vlibras-translator-text-core)),
  o **Video Core**, modelos, dicionários, avatares e marcas exigem revisão de
  licenças e permissões próprias antes de qualquer uso de produção
  (Requirement 18.2).
- `mongodb`, `redis` e `rabbitmq` usam imagens oficiais públicas com versões
  fixadas.

Conteúdo da API/cores foi rephrased a partir das descrições públicas dos
repositórios oficiais para conformidade de licenciamento.

## Modernização e hardening (pendente — não-produção)

A stack legada original assume **Ubuntu 18.04** e **Node.js 10**, além de
MongoDB, Redis e RabbitMQ. Enquanto depender dessa stack, o ambiente permanece
**não-produção** (Requirement 19.1). Antes de qualquer reconsideração de
produção, são exigidos (Requirements 19.2, 19.3, 19.4):

- Inventário de dependências e atualização de runtimes (Node.js para versão LTS
  suportada; sistema base mantido).
- Imagens reproduzíveis e varredura de vulnerabilidades.
- Autenticação, autorização, rate limiting, observabilidade, backups e testes de
  carga.
- **Não** implantar a stack legada diretamente em produção.

O levantamento detalhado da stack legada e os Dockerfiles mínimos para a subida
real são tratados na **tarefa 12.2** (`legacy-assessment.md`), e o tratamento de
indisponibilidade do ambiente na **tarefa 12.3**.

## Fronteiras de conformidade

- Este ambiente **não** automatiza o serviço público "VLibras Vídeo"
  (Requirement 15.3) nem incorpora o VLibras Widget/Hand Talk em WebView
  (Requirement 15.4). O `vlibras-video-core` aqui é parte do protótipo
  auto-hospedado e isolado.
- Operações remotas limitam-se a este contrato público documentado, sem
  descobrir ou chamar endpoints privados (Requirements 15.1, 15.2).
