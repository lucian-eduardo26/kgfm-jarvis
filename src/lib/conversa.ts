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
  '- Newport: engenharia e proposta sao trabalho profundo; prospeccao e follow-up sao rasos. Misturar degrada os dois.',
  '- Pressfield: tempo de expediente sem registro conta como nada feito, e a Resistencia se disfarca de tarefa urgente que nao e a dele.',
  '- Rumelt: oportunidade nova se confronta com a politica norteadora antes de virar frente.',
].join('\n')

export async function montarEstado(): Promise<string> {
  const d = await montarPainel()
  const agora = decidirAgora(d)
  const c = confrontar(d.minutosHoje)
  const [estrategias, frentes, projetos] = await Promise.all([
    prisma.estrategia.findMany(),
    prisma.frente.findMany({ where: { status: 'aberta' }, include: { area: true, projeto: true } }),
    prisma.projeto.findMany({ where: { ativo: true } }),
  ])

  const linhas: string[] = ['ESTADO (unica fonte de verdade sobre a empresa)', '']

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
    linhas.push('', 'PROJETOS:')
    for (const p of projetos) linhas.push(`- ${p.nome} (${p.fase})${p.cliente ? ` - ${p.cliente}` : ''}`)
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
