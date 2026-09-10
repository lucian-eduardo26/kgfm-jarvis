@echo off
REM Abre o Jarvis. Clique duas vezes neste arquivo.
REM O servidor fica preso a esta janela: fechar a janela derruba o Jarvis.
cd /d "%~dp0"
echo Subindo o Jarvis...
start "" http://localhost:3210/painel
call npm run dev -- --port 3210
