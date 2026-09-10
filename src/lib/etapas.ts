// AS ETAPAS DENTRO DE CADA AREA.
//
// Pedido do Lucian em 10/09/2026, e a decisao de projeto que ele embute:
//
//   "Comercial seria prospeccao, a parte central de vendas, e pos-venda. E
//    dentro de fornecedor e compra, definicao de fornecedor, orcamento. Aí a
//    parte administrativa e financeira, fiscal e contabil, eu posso juntar.
//    Mas tudo isso esta dentro de administrativo - nesse momento eu nao
//    separaria."
//
// A tentacao seria criar oito ou dez areas. Nao fizemos, e por dois motivos:
//
// 1. O PAINEL TEM QUATRO MOSTRADORES porque quatro se le de relance. Dez
//    ponteiros nao sao um instrumento, sao um relatorio - e ele ja disse que
//    nao quer interpretar tabela.
// 2. Ele mesmo avisou que vai desmembrar producao depois ("fabricacao interna,
//    terceirizada, rebarbacao... mas nao vou fazer isso agora"). Quem sabe que
//    vai mudar nao cria estrutura rigida hoje.
//
// Entao a AREA continua sendo o mostrador, e a ETAPA e um rotulo dentro dela.
// Quando uma etapa crescer a ponto de merecer ponteiro proprio, ela vira area
// sem quebrar nada do que ja foi registrado.

export type Etapa = { chave: string; nome: string; ajuda: string }

export const ETAPAS: Record<string, Etapa[]> = {
  comercial: [
    { chave: 'prospeccao', nome: 'Prospeccao', ajuda: 'abrir conversa onde nao havia: LinkedIn, indicacao, feira' },
    { chave: 'venda', nome: 'Venda', ajuda: 'cliente ja existe: apresentacao, reuniao, proposta, negociacao' },
    { chave: 'pos-venda', nome: 'Pos-venda', ajuda: 'depois de entregue: duvida, ajuste, medicao, reclamacao' },
  ],
  engenharia: [
    { chave: 'desenvolvimento', nome: 'Desenvolvimento', ajuda: 'conceito, calculo, o que so ele consegue definir' },
    { chave: 'detalhamento', nome: 'Detalhamento', ajuda: 'desenho e documento - o candidato natural a delegacao' },
  ],
  producao: [
    { chave: 'producao', nome: 'Producao', ajuda: 'tudo por enquanto: fabricacao, logistica, qualidade, embalagem' },
  ],
  adm: [
    { chave: 'compras', nome: 'Compras', ajuda: 'definir fornecedor, orcamento, reuniao com fornecedor, pedido' },
    { chave: 'financeiro', nome: 'Financeiro', ajuda: 'pagamento, cobranca, banco, fluxo' },
    { chave: 'fiscal', nome: 'Fiscal e contabil', ajuda: 'nota fiscal, imposto, contabilidade' },
    { chave: 'interno', nome: 'Interno', ajuda: 'a propria empresa: sistema, processo, organizacao' },
  ],
}

/** Todas as etapas, com a area a que pertencem - para a IA escolher. */
export function todasAsEtapas(): { area: string; etapa: Etapa }[] {
  return Object.entries(ETAPAS).flatMap(([area, lista]) => lista.map((etapa) => ({ area, etapa })))
}

export function etapasDaArea(chaveDaArea: string): Etapa[] {
  return ETAPAS[chaveDaArea] ?? []
}

export function nomeDaEtapa(chaveDaArea: string, chaveDaEtapa: string | null): string | null {
  if (!chaveDaEtapa) return null
  return etapasDaArea(chaveDaArea).find((e) => e.chave === chaveDaEtapa)?.nome ?? chaveDaEtapa
}

/** O texto que vai para a IA, para ela classificar a etapa junto com a area. */
export function textoParaIa(): string {
  return Object.entries(ETAPAS)
    .map(([area, lista]) => `${area}: ${lista.map((e) => `${e.chave} (${e.ajuda})`).join(' | ')}`)
    .join('\n')
}
