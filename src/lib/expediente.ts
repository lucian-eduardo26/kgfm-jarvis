// O TEMPO SEM REGISTRO E TEMPO NAO MEDIDO - E SO ISSO.
//
// Decisao do Lucian, 10/09/2026: "parou de fazer algo, estou fazendo nada -
// tambem e contabilizado, para confrontar". Sem isso o painel so soma o que ele
// lembrou de apontar, e um sistema que so mostra acerto nao confronta ninguem.
//
// CORRECAO no mesmo dia, e ele estava certo: o sistema chamava o buraco de
// "nada feito", e isso e uma afirmacao que ele NAO PODE FAZER. O buraco pode
// ser ociosidade, pode ser trabalho que ele esqueceu de apontar, pode ser noite
// de sono. Chamar tudo de ociosidade transforma erro de lancamento em prejuizo
// no fechamento da semana - e ensina a desconfiar do numero.
//
// Agora o buraco se chama NAO MEDIDO, e ao lado dele existe o botao de lancar
// o que faltou. Medir e dele; julgar nao e do sistema.
//
// A conta e deliberadamente crua: expediente decorrido menos minutos apontados.
// Nao existe desconto de almoco, de reuniao nem de banheiro - se foi trabalho,
// aponta; se nao foi, e buraco mesmo, e o buraco tem que aparecer.

import { horaDecimalSP, limitesDoDia } from './datas'

export const INICIO_EXPEDIENTE = 9
export const FIM_EXPEDIENTE = 18

export function ehDiaUtilHoje(agora: Date = new Date()): boolean {
  const { inicio } = limitesDoDia(agora)
  const s = new Date(inicio.getTime() + 12 * 3600_000).getUTCDay()
  return s !== 0 && s !== 6
}

/** Minutos de expediente que ja passaram hoje. Fora do dia util, zero. */
export function minutosDeExpedienteAteAgora(agora: Date = new Date()): number {
  if (!ehDiaUtilHoje(agora)) return 0
  const h = horaDecimalSP(agora)
  if (h <= INICIO_EXPEDIENTE) return 0
  const ate = Math.min(h, FIM_EXPEDIENTE)
  return Math.round((ate - INICIO_EXPEDIENTE) * 60)
}

export type Confronto = {
  minutosExpediente: number
  minutosApontados: number
  minutosNoEscuro: number
  percentualNoEscuro: number
  frase: string
}

export function confrontar(minutosApontados: number, agora: Date = new Date()): Confronto {
  const minutosExpediente = minutosDeExpedienteAteAgora(agora)
  const minutosNoEscuro = Math.max(0, minutosExpediente - minutosApontados)
  const percentual = minutosExpediente > 0 ? (minutosNoEscuro / minutosExpediente) * 100 : 0

  let frase: string
  if (minutosExpediente === 0) {
    frase = 'Fora do expediente. O que for apontado agora e credito, nao obrigacao.'
  } else if (percentual >= 80) {
    frase = 'Quase nada do dia esta medido. Isso nao quer dizer que nada foi feito - quer dizer que o sistema nao sabe. Lance o que faltou e o numero passa a valer.'
  } else if (percentual >= 50) {
    frase = 'Mais da metade do expediente nao foi medido. Se foi trabalho, lance - senao a semana fecha com um buraco que nao e verdade.'
  } else if (percentual >= 25) {
    frase = 'Um quarto do dia sem registro. Nao da para melhorar o que nao aparece - e nao da para cobrar o que nao foi medido.'
  } else if (minutosNoEscuro > 0) {
    frase = 'Quase todo o expediente esta medido. E assim que o mostrador para de chutar.'
  } else {
    frase = 'Expediente inteiro apontado.'
  }

  return {
    minutosExpediente,
    minutosApontados: Math.round(minutosApontados),
    minutosNoEscuro,
    percentualNoEscuro: Math.round(percentual),
    frase,
  }
}
