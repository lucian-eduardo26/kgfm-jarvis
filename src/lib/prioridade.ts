// A PRIORIDADE DOS PROJETOS.
//
// O Lucian em 10/09/2026: "eu quero que ele pense e escolha a melhor
// prioridade pra cada projeto, que é o que traz dinheiro pro caixa".
//
// Então a conta é sobre DINHEIRO E QUANDO ELE ENTRA, e não sobre qual projeto
// é mais bonito. Cinco fatores, cada um de 0 a 1, com peso ajustável:
//
//   valor      quanto há em jogo, comparado com o maior da carteira
//   caixa      quão rápido esse dinheiro entra depois de fechar
//   chance     a probabilidade de fechar mesmo
//   andamento  projeto já vendido ganha de aposta - nota fiscal vence promessa
//   atraso     o que está atrasado sobe, porque atraso corrói margem
//
// DUAS DECISÕES QUE VALEM SER DITAS EM VOZ ALTA:
//
// 1. DADO QUE FALTA NÃO VIRA ZERO SILENCIOSO. Projeto sem valor informado
//    pontua zero naquele fator, e a tela DIZ que foi por isso. Zero calado
//    faria o sistema parecer burro quando na verdade está faltando dado.
// 2. A MÃO DELE GANHA DA CONTA. `Projeto.prioridade` preenchido manda, sem
//    discussão - ele sabe de coisa que o banco não tem. O sistema continua
//    mostrando o que TERIA calculado, para os dois aprenderem com a diferença.

import { prisma } from './prisma'

export type PesosPrioridade = {
  pesoValor: number
  pesoCaixa: number
  pesoChance: number
  pesoAndamento: number
  pesoAtraso: number
}

// Valor e caixa somam 65 dos 100: é uma régua de dinheiro, e ela diz isso.
export const PESOS_PADRAO: PesosPrioridade = {
  pesoValor: 35,
  pesoCaixa: 30,
  pesoChance: 15,
  pesoAndamento: 12,
  pesoAtraso: 8,
}

export const CAMPOS_PRIORIDADE: {
  chave: keyof PesosPrioridade
  rotulo: string
  explicacao: string
}[] = [
  { chave: 'pesoValor', rotulo: 'Valor em jogo', explicacao: 'Quanto o tamanho do projeto pesa. Comparado com o maior da carteira.' },
  { chave: 'pesoCaixa', rotulo: 'Velocidade do dinheiro', explicacao: 'Quanto pesa o dinheiro entrar cedo. Com caixa curto, este é o que manda.' },
  { chave: 'pesoChance', rotulo: 'Chance de fechar', explicacao: 'Quanto pesa a probabilidade. Projeto grande com 10% de chance vale menos que um médio com 90%.' },
  { chave: 'pesoAndamento', rotulo: 'Já está vendido', explicacao: 'Quanto pesa o projeto já ser obrigação e não aposta. Nota fiscal vence promessa.' },
  { chave: 'pesoAtraso', rotulo: 'Está atrasado', explicacao: 'Quanto o atraso sobe a prioridade. Atraso corrói margem e confiança.' },
]

export type EntradaPrioridade = {
  id: number
  nome: string
  tipo: string
  fase: string
  valorEstimado: number | null
  prazoRecebimentoDias: number | null
  probabilidade: number | null
  prioridadeManual: number | null
  atrasoDias: number
}

export type Prioridade = {
  id: number
  /** O que vale na ordenação: a mão dele, se existir; senão a conta. */
  efetiva: number
  calculada: number
  manual: number | null
  /** Por que deu esse número, em português. */
  porque: string[]
  /** O que falta para a conta ser confiável. */
  faltando: string[]
}

/** O prazo de recebimento mais longo que ainda merece nota acima de zero. */
const PRAZO_PIOR = 120

export function calcularPrioridades(
  projetos: EntradaPrioridade[],
  pesos: PesosPrioridade = PESOS_PADRAO,
): Prioridade[] {
  const maiorValor = Math.max(1, ...projetos.map((p) => p.valorEstimado ?? 0))
  const somaPesos =
    pesos.pesoValor + pesos.pesoCaixa + pesos.pesoChance + pesos.pesoAndamento + pesos.pesoAtraso || 1

  return projetos.map((p) => {
    const porque: string[] = []
    const faltando: string[] = []

    // 1. VALOR. Sem valor informado o fator é zero, e a tela avisa.
    const fValor = p.valorEstimado ? p.valorEstimado / maiorValor : 0
    if (p.valorEstimado) porque.push(`R$ ${p.valorEstimado.toLocaleString('pt-BR')} em jogo`)
    else faltando.push('valor estimado')

    // 2. CAIXA. Recebe em 30 dias vale mais que recebe em 120.
    const fCaixa = p.prazoRecebimentoDias
      ? Math.max(0, 1 - p.prazoRecebimentoDias / PRAZO_PIOR)
      : 0
    if (p.prazoRecebimentoDias) porque.push(`dinheiro entra em ${p.prazoRecebimentoDias} dias`)
    else faltando.push('prazo de recebimento')

    // 3. CHANCE.
    const fChance = (p.probabilidade ?? 50) / 100

    // 4. ANDAMENTO. Vendido vale mais que aposta.
    const fAndamento = p.fase === 'fechado' ? 1 : p.fase === 'entregue' ? 0.4 : 0
    if (p.fase === 'fechado') porque.push('já está vendido')

    // 5. ATRASO. Satura em 15 dias: atraso de 60 não é quatro vezes pior que
    // o de 15 na hora de escolher o que fazer hoje.
    const fAtraso = Math.min(1, p.atrasoDias / 15)
    if (p.atrasoDias > 0) porque.push(`${p.atrasoDias} dias de atraso`)

    const calculada = Math.round(
      ((fValor * pesos.pesoValor +
        fCaixa * pesos.pesoCaixa +
        fChance * pesos.pesoChance +
        fAndamento * pesos.pesoAndamento +
        fAtraso * pesos.pesoAtraso) /
        somaPesos) *
        100,
    )

    return {
      id: p.id,
      calculada,
      manual: p.prioridadeManual,
      efetiva: p.prioridadeManual ?? calculada,
      porque,
      faltando,
    }
  })
}

export async function lerPesosPrioridade(): Promise<PesosPrioridade> {
  const linhas = await prisma.config.findMany()
  const pesos = { ...PESOS_PADRAO }
  for (const l of linhas) {
    if (l.chave in pesos) {
      const n = Number(l.valor)
      if (Number.isFinite(n)) (pesos as Record<string, number>)[l.chave] = n
    }
  }
  return pesos
}
