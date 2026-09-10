// "Jarvis, estou fazendo o detalhamento do transportador."
//
// O caminho mais curto entre a boca do Lucian e o cronometro rodando.
//
// COMO ISSO FICOU BARATO (refeito em 10/09/2026):
// A primeira versao chamava um modelo grande TODA VEZ - US$ 0,012 e alguns
// segundos por comando. A 20 comandos por dia isso vira mensalidade disfarcada,
// e o Lucian reclamou com razao.
//
// Ligar o cronometro nao e problema de raciocinio, e problema de "parecido com":
// "levantando os precos da cotacao" tem que casar com a frente "Cotacao de
// pecas pequenas". Isso e comparacao de palavras (src/lib/casar.ts), roda em
// milissegundos, de graca, sem internet e sem espera.
//
// A IA so entra quando a comparacao NAO tem certeza, ou quando ele perguntou
// algo em vez de mandar. Na pratica: quase nunca.
//
// O veredito de prioridade nunca dependeu da IA - ele sempre foi calculado
// aqui, comparando com a recomendacao real do painel.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { montarPainel } from './painel'
import { decidirAgora } from './agora'
import { montarEstado } from './conversa'
import { diasUteisEntre } from './datas'
import { casar, lerIntencao, ehDitado, tituloDoFalado, type AlvoPossivel } from './casar'
import { garantirFrenteAberta } from './abrirFrente'
import { interpretarDitado, gravarDitado } from './ditado'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

export type ResultadoComando = {
  ok: boolean
  acao: 'iniciar' | 'parar' | 'concluir' | 'nada'
  tarefa: string | null
  frente: string | null
  area: string | null
  resposta: string
  alinhamento: 'e a prioridade' | 'nao e a prioridade' | 'sem prioridade definida'
  recomendado: string | null
  /** true quando precisou gastar credito da API. */
  usouIa: boolean
  /** o que foi criado no banco a partir do que ele ditou */
  criou: string[] | null
}

function vazio(resposta: string, recomendado: string | null, usouIa = false): ResultadoComando {
  return {
    ok: false,
    acao: 'nada',
    tarefa: null,
    frente: null,
    area: null,
    resposta,
    alinhamento: 'sem prioridade definida',
    recomendado,
    usouIa,
    criou: null,
  }
}

