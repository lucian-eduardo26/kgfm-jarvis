// O ESTADO REAL dos dois projetos que faturam, ditado pelo Lucian na
// madrugada de sexta 11/09/2026.
//
// BATOQUE DO LOGIMAT
//   "A usinagem terminou os bloquinhos agora. Ainda tem uma tarefa crítica:
//    24 peças. A gente fechou 25 com a usinagem e só tinha 20 blanks em
//    estoque. Mandei fabricar mais 50 blocos pra manter estoque. As peças
//    complementares chegam hoje, aí eu mando pra usinagem - dois furos e o
//    chanfro - retorna pra mim, e eu mando pro pessoal do banho tudo junto.
//    O banho leva normalmente dois dias."
//
//   "Vou ter que chorar pro rapaz da usinagem me entregar sexta pela manhã, e
//    pra empresa de banho colocar no processo sexta mesmo. Pior caso, abro mão
//    das 4 peças, faturo 20 e entrego as outras depois - na Riachuelo tem essa
//    flexibilidade. O grande problema ainda será o banho."
//
// TRAVA CLINKER
//   "As peças já estão cortadas e com acabamento superficial. Falta um banho
//    que a gente faz na empresa - não vou pagar PJ porque tenho o material, é
//    só mergulhar e enxaguar - e a embalagem, que dá um pouquinho de trabalho:
//    olhar todas as peças e agrupar contando a quantidade."
//
// O PRAZO QUE MANDA NOS DOIS: a nota tem que sair até 14/set (segunda) para o
// dinheiro entrar em 15/out. Um dia de atraso empurra para 25/out.
//
// Sábado e domingo não se trabalha, então a corrente útil é sexta 11 e a
// manhã de segunda 14.

import { prisma } from '../src/lib/prisma'

type Pacote = {
  ordem: number
  pacote: string
  area: string
  etapa: string
  quem: 'eu' | 'cliente' | 'terceiro'
  dias: number
  minutos: number
  feito: boolean
  observacao?: string
}

const BATOQUE: Pacote[] = [
  { ordem: 1, pacote: 'Pedido do cliente', area: 'adm', etapa: 'venda', quem: 'cliente', dias: 0, minutos: 5, feito: true },
  { ordem: 2, pacote: 'Cotação com o fornecedor', area: 'adm', etapa: 'compras', quem: 'eu', dias: 1, minutos: 60, feito: true },
  { ordem: 3, pacote: 'Programação da produção', area: 'producao', etapa: 'fabricacao', quem: 'eu', dias: 1, minutos: 60, feito: true },
  { ordem: 4, pacote: 'Colocar o pedido na usinagem', area: 'adm', etapa: 'compras', quem: 'eu', dias: 0, minutos: 30, feito: true },
  { ordem: 5, pacote: 'Usinagem dos 20 blocos em estoque', area: 'producao', etapa: 'fabricacao', quem: 'terceiro', dias: 5, minutos: 0, feito: true },
  {
    ordem: 6,
    pacote: 'Receber os blanks complementares',
    area: 'producao',
    etapa: 'logistica',
    quem: 'terceiro',
    dias: 1,
    minutos: 15,
    feito: false,
    observacao: 'Chegam hoje. São as 4 peças que faltam para fechar 24.',
  },
  {
    ordem: 7,
    pacote: 'Usinar os complementares: dois furos e chanfro',
    area: 'producao',
    etapa: 'fabricacao',
    quem: 'terceiro',
    dias: 1,
    minutos: 30,
    feito: false,
    observacao: 'Usinagem simples. Precisa voltar SEXTA DE MANHÃ, senão o banho não encaixa.',
  },
  {
    ordem: 8,
    pacote: 'Enviar tudo para o banho',
    area: 'producao',
    etapa: 'logistica',
    quem: 'eu',
    dias: 0,
    minutos: 45,
    feito: false,
    observacao: 'O gargalo verdadeiro. Se não entrar no processo na sexta, não sai a tempo.',
  },
  {
    ordem: 9,
    pacote: 'Banho',
    area: 'producao',
    etapa: 'fabricacao',
    quem: 'terceiro',
    dias: 2,
    minutos: 0,
    feito: false,
    observacao: 'Dois dias no padrão. Sábado e domingo não contam para o fornecedor.',
  },
  { ordem: 10, pacote: 'Retirar do banho e conferir', area: 'producao', etapa: 'logistica', quem: 'eu', dias: 0, minutos: 45, feito: false },
  { ordem: 11, pacote: 'Embalagem e contagem', area: 'producao', etapa: 'expedicao', quem: 'eu', dias: 0, minutos: 60, feito: false },
  { ordem: 12, pacote: 'Entrega e nota fiscal', area: 'adm', etapa: 'financeiro', quem: 'eu', dias: 0, minutos: 45, feito: false, observacao: 'ATÉ 14/SET. Depois disso o dinheiro vai de 15/out para 25/out.' },
]

