# ============================================================
#  Umbrella - Script de apresentacao (tunelamento)
#  Sobe API Java + Expo Web e cria tuneis Cloudflare publicos.
#  Ajusta o .env do front automaticamente com a URL da API.
# ============================================================

$ErrorActionPreference = 'Stop'

# --- Caminhos ---
$Root        = $PSScriptRoot
$BackendDir  = Join-Path $Root 'backend\umbrella_api'
$FrontendDir = Join-Path $Root 'frontend\umbrellaApp'
$FrontEnv    = Join-Path $FrontendDir '.env'
$Cloudflared = Join-Path $env:USERPROFILE 'cloudflared\cloudflared.exe'
$LogDir      = Join-Path $env:TEMP 'umbrella-demo-logs'

# --- Conta de professor criada automaticamente (seed) ---
$ProfName  = 'Professor Demo'
$ProfEmail = 'professor@umbrella.com'
$ProfPass  = 'professor123'

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
$ApiTunnelBase = Join-Path $LogDir 'api-tunnel'
$WebTunnelBase = Join-Path $LogDir 'web-tunnel'

Write-Host ''
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '  UMBRELLA - Iniciando ambiente de apresentacao' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host ''

# --- Checagens ---
if (-not (Test-Path $Cloudflared)) {
    Write-Host "[ERRO] cloudflared nao encontrado em: $Cloudflared" -ForegroundColor Red
    Write-Host 'Baixe em https://github.com/cloudflare/cloudflared/releases e coloque nesse caminho.' -ForegroundColor Yellow
    Read-Host 'Pressione ENTER para sair'
    exit 1
}

# Funcao: le a URL publica gerada pelo cloudflared.
# O cloudflared escreve no stderr, entao procuramos no .log E no .err.log.
function Wait-TunnelUrl($logBase, $label) {
    Write-Host "Aguardando URL do tunel ($label)..." -ForegroundColor DarkGray
    $files = @("$logBase.log", "$logBase.err.log")
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        foreach ($f in $files) {
            if (Test-Path $f) {
                $match = Select-String -Path $f -Pattern 'https://[-a-z0-9]+\.trycloudflare\.com' -ErrorAction SilentlyContinue |
                         Select-Object -First 1
                if ($match) {
                    return $match.Matches[0].Value
                }
            }
        }
    }
    return $null
}

# ============================================================
# 1) BACKEND (API Java) - carrega .env e sobe Spring Boot
# ============================================================
Write-Host '[1/4] Subindo API Java (porta 8080)...' -ForegroundColor Green

$RunBackend = Join-Path $Root 'run-backend.ps1'
Start-Process -FilePath 'powershell.exe' `
    -ArgumentList '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $RunBackend | Out-Null

# Espera a API responder localmente antes de abrir o tunel (evita erro 502)
Write-Host '   Aguardando a API ficar pronta (pode levar ate ~90s na 1a vez)...' -ForegroundColor DarkGray
$apiReady = $false
for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 2
    try {
        $probe = Invoke-WebRequest -Uri 'http://localhost:8080/api/public/courses/list' -UseBasicParsing -TimeoutSec 4
        if ($probe.StatusCode -ge 200 -and $probe.StatusCode -lt 500) { $apiReady = $true; break }
    } catch {
        # 4xx tambem significa que a API esta de pe
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) { $apiReady = $true; break }
    }
}
if ($apiReady) {
    Write-Host '   API respondendo em http://localhost:8080' -ForegroundColor White
} else {
    Write-Host '   [AVISO] A API demorou a responder. Verifique a janela da API Java.' -ForegroundColor Yellow
    Write-Host '   O tunel sera criado mesmo assim; se der 502, aguarde a API terminar de subir.' -ForegroundColor Yellow
}

# --- Cria a conta de professor automaticamente (banco H2 zera a cada reinicio) ---
if ($apiReady) {
    Write-Host '   Criando conta de professor...' -ForegroundColor DarkGray
    $body = @{
        name          = $ProfName
        email         = $ProfEmail
        password      = $ProfPass
        neurodivergence = $null
        role          = 'ROLE_TEACHER'
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/register' `
            -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 10 | Out-Null
        Write-Host '   Conta de professor criada.' -ForegroundColor White
    } catch {
        # Se o professor ja existe (email unico), a API retorna erro - tudo bem.
        Write-Host '   (Professor ja existia ou nao foi possivel criar - seguindo.)' -ForegroundColor DarkGray
    }
}

# ============================================================
# 2) TUNEL DA API
# ============================================================
Write-Host '[2/4] Criando tunel da API...' -ForegroundColor Green
Remove-Item "$ApiTunnelBase.log","$ApiTunnelBase.err.log" -Force -ErrorAction SilentlyContinue
Start-Process -FilePath $Cloudflared `
    -ArgumentList 'tunnel', '--url', 'http://localhost:8080' `
    -RedirectStandardOutput "$ApiTunnelBase.log" `
    -RedirectStandardError "$ApiTunnelBase.err.log" `
    -WindowStyle Minimized | Out-Null

