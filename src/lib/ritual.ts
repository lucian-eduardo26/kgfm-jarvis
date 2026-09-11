// Os dois rituais: check-in (planejar a semana) e check-out (conferir).
// Guardados em `sínteses` - texto gerado por IA custa dinheiro, entao gera uma
// vez e le quantas vezes quiser.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { montarSemana, textoDaSemana } from './semana'
import { montarEstado } from './conversa'
import { materialDoPlano, montarDiaSeguinte } from './planoDoDia'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

const REGUA = [
  'A régua é a literatura de base do projeto, e você cita a regra, não o livro:',
  '- Goldratt: comece pelo que DESTRAVA fluxo, não pelo mais atrasado. Item atrasado que não bloqueia nada perde para item no prazo que trava três frentes.',
  '- Newport: planeje por BLOCO de área, nunca por tarefa avulsa. Trabalho profundo (proposta, engenharia) precisa de janela grande; prospecção e follow-up são rasos e podem ir nas bordas. Não misture os dois no mesmo período.',
  '- Personal Kanban: no máximo duas frentes abertas por área, e um cronômetro por vez. Se o plano precisa de três coisas simultaneas, o plano está errado.',
  '- Rumelt: bloco que não amarra em objetivo do mês e candidato a descarte - diga isso na cara quando acontecer.',
  '- Pressfield: tempo de expediente sem registro conta como nada feito. E a Resistência se disfarca de tarefa urgente que não e a dele.',
  '- GTD: a revisão semanal existe para o sistema não virar cemiterio de item velho.',
  '- SPIN: frente marcada como SPIN incompleto não pode virar bloco de "escrever proposta" - o bloco tem que ser a ligacao de qualificação. Mandar proposta sem Implicação e Necessidade e disputar preço.',
  '- RUNWAY MANDA: com menos de 30 dias de caixa, o plano da semana é o que fatura mais rápido, e você diz isso na primeira linha. Bloco profundo em negócio que fecha depois do caixa acabar é erro de prioridade, por melhor que seja o negócio.',
  '- Hora-fundador: hora dele em projeto de baixo ticket é a despesa mais cara da empresa, porque o custo não é o salário dele - é o negócio grande que não andou. Projeto pequeno é trabalho de terceiro com procedimento escrito.',
  '- Dinheiro pesa e aparece no plano: quando duas frentes competirem, a de maior valor em jogo ganha o bloco profundo, e você diz o valor na cara. Bloco grande em frente pequena com frente grande parada é erro, não escolha.',
].join('\n')

const VOZ = [
  'Portugues do Brasil, direto, sem elogio e sem validação. Ele pediu para não ser poupado.',
  'Hifen no lugar de travessao. Nada de gamificacao, medalha ou parabens.',
  'NÃO recalcule número nenhum: todos os números já vem calculados no bloco. Use exatamente os que estão la.',
].join(' ')

