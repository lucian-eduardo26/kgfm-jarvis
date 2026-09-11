// TRANSCRIÇÃO DE REUNIÃO VIRANDO QUALIFICAÇÃO.
//
// O Lucian em 10/09/2026: "eu tenho que ter um campo na edição do projeto,
// onde colar a transcrição, aí o Claude vai rodar pra resumir e transformar,
// pra gerar o S, o P, o I e o N".
//
// É o uso certo da IA aqui, e por um motivo específico: transcrição de reunião
// de uma hora tem oito mil palavras, e as quatro frases que importam estão
// espalhadas no meio. Achá-las à mão é meia hora dele; achá-las aqui custa
// menos de um centavo.
//
// A REGRA QUE MANTÉM ISTO HONESTO: a IA COPIA, não interpreta.
//
// O SPIN só vale se estiver nas palavras do cliente - é disso que Carnegie e
// a venda consultiva vivem. "Implicação" escrita pelo vendedor é o vendedor se
// convencendo sozinho; implicação dita pelo cliente é munição. Então a
// instrução manda extrair TRECHO LITERAL, e deixar vazio quando o cliente não
// disse. Campo vazio é informação: quer dizer que aquela pergunta ainda não
// foi feita, e é justamente a que falta fazer na próxima reunião.
//
// O modelo é o barato, e basta: isto é leitura e recorte, não raciocínio.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'

const MODELO = 'claude-haiku-4-5-20251001'
const PRECO = { entrada: 1, saida: 5 }

export type SpinExtraido = {
  situacao: string | null
  problema: string | null
  implicacao: string | null
  necessidade: string | null
  resumo: string
  decisores: { nome: string; cargo: string | null; oQueDoiParaEle: string | null }[]
  /** O que o cliente NÃO disse, e que vale perguntar na próxima. */
  perguntasQueFaltam: string[]
}

const INSTRUCAO = [
  'Você lê a transcrição de uma reunião comercial da KGFM, uma integradora de automação intralogística, e extrai a qualificação SPIN.',
  '',
  'REGRA MAIS IMPORTANTE: você COPIA, não interpreta.',
  '- Cada campo do SPIN tem que ser um trecho do que o CLIENTE disse, o mais literal possível.',
  '- Se o cliente não disse, o campo é null. Nunca preencha com dedução sua, nem com o que o vendedor falou.',
  '- Campo vazio é uma informação valiosa: diz qual pergunta ainda não foi feita.',
  '',
  'Os quatro campos:',
  '- situacao: como a operação dele funciona hoje. Volume, turnos, equipamento, layout.',
  '- problema: o que não funciona, nas palavras dele.',
  '- implicacao: o CUSTO do problema admitido por ele - dinheiro, hora parada, gente, retrabalho, risco. Este é o campo que mais gente preenche errado. Só conta se ELE reconheceu o custo.',
  '- necessidade: o que ELE disse que precisa. Se quem descreveu a solução foi o vendedor, isto é null.',
  '',
  'Também extraia:',
  '- resumo: no máximo seis linhas, direto, sem introdução. O que foi combinado e o que ficou pendente.',
  '- decisores: quem apareceu na reunião. Para cada um, o que DÓI para ele especificamente, se der para saber.',
  '- perguntasQueFaltam: no máximo quatro perguntas que ficaram sem resposta e que travam a proposta.',
  '',
  'Responda SÓ com JSON, sem cerca de código:',
  '{"situacao":null,"problema":null,"implicacao":null,"necessidade":null,"resumo":"","decisores":[{"nome":"","cargo":null,"oQueDoiParaEle":null}],"perguntasQueFaltam":[]}',
].join('\n')

export async function extrairSpin(transcricao: string): Promise<SpinExtraido | null> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null

  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 2000,
    system: INSTRUCAO,
    messages: [{ role: 'user', content: transcricao.slice(0, 120000) }],
  })

  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'transcricao',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado:
          (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  const texto = r.content.find((c) => c.type === 'text')?.text ?? ''
  // A cerca de código aparece de vez em quando mesmo com a instrução contra.
  const limpo = texto.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  try {
    const j = JSON.parse(limpo) as SpinExtraido
    return {
      situacao: j.situacao || null,
      problema: j.problema || null,
      implicacao: j.implicacao || null,
      necessidade: j.necessidade || null,
      resumo: j.resumo ?? '',
      decisores: Array.isArray(j.decisores) ? j.decisores : [],
      perguntasQueFaltam: Array.isArray(j.perguntasQueFaltam) ? j.perguntasQueFaltam : [],
    }
  } catch {
    return null
  }
}
