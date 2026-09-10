# O mostrador - fórmula fechada em 10/09/2026

A definição vive em UM arquivo de código: `src/lib/mostrador.ts`. No CRM já
aconteceu de cada tela contar diferente com o mesmo nome; a correção foi
centralizar. Aqui já nasce centralizado.

Os números abaixo são o PADRÃO. A página de configuração permite ajustar todos,
e grava a data de cada mudança - se o mostrador mudar de cor, tem que dar para
saber se foi o mundo ou se foi o peso.

## A decisão de projeto

O CLAUDE.md pedia que o ponteiro carregasse movimento, críticos E aderência ao
objetivo do mês. As duas primeiras são fluxo; a terceira é estratégia, e é
lenta. Aderência não muda dentro de um dia - com peso alto, o ponteiro fica
parado, e ponteiro parado ensina a não olhar. Pior: no primeiro mês não há
histórico e os quatro mostradores nasceriam vermelhos.

**O ponteiro mede fluxo. A estratégia tem barra própria no painel.**

## Fórmula

    índice = 0,40 × Movimento + 0,40 × Críticos + 0,20 × Aderência

Sem objetivo do mês para a área, aderência sai e o peso é redistribuído:

    índice = 0,50 × Movimento + 0,50 × Críticos   (marcado "sem objetivo do mês")

Zonas: 0-39 vermelho · 40-69 âmbar · 70-100 verde.

## Componente A - Movimento (peso 40)

Nota por frente aberta, pelo `ultimo_movimento_em`, em dias úteis:

| Parada há | Nota |
|---|---|
| até 3 dias úteis | 1,0 |
| 4 a 7 | 0,6 |
| 8 a 14 | 0,3 |
| mais de 14 | 0 |

`Movimento = média das notas × 100`

Média, não soma: somar premiaria abrir frente. Média pune abrir e não mexer,
que é o comportamento que o sistema existe para combater.

**Área sem frente aberta:**
- com objetivo do mês → índice 0, vermelho, "nenhuma frente aberta"
- sem objetivo do mês → mostrador CINZA, "fora do foco este mês", não entra
  em conta nenhuma

Nunca verde por vazio. Verde por vazio é como o painel aprende a mentir.

## Componente B - Críticos (peso 40)

Começa em 100. Desconta **34 por crítico aberto**, **68** se a frente bloqueia
outra frente. Piso 0 - três críticos zeram a área.

Crítico é sempre fato com data, nunca julgamento da IA. Se a IA decidir o que é
crítico, o número muda sozinho e o sistema perde a confiança.

| Gatilho | Limiar padrão |
|---|---|
| Frente parada - prospecção | 2 dias úteis |
| Frente parada - comercial/proposta | 3 dias úteis |
| Frente parada - entregas | 5 dias úteis |
| Frente parada - engenharia | 7 dias úteis |
| Compromisso vencendo, frente sem movimento | 2 dias úteis |
| Aguardando terceiro sem retorno | 5 dias úteis, vira crítico "cobrar" |

**Regra de Goldratt que muda a conta:** frente esperando resposta de cliente
NÃO desconta enquanto a bola está com o cliente - ela não consome a capacidade
da restrição. Só vira crítico quando passa a janela de cobrança, e aí o crítico
é a ação dele. Sem isso o mostrador pune o Lucian pelo silêncio dos outros, e
ele aprende a ignorar vermelho.

## Componente C - Aderência (peso 20)

    Aderência = mín(100, realizado ÷ esperado × 100)
    esperado  = alvo do mês × (dias úteis decorridos ÷ dias úteis do mês)

Exige objetivo do mês COM número. Objetivo sem número não mede nada, e a
ausência dele é a mensagem.

**Limite assumido:** com peso 20, aderência sozinha nunca leva ao vermelho. Uma
área pode andar rápido para o lado errado e ficar verde. É deliberado - quem
denuncia isso é a barra de alinhamento estratégico. Para mudar, mexer no peso.

## Calibragem contra a realidade de 10/09/2026

Comercial: Shopee parada há ~12 dias, Riachuelo movido há 5, sem objetivo do
mês carregado.

- Movimento = (0,3 + 0,6) ÷ 2 × 100 = 45
- Críticos = 2 abertos → 100 − 68 = 32
- Índice = 0,5×45 + 0,5×32 = **38,5 → vermelho**

Está certo: comercial hoje é vermelho. Com desconto de 25 por crítico daria 47,
âmbar - e âmbar para porta de entrada de receita parada há 12 dias seria
mentira. Foi por isso que o desconto ficou em 34.

## O que ainda não mudou

Com o cronômetro (decidido em 10/09/2026), o Movimento poderá ser medido em
horas apontadas em vez de data do último toque. Só depois de 3 semanas de uso -
antes disso não se sabe quanto é "normal" por área, e trocar seria chute com
aparência de método. Está registrado no BACKLOG.
