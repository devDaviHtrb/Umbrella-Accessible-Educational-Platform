# Auxiliar: sobe o Expo Web na porta 8081.
# Chamado por start-demo.ps1.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\frontend\umbrellaApp
Write-Host 'Subindo Expo Web (porta 8081)...' -ForegroundColor Green
& npx expo start --web --port 8081
