// O CRONOGRAMA. É a função que o Lucian pediu explicitamente para o Jarvis:
// "esse controle de cronograma é a função do Jarvis".
//
// A conta é simples de propósito. A corrente é sequencial - um pacote começa
// quando o anterior termina - então não existe caminho crítico a calcular: a
// corrente É o caminho crítico, porque é uma linha só.
//
// DIA DE CALENDÁRIO, e não dia útil. Fabricação, banho e transporte não param
// no sábado, e é o calendário que o cliente cobra.
//
// ---------------------------------------------------------------------------
// LINHA DE BASE CONTRA LINHA REAL, sem virar MS Project
// ---------------------------------------------------------------------------
// Ele pediu isso e disse "não sei como fazer, quero que você desenvolva". O
// jeito que não vira Project é este, e cabe em três regras:
//
// 1. A BASE CONGELA. `baseInicioEm` e `baseFimEm` são gravados uma vez, quando
//    o plano é feito. Se a previsão se recalculasse a cada ajuste de prazo, o
//    projeto estaria SEMPRE no prazo - porque o prazo perseguiria a realidade.
//    Esse é o erro clássico de cronograma, e congelar é o que o evita.
// 2. O REAL É O QUE ELE LANÇA. `realInicioEm` e `realFimEm`, preenchidos
//    quando acontece. Pacote sem data real ainda não tem história.
// 3. A ACURACIDADE É UMA CONTA SÓ: dos pacotes que já fecharam, quantos
//    fecharam até a data da base. Não tem índice de desempenho, nem valor
//    agregado, nem curva S. Um percentual que ele entende sem manual.
//
// O PERCENTUAL SUBSTITUIU O SIM-OU-NÃO. Pacote de cinco dias passa muito tempo
// em "não feito", e nesse tempo a barra mente. Agora cada pacote tem 0 a 100,
// e o progresso do projeto é a média pesada pelos dias.

import { diaSP } from './datas'

export type PacoteNoTempo = {
  id: number
  ordem: number
  titulo: string
  pacote: string | null
  areaNome: string
  quemSegura: 'eu' | 'cliente' | 'terceiro'
  dias: number
  minutos: number
  percentual: number
  inicioPrevisto: Date
  fimPrevisto: Date
  /** A base congelada, quando existe. */
  baseFim: Date | null
  realFim: Date | null
  fechado: boolean
  atrasado: boolean
  diasDeAtraso: number
  /** Fechou depois da data da linha de base. */
  furouABase: boolean
  /** Dias que passaram da base, quando furou. */
  diasAlemDaBase: number
  /** O anterior fechou, este não começou, e o padrão já estourou. */
  paradoParaComecar: boolean
  diasParado: number
}

export type Cronograma = {
  temData: boolean
  inicio: Date | null
  entregaPrevista: Date | null
  pacotes: PacoteNoTempo[]
  /** 0 a 100, média dos percentuais pesada pelos dias de cada pacote. */
  progresso: number
  diasTotais: number
  /** Minutos DELE que ainda faltam. É o que a semana precisa saber. */
  minutosRestantes: number
  atrasoMaximo: number
  atrasoDe: 'eu' | 'cliente' | 'terceiro' | null
  /** Dos pacotes fechados, quantos por cento respeitaram a linha de base. */
  acuracidade: number | null
  fechadosComBase: number
  /** O pacote que deveria ter começado e não começou. */
  travado: PacoteNoTempo | null
}

type FrenteParaCronograma = {
  id: number
  titulo: string
  pacote: string | null
  ordem: number
  diasEstimados: number | null
  minutosEstimados: number | null
  diasParaIniciar: number | null
  percentual: number
  baseFimEm: Date | null
  realInicioEm: Date | null
  realFimEm: Date | null
  status: string
  aguardandoQuem: 'eu' | 'cliente' | 'terceiro'
  area: { nome: string }
}

function somarDias(d: Date, dias: number): Date {
  const novo = new Date(d)
  novo.setDate(novo.getDate() + dias)
  return novo
}

function diasEntre(de: Date, ate: Date): number {
  return Math.floor((ate.getTime() - de.getTime()) / 86400000)
}

