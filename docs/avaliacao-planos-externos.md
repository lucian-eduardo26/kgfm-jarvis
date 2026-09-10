# Avaliação dos planos que chegaram prontos

10/09/2026. O Lucian trouxe duas arquiteturas escritas por outros modelos e
pediu avaliação com decisão minha. Este documento diz o que entrou no sistema,
o que ficou de fora, e por quê.

---

## O que entrou (e já está no código)

| Ideia | Onde virou código | Por que aceitei |
|---|---|---|
| **Runway como número mestre** | `src/lib/caixa.ts`, faixa acima do painel | É o único número que reordena o dia inteiro. Mostrador verde numa empresa com 40 dias de caixa é instrumento medindo a coisa errada com precisão |
| **Auditoria da hora-fundador** | `auditarHoraFundador`, tela `/caixa` | O custo dessa hora não é o salário dele: é o negócio grande que não andou. E é medível |
| **SPIN como trava, não como lembrete** | `src/lib/spin.ts`, bloco em `/projetos` | Proposta sem Implicação e Necessidade admitidas é disputa de preço. Trava com botão de liberar ao lado, como toda trava daqui |
| **Perfil do decisor com "o que dói para ele"** | modelo `Decisor`, entra no contexto da conversa | Carnegie aplicado: a abordagem fala do problema dele, com as palavras dele. Nunca catálogo |
| **Playbook técnico como lastro** | modelo `Conhecimento`, tela `/playbook` | Sem ele a IA inventa especificação com cara de certeza. E tira da cabeça do Lucian o que a empresa já sabe |
| **Dinheiro pesa na priorização** | régua do check-in e da conversa | Entre duas frentes parecidas, a de maior valor ganha o bloco - e o sistema diz o valor |

E uma que **não estava em nenhum dos dois** e é a correção mais importante:

**Prazo de recebimento.** Os dois planos falam em "gerar caixa rápido" olhando
para o *valor* dos projetos. Valor não paga folha - data paga. Um projeto de
R$ 300 mil que recebe 60 dias após a entrega não resolve caixa em 90 dias: ele
resolve caixa no ano que vem. Agora `projeto.prazoRecebimentoDias` existe, e a
tela `/caixa` só conta na previsão de 90 dias o que tem data dentro dos 90 dias,
ponderado por probabilidade e por margem. O que não tem data aparece separado,
em âmbar, com o nome do que é: valor sem data.

---

## O que recusei

### 1. Obsidian como cérebro do sistema

O plano propõe o Vault como banco de dados e o Claude Code no terminal como
motor. Isso substitui o Jarvis por uma pasta e um terminal. Três problemas:

- **Sem medição.** Não há mostrador, cronômetro, runway nem histórico. Nada é
  medido ao longo do tempo, e o próprio briefing diz que o que não é medido não
  é gerenciado.
- **Depende de abrir o terminal.** O sistema foi desenhado para não depender da
  disciplina do Lucian. Um fluxo que começa em "abra o terminal e escreva um
  prompt" depende de disciplina em cada uso, e é justamente o tipo de coisa que
  ele mesmo listou que abandona sob estresse.
- **Custa mais token, não menos.** "O Claude devora o Vault inteiro" é o caminho
  caro: mandar o acervo todo a cada pergunta é exatamente o que faz a conta da
  API explodir. O Jarvis manda um bloco de estado compacto e montado.

O detalhamento e o caminho alternativo (Obsidian como espelho de uma via só)
estão em [banco-de-conhecimento.md](banco-de-conhecimento.md).

### 2. "Empurre 100% dos projetos pequenos para os PJs"

Está certo no objetivo e errado na conta. Veja a próxima seção.

---

## Onde o modelo falha diante da realidade com os PJs

Foi a pergunta feita, então aqui está sem suavizar.

**1. O plano pressupõe uma capacidade instalada que não existe.**
Hoje os freelancers só entram quando há serviço fechado. Quer dizer: no momento
em que o projeto pequeno é ganho, não existe PJ contratado, treinado e ciente do
padrão da KGFM. Delegar não é uma decisão, é um investimento - e a **primeira**
delegação custa mais hora-fundador do que fazer sozinho, sempre.

Consequência prática: o teto de 20% da semana em baixo ticket é **impossível no
primeiro projeto**. O caminho honesto é aceitar 40% a 50% no primeiro, com uma
condição inegociável: aquele primeiro projeto tem que produzir o procedimento
escrito. Se sair projeto e não sair procedimento, o mês seguinte repete o mesmo
custo, e o modelo inteiro desmorona - só que mais tarde e com menos caixa.

**2. Delegar execução não delega a interface com o cliente.**
Erro de PJ na Shopee não queima o PJ: queima a conta que ele está tentando
expandir. Então "empurrar 100%" está errado. O que se delega é a **execução**;
a **interface** com o cliente continua sendo dele, e interface consome hora.
Um teto realista separa as duas: 0% de execução, mas a interface tem custo e
precisa aparecer no cálculo em vez de ser ignorada.

**3. A proposta não solicitada de R$ 250 mil na Shopee é otimista quanto ao ciclo.**
A tese de "verba de OPEX do gerente local, sem board" é boa - mas a alçada que
passa sem board raramente chega a R$ 250 mil numa empresa daquele porte. O
plano deveria ter **dois alvos simultâneos**, não um:
- **curto:** R$ 30 mil a R$ 80 mil, alçada de gerente, fecha em semanas, paga a folha;
- **longo:** R$ 250 mil ou mais, entra no ciclo de aprovação e não conta como caixa.

Colocar a sobrevivência dos 90 dias num único ticket de R$ 250 mil é apostar o
caixa num ciclo cuja duração ninguém mediu ainda.

**4. Não existe conta de capacidade de entrega, e ela contradiz o plano de caixa.**
Se ele fechar os 3 ou 4 retrofits de R$ 150 mil a R$ 300 mil em 90 dias, quem
executa? Com a estrutura de hoje isso satura engenharia e produção ao mesmo
tempo, vira atraso, e atraso em cliente novo mata exatamente o *land and expand*
que o plano defende. **Plano de caixa e plano de capacidade têm que ser o mesmo
plano** - vender o que não se entrega é a forma mais cara de resolver caixa.

**5. O ponto cego dos dois planos: eles medem faturamento, não recebimento.**
Já corrigido no código, e é a razão de o campo de prazo existir.

---

## O que o sistema ainda não sabe, e por isso não afirma

- **Saldo em caixa de hoje.** Sem ele não existe runway. A tela `/caixa` mostra
  `--` em vez de zero: alarme falso queima a credibilidade do alarme verdadeiro.
- **A parcela do empréstimo.** Entra na queima mensal e muda o runway.
- **Prazo de recebimento de cada projeto.** Sem isso a previsão de 90 dias sai
  vazia, e o âmbar na tela é o sistema dizendo que não sabe.
- **Capacidade de entrega por período.** Está no BACKLOG. Enquanto não existir,
  o Jarvis não vai avisar quando vender além do que se entrega.
