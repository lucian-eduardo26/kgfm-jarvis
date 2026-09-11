// A CARTEIRA DE PROJETOS, pronta para desenhar.
//
// Junta o projeto, a corrente e o cronograma numa forma só, porque a tela de
// gestão à vista precisa das três coisas ao mesmo tempo: o que é, quanto
// andou, e se está atrasado.

import { prisma } from './prisma'
import { montarCronograma, type Cronograma } from './cronograma'
import { NOME_DO_TIPO } from './modelos'
import { calcularPrioridades, lerPesosPrioridade, type Prioridade } from './prioridade'
import type { TipoProjeto } from '@prisma/client'

export type ProjetoNaCarteira = {
  id: number
  nome: string
  cliente: string | null
  tipo: TipoProjeto
  tipoNome: string
  fase: string
  valorEstimado: number | null
  probabilidade: number | null
  temWbs: boolean
  cronograma: Cronograma
  /** Quanto do PRAZO já passou, de 0 a 100. Comparado com o progresso, é o
      que revela atraso sem precisar de nenhum texto. */
  tempoDecorrido: number
  prioridade: Prioridade
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
  const pesos = await lerPesosPrioridade()

  const cronogramas = new Map(projetos.map((p) => [p.id, montarCronograma(p.inicioEm, p.frentes, agora)]))

  const prioridades = new Map(
    calcularPrioridades(
      projetos.map((p) => ({
        id: p.id,
        nome: p.nome,
        tipo: p.tipo,
        fase: p.fase,
        valorEstimado: p.valorEstimado,
        prazoRecebimentoDias: p.prazoRecebimentoDias,
        probabilidade: p.probabilidade,
        prioridadeManual: p.prioridade,
        atrasoDias: cronogramas.get(p.id)?.atrasoMaximo ?? 0,
      })),
      pesos,
    ).map((x) => [x.id, x]),
  )

  const carteira = projetos.map((p) => {
    const cronograma = cronogramas.get(p.id)!

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
      probabilidade: p.probabilidade,
      temWbs: p.frentes.length > 0,
      cronograma,
      tempoDecorrido,
      prioridade: prioridades.get(p.id)!,
    }
  })

  // A ORDEM DA TELA É A ORDEM DA PRIORIDADE. O Lucian pediu "os mais
  // importantes primeiro", e importante aqui quer dizer o que traz dinheiro
  // para o caixa - não o que foi cadastrado primeiro.
  //
  // O desempate é o atraso: entre dois projetos que valem o mesmo, quem já
  // estourou o prazo aparece antes.
  return carteira.sort((a, b) => {
    const dif = b.prioridade.efetiva - a.prioridade.efetiva
    if (dif !== 0) return dif
    return b.cronograma.atrasoMaximo - a.cronograma.atrasoMaximo
  })
}
