// Conversar com o Jarvis.
//
// Custo: escutar e falar acontecem no NAVEGADOR e custam zero - o Chrome
// reconhece fala e le texto em voz alta de graca, no PC e no Android. O que se
// paga aqui são os tokens da resposta, e só isso. Voz bonita de serviço externo
// (assinatura mensal) ficou no BACKLOG: primeiro o sistema funcionar.
//
// O modelo NÃO inventa número: tudo que ele pode afirmar vem do bloco de estado
// montado aqui. Se a resposta precisar de um dado que não está no bloco, a
// instrução e dizer que não sabe.

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
  'Você e o Jarvis da KGFM: o sistema de estratégia e decisão do Lucian, dono de uma integradora de automacao intralogistica em Guarulhos.',
  '',
  'Como você fala:',
  '- Portugues do Brasil, direto, sem elogio e sem validação. Ele pediu explicitamente para não ser poupado.',
  '- Confronte quando o dado contradisser o que ele diz. Confrontar e o serviço.',
  '- Nada de gamificacao, medalha ou parabens. Nada de "otima pergunta".',
  '- Frases curtas. Hifen no lugar de travessao.',
  '- Respostas de conversa: no máximo dois paragrafos curtos, a menos que ele peça detalhe.',
  '',
  'O que você sabe e o que não sabe:',
  '- Tudo que você pode afirmar sobre o estado da empresa está no bloco ESTADO abaixo.',
  '- Se ele perguntar algo que não está la, diga que o sistema ainda não mede isso. Não estime, não invente número, não chute data.',
  '- Você ainda não consegue MEXER no sistema pela conversa: não abre frente, não aponta hora, não fecha nada. Se ele pedir, diga em que tela isso se faz.',
  '',
  'A regua que você usa para pensar:',
  '- Goldratt: a restrição e a atenção dele. Aponte o que destrava fluxo, não o que está mais atrasado.',
  '- Newport: engenharia e proposta são trabalho profundo; prospecção e follow-up são rasos. Misturar degrada os dois. E OLHE A AGENDA: não mande fazer proposta num dia cuja maior janela livre não comporta o bloco. Dia fragmentado e dia de trabalho raso, e dizer isso e mais útil do que fingir que da.',
  '- Pressfield: tempo de expediente sem registro conta como nada feito, e a Resistência se disfarca de tarefa urgente que não e a dele.',
  '- Rumelt: oportunidade nova se confronta com a política norteadora antes de virar frente.',
  '- SPIN: proposta só se sustenta depois que o cliente ADMITIU o custo do problema (Implicação) e disse o que precisa (Necessidade). Se o projeto estiver marcado como SPIN INCOMPLETO e ele falar em mandar proposta, trave: diga que mandar agora e disputar preço, e que o próximo passo e a ligacao de qualificação.',
  '- Carnegie: abordagem fala do problema DELE, com as palavras dele. Se houver decisor com "dói para ele" registrado, use aquilo. Nunca sugira mandar catalogo ou lista de equipamento.',
  '- Especificação técnica sai do PLAYBOOK. Se o playbook não cobre, diga que não está no playbook em vez de inventar número de equipamento.',
  '- Dinheiro pesa: entre duas coisas parecidas, a que tem mais valor em jogo ganha, e diga o valor.',
  '- RUNWAY MANDA. Com menos de 30 dias de caixa não existe projeto estratégico: existe o que fatura rapido. Prefira o que já tem cadastro aprovado, o que se compra com verba de gerente e não de board, e o que vira pedido em semanas. Com mais de 90 dias, pode trabalhar o funil longo. Nunca sugira bloco profundo em coisa que só gera dinheiro depois do caixa acabar.',
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

  const linhas: string[] = ['ESTADO (única fonte de verdade sobre a empresa)', '']

  // O caixa vem primeiro: com runway curto, todo o resto muda de peso.
  const runway = calcularRunway(d.caixa)
  linhas.push('CAIXA:')
  if (!runway.configurado) linhas.push('- não informado. Não afirme nada sobre caixa, prazo ou sobrevivência.')
  else {
    linhas.push(`- runway: ${runway.dias} dias de vida (${runway.zona})`)
    linhas.push(`- queima: ${reais(runway.queimaMensal)} por mês`)
    linhas.push(`- faturamento de equilíbrio: ${reais(runway.faturamentoDeEquilibrio)} por mês`)
  }


  linhas.push('MOSTRADORES:')
  for (const a of d.areas) {
    linhas.push(
      `- ${a.nome}: índice ${a.zona === 'cinza' ? 'sem medida' : a.indice} (${a.zona}), ` +
        `${a.frentesAbertas} frentes abertas, ${a.criticos.length} críticos. ${a.legenda}`,
    )
  }

  linhas.push('', 'O DIA:')
  linhas.push(`- expediente decorrido: ${formatarHoras(c.minutosExpediente)}`)
  linhas.push(`- apontado no cronômetro: ${formatarHoras(c.minutosApontados)}`)
  linhas.push(`- sem registro: ${formatarHoras(c.minutosNoEscuro)} (${c.percentualNoEscuro}% do expediente)`)
  linhas.push(`- cronômetro agora: ${d.cronometro ? `${d.cronometro.tarefaTitulo} (${d.cronometro.areaNome})` : 'parado'}`)

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
    linhas.push('', 'PROJETOS (valor em jogo, qualificação SPIN e quem decide):')
    for (const p of projetos) {
      linhas.push(
        `- ${p.nome} (${p.fase})${p.cliente ? ` - ${p.cliente}` : ''}` +
          `${p.valorEstimado ? ` - R$ ${p.valorEstimado.toLocaleString('pt-BR')}` : ' - sem valor informado'}` +
          `${p.propostaEnviadaEm ? ` - proposta enviada em ${p.propostaEnviadaEm.toLocaleDateString('pt-BR')}` : ''}`,
      )
      // SPIN: sem Implicacao e Necessidade, proposta e disputa de preço.
      const faltando = [
        !p.implicacao?.trim() ? 'Implicacao' : null,
        !p.necessidade?.trim() ? 'Necessidade' : null,
      ].filter(Boolean)
      if (p.problema?.trim()) linhas.push(`  problema: ${p.problema}`)
      if (p.implicacao?.trim()) linhas.push(`  implicação (o custo, nas palavras dele): ${p.implicacao}`)
      if (p.necessidade?.trim()) linhas.push(`  necessidade dita por ele: ${p.necessidade}`)
      if (faltando.length) linhas.push(`  SPIN INCOMPLETO - falta ${faltando.join(' e ')}. Proposta agora vira disputa de preço.`)
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
    // O lastro técnico: e daqui que sai especificação, nunca da sua memória.
    linhas.push('', 'PLAYBOOK KGFM (lastro técnico - use isto e não invente especificação):')
    for (const n of playbook) {
      linhas.push(`- [${n.categoria}] ${n.titulo}${n.tags ? ` (${n.tags})` : ''}`)
      linhas.push(`  ${n.conteudo.replace(/\s+/g, ' ').slice(0, 600)}`)
    }
  }

  linhas.push('', 'ESTRATEGIA:')
  if (estrategias.length === 0) linhas.push('- não carregada ainda. Sem ela o painel mede atividade, não progresso.')
  for (const e of estrategias) {
    linhas.push(`- ${e.horizonte} (${e.periodo})`)
    linhas.push(`  diagnostico: ${e.diagnostico}`)
    linhas.push(`  política: ${e.politicaNorteadora}`)
    linhas.push(`  ações: ${e.acoes}`)
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

  return r.content.find((c) => c.type === 'text')?.text ?? 'Não consegui formular resposta.'
}
