@echo off
REM PUBLICAR O JARVIS - clique duas vezes neste arquivo.
REM
REM Manda para o site o que o Claude escreveu aqui no PC. O link NUNCA muda:
REM https://kgfm-jarvis.vercel.app  - so o conteudo dele fica mais novo.
REM
REM Existe porque a trava de seguranca do Claude Code nao deixa ele mandar
REM codigo para fora sozinho. E uma protecao boa; o preco e este clique.

cd /d "%~dp0"
title Publicando o Jarvis
echo.
echo   Publicando o Jarvis...
echo.

git push
if errorlevel 1 goto erro

echo.
echo   ================================================
echo    ENVIADO. A Vercel esta montando a versao nova.
echo.
echo    Espere cerca de 1 minuto e abra:
echo    https://kgfm-jarvis.vercel.app
echo.
echo    Se ja estiver aberto no celular, feche o
echo    aplicativo e abra de novo - o link e o mesmo.
echo   ================================================
echo.
pause
exit /b 0

:erro
echo.
echo   Nao consegui enviar. Se pediu login do GitHub, faca e clique de novo.
echo   Se disser "everything up-to-date", nao havia nada novo para mandar.
echo.
pause
exit /b 1
