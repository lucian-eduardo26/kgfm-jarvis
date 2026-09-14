// O CRONÔMETRO QUE ESTÁ RODANDO AGORA, numa consulta só.
//
// Existe separado de `painel.ts` porque a barra do Jarvis e a fita do tempo
// vivem na moldura e aparecem em TODA tela - e carregar o painel inteiro para
// saber se há um cronômetro rodando seria pagar caro por uma resposta de uma
// linha.

import { prisma } from './prisma'

export type CronometroAtivo = {
  apontamentoId: number
  tarefaTitulo: string
  frenteId: number
  frenteTitulo: string | null
  areaNome: string
  projeto: string | null
  projetoId: number | null
  iniciadoEm: string
  /** Último "estou aqui". É dele que sai o "faz tanto tempo sem confirmar". */
  blocoDesde: string
} | null

export async function cronometroAtivo(): Promise<CronometroAtivo> {
  const aberto = await prisma.apontamento.findFirst({
    where: { encerradoEm: null },
    include: {
      tarefa: { include: { frente: { include: { area: true, projeto: true } } } },
    },
    orderBy: { iniciadoEm: 'desc' },
  })

  if (!aberto) return null

  return {
    apontamentoId: aberto.id,
    tarefaTitulo: aberto.tarefa.titulo,
    frenteId: aberto.tarefa.frenteId,
    frenteTitulo: aberto.tarefa.frente.titulo,
    areaNome: aberto.tarefa.frente.area.nome,
    projeto: aberto.tarefa.frente.projeto?.nome ?? null,
    projetoId: aberto.tarefa.frente.projetoId,
    iniciadoEm: aberto.iniciadoEm.toISOString(),
    blocoDesde: (aberto.blocoDesde ?? aberto.iniciadoEm).toISOString(),
  }
}

/**
 * AS FRENTES ABERTAS, para a folha de conferência não pedir digitação.
 *
 * Mora aqui e não em `painel.ts` pelo mesmo motivo do cronômetro: a fita do
 * tempo existe em toda tela, e o botão "comecei outra coisa" precisa da lista
 * em qualquer uma delas.
 */
export async function frentesParaApontar() {
  const frentes = await prisma.frente.findMany({
    where: { status: 'aberta' },
    include: { projeto: true },
    orderBy: { ultimoMovimentoEm: 'desc' },
  })
  return frentes.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    projeto: f.projeto?.nome ?? null,
  }))
}
