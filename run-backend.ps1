# Auxiliar: carrega o .env e sobe a API Spring Boot.
# Chamado por start-demo.ps1. Nao rodar isolado a menos que queira so a API.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\backend\umbrella_api

# Carrega cada KEY=VALUE do .env como variavel de ambiente do processo.
foreach ($line in (Get-Content .env -Encoding UTF8)) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $k = $matches[1]
        $v = $matches[2]
        if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        Set-Item -Path "env:$k" -Value $v
    }
}

Write-Host "DB_URL carregada: $env:DB_URL" -ForegroundColor DarkGray
Write-Host 'Subindo Spring Boot (mvnw spring-boot:run)...' -ForegroundColor Green
& .\mvnw.cmd spring-boot:run
