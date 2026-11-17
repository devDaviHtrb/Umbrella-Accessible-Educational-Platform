# Abre as portas 8080 (backend) e 8081 (Expo/Metro) no firewall do Windows
# para permitir que o celular acesse o servidor pela rede local.
# Execute como Administrador.

$rules = @(
    @{ Name = "Umbrella Backend 8080"; Port = 8080 },
    @{ Name = "Umbrella Expo 8081";    Port = 8081 }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Regra '$($r.Name)' ja existe. Pulando." -ForegroundColor Yellow
        continue
    }
    New-NetFirewallRule -DisplayName $r.Name `
        -Direction Inbound `
        -LocalPort $r.Port `
        -Protocol TCP `
        -Action Allow `
        -Profile Private | Out-Null
    Write-Host "Regra criada: $($r.Name) (porta $($r.Port))" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pronto! As portas 8080 e 8081 estao liberadas na rede privada." -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para fechar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
