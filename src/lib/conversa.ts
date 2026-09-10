// Conversar com o Jarvis.
//
// Custo: escutar e falar acontecem no NAVEGADOR e custam zero - o Chrome
// reconhece fala e le texto em voz alta de graca, no PC e no Android. O que se
// paga aqui sao os tokens da resposta, e so isso. Voz bonita de servico externo
// (assinatura mensal) ficou no BACKLOG: primeiro o sistema funcionar.
//
// O modelo NAO inventa numero: tudo que ele pode afirmar vem do bloco de estado
// montado aqui. Se a resposta precisar de um dado que nao esta no bloco, a
// instrucao e dizer que nao sabe.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { montarPainel } from './painel'
import { decidirAgora } from './agora'
import { confrontar } from './expediente'
import { formatarHoras } from './datas'
import { calcularRunway, reais } from './caixa'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

export type Fala = { quem: 'lucian' | 'jarvis'; texto: string }

const INSTRUCAO = [
  'Voce e o Jarvis da KGFM: o sistema de estrategia e decisao do Lucian, dono de uma integradora de automacao intralogistica em Guarulhos.',
  '',
  'Como voce fala:',
  '- Portugues do Brasil, direto, sem elogio e sem validacao. Ele pediu explicitamente para nao ser poupado.',
  '- Confronte quando o dado contradisser o que ele diz. Confrontar e o servico.',
  '- Nada de gamificacao, medalha ou parabens. Nada de "otima pergunta".',
  '- Frases curtas. Hifen no lugar de travessao.',
  '- Respostas de conversa: no maximo dois paragrafos curtos, a menos que ele peca detalhe.',
  '',
  'O que voce sabe e o que nao sabe:',
  '- Tudo que voce pode afirmar sobre o estado da empresa esta no bloco ESTADO abaixo.',
  '- Se ele perguntar algo que nao esta la, diga que o sistema ainda nao mede isso. Nao estime, nao invente numero, nao chute data.',
  '- Voce ainda nao consegue MEXER no sistema pela conversa: nao abre frente, nao aponta hora, nao fecha nada. Se ele pedir, diga em que tela isso se faz.',
  '',
  'A regua que voce usa para pensar:',
  '- Goldratt: a restricao e a atencao dele. Aponte o que destrava fluxo, nao o que esta mais atrasado.',
  '- Newport: engenharia e proposta sao trabalho profundo; prospeccao e follow-up sao rasos. Misturar degrada os dois. E OLHE A AGENDA: nao mande fazer proposta num dia cuja maior janela livre nao comporta o bloco. Dia fragmentado e dia de trabalho raso, e dizer isso e mais util do que fingir que da.',
  '- Pressfield: tempo de expediente sem registro conta como nada feito, e a Resistencia se disfarca de tarefa urgente que nao e a dele.',
  '- Rumelt: oportunidade nova se confronta com a politica norteadora antes de virar frente.',
  '- SPIN: proposta so se sustenta depois que o cliente ADMITIU o custo do problema (Implicacao) e disse o que precisa (Necessidade). Se o projeto estiver marcado como SPIN INCOMPLETO e ele falar em mandar proposta, trave: diga que mandar agora e disputar preco, e que o proximo passo e a ligacao de qualificacao.',
  '- Carnegie: abordagem fala do problema DELE, com as palavras dele. Se houver decisor com "dói para ele" registrado, use aquilo. Nunca sugira mandar catalogo ou lista de equipamento.',
  '- Especificacao tecnica sai do PLAYBOOK. Se o playbook nao cobre, diga que nao esta no playbook em vez de inventar numero de equipamento.',
  '- Dinheiro pesa: entre duas coisas parecidas, a que tem mais valor em jogo ganha, e diga o valor.',
  '- RUNWAY MANDA. Com menos de 30 dias de caixa nao existe projeto estrategico: existe o que fatura rapido. Prefira o que ja tem cadastro aprovado, o que se compra com verba de gerente e nao de board, e o que vira pedido em semanas. Com mais de 90 dias, pode trabalhar o funil longo. Nunca sugira bloco profundo em coisa que so gera dinheiro depois do caixa acabar.',
].join('\n')

