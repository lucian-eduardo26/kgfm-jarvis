// Os dois rituais: check-in (planejar a semana) e check-out (conferir).
// Guardados em `sinteses` - texto gerado por IA custa dinheiro, entao gera uma
// vez e le quantas vezes quiser.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { montarSemana, textoDaSemana } from './semana'
import { montarEstado } from './conversa'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

const REGUA = [
  'A regua e a literatura de base do projeto, e voce cita a regra, nao o livro:',
  '- Goldratt: comece pelo que DESTRAVA fluxo, nao pelo mais atrasado. Item atrasado que nao bloqueia nada perde para item no prazo que trava tres frentes.',
  '- Newport: planeje por BLOCO de area, nunca por tarefa avulsa. Trabalho profundo (proposta, engenharia) precisa de janela grande; prospeccao e follow-up sao rasos e podem ir nas bordas. Nao misture os dois no mesmo periodo.',
  '- Personal Kanban: no maximo duas frentes abertas por area, e um cronometro por vez. Se o plano precisa de tres coisas simultaneas, o plano esta errado.',
  '- Rumelt: bloco que nao amarra em objetivo do mes e candidato a descarte - diga isso na cara quando acontecer.',
  '- Pressfield: tempo de expediente sem registro conta como nada feito. E a Resistencia se disfarca de tarefa urgente que nao e a dele.',
  '- GTD: a revisao semanal existe para o sistema nao virar cemiterio de item velho.',
].join('\n')

const VOZ = [
  'Portugues do Brasil, direto, sem elogio e sem validacao. Ele pediu para nao ser poupado.',
  'Hifen no lugar de travessao. Nada de gamificacao, medalha ou parabens.',
  'NAO recalcule numero nenhum: todos os numeros ja vem calculados no bloco. Use exatamente os que estao la.',
].join(' ')

async function chamar(finalidade: string, sistema: string, pedido: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return 'Sem chave da API eu nao consigo montar o ritual. Configure ANTHROPIC_API_KEY no .env - o passo a passo esta em docs/CHAVE-ANTHROPIC.md. Os numeros da semana acima continuam valendo: eles sao calculados aqui, sem IA.'
  }
  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 1600,
    system: sistema,
    messages: [{ role: 'user', content: pedido }],
  })
  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade,
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado: (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})
  return r.content.find((c) => c.type === 'text')?.text ?? 'Nao consegui formular.'
}

export async function fazerCheckin(): Promise<string> {
  const s = await montarSemana()
  const estado = await montarEstado()

  const texto = await chamar(
    'checkin-semanal',
    [
      'Voce e o Jarvis da KGFM montando o PLANO DA SEMANA do Lucian.',
      VOZ,
      '',
      REGUA,
      '',
      'Formato da resposta, exatamente nesta ordem e sem inventar secao:',
      '1. O QUE MANDA NA SEMANA - duas frases: qual e a restricao desta semana e por que.',
      '2. OS BLOCOS - para cada dia util restante, de 1 a 2 blocos, dizendo area, o que entra e a que objetivo do mes amarra. Se nao amarrar em nenhum, escreva "nao amarra em objetivo" e explique por que mesmo assim entra (ou sugira cortar).',
      '3. O QUE FICA DE FORA - o que voce esta deliberadamente NAO colocando na semana, com o motivo. Esta secao e obrigatoria: plano sem descarte nao e plano.',
      '4. O NUMERO QUE COBRA - repita o desdobramento por dia util dos objetivos, com os numeros dados.',
      '',
      estado,
    ].join('\n'),
    `Monte o plano desta semana.\n\n${textoDaSemana(s)}`,
  )

  const gravada = await prisma.sintese.create({
    data: { tipo: 'checkin', periodoInicio: s.inicio, periodoFim: s.fim, texto },
  })
  return gravada.texto
}

export async function fazerCheckout(): Promise<string> {
  const s = await montarSemana()
  const plano = await prisma.sintese.findFirst({
    where: { tipo: 'checkin', periodoInicio: s.inicio },
    orderBy: { geradaEm: 'desc' },
  })

  const texto = await chamar(
    'checkout-semanal',
    [
      'Voce e o Jarvis da KGFM fechando a semana do Lucian.',
      VOZ,
      '',
      REGUA,
      '',
      'Formato da resposta, exatamente nesta ordem:',
      '1. O QUE ACONTECEU - o que andou e o que travou, com os numeros dados, sem memoria e sem suposicao.',
      '2. ONDE ESTEVE O GARGALO - uma coisa so, com o argumento.',
      '3. PLANO CONTRA REALIDADE - se havia plano de check-in, compare bloco a bloco: o que foi cumprido e o que nao foi. Se nao havia plano, diga isso e siga.',
      '4. EFICIENCIA - a leitura honesta de horas apontadas contra expediente. Semana com muito tempo sem registro nao e boa nem ruim: e semana que nao foi medida, e diga isso.',
      '5. O QUE MUDA NA PROXIMA - no maximo tres mudancas concretas.',
    ].join('\n'),
    [
      'Feche esta semana.',
      '',
      textoDaSemana(s),
      '',
      plano ? `PLANO QUE FOI FEITO NO CHECK-IN:\n${plano.texto}` : 'NAO HOUVE CHECK-IN NESTA SEMANA.',
    ].join('\n'),
  )

  const gravada = await prisma.sintese.create({
    data: { tipo: 'checkout', periodoInicio: s.inicio, periodoFim: s.fim, texto },
  })
  return gravada.texto
}
