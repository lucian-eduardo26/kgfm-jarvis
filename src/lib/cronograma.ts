// O CRONOGRAMA. É a função que o Lucian pediu explicitamente para o Jarvis:
// "esse controle de cronograma é a função do Jarvis".
//
// A conta é simples de propósito. A corrente é sequencial - um pacote começa
// quando o anterior termina - então não existe caminho crítico a calcular: a
// corrente É o caminho crítico, porque é uma linha só. Somar os dias na ordem
// dá a previsão de cada pacote e a data de entrega do projeto.
//
// DIA DE CALENDÁRIO, e não dia útil. Fabricação, banho e transporte não param
// no sábado, e é o calendário que o cliente cobra. Dia útil aqui daria uma
// data bonita que ninguém consegue defender numa reunião.
//
// O PROGRESSO É PESADO POR DIAS, não por contagem de pacote. Fechar a
// embalagem (1 dia) não vale o mesmo que fechar a fabricação (15 dias); se
// valesse, a barra andaria rápido no começo e travaria no meio, mentindo
// exatamente quando ele mais precisa da verdade.

import { diaSP } from './datas'

export type PacoteNoTempo = {
  id: number
  ordem: number
  titulo: string
  pacote: string | null
  areaNome: string
  quemSegura: 'eu' | 'cliente' | 'terceiro'
  dias: number
  inicioPrevisto: Date
  fimPrevisto: Date
  fechado: boolean
  /** Passou da previsão e não fechou. */
  atrasado: boolean
  diasDeAtraso: number
}

export type Cronograma = {
  temData: boolean
  inicio: Date | null
  entregaPrevista: Date | null
  pacotes: PacoteNoTempo[]
  /** 0 a 100, pesado pelos dias de cada pacote. */
  progresso: number
  diasTotais: number
  /** Quantos dias o pacote mais atrasado está estourado. */
  atrasoMaximo: number
  /** De quem é o atraso que mais pesa. Muda o que ele faz: telefonema,
      cobrança ou bloco na agenda. */
  atrasoDe: 'eu' | 'cliente' | 'terceiro' | null
}

type FrenteParaCronograma = {
  id: number
  titulo: string
  pacote: string | null
  ordem: number
  diasEstimados: number | null
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
  const diasFeitos = ordenadas
    .filter((f) => f.status === 'fechada')
    .reduce((s, f) => s + (f.diasEstimados ?? 1), 0)
  const progresso = diasTotais === 0 ? 0 : Math.round((diasFeitos / diasTotais) * 100)

  // Sem data de início não existe previsão. Melhor dizer isso do que inventar
  // uma data a partir de hoje e ele acreditar nela numa reunião.
  if (!inicioEm) {
    return {
      temData: false,
      inicio: null,
      entregaPrevista: null,
      pacotes: [],
      progresso,
      diasTotais,
      atrasoMaximo: 0,
      atrasoDe: null,
    }
  }

  const inicio = diaSP(inicioEm)
  let cursor = inicio
  const pacotes: PacoteNoTempo[] = []
  let atrasoMaximo = 0
  let atrasoDe: Cronograma['atrasoDe'] = null

  for (const f of ordenadas) {
    const dias = f.diasEstimados ?? 1
    const inicioPrevisto = cursor
    const fimPrevisto = somarDias(cursor, dias)
    const fechado = f.status === 'fechada'
    const diasDeAtraso = fechado ? 0 : Math.max(0, diasEntre(fimPrevisto, hoje))

    if (diasDeAtraso > atrasoMaximo) {
      atrasoMaximo = diasDeAtraso
      atrasoDe = f.aguardandoQuem
    }

    pacotes.push({
      id: f.id,
      ordem: f.ordem,
      titulo: f.titulo,
      pacote: f.pacote,
      areaNome: f.area.nome,
      quemSegura: f.aguardandoQuem,
      dias,
      inicioPrevisto,
      fimPrevisto,
      fechado,
      atrasado: diasDeAtraso > 0,
      diasDeAtraso,
    })

    cursor = fimPrevisto
  }

  return {
    temData: true,
    inicio,
    entregaPrevista: cursor,
    pacotes,
    progresso,
    diasTotais,
    atrasoMaximo,
    atrasoDe,
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
 * largura de um telefone. As três não cabiam.
 */
export function dataCurta(d: Date): string {
  const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' })
  const mes = d
    .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
    .replace('.', '')
  return `${dia}/${mes}`
}
