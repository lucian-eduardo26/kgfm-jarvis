// O BATOQUE DO LOGIMAT no ponto em que ele realmente está, ditado pelo Lucian
// em 10/09/2026:
//
//   "entrou o pedido, programação da produção, um dia de serviço de
//    programação, cotei o material está feito, coloquei o pedido da fabricação
//    está feito, fiz a logística de mandar matéria-prima pro fornecedor está
//    feito, o fornecedor executou em cinco dias e me entregou. Hoje, dia dez
//    de setembro, tudo isso já aconteceu. Amanhã, dia onze, tem a logística
//    pro banho. O banho vai me pedir dois dias."
//
// Daí saem três coisas que este script grava:
//
// 1. A MATÉRIA-PRIMA SAI DAQUI. Ele mandou para o fornecedor, então a condição
//    é verdadeira - eu tinha chutado o contrário na primeira carga.
// 2. DOIS PRAZOS SÃO DESTE PROJETO, não do modelo: fabricação levou 5 dias (o
//    modelo diz 15) e o banho pede 2 (o modelo diz 7). É exatamente para isso
//    que os dias moram na frente e não no código.
// 3. A DATA DE INÍCIO SE DEDUZ. Se o pacote 9 começa amanhã e os oito
//    primeiros somam 18 dias, o projeto começou em 24 de agosto. Melhor
//    deduzir da realidade do que inventar.
//
// Rodar de novo refaz a WBS deste projeto do zero. É seguro: nenhum
// apontamento de hora depende dela ainda.

import { prisma } from '../src/lib/prisma'
import { correnteDoProjeto } from '../src/lib/modelos'

const NOME = 'Batoque do Logimat'

/** Prazos que são deste projeto e não do modelo. */
const DIAS_DESTE_PROJETO: Record<string, number> = {
  Fabricação: 5,
  'Revestimento ou banho': 2,
}

/** Até onde já andou. Os oito primeiros estão feitos. */
const FEITO_ATE_A_ORDEM = 8

async function main() {
  const projeto = await prisma.projeto.findFirst({ where: { nome: NOME } })
  if (!projeto) {
    console.error(`Projeto "${NOME}" não existe. Rode npm run projetos antes.`)
    process.exit(1)
  }

  const condicoes = { materiaPrimaNossa: true, temRevestimento: true }
  const corrente = correnteDoProjeto('peca', condicoes)

  // Quanto tempo consumiram os pacotes já feitos.
  const diasFeitos = corrente
    .filter((p) => p.ordem <= FEITO_ATE_A_ORDEM)
    .reduce((s, p) => s + (DIAS_DESTE_PROJETO[p.pacote] ?? p.dias), 0)

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
  const agora = new Date()

  for (const p of corrente) {
    const area = areas.get(p.area)
    if (!area) continue
    const feito = p.ordem <= FEITO_ATE_A_ORDEM
    const dias = DIAS_DESTE_PROJETO[p.pacote] ?? p.dias

    await prisma.frente.create({
      data: {
        titulo: p.pacote,
        areaId: area.id,
        projetoId: projeto.id,
        status: feito ? 'fechada' : 'planejada',
        fechadaEm: feito ? agora : null,
        ordem: p.ordem,
        pacote: p.pacote,
        etapa: p.etapa,
        diasEstimados: dias,
        aguardandoQuem: p.quemSegura,
        tarefas: {
          create: p.tarefas.map((t) => ({
            titulo: t,
            status: feito ? ('feita' as const) : ('aberta' as const),
            concluidaEm: feito ? agora : null,
          })),
        },
      },
    })
  }

  const total = corrente.reduce((s, p) => s + (DIAS_DESTE_PROJETO[p.pacote] ?? p.dias), 0)
  console.log(`${NOME}: ${corrente.length} pacotes, ${FEITO_ATE_A_ORDEM} feitos.`)
  console.log(`início deduzido: ${inicio.toLocaleDateString('pt-BR')}`)
  console.log(`corrente inteira: ${total} dias`)
  console.log(`o próximo pacote é "${corrente[FEITO_ATE_A_ORDEM].pacote}", e começa amanhã.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
