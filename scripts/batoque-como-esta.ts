// O BATOQUE DO LOGIMAT no ponto em que ele realmente está, e com os tempos
// que o Lucian ditou em 10/09/2026.
//
// O QUE ELE CORRIGIU NESTA RODADA:
//
// 1. A ORDEM. A programação da produção vem DEPOIS da cotação: "eu coto, eu
//    tenho o preço, aí eu decido a programação e fecho com esse fornecedor".
// 2. OS MINUTOS. Ler o pedido são 5 min, cotação 1h, programação 1h, fechar
//    condição 1h, colocar o pedido 30 min, logística da matéria-prima 2h. A
//    fabricação são 5 dias e ZERO minuto dele - é aqui que os dois números se
//    separam, e é o motivo de existirem dois.
// 3. A ÂNCORA. "Pega toda essa sequência e volta do dia dez de setembro."
//    Os oito primeiros pacotes somam 12 dias de calendário; se o nono começa
//    amanhã, o projeto começou em 30 de agosto.
//
// A LINHA DE BASE fica gravada agora, e é ela que vai permitir comparar. Para
// os pacotes já feitos, a data real é a mesma da base: foi o que ele contou,
// sem mencionar atraso nenhum. Quando ele lançar a data verdadeira do pedido
// do cliente, o indicador de "parado esperando começar" acende sozinho.
//
// Rodar de novo refaz a WBS deste projeto do zero.

import { prisma } from '../src/lib/prisma'
import { correnteDoProjeto } from '../src/lib/modelos'

const NOME = 'Batoque do Logimat'

/** Prazos que são deste projeto e não do modelo. */
const DIAS_DESTE_PROJETO: Record<string, number> = {
  Fabricação: 5,
  'Revestimento ou banho': 2,
}

const FEITO_ATE_A_ORDEM = 8

function somarDias(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

async function main() {
  const projeto = await prisma.projeto.findFirst({ where: { nome: NOME } })
  if (!projeto) {
    console.error(`Projeto "${NOME}" não existe.`)
    process.exit(1)
  }

  const condicoes = { materiaPrimaNossa: true, temRevestimento: true }
  const corrente = correnteDoProjeto('peca', condicoes)
  const dias = (p: { pacote: string; dias: number }) => DIAS_DESTE_PROJETO[p.pacote] ?? p.dias

  const diasFeitos = corrente.filter((p) => p.ordem <= FEITO_ATE_A_ORDEM).reduce((s, p) => s + dias(p), 0)

  // O pacote seguinte começa AMANHÃ, então o início é hoje + 1 - diasFeitos.
  const inicio = new Date()
  inicio.setHours(12, 0, 0, 0)
  inicio.setDate(inicio.getDate() + 1 - diasFeitos)

  await prisma.frente.deleteMany({ where: { projetoId: projeto.id } })
  await prisma.projeto.update({
    where: { id: projeto.id },
    data: {
      tipo: 'peca',
      fase: 'fechado',
      inicioEm: inicio,
      materiaPrimaNossa: condicoes.materiaPrimaNossa,
      temRevestimento: condicoes.temRevestimento,
    },
  })

  const areas = new Map((await prisma.area.findMany()).map((a) => [a.chave, a]))
  let cursor = inicio
  let minutosDele = 0

  for (const p of corrente) {
    const area = areas.get(p.area)
    if (!area) continue
    const d = dias(p)
    const baseInicio = cursor
    const baseFim = somarDias(cursor, d)
    const feito = p.ordem <= FEITO_ATE_A_ORDEM
    minutosDele += p.minutos

    await prisma.frente.create({
      data: {
        titulo: p.pacote,
        areaId: area.id,
        projetoId: projeto.id,
        status: feito ? 'fechada' : 'planejada',
        fechadaEm: feito ? baseFim : null,
        ordem: p.ordem,
        pacote: p.pacote,
        etapa: p.etapa,
        diasEstimados: d,
        minutosEstimados: p.minutos,
        diasParaIniciar: p.diasParaIniciar ?? null,
        percentual: feito ? 100 : 0,
        baseInicioEm: baseInicio,
        baseFimEm: baseFim,
        // Feito é feito: a data real é a que ele contou, que bate com a base.
        realInicioEm: feito ? baseInicio : null,
        realFimEm: feito ? baseFim : null,
        aguardandoQuem: p.quemSegura,
        tarefas: {
          create: p.tarefas.map((t) => ({
            titulo: t,
            status: feito ? ('feita' as const) : ('aberta' as const),
            concluidaEm: feito ? baseFim : null,
          })),
        },
      },
    })

    cursor = baseFim
  }

  const restantes = corrente.filter((p) => p.ordem > FEITO_ATE_A_ORDEM).reduce((s, p) => s + p.minutos, 0)
  console.log(`${NOME}: ${corrente.length} pacotes, ${FEITO_ATE_A_ORDEM} feitos.`)
  console.log(`início: ${inicio.toLocaleDateString('pt-BR')}`)
  console.log(`entrega prevista: ${cursor.toLocaleDateString('pt-BR')}`)
  console.log(`esforço dele na corrente inteira: ${Math.round(minutosDele / 60 * 10) / 10}h`)
  console.log(`ainda falta da sua hora: ${Math.round(restantes / 60 * 10) / 10}h`)
  console.log(`próximo pacote: "${corrente[FEITO_ATE_A_ORDEM].pacote}", começa amanhã.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
