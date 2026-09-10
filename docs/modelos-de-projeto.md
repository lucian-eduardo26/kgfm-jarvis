# Modelos de projeto: a WBS que nasce do tipo, e o cronograma que sai dela

Proposta escrita em 10/09/2026, a partir da descrição do Lucian por áudio.
Nada disto está implementado ainda - é o desenho para ele corrigir antes.

## O problema com a WBS de hoje

`src/lib/wbs.ts` tem UM modelo só, e ele se desdobra pela fase do projeto.
Serve para um sistema de automação vendido do zero. Não serve para o Batoque
do Logimat, que é peça usinada e não tem concepção técnica nenhuma - tem
fornecedor, pedido, fabricação e logística.

Forçar os dois no mesmo molde produz o pior dos dois mundos: pacote vazio que
ninguém fecha, e etapa real que não existe em lugar nenhum.

## A ideia central: TIPO decide a corrente, FASE decide até onde ela desenrolou

Dois eixos, e não um:

- **tipo** - que corrente de trabalho este projeto é.
- **fase** - até onde essa corrente já foi desdobrada.

O que existe hoje (`Projeto.fase`) continua. Entra `Projeto.tipo`.

## Os dois tipos, escritos como ele descreveu

### Tipo `peca` - peça usinada, spare part

A corrente do Batoque do Logimat. Quase tudo é ADM e Produção; engenharia
não aparece porque o desenho já existe.

| # | pacote | área | quem segura | condição |
|---|---|---|---|---|
| 1 | Cotação com o fornecedor | adm | eu | sempre |
| 2 | Atualizar preço e fechar | adm | terceiro | sempre |
| 3 | Colocar o pedido | adm | eu | sempre |
| 4 | Logística de envio da matéria-prima | producao | terceiro | **se a MP for nossa** |
| 5 | Fabricação | producao | terceiro | sempre |
| 6 | Logística de retirada da peça | producao | terceiro | sempre |
| 7 | Revestimento ou banho | producao | terceiro | **se tiver revestimento** |
| 8 | Logística de ida para o revestimento | producao | terceiro | **se tiver revestimento** |
| 9 | Logística de retorno do revestimento | producao | terceiro | **se tiver revestimento** |
| 10 | Embalagem | producao | eu | sempre |
| 11 | Logística para o cliente | producao | terceiro | sempre |
| 12 | Faturar e cobrar | adm | eu | sempre |

Duas perguntas geram quatro correntes diferentes: *a matéria-prima sai
daqui?* e *tem banho?*. É por isso que o modelo precisa de CONDIÇÃO, e não de
uma lista fixa - senão viram quatro modelos para manter, e três deles vão
ficar desatualizados.

### Tipo `sistema` - sistema de automação

Aqui a fase importa, porque antes do pedido é aposta e depois é obrigação.

**Fase `descoberta`** (custo de venda; o cliente ainda pode não comprar)

| # | pacote | área | quem segura |
|---|---|---|---|
| 1 | Reunião inicial | comercial | cliente |
| 2 | Visita presencial e levantamento | comercial | eu |
| 3 | Transcrição e resumo da visita | engenharia | eu |
| 4 | Análise do layout atual | engenharia | eu |
| 5 | E-mail de kick-off com a lista de dados | engenharia | eu |
| 6 | Cliente responder os dados | engenharia | **cliente** |
| 7 | Análise das respostas | engenharia | eu |
| 8 | Reunião de alinhamento | comercial | cliente |

**Fase `proposta`**

| # | pacote | área | quem segura |
|---|---|---|---|
| 9 | Gerar o layout proposto | engenharia | eu |
| 10 | Apresentar o layout | comercial | cliente |
| 11 | Ajustes do layout | engenharia | eu |
| 12 | Precificar e montar a proposta | adm | eu |
| 13 | Apresentar a proposta | comercial | cliente |
| 14 | Negociação e fechamento | comercial | cliente |

**Fase `execucao`** (só existe depois do pedido)