const TRAVA: Pacote[] = [
  { ordem: 1, pacote: 'Pedido do cliente', area: 'adm', etapa: 'venda', quem: 'cliente', dias: 0, minutos: 5, feito: true },
  { ordem: 2, pacote: 'Corte das peças', area: 'producao', etapa: 'fabricacao', quem: 'terceiro', dias: 3, minutos: 0, feito: true },
  { ordem: 3, pacote: 'Acabamento superficial', area: 'producao', etapa: 'fabricacao', quem: 'terceiro', dias: 2, minutos: 0, feito: true },
  {
    ordem: 4,
    pacote: 'Banho interno',
    area: 'producao',
    etapa: 'fabricacao',
    quem: 'eu',
    dias: 1,
    minutos: 120,
    feito: false,
    observacao: 'Feito aqui dentro: mergulhar e enxaguar. Não paga PJ, o material já é nosso.',
  },
  {
    ordem: 5,
    pacote: 'Embalagem, conferência e contagem',
    area: 'producao',
    etapa: 'expedicao',
    quem: 'eu',
    dias: 1,
    minutos: 180,
    feito: false,
    observacao: 'Dá trabalho: olhar peça por peça, agrupar e contar a quantidade.',
  },
  { ordem: 6, pacote: 'Entrega e nota fiscal', area: 'adm', etapa: 'financeiro', quem: 'eu', dias: 0, minutos: 45, feito: false, observacao: 'ATÉ 14/SET, mesma janela do Batoque.' },
]

/**
 * A ANCORA E HOJE, e nao o comeco do projeto.
 *
 * O que ja foi feito ficou no passado; o que falta comeca AGORA. Somar as
 * duracoes desde o inicio jogaria a entrega para tras e o alarme nunca
 * dispararia - o projeto pareceria entregue antes de existir.
 *
 * Entao o inicio se deduz: hoje menos a duracao do que ja foi feito.
 */
async function montar(nome: string, pacotes: Pacote[], _ignorado: Date) {
  const diasFeitos = pacotes.filter((p) => p.feito).reduce((s, p) => s + p.dias, 0)
  const inicioEm = new Date()
  inicioEm.setHours(12, 0, 0, 0)
  inicioEm.setDate(inicioEm.getDate() - diasFeitos)

  const projeto = await prisma.projeto.findFirst({ where: { nome } })
  if (!projeto) {
    console.error(`nao achei "${nome}"`)
    return
  }

  await prisma.frente.deleteMany({ where: { projetoId: projeto.id } })
  await prisma.projeto.update({
    where: { id: projeto.id },
    data: { fase: 'fechado', inicioEm, tipo: 'peca' },
  })

  const areas = new Map((await prisma.area.findMany()).map((a) => [a.chave, a]))
  let cursor = new Date(inicioEm)
  const agora = new Date()

  for (const p of pacotes) {
    const area = areas.get(p.area)
    if (!area) continue
    const baseInicio = new Date(cursor)
    const baseFim = new Date(cursor)
    baseFim.setDate(baseFim.getDate() + p.dias)

    await prisma.frente.create({
      data: {
        titulo: p.pacote,
        areaId: area.id,
        projetoId: projeto.id,
        status: p.feito ? 'fechada' : 'planejada',
        fechadaEm: p.feito ? baseFim : null,
        ordem: p.ordem,
        pacote: p.pacote,
        etapa: p.etapa,
        diasEstimados: p.dias,
        minutosEstimados: p.minutos,
        diasParaIniciar: 1,
        percentual: p.feito ? 100 : 0,
        baseInicioEm: baseInicio,
        baseFimEm: baseFim,
        realInicioEm: p.feito ? baseInicio : null,
        realFimEm: p.feito ? baseFim : null,
        aguardandoQuem: p.quem,
        tarefas: {
          create: [
            { titulo: p.observacao ?? p.pacote, status: p.feito ? ('feita' as const) : ('aberta' as const), concluidaEm: p.feito ? agora : null },
          ],
        },
      },
    })
    cursor = baseFim
  }

  const meus = pacotes.filter((p) => !p.feito && p.quem === 'eu').reduce((s, p) => s + p.minutos, 0)
  console.log(`${nome}: ${pacotes.length} pacotes, ${pacotes.filter((p) => p.feito).length} feitos`)
  console.log(`  entrega prevista: ${cursor.toLocaleDateString('pt-BR')}`)
  console.log(`  ainda depende de você: ${Math.round((meus / 60) * 10) / 10}h`)
}

async function main() {
  // O Batoque começou em 24/ago; a Trava, em 01/set. Datas deduzidas das
  // durações que ele descreveu, e ele corrige na tela se estiverem erradas.
  await montar('Batoque do Logimat', BATOQUE, new Date(2026, 7, 24, 12))
  await montar('Trava Clinker', TRAVA, new Date(2026, 8, 1, 12))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
