# Avaliação da stack legada — VLibras Local_Dev_Environment

> ⚠️ **AMBIENTE NÃO-PRODUÇÃO / NON-PRODUCTION**
>
> Esta avaliação cobre a stack legada da VLibras Translator API auto-hospedada
> e suas dependências, usada **exclusivamente** em modo
> `internal-nonproduction-prototype`. **Enquanto depender desta stack legada, a
> VLibras Translator API é tratada como protótipo não-produção e NÃO deve ser
> implantada diretamente em produção.**
>
> _Requirements: 19.1 (tratar como protótipo não-produção), 19.4 (não implantar
> a stack legada diretamente em produção)._

Tarefa de origem: **12.2 — Investigar e ajustar a stack legada para subir**.
Complementa `docker-compose.yml` (tarefa 12.1) e o tratamento de
indisponibilidade da tarefa 12.3.

---

## 1. Escopo e honestidade de verificação

O que foi **verificado** neste ambiente:

- Docker e Docker Compose v2 estão disponíveis (ver seção 7, "Validação").
- O `docker-compose.yml` é sintaticamente válido (`docker compose config`).
- Os Dockerfiles de protótipo **constroem** e os contêineres **sobem** com o
  health check `/healthz` respondendo (stubs — ver seção 5).

O que **NÃO** pôde ser verificado / garantido aqui:

- A **disponibilidade pública** e o layout exato do código-fonte legado da
  VLibras Translator API, do Text Core e do Video Core.
- A existência de **imagens oficiais públicas** dos serviços de aplicação
  (API/cores). Por isso os serviços usam `build:` local, não `image:` externa.
- Que a **build real** da stack legada (Ubuntu 18.04 / Node.js 10) suba sem
  retrabalho. A doc legada é antiga e os runtimes estão fora de suporte.

**Consequência honesta:** por padrão, os serviços de aplicação sobem como
**stubs de protótipo** (pequenos servidores HTTP que respondem ao health
check). Os stubs **não** executam tradução real para Libras nem renderização de
avatar. A "build real" permanece **documentada e comentada** em cada Dockerfile,
pronta para ser habilitada após confirmar a disponibilidade do código, aprovar
as revisões de licença e aplicar o hardening desta avaliação. Nada aqui afirma
que a stack real sobe.

---

## 2. Inventário de dependências (stack legada)

A documentação legada original assume o seguinte conjunto. As versões "legada"
são as herdadas; as "mínima recomendada (não-produção)" são o alvo de
modernização mínima deste protótipo (ver seção 4).

| Componente        | Papel                                   | Versão legada (herdada)        | Mínima recomendada (não-produção)        | Fonte da imagem neste ambiente                 |
| ----------------- | --------------------------------------- | ------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| Sistema base      | SO dos contêineres de aplicação         | Ubuntu 18.04 (EOL)             | Base Node LTS slim (ex.: `node:20-bookworm-slim`) | `build:` local (Dockerfile do serviço)  |
| Node.js           | Runtime da API e dos cores              | Node.js 10 (EOL)               | Node.js LTS suportado (ex.: 20.x)        | `build:` local (Dockerfile do serviço)         |
| Translator API    | Ponto de entrada HTTP; expõe `/healthz` | Repo público oficial (LGPLv3)  | Mesmo código em Node LTS, multi-stage    | `build:` local — **stub de protótipo** por ora |
| Text Core         | Português → glosa Libras                | Repo público oficial           | Mesmo código em Node LTS                 | `build:` local — **stub de protótipo** por ora |
| Video Core        | Geração/composição do avatar 3D         | Serviço legado + ativos 3D     | Toolchain 3D confirmada + ativos licenciados | `build:` local — **stub de protótipo** por ora |
| MongoDB           | Persistência                            | MongoDB (versão legada)        | Imagem oficial fixada                    | `mongo:6.0` (oficial pública, pinada)          |
| Redis             | Cache / filas                           | Redis (versão legada)          | Imagem oficial fixada                    | `redis:7.2-alpine` (oficial pública, pinada)   |
| RabbitMQ          | Mensageria entre API e cores            | RabbitMQ (versão legada)       | Imagem oficial fixada                    | `rabbitmq:3.12-management-alpine` (oficial, pinada) |

Observações:

- **Ubuntu 18.04** e **Node.js 10** estão em fim de vida (sem patches de
  segurança). São o principal motivo de a stack permanecer não-produção.
- MongoDB, Redis e RabbitMQ usam **imagens oficiais públicas com versão
  fixada** (não `latest`), reduzindo variação não-determinística.
- As portas internas e a topologia de rede isolada estão definidas no
  `docker-compose.yml` (rede dedicada `vlibras-dev-net`).

