// "Jarvis, estou fazendo o detalhamento do transportador."
//
// O caminho mais curto entre a boca do Lucian e o cronometro rodando. Uma frase
// falada vira: tarefa identificada (ou criada), relogio ligado, e um veredito
// sobre o quanto aquilo importa HOJE - comparado com o que o painel recomenda.
//
// Duas regras que fazem isso valer alguma coisa:
// 1. UMA chamada de IA por comando. Interpretar e responder saem juntos, senao
//    o custo dobra e a espera tambem.
// 2. O veredito e CONFERIDO no codigo, nao aceito do modelo. Se ele disser que
//    a escolha bate com a prioridade, o codigo confere com a recomendacao real
//    antes de mostrar. Modelo erra; ponteiro nao pode errar junto.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { montarPainel } from './painel'
import { decidirAgora } from './agora'
import { montarEstado } from './conversa'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

export type Interpretacao = {
  acao: 'iniciar' | 'parar' | 'concluir' | 'nada'
  frenteId: number | null
  tarefaId: number | null
  tarefaNova: string | null
  resposta: string
}

export type ResultadoComando = {
  ok: boolean
  acao: Interpretacao['acao']
  tarefa: string | null
  frente: string | null
  area: string | null
  resposta: string
  alinhamento: 'e a prioridade' | 'nao e a prioridade' | 'sem prioridade definida'
  recomendado: string | null
}

const INSTRUCAO = `Voce e o Jarvis da KGFM. O Lucian acabou de FALAR com voce enquanto trabalha.
Sua tarefa: entender o que ele esta fazendo (ou pedindo) e devolver SO um JSON, sem texto em volta:

{"acao":"iniciar|parar|concluir|nada","frenteId":numero|null,"tarefaId":numero|null,"tarefaNova":"texto"|null,"resposta":"duas frases no maximo"}

Regras:
- "estou fazendo X", "vou comecar X", "to em X" -> acao "iniciar".
- "parei", "pausa", "terminei por agora" -> acao "parar".
- "acabei X", "terminei X", "fechei X" -> acao "concluir".
- Pergunta ou desabafo sem trabalho comecando -> acao "nada", e responda na resposta.
- Para "iniciar": ache a frente ABERTA mais provavel no estado e use frenteId. Se ja existir tarefa aberta que casa, use tarefaId. Se nao existir, escreva tarefaNova com o titulo curto do que ele disse (5 a 8 palavras, sem "estou fazendo").
- Se nenhuma frente aberta servir, deixe frenteId null: o sistema vai avisar que falta abrir a frente.

A "resposta" e a sua voz falando com ele: direta, sem elogio, portugues do Brasil, hifen no lugar de travessao, no maximo duas frases. Diga o que voce entendeu e o quanto aquilo importa hoje diante do resto - se ele escolheu algo que nao e a prioridade do painel, diga isso na cara, com o motivo. Nada de "otimo", "perfeito" ou "boa escolha".`

