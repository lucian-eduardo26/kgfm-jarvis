// Os projetos REAIS que estão em andamento, ditados pelo Lucian em 10/09/2026.
//
// Não é exemplo e não é semente de demonstração: são os projetos da empresa,
// e por isso o script é conservador - cria o que falta, não apaga nada, e
// rodar de novo não duplica.
//
// O que ele mandou: WBS completa SÓ no Batoque do Logimat. O resto entra com
// o título e o tipo, para as barras aparecerem na tela, e a WBS de cada um a
// gente monta depois, um por um.
//
// DUAS COISAS QUE EU ASSUMI E ELE PRECISA CORRIGIR:
// 1. A data de início de todos é HOJE, porque eu não sei quando cada um
//    começou de verdade. Inventar uma data passada faria o cronograma mentir
//    logo na primeira tela.
// 2. No Batoque eu marquei que TEM revestimento e que a matéria-prima NÃO
//    sai daqui. Ele descreveu as duas como condições mas não disse quais
//    valem para este projeto.

import { prisma } from '../src/lib/prisma'
import { correnteDoProjeto, type Condicoes } from '../src/lib/modelos'
import type { TipoProjeto } from '@prisma/client'

type ProjetoParaCriar = {
  nome: string
  cliente: string
  tipo: TipoProjeto
  areaChave: string
  condicoes: Condicoes
  /** Só o Batoque desdobra a WBS agora. */
  comWbs: boolean
  fase: 'desenvolvimento' | 'fechado' | 'entregue'
}

const PROJETOS: ProjetoParaCriar[] = [
  {
    nome: 'Batoque do Logimat',
    cliente: 'Riachuelo',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: true },
    comWbs: true,
    fase: 'fechado',
  },
  {
    nome: 'Trava Clinker',
    cliente: 'Riachuelo',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'fechado',
  },
  {
    nome: 'Separador Riachuelo',
    cliente: 'Riachuelo',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'desenvolvimento',
  },
  {
    nome: 'Arruela especial do miniload',
    cliente: 'Riachuelo',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'desenvolvimento',
  },
  {
    nome: 'Grandes volumes Riachuelo',
    cliente: 'Riachuelo',
    tipo: 'sistema',
    areaChave: 'comercial',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'desenvolvimento',
  },
  {
    nome: 'Projeto Caedu',
    cliente: 'Caedu',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'desenvolvimento',
  },
  {
    nome: 'Shopee SP08',
    cliente: 'Shopee',
    tipo: 'peca',
    areaChave: 'producao',
    condicoes: { materiaPrimaNossa: false, temRevestimento: false },
    comWbs: false,
    fase: 'desenvolvimento',
  },
]

async function main() {
  const areas = await prisma.area.findMany()
  const porChave = new Map(areas.map((a) => [a.chave, a]))
  if (areas.length === 0) {
    console.error('Nenhuma área no banco. Rode `npm run semear` antes.')
    process.exit(1)
  }

  const hoje = new Date()
  let criados = 0
  let pacotesCriados = 0

  for (const p of PROJETOS) {
    const area = porChave.get(p.areaChave)
    if (!area) {
      console.error(`área "${p.areaChave}" não existe. Pulei ${p.nome}.`)
      continue
    }

    let projeto = await prisma.projeto.findFirst({ where: { nome: p.nome } })

    if (!projeto) {
      projeto = await prisma.projeto.create({
        data: {
          nome: p.nome,
          cliente: p.cliente,
          areaId: area.id,
          tipo: p.tipo,
          fase: p.fase,
          inicioEm: hoje,
          materiaPrimaNossa: p.condicoes.materiaPrimaNossa,
          temRevestimento: p.condicoes.temRevestimento,
        },
      })
      criados++
      console.log(`projeto criado: ${p.nome} (${p.tipo}, ${p.cliente})`)
    } else {
      // Já existia: só completa o que é novo, sem mexer no que ele já ajustou.
      projeto = await prisma.projeto.update({
        where: { id: projeto.id },
        data: {
          tipo: p.tipo,
          cliente: projeto.cliente ?? p.cliente,
          inicioEm: projeto.inicioEm ?? hoje,
          materiaPrimaNossa: p.condicoes.materiaPrimaNossa,
          temRevestimento: p.condicoes.temRevestimento,
        },
      })
      console.log(`projeto já existia, atualizado: ${p.nome}`)
    }

    if (!p.comWbs) continue

    const jaTem = await prisma.frente.count({ where: { projetoId: projeto.id } })
    if (jaTem > 0) {
      console.log(`  WBS já existe (${jaTem} pacotes), não mexi`)
      continue
    }

    for (const pacote of correnteDoProjeto(p.tipo, p.condicoes)) {
      const areaDoPacote = porChave.get(pacote.area)
      if (!areaDoPacote) continue

      // PLANEJADA e não aberta: a WBS é o plano, o quadro é o agora. Abrir as
      // onze de uma vez estouraria o limite de WIP no primeiro dia.
      await prisma.frente.create({
        data: {
          titulo: pacote.pacote,
          areaId: areaDoPacote.id,
          projetoId: projeto.id,
          status: 'planejada',
          ordem: pacote.ordem,
          pacote: pacote.pacote,
          etapa: pacote.etapa,
          diasEstimados: pacote.dias,
          aguardandoQuem: pacote.quemSegura,
          tarefas: { create: pacote.tarefas.map((t) => ({ titulo: t })) },
        },
      })
      pacotesCriados++
    }
    console.log(`  WBS desdobrada: ${correnteDoProjeto(p.tipo, p.condicoes).length} pacotes`)
  }

  console.log(`\n${criados} projetos criados, ${pacotesCriados} pacotes de WBS.`)
  console.log('A data de início de todos é hoje - corrija a real na tela do projeto.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
