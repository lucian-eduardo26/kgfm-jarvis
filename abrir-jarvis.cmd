@echo off
REM Abre o Jarvis. Clique duas vezes neste arquivo.
REM
REM A versao anterior abria o navegador ANTES de o servidor subir, e dava
REM "nao e possivel conectar". Agora ele espera a porta responder para so
REM entao abrir a tela.
REM
REM O servidor fica preso a esta janela: fechar a janela derruba o Jarvis.

cd /d "%~dp0"
title Jarvis KGFM - nao feche esta janela
echo.
echo   Subindo o Jarvis. Leva alguns segundos na primeira vez...
echo.

start "" /b cmd /c "npm run dev -- --port 3210"

set TENTATIVAS=0
:espera
set /a TENTATIVAS+=1
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri http://localhost:3210/entrar -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 goto pronto
if %TENTATIVAS% GEQ 60 goto desistiu
goto espera

:desistiu
echo.
echo   O servidor nao subiu em 60 segundos. Rode "npm run dev" aqui dentro
echo   para ver o erro.
echo.
pause
exit /b 1

:pronto
start "" http://localhost:3210/painel
echo.
echo   Jarvis no ar.
echo.
echo   Neste PC:     http://localhost:3210
echo.
echo   No celular (mesmo wi-fi), use um destes:
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '172.2*' } ^| ForEach-Object { '      http://' + $_.IPAddress + ':3210' }"') do echo %%i
echo.
echo   Senha: jarvis2026
echo.
echo   FECHAR ESTA JANELA DERRUBA O JARVIS.
echo.
pause >nul
