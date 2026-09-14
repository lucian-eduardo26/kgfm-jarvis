' SOBE O JARVIS SEM JANELA NENHUMA.
'
' O Lucian em 14/09/2026: "quando subo o Jarvis no PC fica a janela do cmd
' aberta, diz primeira vez, mas todas estao ficando".
'
' Ele estava certo nas duas coisas, e eram dois defeitos:
'
' 1. A JANELA FICAVA PORQUE TINHA DE FICAR. O launcher antigo rodava o
'    servidor como filho da propria janela e terminava em "pause", com o
'    aviso "FECHAR ESTA JANELA DERRUBA O JARVIS". Nao era sobra: era a
'    arquitetura. Fechar a janela matava o servidor mesmo.
'
' 2. E ELAS SE ACUMULAVAM. Nada checava se o Jarvis JA estava no ar, entao
'    cada duplo clique subia mais um servidor na mesma porta. O segundo
'    falhava em silencio e deixava mais uma janela na barra de tarefas.
'
' Agora o servidor nasce solto do Script Host do Windows, com janela zero -
' o Windows nao consegue rodar um .cmd sem janela, o wscript consegue. E se
' a porta 3210 ja responde, este script NAO sobe nada: so abre a tela.
'
' Como o servidor nao tem mais janela, quem desliga e o "fechar-jarvis.cmd".
' A saida do servidor vai para jarvis.log, nesta pasta - sem janela nao ha
' console para ler o erro.

Option Explicit

Const PORTA = 3210
Const ENDERECO_TESTE = "http://localhost:3210/entrar"
Const ENDERECO_ABRIR = "http://localhost:3210/painel"
Const ESPERA_MAXIMA = 60

Dim sh, fso, pasta
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
pasta = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = pasta

' ---------------------------------------------------------------------------
' Ja esta no ar? Entao so abre a tela. Isto e o que impede a pilha de janelas.
' ---------------------------------------------------------------------------
If Responde() Then
  sh.Run ENDERECO_ABRIR, 1, False
  WScript.Quit 0
End If

' ---------------------------------------------------------------------------
' Nao esta: sobe escondido e espera a porta responder.
' ---------------------------------------------------------------------------
Dim comando
comando = "cmd /c set ""PATH=C:\Program Files\nodejs;%PATH%"" && " & _
          "npm run dev -- --port " & PORTA & " > jarvis.log 2>&1"

' O 0 e o que faz a diferenca: janela escondida. O False e para nao esperar.
sh.Run comando, 0, False

Dim tentativas
tentativas = 0
Do While tentativas < ESPERA_MAXIMA
  WScript.Sleep 1000
  tentativas = tentativas + 1
  If Responde() Then
    sh.Run ENDERECO_ABRIR, 1, False
    WScript.Quit 0
  End If
Loop

' Falhou. Aqui a janela APARECE de proposito: erro em silencio e pior do que
' erro na cara, e sem console ele nao teria como saber o que houve.
MsgBox "O Jarvis nao subiu em " & ESPERA_MAXIMA & " segundos." & vbCrLf & vbCrLf & _
       "O motivo esta em jarvis.log, nesta pasta:" & vbCrLf & pasta, _
       vbExclamation, "Jarvis KGFM"
WScript.Quit 1

' ---------------------------------------------------------------------------

Function Responde()
  Dim http
  Responde = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.XMLHTTP")
  http.Open "GET", ENDERECO_TESTE, False
  http.Send
  If Err.Number = 0 Then
    If http.Status > 0 Then Responde = True
  End If
  Err.Clear
  On Error GoTo 0
End Function
