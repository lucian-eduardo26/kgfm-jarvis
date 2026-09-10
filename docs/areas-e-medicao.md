# Como cortar as áreas, e o que medir primeiro

Escrito em 10/09/2026 de madrugada, respondendo a duas perguntas do Lucian:
*"o que deve ser medido de cara"* e *"prospecção é comercial, entregas é
produção - reunião com fornecedor é o quê?"*.

**Estado:** recomendação minha, ainda não aplicada ao banco. Trocar as áreas é
mexer em `scripts/semear.ts` e rodar `npm run semear`. Decisão sua.

---

## 1. O erro que a pergunta revela (e é um erro meu de origem)

Você está cortando por **organograma**: prospecção fica embaixo de comercial,
entregas fica embaixo de produção. Está certo do ponto de vista de empresa - e
errado para este sistema, porque **as áreas do Jarvis não são departamentos.
São tipos de atenção.**

O gargalo declarado no briefing é a sua cabeça, não a estrutura da KGFM.
Goldratt: o que importa medir é o uso da restrição. Newport: o que degrada a
restrição é a mistura de trabalho profundo com raso. Se prospecção virar uma
linha dentro de comercial, **some exatamente o sintoma que originou o
projeto**: "a prospecção só destravou virando frente exclusiva por 4 dias - e a
engenharia parou nesse período". Um mostrador que não consegue mostrar isso não
serve.

Então a resposta não é fundir. É **renomear pelo que a coisa é**, e resolver o
"centro de custo" numa dimensão separada - que é o `projeto`, e já existe.

## 2. O corte que eu recomendo

| Área | O que é | Tipo | Crítico em |
|---|---|---|---|
| **Prospecção** | gerar conversa nova onde não havia | raso, cadência | 2 dias úteis |
| **Proposta** | do pedido até o sim: entender, desenhar, cotar, precificar, negociar | profundo | 3 dias úteis |
| **Execução** | projeto fechado: detalhamento, compras, fabricação, montagem, entrega | profundo + coordenação | 7 dias úteis |
| **Empresa** | o que não é de cliente nenhum: nota fiscal, cobrança, financeiro, estratégia, o próprio Jarvis | misto | 5 dias úteis |

### Por que "Proposta" e não "Comercial"
Comercial é nome de departamento e engole prospecção. **Proposta** é nome de
fase, tem começo e fim, e é a porta de entrada de receita - o padrão que você
mesmo marcou como crítico ("deixa proposta parada por inércia"). O que se mede
fica com o nome do que dói.

### Por que "Engenharia" e "Entregas" viram uma área só
Depois que o projeto fecha, detalhar, comprar e montar são o mesmo bloco de
atenção, no mesmo projeto, com o mesmo cliente esperando. Separar cria duas
frentes onde existe uma, e o limite de WIP passa a permitir o dobro do que
deveria. Se um dia você tiver alguém só para montagem, separa - hoje não tem.

### Por que "Empresa" é nova, e por que ela importa
Sua própria lista de padrões críticos inclui **"atrasa emissão de nota fiscal e
cobrança"** - e nas quatro áreas de hoje isso não tem casa. O que não tem casa
no painel não aparece, e o que não aparece atrasa. Nota fiscal atrasada é
dinheiro que já foi ganho e não entrou: é a coisa mais barata de consertar em
toda a empresa.

## 3. Reunião com fornecedor: a regra em uma linha

**Siga o projeto, não o interlocutor.**

- Cotar para um negócio **ainda não fechado** → **Proposta**
- Comprar ou acompanhar de um projeto **fechado** → **Execução**
- Conversa de capacidade, parceria ou catálogo, **sem projeto** → **Empresa**

O mesmo fornecedor, na mesma semana, pode cair em três áreas. Isso não é
inconsistência: é o sistema medindo *sua atenção*, não a agenda dele.

## 4. Desenvolvimento antes de fechar: fase, não área

Você chamou de "desenvolvimento" o que vem antes do projeto entrar. Concordo que
é uma coisa distinta - mas ela é **fase do projeto**, não área de atenção.
Entender o problema e precificá-lo é um bloco profundo contínuo; separar em duas
áreas partiria ao meio um trabalho que na sua cabeça é um só.

Por isso `projeto.fase` já está no banco (migração `fase_do_projeto`):
`desenvolvimento` → `fechado` → `entregue`. As horas do cronômetro sobem por
`apontamento → tarefa → frente → projeto`, então **hora por projeto e hora por
fase são consulta, não estrutura nova**. É o seu centro de custo, sem inventar
tabela.

## 5. O que medir de cara

Ordenado por quanto muda decisão, não por quanto é fácil. Os quatro primeiros
já existem no código.

1. **Horas apontadas contra expediente decorrido** - o buraco do dia.
   É o único número que mede o gargalo de verdade. Já está no painel, listrado.
2. **Dias desde o último toque em cada proposta aberta.** Dias, não percentual:
   dinheiro parado se conta em dias. É o componente Movimento do mostrador.
3. **Existe crítico que trava outra frente?** Um sim/não. É a única pergunta que
   reordena o dia inteiro, e é o primeiro teste do FAÇA AGORA.
4. **Toques de prospecção na semana.** Cadência morre em silêncio: não gera
   atraso, gera ausência - e ausência não aparece em lista de pendência.

E, deliberadamente, **o que NÃO medir agora**:

- **Aderência ao objetivo do mês** com peso alto - não há histórico, e no
  primeiro mês ela pintaria tudo de vermelho sem informar nada. Fica com peso 20.
- **Taxa de conversão** - a amostra é pequena demais para significar coisa
  alguma; ela mede sorte antes de medir processo.
- **Horas planejadas contra horas reais por área** - ninguém sabe ainda quanto é
  "normal" numa semana sua. Depois de três semanas de cronômetro isso vira o
  melhor indicador do sistema. Antes disso é chute com cara de método.

## 6. Se você aceitar

Trocar `AREAS` em `scripts/semear.ts` para as quatro acima e rodar
`npm run semear`. As frentes já existentes continuam apontando para os ids
antigos, então o certo é fazer isso **antes** de carregar a base real - ou seja,
antes de qualquer coisa séria entrar. É por isso que este documento existe em
vez de eu já ter mudado sozinho.
