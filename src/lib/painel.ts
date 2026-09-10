// Monta tudo que o painel mostra, numa passada so.

import { prisma } from './prisma'
import { lerConfig } from './configuracao'
import { calcularArea, type FrenteParaCalculo, type ResultadoArea } from './mostrador'
import { mesSP, limitesDoDia } from './datas'

export type CronometroCorrente = {
  apontamentoId: number
  tarefaId: number
  tarefaTitulo: string
  frenteId: number
  frenteTitulo: string
  areaNome: string
  areaChave: string
  iniciadoEm: Date
} | null

export type HorasDaArea = { areaId: number; minutos: number }

export type DadosDoPainel = {
  areas: ResultadoArea[]
  cronometro: CronometroCorrente
  horasHoje: HorasDaArea[]
  minutosHoje: number
  criticosGerais: ResultadoArea['criticos']
  itensSemClassificar: number
  frentesAbertas: number
  temEstrategia: boolean
  temExemplo: boolean
}

/**
 * Cronometro esquecido vira mentira: uma noite dormida vira 14 horas de
 * engenharia. Passou do limite, encerra sozinho e marca para revisao.
 */
export async function encerrarCronometrosEsquecidos(horas: number) {
  const limite = new Date(Date.now() - horas * 3600_000)
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null, iniciadoEm: { lt: limite } },
    data: { encerradoEm: new Date(), encerradoPor: 'automatico', revisar: true },
  })
}

export async function montarPainel(agora: Date = new Date()): Promise<DadosDoPainel> {
  const cfg = await lerConfig()
  await encerrarCronometrosEsquecidos(cfg.autoEncerrarHoras)

  const periodoMes = mesSP(agora)
  const { inicio, fim } = limitesDoDia(agora)

  const [areas, frentes, objetivos, bloqueios, compromissos, aberto, apontamentosHoje, itensNovos, estrategias, exemplos] =
    await Promise.all([
      prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
      prisma.frente.findMany({ where: { status: 'aberta' } }),
      prisma.objetivo.findMany({
        where: { horizonte: 'mes', periodo: periodoMes },
        include: { medicoes: true },
      }),
      prisma.bloqueio.groupBy({ by: ['frenteBloqueadoraId'], _count: { _all: true } }),
      prisma.item.findMany({
        where: { tipo: 'compromisso', venceEm: { not: null }, frenteId: { not: null }, descartadoEm: null },
        select: { frenteId: true, venceEm: true },
      }),
      prisma.apontamento.findFirst({
        where: { encerradoEm: null },
        orderBy: { iniciadoEm: 'desc' },
        include: { tarefa: { include: { frente: { include: { area: true } } } } },
      }),
      prisma.apontamento.findMany({
        where: { OR: [{ encerradoEm: { gte: inicio } }, { encerradoEm: null }], iniciadoEm: { lt: fim } },
        include: { tarefa: { include: { frente: true } } },
      }),
      prisma.item.count({ where: { status: 'novo', descartadoEm: null } }),
      prisma.estrategia.count(),
      prisma.frente.count({ where: { titulo: { contains: '[exemplo]' } } }),
    ])

  const bloqueiaPorFrente = new Map(bloqueios.map((b) => [b.frenteBloqueadoraId, b._count._all]))
  const compromissoPorFrente = new Map<number, Date>()
  for (const c of compromissos) {
    if (!c.frenteId || !c.venceEm) continue
    const atual = compromissoPorFrente.get(c.frenteId)
    if (!atual || c.venceEm < atual) compromissoPorFrente.set(c.frenteId, c.venceEm)
  }

  const objetivoPorArea = new Map<number, { alvo: number | null; realizado: number }>()
  for (const o of objetivos) {
    if (o.areaId == null) continue
    const realizado = o.medicoes.reduce((s, m) => s + m.valor, 0)
    objetivoPorArea.set(o.areaId, { alvo: o.alvo, realizado })
  }

  const resultados = areas.map((a) => {
    const daArea: FrenteParaCalculo[] = frentes
      .filter((f) => f.areaId === a.id)
      .map((f) => ({
        id: f.id,
        titulo: f.titulo,
        ultimoMovimentoEm: f.ultimoMovimentoEm,
        aguardandoQuem: f.aguardandoQuem,
        aguardandoDesde: f.aguardandoDesde,
        bloqueiaQuantas: bloqueiaPorFrente.get(f.id) ?? 0,
        proximoCompromissoEm: compromissoPorFrente.get(f.id) ?? null,
      }))
    return calcularArea(
      {
        areaId: a.id,
        chave: a.chave,
        nome: a.nome,
        diasParaCritico: a.diasParaCritico,
        frentes: daArea,
        objetivoDoMes: objetivoPorArea.get(a.id) ?? null,
      },
      cfg,
      agora,
    )
  })

  // Minutos de hoje por area, recortando o que caiu dentro do dia.
  const minutosPorArea = new Map<number, number>()
  let minutosHoje = 0
  for (const ap of apontamentosHoje) {
    const de = ap.iniciadoEm < inicio ? inicio : ap.iniciadoEm
    const ate = ap.encerradoEm ?? (agora < fim ? agora : fim)
    const min = Math.max(0, (ate.getTime() - de.getTime()) / 60000)
    if (min === 0) continue
    const areaId = ap.tarefa.frente.areaId
    minutosPorArea.set(areaId, (minutosPorArea.get(areaId) ?? 0) + min)
    minutosHoje += min
  }

  const cronometro: CronometroCorrente = aberto
    ? {
        apontamentoId: aberto.id,
        tarefaId: aberto.tarefaId,
        tarefaTitulo: aberto.tarefa.titulo,
        frenteId: aberto.tarefa.frenteId,
        frenteTitulo: aberto.tarefa.frente.titulo,
        areaNome: aberto.tarefa.frente.area.nome,
        areaChave: aberto.tarefa.frente.area.chave,
        iniciadoEm: aberto.iniciadoEm,
      }
    : null

  const criticosGerais = resultados
    .flatMap((r) => r.criticos)
    .sort((a, b) => b.bloqueia - a.bloqueia || b.dias - a.dias)

  return {
    areas: resultados,
    cronometro,
    horasHoje: [...minutosPorArea.entries()].map(([areaId, minutos]) => ({ areaId, minutos })),
    minutosHoje,
    criticosGerais,
    itensSemClassificar: itensNovos,
    frentesAbertas: frentes.length,
    temEstrategia: estrategias > 0,
    temExemplo: exemplos > 0,
  }
}
