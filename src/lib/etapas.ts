// AS ETAPAS DENTRO DE CADA ÁREA.
//
// Pedido do Lucian em 10/09/2026, e a decisão de projeto que ele embute:
//
//   "Comercial seria prospecção, a parte central de vendas, e pos-venda. E
//    dentro de fornecedor e compra, definicao de fornecedor, orçamento. Aí a
//    parte administrativa e financeira, fiscal e contábil, eu posso juntar.
//    Mas tudo isso está dentro de administrativo - nesse momento eu não
//    separaria."
//
// A tentacao seria criar oito ou dez áreas. Não fizemos, e por dois motivos:
//
// 1. O PAINEL TEM QUATRO MOSTRADORES porque quatro se le de relance. Dez
//    ponteiros não são um instrumento, são um relatório - e ele já disse que
//    não quer interpretar tabela.
// 2. Ele mesmo avisou que vai desmembrar producao depois ("fabricacao interna,
//    terceirizada, rebarbacao... mas nao vou fazer isso agora"). Quem sabe que
//    vai mudar não cria estrutura rigida hoje.
//
// Então a ÁREA continua sendo o mostrador, e a ETAPA é um rótulo dentro dela.
// Quando uma etapa crescer a ponto de merecer ponteiro próprio, ela vira área
// sem quebrar nada do que já foi registrado.

export type Etapa = { chave: string; nome: string; ajuda: string }

export const ETAPAS: Record<string, Etapa[]> = {
  comercial: [
    { chave: 'prospeccao', nome: 'Prospecção', ajuda: 'abrir conversa onde não havia: LinkedIn, indicacao, feira' },
    { chave: 'venda', nome: 'Venda', ajuda: 'cliente já existe: apresentação, reunião, proposta, negociação' },
    { chave: 'pos-venda', nome: 'Pós-venda', ajuda: 'depois de entregue: duvida, ajuste, medição, reclamacao' },
  ],
  engenharia: [
    { chave: 'desenvolvimento', nome: 'Desenvolvimento', ajuda: 'conceito, cálculo, o que só ele consegue definir' },
    { chave: 'detalhamento', nome: 'Detalhamento', ajuda: 'desenho e documento - o candidato natural a delegacao' },
  ],
  producao: [
    { chave: 'producao', nome: 'Produção', ajuda: 'tudo por enquanto: fabricacao, logística, qualidade, embalagem' },
  ],
  adm: [
    { chave: 'compras', nome: 'Compras', ajuda: 'definir fornecedor, orçamento, reunião com fornecedor, pedido' },
    { chave: 'financeiro', nome: 'Financeiro', ajuda: 'pagamento, cobranca, banco, fluxo' },
    { chave: 'fiscal', nome: 'Fiscal e contábil', ajuda: 'nota fiscal, imposto, contabilidade' },
    { chave: 'interno', nome: 'Interno', ajuda: 'a própria empresa: sistema, processo, organização' },
  ],
}

/** Todas as etapas, com a área a que pertencem - para a IA escolher. */
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

/** O texto que vai para a IA, para ela classificar a etapa junto com a área. */
export function textoParaIa(): string {
  return Object.entries(ETAPAS)
    .map(([area, lista]) => `${area}: ${lista.map((e) => `${e.chave} (${e.ajuda})`).join(' | ')}`)
    .join('\n')
}
