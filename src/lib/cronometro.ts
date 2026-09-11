// O CRONÔMETRO QUE ESTÁ RODANDO AGORA, numa consulta só.
//
// Existe separado de `painel.ts` porque a barra do Jarvis vive na moldura e
// aparece em TODA tela - e carregar o painel inteiro para saber se há um
// cronômetro rodando seria pagar caro por uma resposta de uma linha.

import { prisma } from './prisma'

export type CronometroAtivo = {
  tarefaTitulo: string
  frenteTitulo: string | null
  areaNome: string
  iniciadoEm: string
} | null

export async function cronometroAtivo(): Promise<CronometroAtivo> {
  const aberto = await prisma.apontamento.findFirst({
    where: { encerradoEm: null },
    include: { tarefa: { include: { frente: { include: { area: true } } } } },
    orderBy: { iniciadoEm: 'desc' },
  })

  if (!aberto) return null

  return {
    tarefaTitulo: aberto.tarefa.titulo,
    frenteTitulo: aberto.tarefa.frente.titulo,
    areaNome: aberto.tarefa.frente.area.nome,
    iniciadoEm: aberto.iniciadoEm.toISOString(),
  }
}
