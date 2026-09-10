// Check-in de domingo e check-out de sexta.
//
// A conta e feita AQUI, em codigo. O modelo so escreve o texto em cima de
// numeros que ja existem - se ele calculasse, a taxa mudaria de valor a cada
// vez que fosse perguntada, e um numero que muda sozinho nao serve para decidir.
//
// Da literatura, cada ritual carrega uma coisa:
// - GTD: a revisao semanal e o que impede o sistema de virar cemiterio. Sem um
//   momento fixo de reconciliacao, ninguem confia no que esta guardado - e um
//   sistema em que nao se confia continua sendo carregado na cabeca.
// - Newport: o plano da semana e por BLOCO de area, nunca por tarefa avulsa, e
//   trabalho profundo precisa de janela grande, nao de sobra entre reunioes.
// - Goldratt: o plano comeca pelo que destrava fluxo, nao pelo que esta mais
//   atrasado, e o check-out pergunta onde o gargalo esteve.
// - Rumelt: bloco que nao amarra em objetivo do mes e candidato a descarte, e
//   o check-in diz isso na cara.
// - Pressfield: o check-out compara expediente com hora apontada. Semana sem
//   registro nao e semana boa nem ruim - e semana que nao aconteceu.

import { prisma } from './prisma'
import { mesSP, diasUteisDoMes, limitesDoDia, formatarHoras } from './datas'
import { INICIO_EXPEDIENTE, FIM_EXPEDIENTE } from './expediente'

export type ObjetivoDesdobrado = {
  descricao: string
  area: string | null
  alvo: number
  realizado: number
  esperadoHoje: number
  faltam: number
  diasUteisRestantesNoMes: number
  porSemana: number
  porDiaUtil: number
  noRitmo: boolean
}

export type HorasDaSemana = { area: string; minutos: number }

export type DadosDaSemana = {
  inicio: Date
  fim: Date
  diasUteisNaSemana: number
  diasUteisDecorridosNaSemana: number
  minutosExpedienteDecorrido: number
  minutosApontados: number
  minutosNoEscuro: number
  percentualNoEscuro: number
  horasPorArea: HorasDaSemana[]
  objetivos: ObjetivoDesdobrado[]
  criticos: { titulo: string; texto: string; bloqueia: number }[]
  frentesAbertas: { titulo: string; area: string; projeto: string | null; diasParada: number }[]
  pacotesPlanejados: { titulo: string; area: string; projeto: string | null }[]
}

function segundaDaSemana(d: Date): Date {
  const { inicio } = limitesDoDia(d)
  // inicio e meia-noite de Sao Paulo em UTC; o dia da semana sai do meio-dia.
  const meio = new Date(inicio.getTime() + 12 * 3600_000)
  const s = meio.getUTCDay()
  const recuo = s === 0 ? 6 : s - 1
  return new Date(inicio.getTime() - recuo * 24 * 3600_000)
}

