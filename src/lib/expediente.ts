// O TEMPO SEM REGISTRO E TEMPO NÃO MEDIDO - E SÓ ISSO.
//
// Decisao do Lucian, 10/09/2026: "parou de fazer algo, estou fazendo nada -
// também e contabilizado, para confrontar". Sem isso o painel só soma o que ele
// lembrou de apontar, e um sistema que só mostra acerto não confronta ninguém.
//
// CORRECAO no mesmo dia, e ele estava certo: o sistema chamava o buraco de
// "nada feito", e isso é uma afirmacao que ele NÃO PODE FAZER. O buraco pode
// ser ociosidade, pode ser trabalho que ele esqueceu de apontar, pode ser noite
// de sono. Chamar tudo de ociosidade transforma erro de lancamento em prejuizo
// no fechamento da semana - e ensina a desconfiar do número.
//
// Agora o buraco se chama NÃO MEDIDO, e ao lado dele existe o botao de lancar
// o que faltou. Medir e dele; julgar nao e do sistema.
//
// A conta e deliberadamente crua: expediente decorrido menos minutos apontados.
// Não existe desconto de almoço, de reunião nem de banheiro - se foi trabalho,
// aponta; se nao foi, e buraco mesmo, e o buraco tem que aparecer.

import { horaDecimalSP, limitesDoDia } from './datas'

export const INICIO_EXPEDIENTE = 9
export const FIM_EXPEDIENTE = 18

export function ehDiaUtilHoje(agora: Date = new Date()): boolean {
  const { inicio } = limitesDoDia(agora)
  const s = new Date(inicio.getTime() + 12 * 3600_000).getUTCDay()
  return s !== 0 && s !== 6
}

/** Minutos de expediente que já passaram hoje. Fora do dia útil, zero. */
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
    frase = 'Fora do expediente. O que for apontado agora e credito, não obrigacao.'
  } else if (percentual >= 80) {
    frase = 'Quase nada do dia está medido. Isso não quer dizer que nada foi feito - quer dizer que o sistema não sabe. Lance o que faltou e o número passa a valer.'
  } else if (percentual >= 50) {
    frase = 'Mais da metade do expediente não foi medido. Se foi trabalho, lance - senao a semana fecha com um buraco que não e verdade.'
  } else if (percentual >= 25) {
    frase = 'Um quarto do dia sem registro. Não da para melhorar o que não aparece - e não da para cobrar o que não foi medido.'
  } else if (minutosNoEscuro > 0) {
    frase = 'Quase todo o expediente está medido. E assim que o mostrador para de chutar.'
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
