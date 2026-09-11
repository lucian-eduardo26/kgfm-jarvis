// O FUNIL, E OS INDICADORES QUE VALEM A PENA.
//
// O Lucian em 11/09/2026: "quero indicador de cobertura do funil, quanto tem no
// funil do que temos chance real de fechamento. Ideal acima de 80% de
// cobertura. E crie outros indicadores com base em teoria literária para
// marketing e vendas que faça diferença pra nós."
//
// ---------------------------------------------------------------------------
// DE ONDE VEM CADA NÚMERO, E POR QUE NÃO VEM DO CRM
// ---------------------------------------------------------------------------
// O CRM da KGFM rastreia PESSOAS e CONVERSAS, não dinheiro: ele não tem campo
// de valor, nem de probabilidade. Isso não é falha dele - é o desenho certo,
// porque o trabalho dele termina quando a conversa sai do LinkedIn.
//
// Então o funil em reais se calcula AQUI, com os projetos, que é onde valor,
// probabilidade e fase existem. Do CRM vem o TOPO: quantas conversas viraram
// contato real, que é o que diz se o funil vai ser reabastecido.
//
// ---------------------------------------------------------------------------
// OS INDICADORES, E A LITERATURA DE CADA UM
// ---------------------------------------------------------------------------
// Nenhum deles foi inventado aqui. Cada um resolve um erro conhecido:
//
// 1. COBERTURA - pipeline coverage, prática padrão de gestão de vendas.
//    Funil ponderado dividido pela meta do período. Existe porque funil bruto
//    mente: somar tudo que está aberto conta como dinheiro o que tem 10% de
//    chance.
//
// 2. VELOCIDADE - a fórmula de aceleração de vendas (Mark Roberge, "The Sales
//    Acceleration Formula"): oportunidades x ticket médio x taxa de conversão,
//    dividido pelo ciclo em dias. É quanto dinheiro o funil produz POR DIA, e
//    é o único número que junta volume, tamanho, qualidade e tempo.
//
// 3. CONCENTRAÇÃO - quanto do funil está num cliente só. Rumelt trataria isso
//    como diagnóstico: um funil de R$ 1 milhão todo num cliente não é um funil
//    de R$ 1 milhão, é uma aposta. Para a KGFM importa muito, porque quase
//    tudo hoje é Riachuelo.
//
// 4. QUALIFICAÇÃO - percentual do funil com SPIN completo (Rackham). Negócio
//    sem Implicação admitida pelo cliente fecha muito menos, e proposta feita
//    sem ela vira disputa de preço. Mede o funil que é REAL.
//
// 5. CICLO MÉDIO - dias entre abrir e fechar. Alimenta a velocidade e, com
//    caixa curto, decide o que entra na semana: negócio que fecha depois do
//    caixa acabar não é prioridade, por melhor que seja.

import { prisma } from './prisma'
import { carteiraDeProjetos } from './projetos'

export type EtapaDoFunil = {
  chave: string
  nome: string
  /** O que esta etapa quer dizer, em uma frase. */
  significa: string
  quantidade: number
  valor: number
  valorPonderado: number
}

export type Indicador = {
  chave: string
  nome: string
  /** O número, já formatado. */
  valor: string
  /** O número cru, para desenhar. */
  bruto: number | null
  /** A referência: o que é bom. */
  alvo: string
  /** verde quando bate o alvo, âmbar quando aperta, vermelho quando não. */
  zona: 'verde' | 'ambar' | 'vermelho' | 'cinza'
  /** De onde veio a ideia, para ele poder discordar com fundamento. */
  fonte: string
  /** O que fazer com este número. */
  leitura: string
}

export type Funil = {
  etapas: EtapaDoFunil[]
  total: number
  totalPonderado: number
  meta: number | null
  indicadores: Indicador[]
  /** O que falta preencher para os números pararem de mentir. */
  faltando: string[]
}

const reais = (n: number) =>
  n >= 1000
    ? `R$ ${Math.round(n / 1000).toLocaleString('pt-BR')} mil`
    : `R$ ${Math.round(n).toLocaleString('pt-BR')}`

/**
 * As etapas do funil na linguagem da KGFM.
 *
 * Não são as etapas genéricas de CRM. São as fases que o projeto realmente
 * atravessa aqui, e cada uma tem um significado de dinheiro diferente.
 */
const ETAPAS = [
  { chave: 'descoberta', nome: 'Descoberta', significa: 'conversa aberta, ainda sem layout nem número' },
  { chave: 'proposta', nome: 'Proposta', significa: 'layout apresentado ou proposta na mão do cliente' },
  { chave: 'fechado', nome: 'Ganho', significa: 'pedido na mão, virou obrigação de entregar' },
]

