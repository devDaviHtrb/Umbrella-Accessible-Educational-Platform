# Deploy: Supabase (banco) + Render (backend Java)

Guia para hospedar o backend Spring Boot no **Render**, com o Postgres no
**Supabase**. O worker **transformer** (Whisper+Gemini) continua rodando local,
exposto por **ngrok** na porta 8000.

Arquitetura final:

```
APK / Web  ──HTTPS──▶  Render (Spring Boot)  ──TLS──▶  Supabase (Postgres)
                              │
                              └──HTTPS (ngrok)──▶  seu PC (transformer :8000)
```

Cloudinary já é nuvem e não muda.

---

## Parte 1 — Supabase (banco de dados)

1. Em [supabase.com](https://supabase.com), abra (ou crie) o projeto.
2. Guarde a **senha do banco** (a que você definiu ao criar o projeto). Se
   esqueceu: *Project Settings → Database → Reset database password*.
3. Clique no botão **Connect** (topo do dashboard).
4. Escolha a aba **Session pooler** (NÃO "Transaction" nem "Direct").
   > Por quê: o Render não tem IPv6 de saída, e a conexão *direct* do Supabase
   > é IPv6 → falharia. O **Session pooler** é IPv4 e suporta prepared
   > statements (necessário para o Hibernate). O "Transaction pooler" (porta
   > 6543) quebra prepared statements → não usar.
5. Copie a string. Ela tem este formato (porta **5432**, host **pooler**):

   ```
   postgresql://postgres.SEU_PROJECT_REF:SUA_SENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
   ```

A partir dela, monte os 3 valores que o Render vai usar (formato JDBC):

| Variável no Render | Valor |
|---|---|
| `DB_URL`  | `jdbc:postgresql://aws-0-REGIAO.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_USER` | `postgres.SEU_PROJECT_REF` |
| `DB_PASS` | a senha do banco |

> Observações:
> - Mantenha o `?sslmode=require` no fim da `DB_URL` (o Supabase exige TLS).
> - Se a senha tiver caracteres especiais (`@ : / ?`), eles vão em `DB_PASS`
>   como texto puro (não precisa URL-encode, porque não está na URL).
> - O `ddl-auto=update` cria as tabelas automaticamente no primeiro boot.

---

## Parte 2 — Render (backend)

O repositório já contém um **`render.yaml`** (Blueprint) na raiz, que descreve
o serviço. Passos:

1. Faça commit e push de tudo para o GitHub (branch `main`):
   ```
   git add render.yaml backend/umbrella_api/src/main/resources/application.yaml docs/deploy-render-supabase.md
   git commit -m "deploy: config Render + Supabase para o backend"
   git push origin main
   ```
2. Em [dashboard.render.com](https://dashboard.render.com): **New → Blueprint**.
3. Selecione o repositório `Umbrella-Accessible-Educational-Platform`.
   O Render lê o `render.yaml` e propõe criar o serviço **umbrella-api**.
4. Clique em **Apply**. O Render vai pedir os valores das variáveis marcadas
   como segredo (`sync: false`). Preencha:

   | Variável | Valor |
   |---|---|
   | `DB_URL` | (da Parte 1) |
   | `DB_USER` | (da Parte 1) |
   | `DB_PASS` | (da Parte 1) |
   | `JWT_SECRET` | o mesmo do seu `.env` (ou gere um novo forte) |
   | `GEMINI_API_KEY` | chave Gemini do backend/tutor |
   | `TRANSFORMER_BASE_URL` | URL pública do ngrok do transformer (ver Parte 3) |
   | `TRANSFORMER_GEMINI_KEY` | chave Gemini dedicada do worker |
   | `CLOUDINARY_NAME` | `dnet6nodm` |
   | `CLOUDINARY_KEY` | `365668241155358` |
   | `CLOUDINARY_SECRET` | o secret do Cloudinary |

   As não-secretas (`SPRING_JPA_HIBERNATE_DDL_AUTO=update`,
   `SPRING_JPA_SHOW_SQL=false`, `IA_MODEL_INSTRUCTIONS=nothing`,
   `TRANSFORMER_TIMEOUT=1800`) já vêm preenchidas pelo Blueprint.
5. O Render builda a imagem a partir do `dockerfile` e sobe o serviço.
   A URL pública fica algo como `https://umbrella-api.onrender.com`.
6. Teste: abra `https://umbrella-api.onrender.com/api/public` no navegador —
   deve responder a mensagem de rota pública.

> **Plano free do Render**: o serviço "dorme" após ~15 min sem tráfego; a
> primeira requisição depois disso leva ~30–60s para acordar. O backend está
> configurado (Hikari) para tolerar esse cold start sem cair.

---

## Parte 3 — Transformer local via ngrok (porta 8000)

O transformer continua no seu PC (container Docker). Para o Render alcançá-lo,
exponha a porta 8000 com um túnel ngrok **separado** do que você já usa para
testar o backend:

```
ngrok http 8000
```

Copie a URL `https://XXXX.ngrok-free.app` e coloque em `TRANSFORMER_BASE_URL`
no Render. Toda vez que o ngrok reiniciar, a URL muda → atualize a variável no
Render (Settings → Environment) e o serviço reinicia sozinho.

> Enquanto você não ligar esse túnel, o backend sobe normalmente; só a
> **geração automática de legendas** fica indisponível (dá erro/timeout ao
> enviar vídeo). Todo o resto (login, cursos, materiais, mensagens,
> notificações) funciona sem o transformer.

---

## Parte 4 — Apontar o app para o backend hospedado

No `frontend/umbrellaApp`:

1. `.env`:
   ```
   EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL="https://umbrella-api.onrender.com/api/"
   ```
2. `eas.json` (perfil `preview`, bloco `env`): troque a URL do ngrok pela do
   Render — ela precisa estar aqui porque o EAS não lê o `.env` local na nuvem.
3. Rebuild do APK:
   ```
   npx eas build --platform android --profile preview
   ```

Depois disso o APK fala direto com o Render e **não depende mais do seu PC**
(exceto para gerar legendas, que ainda usa o transformer local via ngrok).