export async function montarEstado(): Promise<string> {
  const d = await montarPainel()
  const agora = decidirAgora(d)
  const c = confrontar(d.minutosHoje)
  const [estrategias, frentes, projetos, playbook] = await Promise.all([
    prisma.estrategia.findMany(),
    prisma.frente.findMany({ where: { status: 'aberta' }, include: { area: true, projeto: true } }),
    prisma.projeto.findMany({ where: { ativo: true }, include: { decisores: true } }),
    prisma.conhecimento.findMany({ orderBy: { atualizadoEm: 'desc' }, take: 40 }),
  ])

  const linhas: string[] = ['ESTADO (unica fonte de verdade sobre a empresa)', '']

  // O caixa vem primeiro: com runway curto, todo o resto muda de peso.
  const runway = calcularRunway(d.caixa)
  linhas.push('CAIXA:')
  if (!runway.configurado) linhas.push('- nao informado. Nao afirme nada sobre caixa, prazo ou sobrevivencia.')
  else {
    linhas.push(`- runway: ${runway.dias} dias de vida (${runway.zona})`)
    linhas.push(`- queima: ${reais(runway.queimaMensal)} por mes`)
    linhas.push(`- faturamento de equilibrio: ${reais(runway.faturamentoDeEquilibrio)} por mes`)
  }


  linhas.push('MOSTRADORES:')
  for (const a of d.areas) {
    linhas.push(
      `- ${a.nome}: indice ${a.zona === 'cinza' ? 'sem medida' : a.indice} (${a.zona}), ` +
        `${a.frentesAbertas} frentes abertas, ${a.criticos.length} criticos. ${a.legenda}`,
    )
  }

  linhas.push('', 'O DIA:')
  linhas.push(`- expediente decorrido: ${formatarHoras(c.minutosExpediente)}`)
  linhas.push(`- apontado no cronometro: ${formatarHoras(c.minutosApontados)}`)
  linhas.push(`- sem registro: ${formatarHoras(c.minutosNoEscuro)} (${c.percentualNoEscuro}% do expediente)`)
  linhas.push(`- cronometro agora: ${d.cronometro ? `${d.cronometro.tarefaTitulo} (${d.cronometro.areaNome})` : 'parado'}`)

  linhas.push('', 'AGENDA DE HOJE:')
  if (d.agenda.compromissos.length === 0) linhas.push('- nenhum compromisso marcado')
  for (const k of d.agenda.compromissos) {
    linhas.push(`- ${k.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} ${k.titulo}`)
  }
  linhas.push(`- maior janela livre: ${d.agenda.maiorJanela} min. ${d.agenda.frase}`)

  linhas.push('', 'CRITICOS:')
  if (d.criticosGerais.length === 0) linhas.push('- nenhum')
  for (const x of d.criticosGerais) {
    linhas.push(`- ${x.titulo}: ${x.texto}${x.bloqueia > 0 ? ` - trava ${x.bloqueia} frente(s)` : ''}`)
  }

  linhas.push('', 'FRENTES ABERTAS:')
  if (frentes.length === 0) linhas.push('- nenhuma')
  for (const f of frentes) {
    linhas.push(
      `- ${f.titulo} [${f.area.nome}${f.projeto ? ` / ${f.projeto.nome}` : ''}] ` +
        `aguardando ${f.aguardandoQuem}`,
    )
  }

  if (projetos.length > 0) {
    linhas.push('', 'PROJETOS (valor em jogo, qualificacao SPIN e quem decide):')
    for (const p of projetos) {
      linhas.push(
        `- ${p.nome} (${p.fase})${p.cliente ? ` - ${p.cliente}` : ''}` +
          `${p.valorEstimado ? ` - R$ ${p.valorEstimado.toLocaleString('pt-BR')}` : ' - sem valor informado'}` +
          `${p.propostaEnviadaEm ? ` - proposta enviada em ${p.propostaEnviadaEm.toLocaleDateString('pt-BR')}` : ''}`,
      )
      // SPIN: sem Implicacao e Necessidade, proposta e disputa de preco.
      const faltando = [
        !p.implicacao?.trim() ? 'Implicacao' : null,
        !p.necessidade?.trim() ? 'Necessidade' : null,
      ].filter(Boolean)
      if (p.problema?.trim()) linhas.push(`  problema: ${p.problema}`)
      if (p.implicacao?.trim()) linhas.push(`  implicacao (o custo, nas palavras dele): ${p.implicacao}`)
      if (p.necessidade?.trim()) linhas.push(`  necessidade dita por ele: ${p.necessidade}`)
      if (faltando.length) linhas.push(`  SPIN INCOMPLETO - falta ${faltando.join(' e ')}. Proposta agora vira disputa de preco.`)
      for (const d of p.decisores) {
        linhas.push(
          `  decisor: ${d.nome}${d.cargo ? ` (${d.cargo})` : ''}` +
            `${d.oQueDoiParaEle ? ` - dói para ele: ${d.oQueDoiParaEle}` : ''}` +
            `${d.interesses ? ` - interesses: ${d.interesses}` : ''}`,
        )
      }
    }
  }

  if (playbook.length > 0) {
    // O lastro tecnico: e daqui que sai especificacao, nunca da sua memoria.
    linhas.push('', 'PLAYBOOK KGFM (lastro tecnico - use isto e nao invente especificacao):')
    for (const n of playbook) {
      linhas.push(`- [${n.categoria}] ${n.titulo}${n.tags ? ` (${n.tags})` : ''}`)
      linhas.push(`  ${n.conteudo.replace(/\s+/g, ' ').slice(0, 600)}`)
    }
  }

  linhas.push('', 'ESTRATEGIA:')
  if (estrategias.length === 0) linhas.push('- nao carregada ainda. Sem ela o painel mede atividade, nao progresso.')
  for (const e of estrategias) {
    linhas.push(`- ${e.horizonte} (${e.periodo})`)
    linhas.push(`  diagnostico: ${e.diagnostico}`)
    linhas.push(`  politica: ${e.politicaNorteadora}`)
    linhas.push(`  acoes: ${e.acoes}`)
  }

  if (agora) linhas.push('', `RECOMENDACAO ATUAL DO PAINEL: ${agora.titulo} - ${agora.porque}`)

  return linhas.join('\n')
}

export async function responder(historico: Fala[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return 'Sem chave da API configurada, eu nao consigo pensar - so guardar. Coloque ANTHROPIC_API_KEY no arquivo .env (o passo a passo esta em docs/CHAVE-ANTHROPIC.md) e eu volto a falar.'
  }

  const estado = await montarEstado()
  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 700,
    system: `${INSTRUCAO}\n\n${estado}`,
    messages: historico.slice(-12).map((f) => ({
      role: f.quem === 'lucian' ? ('user' as const) : ('assistant' as const),
      content: f.texto,
    })),
  })

  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'conversa',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado: (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  return r.content.find((c) => c.type === 'text')?.text ?? 'Nao consegui formular resposta.'
}
