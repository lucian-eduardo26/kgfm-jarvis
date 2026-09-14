@echo off
REM DESLIGA O JARVIS.
REM
REM Passou a existir em 14/09/2026, junto com o servidor sem janela. Antes o
REM jeito de desligar era fechar a janela preta; agora nao ha janela, entao
REM precisa haver um botao.
REM
REM Derruba quem estiver ESCUTANDO A PORTA 3210, e so isso. Nao mata "todo
REM node.exe da maquina" de proposito: o vigia da prospeccao tambem e node, e
REM derrubar o vigia junto seria consertar uma coisa quebrando outra.
REM
REM Em PowerShell e nao em findstr: ler a saida do netstat com "tokens=5"
REM depende do alinhamento das colunas, que muda com o tamanho do PID e com o
REM idioma do Windows. Get-NetTCPConnection devolve o numero, nao um texto
REM para alguem recortar.

powershell -NoProfile -Command ^
  "$p = Get-NetTCPConnection -LocalPort 3210 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique;" ^
  "if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Host ''; Write-Host '   Jarvis desligado.' }" ^
  "else { Write-Host ''; Write-Host '   O Jarvis nao estava rodando nesta maquina.' }"

echo.
timeout /t 3 /nobreak >nul
exit /b 0
