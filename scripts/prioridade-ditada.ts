// A prioridade que o LUCIAN ditou em 10/09/2026, gravada como decisão dele:
//
//   "os mais importantes primeiro, e os mais importantes são os de sistemas.
//    O da Riachuelo é prioridade."
//
// Por que entra à mão e não pela conta: nenhum projeto tem valor estimado nem
// prazo de recebimento no banco ainda, então a régua de dinheiro não tem o que
// medir e empata todo mundo. A conta está certa - é o dado que falta.
//
// Assim que ele preencher valor e prazo, basta apagar o número na tela de
// prioridade que o sistema volta a decidir sozinho. Campo vazio quer dizer
// "use o que você calculou", e não prioridade zero.

import { prisma } from '../src/lib/prisma'

const DITADO: { nome: string; prioridade: number; porque: string }[] = [
  {
    nome: 'Grandes volumes Riachuelo',
    prioridade: 95,
    porque: 'ele disse na letra: o da Riachuelo é prioridade, e é sistema',
  },
  {
    nome: 'Batoque do Logimat',
    prioridade: 70,
    porque: 'em execução e perto do fim - é o que vira nota fiscal primeiro',
  },
  {
    nome: 'Jarvis KGFM',
    prioridade: 15,
    porque: 'projeto interno: consome hora e não traz dinheiro para o caixa',
  },
]

async function main() {
  for (const d of DITADO) {
    const p = await prisma.projeto.findFirst({ where: { nome: d.nome } })
    if (!p) {
      console.error(`nao achei "${d.nome}"`)
      continue
    }
    await prisma.projeto.update({ where: { id: p.id }, data: { prioridade: d.prioridade } })
    console.log(`${d.nome}: ${d.prioridade} - ${d.porque}`)
  }
  console.log('\nOs outros seguem pela conta do sistema, que hoje empata por falta de valor e prazo.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
