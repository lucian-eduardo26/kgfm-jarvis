// Os sete dias da semana corrente, com quantos compromissos cada um tem.
//
// Semana de SEGUNDA a DOMINGO, e não de domingo a sábado: ele trabalha, e a
// semana de quem trabalha começa na segunda. O domingo fica no fim, onde ele
// é descanso e não abertura.

import { prisma } from './prisma'
import { FUSO } from './datas'

export type DiaDaSemana = {
  dia: string
  sigla: string
  numero: number
  compromissos: number
  hoje: boolean
}

const SIGLAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

export async function montarSemanaCurta(agora: Date = new Date()): Promise<DiaDaSemana[]> {
  // O dia de hoje em São Paulo, zerado. Sem o fuso, quem abre o sistema às 22h
  // vê a semana errada, porque a Vercel roda em UTC.
  const hojeTexto = agora.toLocaleDateString('en-CA', { timeZone: FUSO })
  const hoje = new Date(`${hojeTexto}T00:00:00`)

  // getDay: 0 é domingo. Para semana que começa na segunda, domingo vira 6.
  const diaDaSemana = (hoje.getDay() + 6) % 7
  const segunda = new Date(hoje)
  segunda.setDate(segunda.getDate() - diaDaSemana)

  const domingoFim = new Date(segunda)
  domingoFim.setDate(domingoFim.getDate() + 7)

  const compromissos = await prisma.compromisso.findMany({
    where: { inicio: { gte: segunda, lt: domingoFim } },
    select: { inicio: true },
  })

  const porDia = new Map<string, number>()
  for (const c of compromissos) {
    const chave = c.inicio.toLocaleDateString('en-CA', { timeZone: FUSO })
    porDia.set(chave, (porDia.get(chave) ?? 0) + 1)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda)
    d.setDate(d.getDate() + i)
    const chave = d.toLocaleDateString('en-CA')
    return {
      dia: chave,
      sigla: SIGLAS[i],
      numero: d.getDate(),
      compromissos: porDia.get(chave) ?? 0,
      hoje: chave === hojeTexto,
    }
  })
}