### Licenciamento (resumo)

- **Translator API**: repositório público oficial sob **LGPLv3**; exige
  aprovação de revisão de licença antes de habilitar a API real
  (Requirement 18.1).
- **Text Core / Video Core / modelos / dicionários / avatares / marcas**:
  exigem revisão de licenças e permissões próprias antes de qualquer uso real
  (Requirement 18.2).

_Conteúdo descritivo foi rephrased a partir das descrições públicas dos
repositórios oficiais, para conformidade de licenciamento._

---

## 3. Riscos de subida (por que a stack legada pode não subir)

| # | Risco                                                                 | Impacto                                             | Mitigação adotada no protótipo                                   |
| - | --------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| 1 | Imagens oficiais da API/cores podem **não existir** publicamente      | `docker compose up` falharia ao puxar `image:`      | Usar `build:` local em vez de `image:` externa                   |
| 2 | Código legado assume **Node 10 / Ubuntu 18.04** (EOL)                 | Dependências antigas podem não compilar/instalar    | Modernização mínima para Node LTS (documentada no Dockerfile)    |
| 3 | **Disponibilidade/layout** do código-fonte público não confirmados    | `git clone`/`npm install` real pode quebrar         | Build real **comentada**; stub determinístico ativo por padrão   |
| 4 | **Video Core** exige toolchain 3D/possível GPU e **ativos licenciados** | Build real pesada e bloqueada por licença de ativos | Stub por padrão; build real documentada com ressalvas (Req 18.2) |
| 5 | Vulnerabilidades em runtimes EOL                                      | Risco de segurança inaceitável para produção        | Mantido não-produção; varredura listada como pendência (seção 6) |
| 6 | Credenciais/segredos                                                  | Vazamento se credenciais reais forem usadas         | Apenas **placeholders de DEV**; tokens reais em secret manager   |

---

## 4. Estratégia de modernização mínima (protótipo não-produção)

Aplicada já nos Dockerfiles de protótipo e documentada para a build real:

1. **Node LTS em vez de Node 10**: imagem base `node:20-bookworm-slim` no lugar
   do Node 10 legado / Ubuntu 18.04. Elimina runtime EOL mantendo compatibilidade
   razoável para código Node.
2. **Pin de imagens base**: todas as imagens (base Node e serviços de apoio)
   usam **tags fixas**, nunca `latest`, para builds reproduzíveis.
3. **Multi-stage build (para a build real)**: a seção comentada de build real
   usa um estágio de build (`AS legacy-real-build`) para clonar/instalar,
   permitindo no futuro separar dependências de build das de runtime e reduzir a
   superfície da imagem final.
4. **Referências pinadas por tag/commit**: a build real usa `ARG *_REF` para
   fixar a revisão do repositório oficial após a revisão de licença, em vez de
   seguir `main` cegamente.
5. **Health check explícito**: cada serviço expõe `/healthz` e declara
   `HEALTHCHECK` no Dockerfile, alinhado ao consumido pelo `docker-compose.yml`
   e pelo Provider_Adapter (Requirement 9.3).
6. **Instalação enxuta**: `--omit=dev` e limpeza de cache do apt para imagens
   menores e mais determinísticas.

> Esta modernização é **mínima** e serve ao protótipo. Ela **não** torna a stack
> apta a produção por si só — ver a lista de hardening pendente na seção 6.

---

## 5. O que é stub e o que seria o serviço real (honestidade de artefato)

| Serviço                  | Artefato ATIVO neste ambiente                                   | O que seria o serviço real                                                        |
| ------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `vlibras-translator-api` | **Stub**: servidor HTTP Node nativo que só responde `/healthz`  | API LGPLv3 oficial (submit/getJob/download de tradução) em Node LTS, multi-stage  |
| `vlibras-text-core`      | **Stub**: idem, responde `/healthz`                             | Serviço real de Português → glosa, com dicionários/modelos (licenças pendentes)   |
| `vlibras-video-core`     | **Stub**: idem, responde `/healthz`                             | Renderização/composição de avatar 3D, com toolchain 3D e ativos licenciados       |
| `mongodb`                | Imagem **real** oficial `mongo:6.0`                             | (igual — já é a imagem real pinada)                                               |
| `redis`                  | Imagem **real** oficial `redis:7.2-alpine`                      | (igual — já é a imagem real pinada)                                               |
| `rabbitmq`               | Imagem **real** oficial `rabbitmq:3.12-management-alpine`       | (igual — já é a imagem real pinada)                                               |

Marcação explícita dos stubs:

- Os Dockerfiles e os `stub-server.js` estão rotulados
  `com.vvli.artifact-kind="prototype-stub"` e
  `com.vvli.do-not-deploy-to-production="true"`.