export function montarCronograma(
  inicioEm: Date | null,
  frentes: FrenteParaCronograma[],
  agora: Date = new Date(),
): Cronograma {
  const ordenadas = [...frentes].sort((a, b) => a.ordem - b.ordem)
  const hoje = diaSP(agora)

  const diasTotais = ordenadas.reduce((s, f) => s + (f.diasEstimados ?? 1), 0)

  // Progresso: média dos percentuais, pesada pelos dias. Pacote fechado conta
  // 100 mesmo se o percentual não tiver sido preenchido.
  const pesoTotal = ordenadas.reduce((s, f) => s + Math.max(1, f.diasEstimados ?? 1), 0)
  const pesoFeito = ordenadas.reduce((s, f) => {
    const pct = f.status === 'fechada' ? 100 : f.percentual
    return s + Math.max(1, f.diasEstimados ?? 1) * (pct / 100)
  }, 0)
  const progresso = pesoTotal === 0 ? 0 : Math.round((pesoFeito / pesoTotal) * 100)

  // O que ainda vai consumir a hora dele. Pacote meio feito conta meio.
  const minutosRestantes = Math.round(
    ordenadas.reduce((s, f) => {
      const pct = f.status === 'fechada' ? 100 : f.percentual
      return s + (f.minutosEstimados ?? 0) * ((100 - pct) / 100)
    }, 0),
  )

  // Acuracidade: dos que fecharam COM base gravada, quantos respeitaram.
  const comBase = ordenadas.filter((f) => f.status === 'fechada' && f.baseFimEm && f.realFimEm)
  const dentroDaBase = comBase.filter((f) => diaSP(f.realFimEm!) <= diaSP(f.baseFimEm!))
  const acuracidade = comBase.length === 0 ? null : Math.round((dentroDaBase.length / comBase.length) * 100)

  if (!inicioEm) {
    return {
      temData: false,
      inicio: null,
      entregaPrevista: null,
      pacotes: [],
      progresso,
      diasTotais,
      minutosRestantes,
      atrasoMaximo: 0,
      atrasoDe: null,
      acuracidade,
      fechadosComBase: comBase.length,
      travado: null,
    }
  }

  const inicio = diaSP(inicioEm)
  let cursor = inicio
  const pacotes: PacoteNoTempo[] = []
  let atrasoMaximo = 0
  let atrasoDe: Cronograma['atrasoDe'] = null
  let travado: PacoteNoTempo | null = null
  let fimDoAnterior: Date | null = null

  for (const f of ordenadas) {
    const dias = f.diasEstimados ?? 1
    const inicioPrevisto = cursor
    const fimPrevisto = somarDias(cursor, dias)
    const fechado = f.status === 'fechada'
    const diasDeAtraso = fechado ? 0 : Math.max(0, diasEntre(fimPrevisto, hoje))

    const baseFim = f.baseFimEm ? diaSP(f.baseFimEm) : null
    const realFim = f.realFimEm ? diaSP(f.realFimEm) : null
    const furouABase = Boolean(baseFim && realFim && realFim > baseFim)
    const diasAlemDaBase = furouABase ? diasEntre(baseFim!, realFim!) : 0

    // O ALARME QUE ELE PEDIU: o anterior fechou, este não começou, e o padrão
    // de dias para iniciar já passou. "Já faz tanto tempo que você recebeu o
    // pedido e não deu start na produção."
    const padrao = f.diasParaIniciar
    const naoComecou = !fechado && !f.realInicioEm && f.percentual === 0
    const diasParado = fimDoAnterior && naoComecou ? Math.max(0, diasEntre(fimDoAnterior, hoje)) : 0
    const paradoParaComecar = Boolean(padrao != null && naoComecou && diasParado > padrao)

    if (diasDeAtraso > atrasoMaximo) {
      atrasoMaximo = diasDeAtraso
      atrasoDe = f.aguardandoQuem
    }

    const p: PacoteNoTempo = {
      id: f.id,
      ordem: f.ordem,
      titulo: f.titulo,
      pacote: f.pacote,
      areaNome: f.area.nome,
      quemSegura: f.aguardandoQuem,
      dias,
      minutos: f.minutosEstimados ?? 0,
      percentual: fechado ? 100 : f.percentual,
      inicioPrevisto,
      fimPrevisto,
      baseFim,
      realFim,
      fechado,
      atrasado: diasDeAtraso > 0,
      diasDeAtraso,
      furouABase,
      diasAlemDaBase,
      paradoParaComecar,
      diasParado,
    }
    pacotes.push(p)

    if (paradoParaComecar && !travado) travado = p

    cursor = fimPrevisto
    if (fechado) fimDoAnterior = realFim ?? fimPrevisto
    else fimDoAnterior = null
  }

  return {
    temData: true,
    inicio,
    entregaPrevista: cursor,
    pacotes,
    progresso,
    diasTotais,
    minutosRestantes,
    atrasoMaximo,
    atrasoDe,
    acuracidade,
    fechadosComBase: comBase.length,
    travado,
  }
}

/** O que fazer com um atraso, dito na língua dele. */
export function oQueFazerComOAtraso(de: Cronograma['atrasoDe']): string {
  if (de === 'terceiro') return 'telefonema no fornecedor'
  if (de === 'cliente') return 'cobrança no cliente'
  if (de === 'eu') return 'bloco na sua agenda'
  return ''
}

/**
 * "09/set" - curta de verdade.
 *
 * O formato pronto do pt-BR devolve "09 de set." e são nove caracteres numa
 * linha que já tem data de início, situação e data de entrega dividindo a
 * largura de um telefone.
 */
export function dataCurta(d: Date): string {
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' })
  const mes = d
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
    .replace('.', '')
  return `${dia}/${mes}`
}

/** "1h30" para 90 minutos. Zero vira travessão, porque zero minuto dele é uma
    informação e não um vazio: quer dizer que a engrenagem gira sem ele. */
export function horasCurtas(minutos: number): string {
  if (minutos <= 0) return '-'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}
