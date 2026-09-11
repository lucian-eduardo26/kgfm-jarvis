// QUANDO O DINHEIRO ENTRA DE VERDADE.
//
// O Lucian ditou a regra da Riachuelo em 11/09/2026, e ela desmonta a conta
// que o sistema fazia até aqui:
//
//   "Não é 28 DDL padrão de mercado. São dias fixos de pagamento: dia 5, 15 e
//    25 de cada mês. Se for nota de serviço, a data de corte é dia 15. Se eu
//    enviar dia 14, dia 15 de outubro o dinheiro está na conta. Se eu atrasar
//    e mandar dia 15 ou 16, o pagamento não vai ser 15 de outubro, vai ser 25."
//
// POR QUE ISSO MUDA TUDO: com prazo em dias corridos, atrasar um dia custa um
// dia. Com data de corte, atrasar UM dia custa DEZ - o dinheiro pula para a
// próxima janela inteira. É a diferença entre um aborrecimento e um buraco de
// caixa, e nenhuma conta de "recebe em 60 dias" enxerga isso.
//
// E é por isso que o prazo de entrega se calcula DE TRÁS PARA A FRENTE: a
// data que manda não é a da entrega, é a do corte.

/** A data de corte que o Lucian está de fato usando para a Riachuelo. */
export type RegraDeRecebimento = {
  cliente: string
  /** Dias do mês em que o cliente paga. */
  diasDePagamento: number[]
  /** Até que dia do mês a nota precisa chegar para entrar na janela. */
  corteServico: number
  /** Idem, para nota de material. */
  corteMaterial: number
  /** O que ainda não está confirmado, e a tela precisa dizer. */
  duvida?: string
}

export const REGRAS: RegraDeRecebimento[] = [
  {
    cliente: 'RCHLO',
    diasDePagamento: [5, 15, 25],
    corteServico: 15,
    corteMaterial: 20,
    // CONFIRMADO por ele em 11/09/2026: o corte de material é mesmo dia 20.
    // E foi ele quem tirou a conclusão que importa - pelo dia 20 o pagamento
    // cai no dia 25, dez dias depois. Por isso o sistema não escolhe o corte
    // pelo tipo da nota: escolhe o que paga mais cedo. Ver `melhorJanela`.
  },
]

export type TipoNota = 'servico' | 'material'

export function regraDoCliente(cliente: string | null): RegraDeRecebimento | null {
  if (!cliente) return null
  const c = cliente.trim().toUpperCase()
  return (
    REGRAS.find((r) => r.cliente.toUpperCase() === c) ??
    // "Riachuelo" e "RCHLO" são o mesmo cliente.
    (c.startsWith('RIACHUELO') ? REGRAS.find((r) => r.cliente === 'RCHLO') ?? null : null)
  )
}

export type JanelaDeFaturamento = {
  /** O último dia para a nota sair e entrar nesta janela. */
  corte: Date
  /** Quando o dinheiro cai, se a nota sair até o corte. */
  pagamento: Date
  /** Quando cai se PERDER o corte. É este número que assusta, e deve. */
  pagamentoSePerder: Date
  /** Dias corridos daqui até o corte. Negativo quer dizer que já passou. */
  diasAteOCorte: number
  /** Quantos dias o dinheiro atrasa se o corte for perdido. */
  custoEmDiasDeAtraso: number
}

function dia(ano: number, mes: number, d: number): Date {
  return new Date(ano, mes, d, 12, 0, 0, 0)
}