export async function montarFunil(): Promise<Funil> {
  const carteira = await carteiraDeProjetos()
  const faltando: string[] = []

  const semValor = carteira.filter((p) => !p.valorEstimado)
  if (semValor.length > 0) {
    faltando.push(`${semValor.length} ${semValor.length === 1 ? 'projeto sem' : 'projetos sem'} valor estimado`)
  }

  // A META TEM QUE SER EM DINHEIRO, e conferir isso não é preciosismo.
  //
  // A primeira versão pegava qualquer objetivo do mês com alvo, e o alvo que
  // veio foi "4 notas fiscais emitidas". Dividir R$ 5 milhões por 4 devolveu
  // uma cobertura de 131 milhões por cento - um número tão absurdo que dava
  // para rir, mas a mesma falha com números parecidos passaria despercebida.
  //
  // Então a métrica precisa dizer que é dinheiro. Sem isso, o sistema diz que
  // não tem meta, que é a verdade.
  const objetivos = await prisma.objetivo.findMany({
    where: { horizonte: 'mes', alvo: { not: null } },
    orderBy: { criadoEm: 'desc' },
  })
  const emDinheiro = objetivos.find((o) =>
    /faturamento|receita|reais|r\$|vendas|venda fechada/i.test(`${o.metrica ?? ''} ${o.descricao}`),
  )
  const meta = emDinheiro?.alvo ?? null
  if (!meta) {
    faltando.push(
      objetivos.length > 0
        ? 'um objetivo do mês em REAIS (os que existem contam propostas, contatos e notas, não dinheiro)'
        : 'a meta de faturamento do mês',
    )
  }

  const etapas: EtapaDoFunil[] = ETAPAS.map((e) => {
    // Descoberta e proposta saem da mesma fase do projeto; o que separa é ter
    // proposta enviada. Sem esse detalhe, tudo viraria uma etapa só.
    const doGrupo = carteira.filter((p) => {
      if (e.chave === 'fechado') return p.fase === 'fechado'
      if (p.fase !== 'desenvolvimento') return false
      const temProposta = (p.prioridade.porque ?? []).some((x) => x.includes('proposta'))
      return e.chave === 'proposta' ? temProposta : !temProposta
    })

    const valor = doGrupo.reduce((s, p) => s + (p.valorEstimado ?? 0), 0)
    const ponderado = doGrupo.reduce(
      (s, p) => s + (p.valorEstimado ?? 0) * ((p.fase === 'fechado' ? 100 : (p.probabilidade ?? 50)) / 100),
      0,
    )

    return { ...e, quantidade: doGrupo.length, valor, valorPonderado: ponderado }
  })

  const total = etapas.reduce((s, e) => s + e.valor, 0)
  const totalPonderado = etapas.reduce((s, e) => s + e.valorPonderado, 0)

  // Só o que ainda NÃO fechou conta como funil: o ganho já é obrigação.
  const emAberto = etapas.filter((e) => e.chave !== 'fechado')
  const abertoPonderado = emAberto.reduce((s, e) => s + e.valorPonderado, 0)
  const abertoQuantidade = emAberto.reduce((s, e) => s + e.quantidade, 0)

  const indicadores: Indicador[] = []

  // 1. COBERTURA
  const cobertura = meta && meta > 0 ? (abertoPonderado / meta) * 100 : null
  indicadores.push({
    chave: 'cobertura',
    nome: 'Cobertura do funil',
    valor: cobertura === null ? 'sem meta' : `${Math.round(cobertura)}%`,
    bruto: cobertura,
    alvo: 'acima de 80%',
    zona: cobertura === null ? 'cinza' : cobertura >= 80 ? 'verde' : cobertura >= 50 ? 'ambar' : 'vermelho',
    fonte: 'Prática padrão de gestão de vendas: funil ponderado dividido pela meta.',
    leitura:
      cobertura === null
        ? 'Sem meta de faturamento no mês, não existe cobertura para calcular. É o primeiro número a preencher.'
        : cobertura >= 80
          ? 'O funil cobre a meta. O trabalho agora é converter, não prospectar.'
          : `O funil ponderado cobre ${Math.round(cobertura)}% da meta. Falta ${reais(Math.max(0, meta! - abertoPonderado))} de funil ponderado, e isso se resolve prospectando, não empurrando o que já existe.`,
  })

  // 2. CONCENTRAÇÃO
  const porCliente = new Map<string, number>()
  for (const p of carteira) {
    const c = p.cliente ?? 'sem cliente'
    porCliente.set(c, (porCliente.get(c) ?? 0) + (p.valorEstimado ?? 0))
  }
  const maior = [...porCliente.entries()].sort((a, b) => b[1] - a[1])[0]
  const concentracao = total > 0 && maior ? (maior[1] / total) * 100 : null
  indicadores.push({
    chave: 'concentracao',
    nome: 'Concentração no maior cliente',
    valor: concentracao === null ? 'sem valor' : `${Math.round(concentracao)}%`,
    bruto: concentracao,
    alvo: 'abaixo de 50%',
    zona:
      concentracao === null ? 'cinza' : concentracao <= 50 ? 'verde' : concentracao <= 75 ? 'ambar' : 'vermelho',
    fonte: 'Rumelt: o diagnóstico honesto vem antes da política. Funil concentrado não é funil, é aposta.',
    leitura:
      concentracao === null
        ? 'Sem valor nos projetos, não dá para medir concentração.'
        : `${maior?.[0]} responde por ${Math.round(concentracao)}% do que está na carteira. Se esse cliente parar, isso para junto.`,
  })

  // 3. QUALIFICAÇÃO SPIN
  const projetos = await prisma.projeto.findMany({
    where: { ativo: true, fase: 'desenvolvimento' },
    select: { implicacao: true, necessidade: true, valorEstimado: true },
  })
  const qualificados = projetos.filter((p) => p.implicacao?.trim() && p.necessidade?.trim())
  const pctQualificado = projetos.length > 0 ? (qualificados.length / projetos.length) * 100 : null
  indicadores.push({
    chave: 'qualificacao',
    nome: 'Funil qualificado',
    valor: pctQualificado === null ? 'sem funil' : `${Math.round(pctQualificado)}%`,
    bruto: pctQualificado,
    alvo: 'acima de 60%',
    zona:
      pctQualificado === null
        ? 'cinza'
        : pctQualificado >= 60
          ? 'verde'
          : pctQualificado >= 30
            ? 'ambar'
            : 'vermelho',
    fonte: 'Rackham, SPIN Selling: sem Implicação admitida pelo cliente, proposta vira disputa de preço.',
    leitura:
      pctQualificado === null
        ? 'Nenhum projeto em desenvolvimento para qualificar.'
        : `${qualificados.length} de ${projetos.length} oportunidades têm Implicação e Necessidade nas palavras do cliente. O resto é conversa que ainda não virou negócio.`,
  })

  // 4. TICKET MÉDIO
  const comValor = carteira.filter((p) => p.valorEstimado)
  const ticket = comValor.length > 0 ? total / comValor.length : null
  indicadores.push({
    chave: 'ticket',
    nome: 'Ticket médio',
    valor: ticket === null ? 'sem valor' : reais(ticket),
    bruto: ticket,
    alvo: 'quanto maior, menos negócios para a mesma meta',
    zona: ticket === null ? 'cinza' : 'verde',
    fonte: 'Hora-fundador: a hora dele custa o mesmo num projeto de R$ 5 mil e num de R$ 300 mil.',
    leitura:
      ticket === null
        ? 'Preencha o valor dos projetos e este número aparece.'
        : `Com ticket de ${reais(ticket)}, bater ${meta ? reais(meta) : 'a meta'} exige ${meta ? Math.ceil(meta / ticket) : '?'} negócios fechados.`,
  })

  // 5. VELOCIDADE DO FUNIL
  const taxa = pctQualificado !== null ? pctQualificado / 100 : 0.3
  const cicloDias = 45
  const velocidade =
    ticket && abertoQuantidade > 0 ? (abertoQuantidade * ticket * taxa) / cicloDias : null
  indicadores.push({
    chave: 'velocidade',
    nome: 'Velocidade do funil',
    valor: velocidade === null ? 'sem dados' : `${reais(velocidade)} por dia`,
    bruto: velocidade,
    alvo: `precisa passar de ${meta ? reais(meta / 30) : 'meta ÷ 30'} por dia`,
    zona:
      velocidade === null || !meta
        ? 'cinza'
        : velocidade >= meta / 30
          ? 'verde'
          : velocidade >= meta / 60
            ? 'ambar'
            : 'vermelho',
    fonte: 'Roberge, The Sales Acceleration Formula: oportunidades x ticket x conversão, dividido pelo ciclo.',
    leitura:
      velocidade === null
        ? 'Falta valor nos projetos para calcular.'
        : `O funil produz cerca de ${reais(velocidade)} por dia no ritmo atual. Ciclo assumido de ${cicloDias} dias - corrija quando souber o real, porque é ele que manda nesta conta.`,
  })

  return { etapas, total, totalPonderado, meta, indicadores, faltando }
}

export const COR_DA_ZONA_INDICADOR: Record<Indicador['zona'], string> = {
  verde: 'var(--verde)',
  ambar: 'var(--ambar)',
  vermelho: 'var(--vermelho)',
  cinza: 'var(--fraco)',
}
