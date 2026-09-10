// A AGENDA, e as janelas que sobram nela.
//
// Newport: trabalho cognitivamente exigente precisa de bloco longo sem
// interrupcao. O que mata nao e a reuniao em si - e o pedaco de 40 minutos
// entre duas reunioes, que parece tempo livre e nao cabe nada profundo.
//
// Por isso o sistema nao pergunta "quanto tempo livre voce tem hoje": ele
// calcula QUAL E A MAIOR JANELA CONTINUA. Cinco pedacos de 30 minutos somam
// duas horas e meia e nao produzem uma proposta.

import { limitesDoDia, horaDecimalSP, formatarHoras } from './datas'
import { INICIO_EXPEDIENTE, FIM_EXPEDIENTE } from './expediente'

/** Uma janela grande o suficiente para trabalho profundo, em minutos. */
export const MINUTOS_BLOCO_PROFUNDO = 90

export type CompromissoDoDia = {
  id: number
  titulo: string
  inicio: Date
  fim: Date
  local: string | null
}

export type Janela = { inicioMin: number; fimMin: number; minutos: number }

export type Agenda = {
  compromissos: CompromissoDoDia[]
  minutosComprometidos: number
  janelas: Janela[]
  maiorJanela: number
  cabeBlocoProfundo: boolean
  fragmentado: boolean
  frase: string
}

/** Minutos desde a meia-noite de Sao Paulo. */
function minutosDoDia(d: Date, inicioDoDia: Date): number {
  return Math.round((d.getTime() - inicioDoDia.getTime()) / 60000)
}

export function relogio(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function montarAgenda(compromissos: CompromissoDoDia[], agora: Date = new Date()): Agenda {
  const { inicio: meiaNoite } = limitesDoDia(agora)
  const abre = INICIO_EXPEDIENTE * 60
  const fecha = FIM_EXPEDIENTE * 60

  // So o que cai dentro do expediente conta para o calculo de janela. Reuniao
  // as 20h e problema de outra natureza.
  const ocupados = compromissos
    .map((c) => ({
      de: Math.max(abre, minutosDoDia(c.inicio, meiaNoite)),
      ate: Math.min(fecha, minutosDoDia(c.fim, meiaNoite)),
    }))
    .filter((o) => o.ate > o.de)
    .sort((a, b) => a.de - b.de)

  // Compromissos sobrepostos viram um bloco so - senao a conta de janela mente.
  const fundidos: { de: number; ate: number }[] = []
  for (const o of ocupados) {
    const ultimo = fundidos[fundidos.length - 1]
    if (ultimo && o.de <= ultimo.ate) ultimo.ate = Math.max(ultimo.ate, o.ate)
    else fundidos.push({ ...o })
  }

  const minutosComprometidos = fundidos.reduce((s, o) => s + (o.ate - o.de), 0)

  // As janelas: o que sobra entre os blocos, a partir de AGORA se o dia ja
  // comecou. Janela no passado nao e janela.
  const agoraMin = Math.round(horaDecimalSP(agora) * 60)
  const piso = Math.max(abre, agoraMin)

  const janelas: Janela[] = []
  let cursor = piso
  for (const o of fundidos) {
    if (o.de > cursor) janelas.push({ inicioMin: cursor, fimMin: o.de, minutos: o.de - cursor })
    cursor = Math.max(cursor, o.ate)
  }
  if (fecha > cursor) janelas.push({ inicioMin: cursor, fimMin: fecha, minutos: fecha - cursor })

  const uteis = janelas.filter((j) => j.minutos >= 15)
  const maiorJanela = uteis.reduce((m, j) => Math.max(m, j.minutos), 0)
  const cabe = maiorJanela >= MINUTOS_BLOCO_PROFUNDO
  const sobra = uteis.reduce((s, j) => s + j.minutos, 0)

  // Fragmentado: sobra tempo, mas nenhum pedaco grande o bastante.
  const fragmentado = !cabe && sobra >= MINUTOS_BLOCO_PROFUNDO

  let frase: string
  if (compromissos.length === 0) {
    frase =
      agoraMin >= fecha
        ? 'Expediente encerrado.'
        : `Nenhum compromisso hoje. ${formatarHoras(maiorJanela)} continuos pela frente - dia de bloco profundo, se voce escolher um.`
  } else if (fragmentado) {
    frase = `Sobram ${formatarHoras(sobra)} espalhados, mas a maior janela e de ${formatarHoras(maiorJanela)}. Isso nao cabe proposta nem engenharia - hoje e dia de trabalho raso: follow-up, prospeccao, respostas.`
  } else if (!cabe && sobra > 0) {
    frase = `Restam ${formatarHoras(sobra)} no dia. Pouco para abrir frente nova; da para fechar pendencia curta.`
  } else if (!cabe) {
    frase = 'Sem janela util no que resta do expediente.'
  } else {
    frase = `${compromissos.length} ${compromissos.length === 1 ? 'compromisso' : 'compromissos'}, e a maior janela livre e de ${formatarHoras(maiorJanela)}. Cabe um bloco profundo - proteja ele.`
  }

  return {
    compromissos: [...compromissos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime()),
    minutosComprometidos,
    janelas: uteis,
    maiorJanela,
    cabeBlocoProfundo: cabe,
    fragmentado,
    frase,
  }
}
