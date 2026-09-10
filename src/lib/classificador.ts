// A IA le a captura e decide tipo, área e frente. O usuário só corrige.
// Sem chave da API o sistema NÃO quebra: devolve null e o item fica em "novo",
// esperando a mão. Melhor um item sem classificar do que uma captura perdida.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'

// Modelo pequeno: classificar e a chamada mais frequente do sistema, e o custo
// da API é risco nomeado no briefing.
const MODELO = 'claude-haiku-4-5-20251001'

// US$ por milhao de tokens, para a estimativa em chamadas_ia.
const PRECO = { entrada: 1, saida: 5 }

export type Classificacao = {
  tipo: 'tarefa' | 'insight' | 'compromisso' | 'oportunidade' | 'indefinido'
  areaId: number | null
  frenteId: number | null
  venceEm: Date | null
  confianca: number
}

export function temChave(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

export async function classificar(texto: string): Promise<Classificacao | null> {
  if (!temChave()) return null

  const [areas, frentes] = await Promise.all([
    prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.frente.findMany({ where: { status: 'aberta' }, include: { area: true, projeto: true } }),
  ])

  const catalogo = [
    'AREAS:',
    ...areas.map((a) => `- id ${a.id}: ${a.nome}`),
    '',
    'FRENTES ABERTAS:',
    ...(frentes.length
      ? frentes.map((f) => `- id ${f.id}: ${f.titulo} (área ${f.area.nome}${f.projeto ? `, projeto ${f.projeto.nome}` : ''})`)
      : ['- nenhuma']),
  ].join('\n')

  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const hoje = new Date().toISOString().slice(0, 10)

  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 300,
    system:
      'Você classifica capturas rapidas de um dono de empresa de automacao intralogistica. ' +
      'Responda SÓ com JSON, sem texto em volta, no formato ' +
      '{"tipo":"tarefa|insight|compromisso|oportunidade|indefinido","areaId":numero|null,"frenteId":numero|null,"venceEm":"AAAA-MM-DD"|null,"confianca":0a1}. ' +
      'Use frenteId apenas quando a captura for claramente sobre aquela frente. ' +
      'Na dúvida use indefinido e confiança baixa - errar calado é pior do que admitir dúvida.',
    messages: [{ role: 'user', content: `Hoje e ${hoje}.\n\n${catalogo}\n\nCAPTURA:\n${texto}` }],
  })

  const bruto = r.content.find((c) => c.type === 'text')?.text ?? ''

  // O custo sobe aqui antes de subir na fatura.
  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'classificacao',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado:
          (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  const achado = bruto.match(/\{[\s\S]*\}/)
  if (!achado) return null

  try {
    const j = JSON.parse(achado[0]) as Record<string, unknown>
    const areaId = typeof j.areaId === 'number' && areas.some((a) => a.id === j.areaId) ? j.areaId : null
    const frenteId = typeof j.frenteId === 'number' && frentes.some((f) => f.id === j.frenteId) ? j.frenteId : null
    const tipos = ['tarefa', 'insight', 'compromisso', 'oportunidade', 'indefinido']
    return {
      tipo: (tipos.includes(String(j.tipo)) ? j.tipo : 'indefinido') as Classificacao['tipo'],
      areaId,
      frenteId,
      venceEm: typeof j.venceEm === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(j.venceEm) ? new Date(j.venceEm + 'T12:00:00-03:00') : null,
      confianca: typeof j.confianca === 'number' ? Math.max(0, Math.min(1, j.confianca)) : 0.5,
    }
  } catch {
    return null
  }
}
