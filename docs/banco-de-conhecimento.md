# Banco de conhecimento, e o que eu acho do Obsidian

Pergunta do Lucian em 10/09/2026: *"pensei em integrar com Obsidian pra não
pesar o Claude, nem hospedagem nem outras coisas"*.

## Primeiro: a premissa está errada, e é boa notícia

Texto não pesa. Dez anos de insights, capturas, sínteses e reuniões dão alguns
megabytes. O plano gratuito do Neon dá 0,5 GB - **cabe umas cem vezes**. E o
custo da API não sobe com o tamanho do banco: sobe com o quanto se manda para o
modelo em cada pergunta, e isso quem escolhe é o código, não o acervo.

Então "não pesar" não é motivo para tirar o conhecimento do Jarvis. Se um dia
pesar, o problema é seleção - mandar só o trecho relevante - e não lugar de
guardar.

## Segundo: o motivo verdadeiro de querer Obsidian é outro, e é legítimo

Você quer **pensar em grafo**: nota puxando nota, backlink, mapa de ideias.
Isso o Jarvis não faz e nem deveria fazer - ele é painel de decisão, não
ferramenta de escrita longa.

## Terceiro: o custo que a integração cobra

O Obsidian é uma pasta de arquivos `.md` no seu PC. O Jarvis roda na Vercel.
Um não enxerga o outro. Para ligar os dois só existem caminhos ruins:

- Sincronizar o cofre para um repositório que o app leia - mais um lugar para
  quebrar, e o conteúdo sai do seu controle.
- Um script no seu PC empurrando arquivo para a API - é o vigia do CRM de novo,
  mais uma coisa que precisa estar no ar.

Os dois são **camada de tradução entre ferramentas**, que é exatamente onde a
tentativa com o Zapier quebrou e está proibida no briefing.

## O que eu recomendo

**O conhecimento mora no Jarvis. O Obsidian é espelho, não fonte.**

1. **Guardar continua sendo captura.** `item` com tipo `insight` já existe, já
   liga em área, projeto e objetivo. A frase da feira, a citação do livro, a
   ideia no carro - tudo entra pela mesma caixa, em menos de dez segundos.
2. **Um botão de exportar**, uma via só, sem dependência: o Jarvis escreve os
   insights como arquivos `.md` numa pasta do seu cofre do Obsidian, com as
   ligações já feitas (`[[projeto]]`, `[[objetivo]]`, `[[tema]]`). Se o
   Obsidian sumir amanhã, o Jarvis continua inteiro.
3. **Ler nunca depende do Obsidian.** Quando você perguntar "o que eu já sabia
   sobre transportador de caixas?", quem responde é o Jarvis, com o que está no
   banco. Nada de ir buscar no seu PC.

Uma via só é o que torna isso barato: exportar é escrever arquivo. Importar de
volta seria sincronizar - e sincronizar é onde integração morre.

## A ordem em que isso deve entrar

Depois do sistema funcionar, e nesta ordem:

1. **Recuperar o que já foi capturado** dentro do próprio Jarvis - busca por
   texto e por tema. Sem isso, o acervo é depósito, não conhecimento, e
   exportar um depósito não melhora nada.
2. **Ligar insight a projeto e a objetivo** na hora da captura, pela IA.
   É o que faz o insight reaparecer quando o assunto volta - que era a promessa
   original do briefing.
3. **Só então o export para o Obsidian**, se ainda fizer falta. É bem possível
   que não faça: a razão de existir do cofre é encontrar o que você guardou, e
   os passos 1 e 2 já resolvem isso.

Registrado no BACKLOG.
