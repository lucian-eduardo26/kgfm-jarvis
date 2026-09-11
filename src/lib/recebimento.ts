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
    // Ele mesmo hesitou: "a data de corte pra notas de material não tem. Se eu
    // não me engano tem sim, que é dia 20". Na dúvida o sistema usa o corte
    // de SERVIÇO, que é o mais apertado - errar para o lado seguro aqui
    // significa mandar a nota cedo demais, e isso não custa nada.
    duvida: 'o corte de material (dia 20) ainda não está confirmado; o sistema usa o de serviço, que é mais apertado',
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

export function dataLonga(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
}
