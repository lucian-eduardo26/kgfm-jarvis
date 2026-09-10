// A CARTEIRA DE PROJETOS, pronta para desenhar.
//
// Junta o projeto, a corrente e o cronograma numa forma só, porque a tela de
// gestão à vista precisa das três coisas ao mesmo tempo: o que é, quanto
// andou, e se está atrasado.

import { prisma } from './prisma'
import { montarCronograma, type Cronograma } from './cronograma'
import { NOME_DO_TIPO } from './modelos'
import type { TipoProjeto } from '@prisma/client'

export type ProjetoNaCarteira = {
  id: number
  nome: string
  cliente: string | null
  tipo: TipoProjeto
  tipoNome: string
  fase: string
  valorEstimado: number | null
  temWbs: boolean
  cronograma: Cronograma
  /** Quanto do PRAZO já passou, de 0 a 100. Comparado com o progresso, é o
      que revela atraso sem precisar de nenhum texto. */
  tempoDecorrido: number
}

export async function carteiraDeProjetos(): Promise<ProjetoNaCarteira[]> {
  const projetos = await prisma.projeto.findMany({
    where: { ativo: true },
    include: {
      frentes: {
        where: { status: { not: 'descartada' } },
        include: { area: { select: { nome: true } } },
        orderBy: { ordem: 'asc' },
      },
    },
    orderBy: { criadoEm: 'asc' },
  })

  const agora = new Date()

  return projetos.map((p) => {
    const cronograma = montarCronograma(p.inicioEm, p.frentes, agora)

    let tempoDecorrido = 0
    if (cronograma.temData && cronograma.inicio && cronograma.entregaPrevista) {
      const total = cronograma.entregaPrevista.getTime() - cronograma.inicio.getTime()
      const passou = agora.getTime() - cronograma.inicio.getTime()
      tempoDecorrido = total <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((passou / total) * 100)))
    }

    return {
      id: p.id,
      nome: p.nome,
      cliente: p.cliente,
      tipo: p.tipo,
      tipoNome: NOME_DO_TIPO[p.tipo],
      fase: p.fase,
      valorEstimado: p.valorEstimado,
      temWbs: p.frentes.length > 0,
      cronograma,
      tempoDecorrido,
    }
  })
}