function diasEntre(de: Date, ate: Date): number {
  const a = new Date(de.getFullYear(), de.getMonth(), de.getDate())
  const b = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

/**
 * A próxima janela de faturamento deste cliente.
 *
 * "Subsequente" é ao pé da letra: a nota que entra até o corte de setembro é
 * paga no dia de pagamento do mês SEGUINTE. Perder o corte não empurra para o
 * dia seguinte - empurra para o próximo dia de pagamento, que pode ser dez
 * dias depois.
 */
export function proximaJanela(
  regra: RegraDeRecebimento,
  tipo: TipoNota,
  hoje: Date = new Date(),
): JanelaDeFaturamento {
  const diaDeCorte = tipo === 'servico' ? regra.corteServico : regra.corteMaterial
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  // A nota tem que sair ATÉ a véspera do corte: no dia do corte já passou.
  let corte = dia(ano, mes, diaDeCorte - 1)
  if (diasEntre(hoje, corte) < 0) {
    // O corte deste mês já passou; a próxima janela é a do mês que vem.
    corte = dia(ano, mes + 1, diaDeCorte - 1)
  }

  // O pagamento é no primeiro dia de pagamento do mês subsequente ao corte.
  const pagamento = dia(corte.getFullYear(), corte.getMonth() + 1, Math.min(...regra.diasDePagamento.filter((d) => d >= diaDeCorte)) || regra.diasDePagamento[0])

  // Perdeu o corte: cai no dia de pagamento seguinte da lista.
  const ordenados = [...regra.diasDePagamento].sort((a, b) => a - b)
  const atual = pagamento.getDate()
  const proximoDia = ordenados.find((d) => d > atual)
  const pagamentoSePerder = proximoDia
    ? dia(pagamento.getFullYear(), pagamento.getMonth(), proximoDia)
    : dia(pagamento.getFullYear(), pagamento.getMonth() + 1, ordenados[0])

  return {
    corte,
    pagamento,
    pagamentoSePerder,
    diasAteOCorte: diasEntre(hoje, corte),
    custoEmDiasDeAtraso: diasEntre(pagamento, pagamentoSePerder),
  }
}

/**
 * A MELHOR JANELA, e não a janela do tipo da nota.
 *
 * O Lucian corrigiu isto em 11/09/2026, e a correção é mais fina do que
 * parece:
 *
 *   "O corte do envio de material é dia 20. Mas se eu enviar dia 19, vou
 *    receber dia 25 de outubro. Estou jogando pra frente à toa."
 *
 * O erro que eu ia cometer era tratar a data de corte como uma REGRA A
 * CUMPRIR. Ela não é: é uma porta, e há mais de uma porta aberta. Pelo corte
 * de serviço (dia 15) a nota sai até 14 e o dinheiro entra 15 de outubro.
 * Pelo corte de material (dia 20) a nota sai até 19 e o dinheiro entra 25.
 * A segunda porta é mais folgada e paga DEZ DIAS DEPOIS.
 *
 * Então a pergunta certa nunca foi "qual corte se aplica a esta nota". É
 * "qual corte põe o dinheiro na conta mais cedo" - e é sempre esse que o
 * sistema mira, independentemente do tipo da nota.
 *
 * Folga que custa dez dias de caixa não é folga, é prejuízo com data marcada.
 */
export function melhorJanela(
  regra: RegraDeRecebimento,
  hoje: Date = new Date(),
): JanelaDeFaturamento & { tipoQueGanhou: TipoNota } {
  const servico = proximaJanela(regra, 'servico', hoje)
  const material = proximaJanela(regra, 'material', hoje)

  // Só entra na disputa a janela que ainda dá para alcançar.
  const possiveis: { tipo: TipoNota; j: JanelaDeFaturamento }[] = []
  if (servico.diasAteOCorte >= 0) possiveis.push({ tipo: 'servico', j: servico })
  if (material.diasAteOCorte >= 0) possiveis.push({ tipo: 'material', j: material })

  // Nenhuma alcançável: devolve a de serviço, que já traz o corte do mês que
  // vem calculado, e o alerta cuida de dizer que passou.
  if (possiveis.length === 0) return { ...servico, tipoQueGanhou: 'servico' }

  const melhor = possiveis.sort(
    (a, b) => a.j.pagamento.getTime() - b.j.pagamento.getTime() || a.j.corte.getTime() - b.j.corte.getTime(),
  )[0]

  return { ...melhor.j, tipoQueGanhou: melhor.tipo }
}

export function dataLonga(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
}