export async function executarComando(texto: string): Promise<ResultadoComando> {
  const painel = await montarPainel()
  const recomendacao = decidirAgora(painel)
  const recomendado = recomendacao?.titulo ?? null
  const agora = new Date()
  const intencao = lerIntencao(texto)

  // ---------- parar: nao precisa casar com nada ----------
  if (intencao === 'parar') {
    const abertos = await prisma.apontamento.findMany({
      where: { encerradoEm: null },
      include: { tarefa: { include: { frente: true } } },
    })
    if (abertos.length === 0) return vazio('Nenhum cronometro estava rodando.', recomendado)

    await prisma.apontamento.updateMany({
      where: { encerradoEm: null },
      data: { encerradoEm: agora, encerradoPor: 'usuario' },
    })
    for (const a of abertos) {
      await prisma.movimento.create({
        data: { frenteId: a.tarefa.frenteId, tipo: 'cronometro-parado', descricao: a.tarefa.titulo },
      })
    }
    const min = Math.round((agora.getTime() - abertos[0].iniciadoEm.getTime()) / 60000)
    return {
      ok: true,
      acao: 'parar',
      tarefa: abertos[0].tarefa.titulo,
      frente: abertos[0].tarefa.frente.titulo,
      area: null,
      resposta: `Parado. ${min} min em ${abertos[0].tarefa.titulo}.`,
      alinhamento: 'sem prioridade definida',
      recomendado,
      usouIa: false,
      criou: null,
    }
  }

  // ---------- os alvos possiveis ----------
  const frentes = await prisma.frente.findMany({
    where: { status: 'aberta' },
    include: {
      area: true,
      projeto: true,
      tarefas: { where: { status: 'aberta' } },
      bloqueiaEstas: true,
    },
  })

  const alvos: AlvoPossivel[] = frentes.map((f) => ({
    frenteId: f.id,
    frenteTitulo: f.titulo,
    projeto: f.projeto?.nome ?? null,
    area: f.area.nome,
    tarefas: f.tarefas.map((t) => ({ id: t.id, titulo: t.titulo })),
  }))

  // Texto longo, ou com varias acoes encadeadas, NUNCA passa pelo casamento de
  // palavras: e plano, e plano se organiza, nao se "casa".
  const m = ehDitado(texto)
    ? { confiante: false, frenteId: null, tarefaId: null, tituloDaTarefaNova: tituloDoFalado(texto), nota: 0, segunda: 0 }
    : casar(texto, alvos)

  // ---------- concluir ----------
  if (intencao === 'concluir') {
    if (!m.confiante || !m.tarefaId) {
      return vazio(
        'Nao consegui identificar qual tarefa terminou. Diga o nome dela, ou marque como feita na tela de Frentes.',
        recomendado,
      )
    }
    await prisma.apontamento.updateMany({
      where: { tarefaId: m.tarefaId, encerradoEm: null },
      data: { encerradoEm: agora, encerradoPor: 'usuario' },
    })
    const t = await prisma.tarefa.update({
      where: { id: m.tarefaId },
      data: { status: 'feita', concluidaEm: agora },
    })
    await prisma.movimento.create({ data: { frenteId: t.frenteId, tipo: 'tarefa-feita', descricao: t.titulo } })
    return {
      ok: true,
      acao: 'concluir',
      tarefa: t.titulo,
      frente: null,
      area: null,
      resposta: `Feita: ${t.titulo}.`,
      alinhamento: 'sem prioridade definida',
      recomendado,
      usouIa: false,
      criou: null,
    }
  }

  // ---------- pergunta: a IA responde, nao escreve nada ----------
  if (intencao === 'perguntar') {
    return await comIa(texto, recomendado, null)
  }

  // ---------- nao casou com nada: e DITADO, nao comando ----------
  //
  // Este era o beco sem saida do sistema. Quando ele ditava trabalho novo -
  // "o motoboy busca as pecas na usinagem do Dennis, depois vai pro banho na
  // Soriel" - a comparacao por palavras nao tinha o que casar e respondia
  // "nao tenho certeza de qual frente e": tecnicamente correta e inutil.
  //
  // Agora, se nao casou, o sistema entende que e trabalho NOVO e organiza:
  // cria a frente na area certa, as tarefas na ordem, e os prazos.
  if (!m.confiante) {
    const { plano, usouIa } = await interpretarDitado(texto)

    if (!plano || !plano.frentes?.length) {
      if (!usouIa) {
        return vazio(
          'Sem chave da API eu so consigo casar com o que ja existe - e isto aqui e assunto novo. Configure ANTHROPIC_API_KEY, ou abra a frente na tela de Frentes.',
          recomendado,
        )
      }
      return vazio('Nao consegui organizar isso. Repita separando as coisas: o que fazer, onde, e para quando.', recomendado, true)
    }

    const { linhas, tarefaParaComecar } = await gravarDitado(plano)

    // Ele pode estar comecando algo que JA EXISTE, dito com outras palavras:
    // "a logistica das pecas pra trazer da usinagem" e a tarefa
    // "Logistica de retorno da usinagem". O modelo aponta o numero, e aqui a
    // gente confere que a tarefa existe mesmo antes de ligar o relogio.
    let alvo = tarefaParaComecar
    if (!alvo && plano.tarefaExistenteId) {
      const existe = await prisma.tarefa.findFirst({
        where: { id: plano.tarefaExistenteId, status: 'aberta' },
      })
      if (existe) alvo = existe.id
    }

    // Se ele disse que ja esta fazendo uma delas, o relogio parte junto.
    let tarefaIniciada: string | null = null
    let frenteIniciada: string | null = null
    let areaIniciada: string | null = null
    if (alvo) {
      const t = await prisma.tarefa.findUnique({
        where: { id: alvo },
        include: { frente: { include: { area: true } } },
      })
      if (t) {
        await prisma.apontamento.updateMany({
          where: { encerradoEm: null },
          data: { encerradoEm: agora, encerradoPor: 'troca' },
        })
        await prisma.apontamento.create({
          data: { tarefaId: t.id, iniciadoEm: agora, blocoDesde: agora },
        })
        await garantirFrenteAberta(t.frenteId)
        tarefaIniciada = t.titulo
        frenteIniciada = t.frente.titulo
        areaIniciada = t.frente.area.nome
      }
    }

    return {
      ok: true,
      acao: tarefaIniciada ? 'iniciar' : 'nada',
      tarefa: tarefaIniciada,
      frente: frenteIniciada,
      area: areaIniciada,
      resposta: plano.entendi || 'Organizado.',
      alinhamento: 'sem prioridade definida',
      recomendado,
      usouIa: true,
      criou: linhas,
    }
  }

  // ---------- iniciar, com certeza e sem custo ----------
  const frente = frentes.find((f) => f.id === m.frenteId)
  if (!frente) return vazio('A frente que eu entendi nao existe mais.', recomendado)

  let tarefaId = m.tarefaId
  let tituloTarefa: string
  if (tarefaId) {
    tituloTarefa = frente.tarefas.find((t) => t.id === tarefaId)?.titulo ?? m.tituloDaTarefaNova
  } else {
    const nova = await prisma.tarefa.create({
      data: { frenteId: frente.id, titulo: m.tituloDaTarefaNova || tituloDoFalado(texto) },
    })
    tarefaId = nova.id
    tituloTarefa = nova.titulo
  }

  // Um cronometro por vez, no sistema inteiro.
  const anterior = await prisma.apontamento.findFirst({
    where: { encerradoEm: null },
    include: { tarefa: true },
  })
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null },
    data: { encerradoEm: agora, encerradoPor: 'troca' },
  })
  await prisma.apontamento.create({ data: { tarefaId, iniciadoEm: agora, blocoDesde: agora } })
  await garantirFrenteAberta(frente.id)
  await prisma.movimento.create({ data: { frenteId: frente.id, tipo: 'cronometro' } })

  const paradaHa = diasUteisEntre(frente.ultimoMovimentoEm, agora)
  await prisma.frente.update({ where: { id: frente.id }, data: { ultimoMovimentoEm: agora } })

  const alinhamento: ResultadoComando['alinhamento'] = !recomendacao
    ? 'sem prioridade definida'
    : recomendacao.frenteId === frente.id
      ? 'e a prioridade'
      : 'nao e a prioridade'

  // A resposta e montada com FATO, nao com opiniao de modelo.
  const partes: string[] = [`Rodando: ${tituloTarefa}.`]
  if (anterior && anterior.tarefaId !== tarefaId) {
    const minAnterior = Math.round((agora.getTime() - anterior.iniciadoEm.getTime()) / 60000)
    partes.push(`Encerrei ${anterior.tarefa.titulo} com ${minAnterior} min.`)
  }
  if (frente.bloqueiaEstas.length > 0) {
    partes.push(`Esta frente trava ${frente.bloqueiaEstas.length} outra${frente.bloqueiaEstas.length > 1 ? 's' : ''}.`)
  } else if (paradaHa >= frente.area.diasParaCritico) {
    partes.push(`Estava parada ha ${paradaHa} dias uteis.`)
  }

  return {
    ok: true,
    acao: 'iniciar',
    tarefa: tituloTarefa,
    frente: frente.titulo,
    area: frente.area.nome,
    resposta: partes.join(' '),
    alinhamento,
    recomendado,
    usouIa: false,
    criou: null,
  }
}