async function chamar(finalidade: string, sistema: string, pedido: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return 'Sem chave da API eu não consigo montar o ritual. Configure ANTHROPIC_API_KEY no .env - o passo a passo está em docs/CHAVE-ANTHROPIC.md. Os números da semana acima continuam valendo: eles são calculados aqui, sem IA.'
  }
  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const r = await cliente.messages.create({
    model: MODELO,
    // 1600 NAO BASTA, e a falha era silenciosa: o modelo raciocina antes de
    // responder, e com 1600 ele gastava o orcamento inteiro pensando e parava
    // em max_tokens SEM NENHUM bloco de texto. A funcao devolvia "nao consegui
    // formular" como se fosse recusa, quando era teto curto. O check-in
    // semanal tinha o mesmo defeito esperando a vez dele.
    max_tokens: 12000,
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
  return r.content.find((c) => c.type === 'text')?.text ?? 'Não consegui formular.'
}

export async function fazerCheckin(): Promise<string> {
  const s = await montarSemana()
  const estado = await montarEstado()

  const texto = await chamar(
    'checkin-semanal',
    [
      'Você e o Jarvis da KGFM montando o PLANO DA SEMANA do Lucian.',
      VOZ,
      '',
      REGUA,
      '',
      'Formato da resposta, exatamente nesta ordem e sem inventar secao:',
      '1. O QUE MANDA NA SEMANA - duas frases: qual e a restrição desta semana e por que.',
      '2. OS BLOCOS - para cada dia útil restante, de 1 a 2 blocos, dizendo área, o que entra e a que objetivo do mês amarra. Se não amarrar em nenhum, escreva "não amarra em objetivo" e explique por que mesmo assim entra (ou sugira cortar).',
      '3. O QUE FICA DE FORA - o que você está deliberadamente NÃO colocando na semana, com o motivo. Esta seção é obrigatória: plano sem descarte não é plano.',
      '4. O NÚMERO QUE COBRA - repita o desdobramento por dia útil dos objetivos, com os números dados.',
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
      'Você e o Jarvis da KGFM fechando a semana do Lucian.',
      VOZ,
      '',
      REGUA,
      '',
      'Formato da resposta, exatamente nesta ordem:',
      '1. O QUE ACONTECEU - o que andou e o que travou, com os números dados, sem memória e sem suposição.',
      '2. ONDE ESTEVE O GARGALO - uma coisa só, com o argumento.',
      '3. PLANO CONTRA REALIDADE - se havia plano de check-in, compare bloco a bloco: o que foi cumprido e o que não foi. Se não havia plano, diga isso e siga.',
      '4. EFICIÊNCIA - a leitura honesta de horas apontadas contra expediente. Semana com muito tempo sem registro não é boa nem ruim: é semana que não foi medida, e diga isso.',
      '5. O QUE MUDA NA PROXIMA - no máximo três mudancas concretas.',
    ].join('\n'),
    [
      'Feche esta semana.',
      '',
      textoDaSemana(s),
      '',
      plano ? `PLANO QUE FOI FEITO NO CHECK-IN:\n${plano.texto}` : 'NÃO HOUVE CHECK-IN NESTA SEMANA.',
    ].join('\n'),
  )

  const gravada = await prisma.sintese.create({
    data: { tipo: 'checkout', periodoInicio: s.inicio, periodoFim: s.fim, texto },
  })
  return gravada.texto
}

/**
 * O PLANO DE AMANHÃ, com hora marcada.
 *
 * Pedido do Lucian em 10/09/2026: "gerar o planejamento do dia de amanhã com
 * tudo que ele sabe, começando às 8h, como consultor de administração de tempo
 * e agenda, ponderado pelas nossas prioridades".
 *
 * A diferença para o check-in semanal é essa: a semana escolhe TEMAS, o dia
 * escolhe HORÁRIOS. Plano de dia sem hora não é plano, é lista de desejos.
 *
 * `foco` existe porque ele pode mandar o dia inteiro numa área - e quando
 * manda, o consultor obedece E diz o que está sendo empurrado para depois.
 * Obedecer sem avisar o custo não é consultoria, é secretariado.
 */
export async function fazerPlanoDoDia(foco?: string): Promise<string> {
  const material = await materialDoPlano()
  const estado = await montarEstado()
  const dia = await montarDiaSeguinte()

  const texto = await chamar(
    'plano-do-dia',
    [
      'Você é o Jarvis da KGFM montando o PLANO DE AMANHÃ do Lucian, hora a hora.',
      VOZ,
      '',
      REGUA,
      '',
      'VOCÊ É CONSULTOR DE ADMINISTRAÇÃO DE TEMPO, e isso muda o que você faz:',
      '- Não distribua trabalho até encher o dia. Dia cheio de 100% é dia que estoura no primeiro imprevisto.',
      '- Deixe folga declarada. Diga onde ela está e para que serve.',
      '- Bloco tem hora de início e de fim, e a soma tem que fechar com o relógio.',
      '- Respeite almoço. Se ele não marcou, marque uma hora e diga que marcou.',
      '- Trabalho profundo de manhã, trabalho raso depois do almoço: é quando a atenção já caiu e telefonema não exige a mesma cabeça.',
      '- Pacote que está com TERCEIRO ou CLIENTE não vira bloco de trabalho. Vira, no máximo, cinco minutos de cobrança - a engrenagem gira sem ele.',
      '',
      foco
        ? `FOCO PEDIDO POR ELE: ${foco}. Obedeça, E diga na seção 4 o que está sendo empurrado por causa disso, com o custo.`
        : 'Sem foco pedido: escolha pela régua de prioridade.',
      '',
      'Formato da resposta, exatamente nesta ordem e sem inventar seção:',
      '1. A APOSTA DO DIA - duas frases: o que este dia precisa entregar para a semana não ser perdida, e por quê.',
      '2. A AGENDA - a lista de blocos com HORA de início e fim, começando 08:00. Para cada bloco: a hora, o que é, a que projeto pertence, e em uma frase por que ele está nessa posição do dia e não em outra.',
      '3. O QUE GIRA SEM VOCÊ - o que avança amanhã sem consumir hora dele, e o que ele precisa fazer (se algo) para não travar.',
      '4. O QUE FICA DE FORA - obrigatório. O que você deliberadamente NÃO colocou, e o custo de não colocar.',
      '5. O RISCO DESTE PLANO - a frase que ele vai lembrar às 17h se o dia der errado.',
      '',
      material,
      '',
      estado,
    ].join('\n'),
    `Monte o plano de amanhã, ${dia.rotulo}. Ele começa às 08:00.`,
  )

  const gravada = await prisma.sintese.create({
    data: { tipo: 'plano-do-dia', periodoInicio: dia.data, periodoFim: dia.data, texto },
  })
  return gravada.texto
}
