// A checagem rápida, do lado de fora do login.
//
// Existe por um motivo prático: depois de mexer em variável de ambiente na
// Vercel, a única forma de saber se o redeploy pegou era entrar no sistema e
// tentar ditar alguma coisa. Agora dá para perguntar de fora.
//
// Só devolve SIM ou NÃO. Nenhum valor de chave, nenhum trecho, nenhum
// tamanho - a resposta é pública e um booleano não vaza nada.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarNoCrm } from '@/lib/crm'

export const dynamic = 'force-dynamic'

export async function GET() {
  let bancoConectado = false
  try {
    await prisma.$queryRaw`SELECT 1`
    bancoConectado = true
  } catch {
    bancoConectado = false
  }

  // Uma busca minima, so para saber se o CRM aceita o token.
  let crmResponde: boolean | null = null
  if (process.env.CRM_TOKEN?.trim()) {
    crmResponde = (await buscarNoCrm('ria')) !== null
  }

  return NextResponse.json({
    banco_conectado: bancoConectado,
    // Sem isto o ditado e a conversa respondem "sem chave da API" e o resto
    // do sistema continua funcionando normalmente.
    chave_ia_configurada: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    // Booleano tambem aqui: nunca o valor, nunca um pedaco dele.
    crm_ligado: Boolean(process.env.CRM_TOKEN?.trim()),
    // A DIFERENCA QUE IMPORTA: 'ligado' so diz que a variavel existe.
    // 'responde' prova que o token vale - sao coisas diferentes, e token
    // errado passa na primeira e falha na segunda, em silencio.
    crm_responde: crmResponde,
    google_configurado: Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
    ),
    quando: new Date().toISOString(),
  })
}