/** O caminho caro. So quando a comparacao nao deu conta. */
async function comIa(
  texto: string,
  recomendado: string | null,
  alvosParaEscolher: AlvoPossivel[] | null,
): Promise<ResultadoComando> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    if (alvosParaEscolher && alvosParaEscolher.length > 0) {
      const nomes = alvosParaEscolher.slice(0, 4).map((a) => a.frenteTitulo).join(', ')
      return vazio(`Nao tenho certeza de qual frente e. Repita com o nome dela - as abertas sao: ${nomes}.`, recomendado)
    }
    return vazio('Nao achei frente aberta para isso. Abra a frente primeiro.', recomendado)
  }

  const estado = await montarEstado()
  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const r = await cliente.messages.create({
    model: MODELO,
    max_tokens: 350,
    system: [
      'Voce e o Jarvis da KGFM. O Lucian falou com voce enquanto trabalha e a busca por palavras nao teve certeza do que ele quis dizer.',
      'Responda em no maximo duas frases, portugues do Brasil, direto, sem elogio, hifen no lugar de travessao.',
      'Se for pergunta, responda com o que esta no ESTADO abaixo e nada alem disso.',
      'Se ele quis comecar algo e voce conseguir identificar a frente, diga o nome dela e peca para ele repetir usando esse nome - voce nao liga o cronometro nesta situacao.',
      '',
      estado,
    ].join('\n'),
    messages: [{ role: 'user', content: texto }],
  })

  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'comando-incerto',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado:
          (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  const resposta = r.content.find((c) => c.type === 'text')?.text ?? 'Nao consegui formular.'
  return { ...vazio(resposta, recomendado, true) }
}