$ApiUrl = Wait-TunnelUrl $ApiTunnelBase 'API'
if (-not $ApiUrl) {
    Write-Host '[ERRO] Nao consegui obter a URL do tunel da API.' -ForegroundColor Red
    Read-Host 'Pressione ENTER para sair'
    exit 1
}
Write-Host "   API publica: $ApiUrl" -ForegroundColor White

# ============================================================
# 3) Atualiza o .env do front com a URL publica da API
# ============================================================
Write-Host '[3/4] Ajustando .env do front e subindo Expo Web (porta 8081)...' -ForegroundColor Green
$envContent = @"
EXPO_PUBLIC_UMBRELLA_PUBLIC_API_URL="$ApiUrl/api/"
EXPO_PUBLIC_REQUEST_TIME_OUT="20000"
"@
Set-Content -Path $FrontEnv -Value $envContent -Encoding UTF8

# Sobe o Expo Web
$RunFrontend = Join-Path $Root 'run-frontend.ps1'
Start-Process -FilePath 'powershell.exe' `
    -ArgumentList '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $RunFrontend | Out-Null

# ============================================================
# 4) TUNEL DO FRONT
# ============================================================
Write-Host '[4/4] Criando tunel do front...' -ForegroundColor Green
Remove-Item "$WebTunnelBase.log","$WebTunnelBase.err.log" -Force -ErrorAction SilentlyContinue
# Da um tempo pro Expo comecar a servir antes de abrir o tunel
Start-Sleep -Seconds 20
Start-Process -FilePath $Cloudflared `
    -ArgumentList 'tunnel', '--url', 'http://localhost:8081' `
    -RedirectStandardOutput "$WebTunnelBase.log" `
    -RedirectStandardError "$WebTunnelBase.err.log" `
    -WindowStyle Minimized | Out-Null

$WebUrl = Wait-TunnelUrl $WebTunnelBase 'Front'
if (-not $WebUrl) {
    Write-Host '[ERRO] Nao consegui obter a URL do tunel do front.' -ForegroundColor Red
    Read-Host 'Pressione ENTER para sair'
    exit 1
}

# ============================================================
# RESULTADO
# ============================================================
Write-Host ''
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '  PRONTO! Compartilhe o link do FRONT com seu amigo:' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "  >> APP (abrir no navegador):" -ForegroundColor Yellow
Write-Host "     $WebUrl" -ForegroundColor White
Write-Host ''
Write-Host "  >> LOGIN DO PROFESSOR (ja criado automaticamente):" -ForegroundColor Yellow
Write-Host "     Email: $ProfEmail" -ForegroundColor White
Write-Host "     Senha: $ProfPass" -ForegroundColor White
Write-Host ''
Write-Host "  (API publica: $ApiUrl )" -ForegroundColor DarkGray
Write-Host ''
Write-Host '  DICAS:' -ForegroundColor DarkGray
Write-Host '  - Deixe TODAS as janelas abertas durante a gravacao.' -ForegroundColor DarkGray
Write-Host '  - O banco e em memoria: dados somem ao reiniciar a API.' -ForegroundColor DarkGray
Write-Host '  - Para encerrar tudo, rode stop-demo.bat (ou feche as janelas).' -ForegroundColor DarkGray
Write-Host ''

# Copia a URL do front pra area de transferencia (facilita colar)
try { Set-Clipboard -Value $WebUrl; Write-Host '  (A URL do app foi copiada para a area de transferencia.)' -ForegroundColor DarkGray } catch {}

# Salva tudo num arquivo fixo e abre, pra voce nao depender desta janela
$OutFile = Join-Path $Root 'demo-urls.txt'
$texto = @"
==========================================================
  UMBRELLA - Dados da apresentacao
  (gerado em $(Get-Date -Format 'dd/MM/yyyy HH:mm'))
==========================================================

APP (abrir no navegador):
  $WebUrl

LOGIN DO PROFESSOR:
  Email: $ProfEmail
  Senha: $ProfPass

API publica:
  $ApiUrl

Lembretes:
- Deixe as janelas abertas durante a gravacao.
- Banco em memoria: dados somem ao reiniciar a API.
- Para encerrar tudo: stop-demo.bat
"@
Set-Content -Path $OutFile -Value $texto -Encoding UTF8
Write-Host "  (Os dados tambem foram salvos em: $OutFile)" -ForegroundColor DarkGray
try { Start-Process notepad.exe $OutFile } catch {}

Write-Host ''
Read-Host 'Pressione ENTER para fechar esta janela (os servicos continuam rodando)'