| # | pacote | área | quem segura |
|---|---|---|---|
| 15 | Pedido formal e cadastro | adm | eu |
| 16 | Projeto executivo e detalhamento | engenharia | eu |
| 17 | Aprovação do executivo com o cliente | engenharia | cliente |
| 18 | Compra de material | adm | eu |
| 19 | Contratos com fornecedores | adm | eu |
| 20 | Fabricação | producao | terceiro |
| 21 | Logística para a obra | producao | terceiro |
| 22 | Montagem e mão de obra | producao | eu |
| 23 | Gestão da equipe de montagem | producao | eu |
| 24 | Comissionamento | producao | eu |
| 25 | Startup com o cliente | producao | cliente |
| 26 | Faturamento e recebimento | adm | eu |

## A decisão que eu recomendo diferente do que ele falou

Ele disse que depois do pedido "vai se tornar um outro projeto".

**Recomendo um projeto só, mudando de fase.** O motivo é o número que ele
mesmo pediu: total de horas por projeto. Se a execução virar outro projeto,
as horas gastas VENDENDO somem da conta, e o projeto parece mais barato do
que foi. Justamente a hora-fundador, que é a mais cara da empresa.

As telas continuam mostrando só a fase atual - não precisa ver 26 pacotes de
uma vez para o projeto ser um só por dentro.

## O cronograma, que é a função que ele pediu para o Jarvis

Cada pacote ganha `diasEstimados`. A corrente é sequencial: um pacote começa
quando o anterior termina. Não precisa de caminho crítico porque a corrente É
o caminho crítico - ela é uma linha só.

Disso sai, sem nenhuma conta complicada:

- **Previsão de cada pacote** a partir da data de início.
- **Data de entrega do projeto**, que é a previsão do último pacote.
- **Atraso**, quando hoje passou da previsão e o pacote não fechou.
- **De quem é o atraso**, que já existe no campo `aguardandoQuem`.

Esse último é o que muda o dia dele. Um projeto atrasado por `terceiro` é
telefonema; atrasado por `cliente` é cobrança; atrasado por `eu` é bloco na
agenda. Hoje o painel não separa isso por projeto.

E encaixa no que já existe: pacote com `aguardandoQuem` diferente de `eu` já
conta como engrenagem girando sem consumir a hora dele. O cronograma vira
alimentador do painel de engrenagens de graça.

## Onde os modelos moram: no banco, e não no código

Ele disse "precisa criar padrões aí, ficar salvando coisas". Isso só é
verdade se o modelo for DADO.

Modelo em código, um projeto novo só muda quando eu mexer no arquivo. Modelo
no banco, ele conversa com o Jarvis, corrige um pacote, e o próximo projeto
daquele tipo já nasce corrigido. Como ele quer criar isso por áudio, o modelo
tem que ser editável sem deploy.

Tabelas novas: `ModeloProjeto` (o tipo) e `PacoteModelo` (os pacotes, com
ordem, área, quem segura, dias estimados e condição).

## Como o projeto nasce pela conversa

1. Ele fala: *"Jarvis, abre o Batoque do Logimat pra Riachuelo, peça usinada,
   tem banho, a matéria-prima sai daqui, uns 18 mil"*.
2. O ditado (`src/lib/ditado.ts`, que já existe) devolve tipo, cliente, valor
   e as respostas das condições.
3. O que ele não disser, o Jarvis PERGUNTA - uma pergunta por vez, e só as
   que mudam a corrente.
4. A WBS se desdobra em pacotes PLANEJADOS, com as datas previstas.
5. A tela mostra o que foi criado, para ele conferir na hora.

O passo 3 é o que evita o pior defeito possível aqui: modelo que adivinha
errado e cria dez pacotes que ele vai ter que apagar um por um.

## O que fica para depois

- A ponte do CRM: lead que fecha vira projeto aqui, sem redigitar.
- Gravação de reunião virando transcrição e resumo (ele já citou o Drive).
- Terceiro tipo, `manutencao`, que ele ainda não descreveu.