export async function executarComando(texto: string): Promise<ResultadoComando> {
  const painel = await montarPainel()
  const recomendacao = decidirAgora(painel)

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return {
      ok: false,
      acao: 'nada',
      tarefa: null,
      frente: null,
      area: null,
      resposta: 'Sem chave da API eu nao entendo o que voce falou. Configure ANTHROPIC_API_KEY no .env - o passo a passo esta em docs/CHAVE-ANTHROPIC.md.',
      alinhamento: 'sem prioridade definida',
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  const estado = await montarEstado()
  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // As frentes abertas com id, para o modelo ter o que casar.
  const frentes = await prisma.frente.findMany({
    where: { status: 'aberta' },
    include: { area: true, projeto: true, tarefas: { where: { status: 'aberta' } } },
  })
  const catalogo = frentes
    .map(
      (f) =>
        `frenteId ${f.id}: ${f.titulo} [${f.area.nome}${f.projeto ? ' / ' + f.projeto.nome : ''}]` +
        (f.tarefas.length ? `\n    tarefas: ${f.tarefas.map((t) => `tarefaId ${t.id} ${t.titulo}`).join(' | ')}` : ''),
    )
    .join('\n')

  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 500,
    system: `${INSTRUCAO}\n\n${estado}\n\nFRENTES ABERTAS COM ID:\n${catalogo || '- nenhuma'}`,
    messages: [{ role: 'user', content: texto }],
  })

  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'comando-de-voz',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado: (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  const bruto = r.content.find((c) => c.type === 'text')?.text ?? ''
  const achado = bruto.match(/\{[\s\S]*\}/)
  if (!achado) {
    return {
      ok: false,
      acao: 'nada',
      tarefa: null,
      frente: null,
      area: null,
      resposta: 'Nao consegui entender. Repita dizendo o que voce esta fazendo e de que frente e.',
      alinhamento: 'sem prioridade definida',
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  let i: Interpretacao
  try {
    i = JSON.parse(achado[0]) as Interpretacao
  } catch {
    return {
      ok: false,
      acao: 'nada',
      tarefa: null,
      frente: null,
      area: null,
      resposta: 'Nao consegui entender. Repita com o nome do assunto.',
      alinhamento: 'sem prioridade definida',
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  const agora = new Date()

  if (i.acao === 'parar') {
    const abertos = await prisma.apontamento.findMany({ where: { encerradoEm: null }, include: { tarefa: true } })
    await prisma.apontamento.updateMany({ where: { encerradoEm: null }, data: { encerradoEm: agora, encerradoPor: 'usuario' } })
    for (const a of abertos) {
      await prisma.movimento.create({ data: { frenteId: a.tarefa.frenteId, tipo: 'cronometro-parado', descricao: a.tarefa.titulo } })
    }
    return {
      ok: true,
      acao: 'parar',
      tarefa: abertos[0]?.tarefa.titulo ?? null,
      frente: null,
      area: null,
      resposta: i.resposta || 'Relogio parado.',
      alinhamento: 'sem prioridade definida',
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  if (i.acao === 'concluir' && i.tarefaId) {
    await prisma.apontamento.updateMany({ where: { tarefaId: i.tarefaId, encerradoEm: null }, data: { encerradoEm: agora, encerradoPor: 'usuario' } })
    const t = await prisma.tarefa.update({ where: { id: i.tarefaId }, data: { status: 'feita', concluidaEm: agora } })
    await prisma.movimento.create({ data: { frenteId: t.frenteId, tipo: 'tarefa-feita', descricao: t.titulo } })
    return {
      ok: true,
      acao: 'concluir',
      tarefa: t.titulo,
      frente: null,
      area: null,
      resposta: i.resposta || 'Marcada como feita.',
      alinhamento: 'sem prioridade definida',
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  if (i.acao === 'iniciar') {
    if (!i.frenteId) {
      return {
        ok: false,
        acao: 'nada',
        tarefa: null,
        frente: null,
        area: null,
        resposta:
          i.resposta ||
          'Nao achei frente aberta para isso. Abra a frente primeiro - o cronometro precisa saber a que assunto a hora pertence.',
        alinhamento: 'sem prioridade definida',
        recomendado: recomendacao?.titulo ?? null,
      }
    }

    const frente = await prisma.frente.findUnique({ where: { id: i.frenteId }, include: { area: true } })
    if (!frente) {
      return {
        ok: false,
        acao: 'nada',
        tarefa: null,
        frente: null,
        area: null,
        resposta: 'A frente que eu entendi nao existe mais. Repita com o nome do assunto.',
        alinhamento: 'sem prioridade definida',
        recomendado: recomendacao?.titulo ?? null,
      }
    }

    let tarefaId = i.tarefaId
    if (!tarefaId) {
      const nova = await prisma.tarefa.create({
        data: { frenteId: frente.id, titulo: i.tarefaNova?.trim() || texto.slice(0, 80) },
      })
      tarefaId = nova.id
    }

    // Um cronometro por vez, no sistema inteiro.
    await prisma.apontamento.updateMany({ where: { encerradoEm: null }, data: { encerradoEm: agora, encerradoPor: 'troca' } })
    await prisma.apontamento.create({ data: { tarefaId, iniciadoEm: agora } })
    await prisma.movimento.create({ data: { frenteId: frente.id, tipo: 'cronometro' } })
    await prisma.frente.update({ where: { id: frente.id }, data: { ultimoMovimentoEm: agora } })

    const tarefa = await prisma.tarefa.findUnique({ where: { id: tarefaId } })

    // O veredito conferido no codigo, nao aceito do modelo.
    const alinhamento: ResultadoComando['alinhamento'] = !recomendacao
      ? 'sem prioridade definida'
      : recomendacao.frenteId === frente.id
        ? 'e a prioridade'
        : 'nao e a prioridade'

    return {
      ok: true,
      acao: 'iniciar',
      tarefa: tarefa?.titulo ?? null,
      frente: frente.titulo,
      area: frente.area.nome,
      resposta: i.resposta || 'Relogio rodando.',
      alinhamento,
      recomendado: recomendacao?.titulo ?? null,
    }
  }

  return {
    ok: true,
    acao: 'nada',
    tarefa: null,
    frente: null,
    area: null,
    resposta: i.resposta || 'Entendi, mas nao vi trabalho comecando.',
    alinhamento: 'sem prioridade definida',
    recomendado: recomendacao?.titulo ?? null,
  }
}
