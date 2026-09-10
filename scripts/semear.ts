// Os quatro setores. Roda quantas vezes quiser: nao duplica.
//
// Estes sao os setores que o Lucian nomeou em 10/09/2026 - ADM, Engenharia,
// Comercial e Producao - e sao os mesmos que a WBS usa em src/lib/wbs.ts.
//
// RESSALVA REGISTRADA (leia docs/areas-e-medicao.md): com prospeccao dentro de
// Comercial, o mostrador perde a capacidade de mostrar prospeccao morrendo
// enquanto a proposta anda - que e o sintoma que originou o projeto. A saida
// barata e manter uma frente permanente "Cadencia de prospecção" em Comercial e
// olhar o tempo apontado nela. Se em duas semanas isso nao bastar, o corte
// alternativo esta no documento.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const AREAS = [
  {
    chave: 'comercial',
    nome: 'Comercial',
    ordem: 1,
    metaHorasSemana: 12,
    // Proposta parada e receita nao realizada, e prospeccao mora aqui dentro:
    // por isso o limiar mais curto de todos.
    diasParaCritico: 3,
  },
  { chave: 'engenharia', nome: 'Engenharia', ordem: 2, metaHorasSemana: 14, diasParaCritico: 7 },
  { chave: 'producao', nome: 'Produção', ordem: 3, metaHorasSemana: 10, diasParaCritico: 5 },
  {
    chave: 'adm',
    nome: 'ADM',
    ordem: 4,
    metaHorasSemana: 4,
    // Nota fiscal e cobranca vivem aqui. Sao o dinheiro ja ganho que nao entrou.
    diasParaCritico: 4,
  },
]

async function main() {
  for (const a of AREAS) {
    await prisma.area.upsert({
      where: { chave: a.chave },
      create: a,
      update: { nome: a.nome, ordem: a.ordem, diasParaCritico: a.diasParaCritico, metaHorasSemana: a.metaHorasSemana },
    })
    console.log('area', a.chave, 'ok')
  }

  // Areas antigas que nao tem mais nada apontando para elas saem de cena.
  const chaves = AREAS.map((a) => a.chave)
  const sobrando = await prisma.area.findMany({
    where: { chave: { notIn: chaves } },
    include: { frentes: true, projetos: true, objetivos: true, itens: true },
  })
  for (const a of sobrando) {
    const usada = a.frentes.length + a.projetos.length + a.objetivos.length + a.itens.length
    if (usada === 0) {
      await prisma.area.delete({ where: { id: a.id } })
      console.log('área antiga removida:', a.chave)
    } else {
      console.log(`área antiga "${a.chave}" AINDA EM USO (${usada} registros) - não removi`)
    }
  }
}

main().finally(() => prisma.$disconnect())
