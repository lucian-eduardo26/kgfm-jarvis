// Carga de EXEMPLO, para ver os ponteiros se mexendo antes de existir dado real.
// Nao e a sua base: e cenario de teste.
//   npm run exemplo   carrega
//   npm run limpar    apaga so o que este script criou
//
// Tudo que ele cria leva a marca [exemplo] no titulo, para nunca se confundir
// com frente de verdade.

import { PrismaClient } from '@prisma/client'
import { mesSP, anoSP } from '../src/lib/datas'

const prisma = new PrismaClient()
const MARCA = '[exemplo]'

function diasUteisAtras(n: number): Date {
  const d = new Date()
  let c = 0
  while (c < n) {
    d.setDate(d.getDate() - 1)
    const s = d.getDay()
    if (s !== 0 && s !== 6) c++
  }
  return d
}

async function limpar() {
  const frentes = await prisma.frente.findMany({ where: { titulo: { contains: MARCA } } })
  const ids = frentes.map((f) => f.id)
  await prisma.apontamento.deleteMany({ where: { tarefa: { frenteId: { in: ids } } } })
  await prisma.tarefa.deleteMany({ where: { frenteId: { in: ids } } })
  await prisma.movimento.deleteMany({ where: { frenteId: { in: ids } } })
  await prisma.bloqueio.deleteMany({ where: { OR: [{ frenteBloqueadoraId: { in: ids } }, { frenteBloqueadaId: { in: ids } }] } })
  await prisma.item.deleteMany({ where: { conteudo: { contains: MARCA } } })
  await prisma.frente.deleteMany({ where: { id: { in: ids } } })
  await prisma.projeto.deleteMany({ where: { nome: { contains: MARCA } } })
  await prisma.medicao.deleteMany({ where: { objetivo: { descricao: { contains: MARCA } } } })
  await prisma.objetivo.deleteMany({ where: { descricao: { contains: MARCA } } })
  await prisma.estrategia.deleteMany({ where: { diagnostico: { contains: MARCA } } })
  console.log('exemplo apagado')
}

async function carregar() {
  await limpar()
  const areas = Object.fromEntries((await prisma.area.findMany()).map((a) => [a.chave, a]))

  await prisma.estrategia.create({
    data: {
      horizonte: 'ano',
      periodo: anoSP(),
      diagnostico: `${MARCA} O gargalo e a atencao do dono: quatro areas competem pela mesma cabeca.`,
      politicaNorteadora: 'Concentrar em poucos projetos de alto valor e proteger blocos de trabalho profundo.',
      acoes: 'Uma frente por vez por area; proposta nao dorme mais de tres dias uteis.',
    },
  })

  const objetivo = await prisma.objetivo.create({
    data: {
      horizonte: 'mes',
      periodo: mesSP(),
      descricao: `${MARCA} propostas enviadas`,
      metrica: 'propostas',
      alvo: 8,
      areaId: areas.comercial.id,
    },
  })
  await prisma.medicao.create({ data: { objetivoId: objetivo.id, valor: 2 } })

  const cotacao = await prisma.frente.create({
    data: {
      titulo: `${MARCA} Cotacao de pecas pequenas`,
      areaId: areas.comercial.id,
      ultimoMovimentoEm: diasUteisAtras(12),
      abertaEm: diasUteisAtras(20),
      objetivoId: objetivo.id,
    },
  })
  const projeto = await prisma.frente.create({
    data: {
      titulo: `${MARCA} Projeto grande - detalhamento`,
      areaId: areas.engenharia.id,
      ultimoMovimentoEm: diasUteisAtras(5),
      abertaEm: diasUteisAtras(30),
    },
  })
  const proposta = await prisma.frente.create({
    data: {
      titulo: `${MARCA} Proposta enviada, aguardando cliente`,
      areaId: areas.comercial.id,
      ultimoMovimentoEm: diasUteisAtras(8),
      aguardandoQuem: 'cliente',
      aguardandoDesde: diasUteisAtras(2),
    },
  })
  const convites = await prisma.frente.create({
    data: {
      titulo: `${MARCA} Cadencia de prospeccao`,
      areaId: areas.comercial.id,
      ultimoMovimentoEm: diasUteisAtras(1),
    },
  })

  // A cotacao trava o detalhamento: e isso que o FACA AGORA tem que enxergar.
  await prisma.bloqueio.create({
    data: { frenteBloqueadoraId: cotacao.id, frenteBloqueadaId: projeto.id },
  })

  for (const [frenteId, titulos] of [
    [cotacao.id, ['Levantar precos com o fornecedor', 'Montar a planilha']],
    [projeto.id, ['Detalhar o layout', 'Revisar lista de materiais']],
    [convites.id, ['Mandar 20 convites']],
  ] as [number, string[]][]) {
    for (const titulo of titulos) await prisma.tarefa.create({ data: { frenteId, titulo } })
  }

  // Duas horas apontadas hoje, ja encerradas, so para o grafico do dia existir.
  const tarefa = await prisma.tarefa.findFirst({ where: { frenteId: projeto.id } })
  if (tarefa) {
    const fim = new Date()
    await prisma.apontamento.create({
      data: {
        tarefaId: tarefa.id,
        iniciadoEm: new Date(fim.getTime() - 95 * 60000),
        encerradoEm: fim,
        encerradoPor: 'usuario',
      },
    })
  }

  await prisma.item.create({
    data: {
      conteudo: `${MARCA} ligar para o comprador na quinta`,
      conteudoBruto: `${MARCA} ligar para o comprador na quinta`,
      tipo: 'tarefa',
      areaId: areas.comercial.id,
      status: 'classificado',
      confiancaClassificacao: 0.9,
    },
  })

  await prisma.frente.count()
  console.log('exemplo carregado: 4 frentes, 5 tarefas, 1 bloqueio, 1h35 apontada')
  console.log('para apagar: npm run limpar')
}

const acao = process.argv[2] === 'limpar' ? limpar : carregar
acao().finally(() => prisma.$disconnect())