function contarDiasUteis(de: Date, ate: Date): number {
  let n = 0
  const cursor = new Date(de)
  while (cursor < ate) {
    const s = new Date(cursor.getTime() + 12 * 3600_000).getUTCDay()
    if (s !== 0 && s !== 6) n++
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return n
}

export async function montarSemana(agora: Date = new Date()): Promise<DadosDaSemana> {
  const inicio = segundaDaSemana(agora)
  const fim = new Date(inicio.getTime() + 7 * 24 * 3600_000)
  const hojeInicio = limitesDoDia(agora).inicio

  const diasUteisNaSemana = contarDiasUteis(inicio, fim)
  const diasUteisDecorridos = contarDiasUteis(inicio, new Date(hojeInicio.getTime() + 24 * 3600_000))

  const [apontamentos, objetivos, frentes, areas] = await Promise.all([
    prisma.apontamento.findMany({
      where: { iniciadoEm: { gte: inicio, lt: fim } },
      include: { tarefa: { include: { frente: { include: { area: true } } } } },
    }),
    prisma.objetivo.findMany({
      where: { horizonte: 'mes', periodo: mesSP(agora) },
      include: { medicoes: true, area: true },
    }),
    prisma.frente.findMany({
      where: { status: { in: ['aberta', 'planejada'] } },
      include: { area: true, projeto: true },
      orderBy: { ultimoMovimentoEm: 'asc' },
    }),
    prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
  ])

  const porArea = new Map<string, number>(areas.map((a) => [a.nome, 0]))
  let minutosApontados = 0
  for (const ap of apontamentos) {
    const ate = ap.encerradoEm ?? agora
    const min = Math.max(0, (ate.getTime() - ap.iniciadoEm.getTime()) / 60000)
    const nome = ap.tarefa.frente.area.nome
    porArea.set(nome, (porArea.get(nome) ?? 0) + min)
    minutosApontados += min
  }

  const minutosExpedienteDecorrido = diasUteisDecorridos * (FIM_EXPEDIENTE - INICIO_EXPEDIENTE) * 60
  const minutosNoEscuro = Math.max(0, minutosExpedienteDecorrido - minutosApontados)

  // O desdobramento: do objetivo do mes ate quanto falta por dia util.
  const { total, decorridos } = diasUteisDoMes(agora)
  const restantesNoMes = Math.max(0, total - decorridos)
  const desdobrados: ObjetivoDesdobrado[] = objetivos
    .filter((o) => o.alvo != null && o.alvo > 0)
    .map((o) => {
      const realizado = o.medicoes.reduce((s, m) => s + m.valor, 0)
      const alvo = o.alvo as number
      const esperadoHoje = alvo * (decorridos / total)
      const faltam = Math.max(0, alvo - realizado)
      const porDiaUtil = restantesNoMes > 0 ? faltam / restantesNoMes : faltam
      return {
        descricao: o.descricao,
        area: o.area?.nome ?? null,
        alvo,
        realizado,
        esperadoHoje: Math.round(esperadoHoje * 10) / 10,
        faltam,
        diasUteisRestantesNoMes: restantesNoMes,
        porSemana: Math.round(porDiaUtil * 5 * 10) / 10,
        porDiaUtil: Math.round(porDiaUtil * 10) / 10,
        noRitmo: realizado >= esperadoHoje,
      }
    })

  const abertas = frentes.filter((f) => f.status === 'aberta')
  const planejadas = frentes.filter((f) => f.status === 'planejada')

  const diasParada = (d: Date) => contarDiasUteis(limitesDoDia(d).inicio, hojeInicio)

  const criticos = abertas
    .filter((f) => diasParada(f.ultimoMovimentoEm) >= f.area.diasParaCritico)
    .map((f) => ({
      titulo: f.titulo,
      texto: `parada ha ${diasParada(f.ultimoMovimentoEm)} dias uteis (${f.area.nome})`,
      bloqueia: 0,
    }))

  return {
    inicio,
    fim,
    diasUteisNaSemana,
    diasUteisDecorridosNaSemana: diasUteisDecorridos,
    minutosExpedienteDecorrido,
    minutosApontados: Math.round(minutosApontados),
    minutosNoEscuro,
    percentualNoEscuro:
      minutosExpedienteDecorrido > 0 ? Math.round((minutosNoEscuro / minutosExpedienteDecorrido) * 100) : 0,
    horasPorArea: [...porArea.entries()].map(([area, minutos]) => ({ area, minutos: Math.round(minutos) })),
    objetivos: desdobrados,
    criticos,
    frentesAbertas: abertas.map((f) => ({
      titulo: f.titulo,
      area: f.area.nome,
      projeto: f.projeto?.nome ?? null,
      diasParada: diasParada(f.ultimoMovimentoEm),
    })),
    pacotesPlanejados: planejadas.map((f) => ({
      titulo: f.titulo,
      area: f.area.nome,
      projeto: f.projeto?.nome ?? null,
    })),
  }
}

/** O bloco de numeros que vai junto com o pedido ao modelo. */
export function textoDaSemana(s: DadosDaSemana): string {
  const l: string[] = []
  l.push(`SEMANA de ${s.inicio.toLocaleDateString('pt-BR')} - ${s.diasUteisNaSemana} dias uteis, ${s.diasUteisDecorridosNaSemana} decorridos.`)
  l.push('')
  l.push('TEMPO:')
  l.push(`- expediente decorrido na semana: ${formatarHoras(s.minutosExpedienteDecorrido)}`)
  l.push(`- apontado no cronometro: ${formatarHoras(s.minutosApontados)}`)
  l.push(`- sem registro: ${formatarHoras(s.minutosNoEscuro)} (${s.percentualNoEscuro}%)`)
  for (const h of s.horasPorArea) l.push(`- ${h.area}: ${formatarHoras(h.minutos)}`)

  l.push('', 'OBJETIVOS DO MES E O DESDOBRAMENTO (ja calculado, nao recalcule):')
  if (s.objetivos.length === 0) l.push('- nenhum objetivo do mes com numero. Sem isso nao existe desdobramento.')
  for (const o of s.objetivos) {
    l.push(
      `- ${o.descricao}${o.area ? ` [${o.area}]` : ''}: ${o.realizado} de ${o.alvo}. ` +
        `Esperado a esta altura do mes: ${o.esperadoHoje}. ${o.noRitmo ? 'NO RITMO' : 'ATRASADO'}. ` +
        `Faltam ${o.faltam} em ${o.diasUteisRestantesNoMes} dias uteis = ${o.porSemana} por semana, ${o.porDiaUtil} por dia util.`,
    )
  }

  l.push('', 'FRENTES ABERTAS:')
  if (s.frentesAbertas.length === 0) l.push('- nenhuma')
  for (const f of s.frentesAbertas) {
    l.push(`- ${f.titulo} [${f.area}${f.projeto ? ' / ' + f.projeto : ''}] parada ha ${f.diasParada} dias uteis`)
  }

  if (s.pacotesPlanejados.length > 0) {
    l.push('', 'PACOTES DE WBS PLANEJADOS (ainda nao ativados):')
    for (const p of s.pacotesPlanejados) l.push(`- ${p.titulo} [${p.area}${p.projeto ? ' / ' + p.projeto : ''}]`)
  }

  if (s.criticos.length > 0) {
    l.push('', 'CRITICOS:')
    for (const c of s.criticos) l.push(`- ${c.titulo}: ${c.texto}`)
  }

  return l.join('\n')
}
