// Fuso unico do sistema. A Vercel roda em UTC; sem isto "hoje" vira as 21h
// e "parado há 3 dias" conta errado. Risco 7 do briefing.

export const FUSO = 'America/Sao_Paulo'

type Partes = { ano: number; mes: number; dia: number; hora: number; minuto: number }

function partes(d: Date): Partes {
  const f = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const p: Record<string, string> = {}
  for (const { type, value } of f.formatToParts(d)) p[type] = value
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: p.hour === '24' ? 0 : Number(p.hour),
    minuto: Number(p.minute),
  }
}

/** Meia-noite de São Paulo do dia daquele instante, como Date em UTC. */
export function diaSP(d: Date = new Date()): Date {
  const p = partes(d)
  return new Date(Date.UTC(p.ano, p.mes - 1, p.dia))
}

/** "2026-09-10" no fuso de São Paulo. */
export function hojeSP(d: Date = new Date()): string {
  const p = partes(d)
  return `${p.ano}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`
}

/** "2026-09" - o período usado nos objetivos do mês. */
export function mesSP(d: Date = new Date()): string {
  return hojeSP(d).slice(0, 7)
}

export function anoSP(d: Date = new Date()): string {
  return hojeSP(d).slice(0, 4)
}

export function horaSP(d: Date = new Date()): number {
  return partes(d).hora
}

/** Hora com fracao de minuto, no fuso de Sao Paulo (a Vercel roda em UTC). */
export function horaDecimalSP(d: Date = new Date()): number {
  const p = partes(d)
  return p.hora + p.minuto / 60
}

function ehDiaUtil(d: Date): boolean {
  const s = d.getUTCDay()
  return s !== 0 && s !== 6
}

/**
 * Dias úteis decorridos entre duas datas. Não conta o dia inicial.
 * Fim de semana não e abandono - por isso todo limiar do mostrador e em dia útil.
 */
export function diasUteisEntre(de: Date, ate: Date = new Date()): number {
  const a = diaSP(de)
  const b = diaSP(ate)
  if (b <= a) return 0
  let n = 0
  const cursor = new Date(a)
  while (cursor < b) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    if (ehDiaUtil(cursor)) n++
  }
  return n
}

/** Dias uteis do mes inteiro e quantos ja passaram (contando hoje). */
export function diasUteisDoMes(d: Date = new Date()): { total: number; decorridos: number } {
  const p = partes(d)
  const ultimoDia = new Date(Date.UTC(p.ano, p.mes, 0)).getUTCDate()
  let total = 0
  let decorridos = 0
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(Date.UTC(p.ano, p.mes - 1, dia))
    if (!ehDiaUtil(data)) continue
    total++
    if (dia <= p.dia) decorridos++
  }
  return { total, decorridos }
}

/** Inicio e fim do dia de São Paulo, em UTC - para filtrar apontamentos de hoje. */
export function limitesDoDia(d: Date = new Date()): { inicio: Date; fim: Date } {
  const p = partes(d)
  const meiaNoiteUTC = Date.UTC(p.ano, p.mes - 1, p.dia)
  // Sao Paulo e UTC-3 o ano todo desde 2019 (sem horario de verao).
  const inicio = new Date(meiaNoiteUTC + 3 * 3600_000)
  return { inicio, fim: new Date(inicio.getTime() + 24 * 3600_000) }
}

export function formatarHoras(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = Math.round(minutos % 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}