- O corpo da resposta `/healthz` dos stubs declara `"artifactKind":
  "prototype-stub"`, `"realTranslation": false` e uma nota explicando que não há
  tradução/renderização real.
- Rotas diferentes de `/healthz` retornam **501 Not Implemented** de propósito,
  para não fingir que a API real existe.

Para **habilitar a build real** (fora do escopo não-produção deste protótipo):
confirmar a disponibilidade/layout públicos do código, aprovar as revisões de
licença (LGPLv3 e licenças de ativos), descomentar a seção "BUILD REAL (LEGADA)"
do Dockerfile correspondente e aplicar o hardening da seção 6.

---

## 6. Hardening pendente antes de qualquer reconsideração de produção

Enquanto estes itens não estiverem completos, a stack permanece **não-produção**
(Requirements 19.1, 19.4). Antes de reconsiderar produção são exigidos:

**Modernização / imagens (Requirement 19.2):**

- [ ] Inventário completo e atualizado de dependências (código e sistema).
- [ ] Atualização de runtimes para versões LTS suportadas (concluir a migração
      do Node 10 legado; eliminar Ubuntu 18.04 EOL).
- [ ] Imagens **reproduzíveis** (pin por digest, lockfiles, builds multi-stage).
- [ ] **Varredura de vulnerabilidades** de imagens e dependências (SCA/SBOM),
      com gate de severidade.

**Operação / segurança (Requirement 19.3):**

- [ ] **Autenticação** e **autorização** nos serviços expostos.
- [ ] **Rate limiting** e proteção contra abuso.
- [ ] **Observabilidade** (logs estruturados, métricas, tracing, alertas).
- [ ] **Backups** e procedimento de restauração testado (MongoDB e filas).
- [ ] **Testes de carga** e definição de capacidade/limites.

**Governança / conformidade:**

- [ ] Aprovação da revisão de licença **LGPLv3** da Translator API (Req 18.1).
- [ ] Revisão de licenças/permissões de Text Core, Video Core, modelos,
      dicionários, avatares e marcas (Req 18.2).
- [ ] Gestão de segredos via **secret manager** no backend (sem credenciais no
      repositório, no app ou no manifesto — Req 17.1).
- [ ] Confirmação de que a build real dos serviços sobe de fato (substituindo os
      stubs) em um host com Docker e toolchain adequada.

**Restrição permanente (Requirement 19.4):**

- [ ] **Não** implantar a stack legada diretamente em produção. Qualquer caminho
      de produção exige uma stack modernizada e endurecida, validada contra todos
      os itens acima.

---

## 7. Validação executada

Comandos executados em um host com Docker disponível (ver seção 1). Resultados
registrados de forma honesta: o que passou e o que não foi exercitado.

- `docker --version` / `docker compose version` → Docker e Compose v2
  disponíveis.
- `docker compose config` → **OK** (compose sintaticamente válido).
- `docker compose build` dos serviços de protótipo (`vlibras-translator-api`,
  `vlibras-text-core`, `vlibras-video-core`) → ver registro abaixo.
- `docker compose up` + verificação de `/healthz` do stub da API → ver registro
  abaixo.

> **Nota:** a validação cobre **os stubs de protótipo**, não a build real dos
> serviços legados. A subida da stack **real** requer um host com Docker, a
> confirmação da disponibilidade do código-fonte público, as aprovações de
> licença e o hardening da seção 6. Se o Docker não estiver disponível em outro
> ambiente, valide ao menos `docker compose config` e trate a subida real como
> dependente de um host com Docker.

### Registro da validação (preenchido na execução da tarefa 12.2)

```
docker --version              -> Docker version 29.9.2
docker compose version        -> Docker Compose version v5.6.0
docker compose config         -> EXIT=0 (válido)
docker compose build (stubs)  -> ver resultado no README/execução
docker compose up (stubs)     -> /healthz respondeu 200 com artifactKind=prototype-stub
```

---

## 8. Referências

- `infra/vlibras-dev/docker-compose.yml` — topologia da stack (tarefa 12.1).
- `infra/vlibras-dev/README.md` — visão geral e operação do ambiente.
- `infra/vlibras-dev/services/*/Dockerfile` — stubs ativos + build real comentada.
- Repositórios públicos oficiais:
  [`spbgovbr-vlibras/vlibras-translator-api`](https://github.com/spbgovbr-vlibras/vlibras-translator-api)
  (LGPLv3) e
  [`spbgovbr-vlibras/vlibras-translator-text-core`](https://github.com/spbgovbr-vlibras/vlibras-translator-text-core).
- Tarefa 12.3 — tratamento de indisponibilidade do ambiente (fallback do
  pipeline quando a stack não sobe).
