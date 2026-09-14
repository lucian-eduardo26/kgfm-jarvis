@echo off
REM Abre o Jarvis. Clique duas vezes neste arquivo.
REM
REM Duas linhas so: o trabalho todo mora em jarvis.vbs, que roda o servidor
REM SEM JANELA. Este arquivo continua existindo porque o atalho do Lucian
REM aponta para ele - e atalho que para de funcionar e pior do que arquivo
REM a mais.
REM
REM A janelinha preta que pisca agora e esta aqui, e ela fecha sozinha.
REM Para desligar o Jarvis: fechar-jarvis.cmd, nesta mesma pasta.

start "" wscript.exe "%~dp0jarvis.vbs"
exit /b 0
