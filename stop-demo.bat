@echo off
REM ============================================================
REM  Umbrella - Encerra o ambiente de apresentacao
REM  Mata os tuneis Cloudflare, a API Java e o Expo.
REM ============================================================
title Umbrella - Encerrando apresentacao

echo Encerrando tuneis Cloudflare...
taskkill /IM cloudflared.exe /F >nul 2>&1

echo Encerrando API Java (Maven/Spring Boot)...
REM Mata processos java (API). Atencao: fecha QUALQUER java aberto.
taskkill /IM java.exe /F >nul 2>&1

echo Encerrando Expo / Metro (node)...
REM Mata o bundler do Expo na porta 8081, se estiver rodando.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

echo.
echo Pronto. Ambiente de apresentacao encerrado.
echo (Se alguma janela do PowerShell continuar aberta, pode fecha-la.)
echo.
pause
