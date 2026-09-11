'use server'

// Todas as ações de escrita. Server Actions em vez de rotas de API: e menos
// codigo para a mesma coisa, e o sistema tem um usuário só.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { classificar } from '@/lib/classificador'
import { gravarConfig, voltarAoPadrao } from '@/lib/configuracao'
import { senhaConfere, abrirSessao, fecharSessao } from '@/lib/sessao'
import type { ConfigMostrador } from '@/lib/mostrador'
import { responder, type Fala } from '@/lib/conversa'
import { pacotesDaFase, type FaseWbs } from '@/lib/wbs'
import { CAMPOS_PRIORIDADE } from '@/lib/prioridade'
import { correnteDoProjeto } from '@/lib/modelos'
import { extrairSpin } from '@/lib/transcricao'
import { fazerPlanoDoDia } from '@/lib/ritual'
import type { TipoProjeto } from '@prisma/client'
import { executarComando, type ResultadoComando } from '@/lib/comando'
import { fazerCheckin, fazerCheckout } from '@/lib/ritual'
import { podeMandarProposta } from '@/lib/spin'
import { garantirFrenteAberta } from '@/lib/abrirFrente'

export async function entrar(form: FormData) {
  const senha = String(form.get('senha') ?? '')
  if (!senhaConfere(senha)) redirect('/entrar?erro=1')
  await abrirSessao()
  redirect('/painel')
}

export async function sair() {
  await fecharSessao()
  redirect('/entrar')
}

/** Captura. Zero campo obrigatório além do texto. A IA classifica depois. */
export async function capturar(form: FormData) {
  const bruto = String(form.get('conteudo') ?? '').trim()
  if (!bruto) return
  const origem = (String(form.get('origem') ?? 'texto') as 'texto' | 'voz' | 'imagem') ?? 'texto'

  const item = await prisma.item.create({
    data: { conteudo: bruto, conteudoBruto: bruto, origem },
  })

  // Classificar nunca pode segurar a captura. Se a IA falhar ou não houver
  // chave, o item fica em "novo" e aparece na lista para o Lucian arrastar.
  try {
    const c = await classificar(bruto)
    if (c) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          tipo: c.tipo,
          areaId: c.areaId,
          frenteId: c.frenteId,
          venceEm: c.venceEm,
          confiancaClassificacao: c.confianca,
          status: 'classificado',
          processadoEm: new Date(),
        },
      })
      if (c.frenteId) await registrarMovimento(c.frenteId, 'captura', bruto.slice(0, 120))
    }
  } catch {
    // silêncio de propósito: o item já está salvo, que é o que importa
  }

  revalidatePath('/painel')
  revalidatePath('/capturas')
}

export async function corrigirItem(form: FormData) {
  const id = Number(form.get('id'))
  const areaId = form.get('areaId') ? Number(form.get('areaId')) : null
  const tipo = String(form.get('tipo') ?? 'indefinido') as 'tarefa' | 'insight' | 'compromisso' | 'oportunidade' | 'indefinido'
  await prisma.item.update({
    where: { id },
    data: { areaId, tipo, corrigidoPeloUsuario: true, status: 'classificado' },
  })
  revalidatePath('/capturas')
  revalidatePath('/painel')
}

export async function descartarItem(form: FormData) {
  const id = Number(form.get('id'))
  await prisma.item.update({
    where: { id },
    data: { status: 'descartado', descartadoEm: new Date(), motivoDescarte: String(form.get('motivo') ?? '') },
  })
  revalidatePath('/capturas')
}

async function registrarMovimento(frenteId: number, tipo: string, descricao?: string) {
  await prisma.movimento.create({ data: { frenteId, tipo, descricao } })
  await prisma.frente.update({ where: { id: frenteId }, data: { ultimoMovimentoEm: new Date() } })
}

/** Abrir frente. O limite de WIP bloqueia, e a tela oferece liberar ao lado. */
export async function abrirFrente(form: FormData): Promise<void> {
  const titulo = String(form.get('titulo') ?? '').trim()
  const areaId = Number(form.get('areaId'))
  if (!titulo || !areaId) return
  const forcar = form.get('forcar') === '1'

  const area = await prisma.area.findUnique({ where: { id: areaId } })
  if (!area) return
  const abertas = await prisma.frente.count({ where: { areaId, status: 'aberta' } })
  if (abertas >= area.limiteWip && !forcar) {
    redirect(`/frentes?wip=${areaId}&titulo=${encodeURIComponent(titulo)}`)
  }

  const f = await prisma.frente.create({ data: { titulo, areaId } })
  await prisma.movimento.create({ data: { frenteId: f.id, tipo: 'abertura' } })
  revalidatePath('/frentes')
  revalidatePath('/painel')
}

export async function mexerNaFrente(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  await registrarMovimento(frenteId, 'sinalizado', String(form.get('descricao') ?? '') || undefined)
  revalidatePath('/frentes')
  revalidatePath('/painel')
}

export async function mudarEspera(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  const quem = String(form.get('quem') ?? 'eu') as 'eu' | 'cliente' | 'terceiro'
  await prisma.frente.update({
    where: { id: frenteId },
    data: { aguardandoQuem: quem, aguardandoDesde: quem === 'eu' ? null : new Date() },
  })
  await registrarMovimento(frenteId, 'espera', quem)
  revalidatePath('/frentes')
  revalidatePath('/painel')
}

export async function fecharFrente(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  await prisma.frente.update({ where: { id: frenteId }, data: { status: 'fechada', fechadaEm: new Date() } })
  await prisma.movimento.create({ data: { frenteId, tipo: 'fechamento' } })
  revalidatePath('/frentes')
  revalidatePath('/painel')
}

export async function criarTarefa(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  const titulo = String(form.get('titulo') ?? '').trim()
  if (!titulo) return
  await prisma.tarefa.create({ data: { frenteId, titulo } })
  revalidatePath('/frentes')
}

/**
 * O cronômetro. Só UM apontamento aberto no sistema inteiro: começar outra
 * tarefa encerra a anterior com motivo "troca". O limite de WIP deixa de ser
 * aviso e vira física.
 */
export async function iniciarCronometro(form: FormData) {
  const tarefaId = Number(form.get('tarefaId'))
  const agora = new Date()
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null },
    data: { encerradoEm: agora, encerradoPor: 'troca' },
  })
  await prisma.apontamento.create({ data: { tarefaId, iniciadoEm: agora, blocoDesde: agora } })
  const t = await prisma.tarefa.findUnique({ where: { id: tarefaId } })
  if (t) {
    await garantirFrenteAberta(t.frenteId)
    await registrarMovimento(t.frenteId, 'cronometro', t.titulo)
  }
  revalidatePath('/painel')
  revalidatePath('/frentes')
}

export async function pararCronometro() {
  const agora = new Date()
  const abertos = await prisma.apontamento.findMany({ where: { encerradoEm: null }, include: { tarefa: true } })
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null },
    data: { encerradoEm: agora, encerradoPor: 'usuario' },
  })
  for (const a of abertos) await registrarMovimento(a.tarefa.frenteId, 'cronometro-parado', a.tarefa.titulo)
  revalidatePath('/painel')
  revalidatePath('/frentes')
}

export async function concluirTarefa(form: FormData) {
  const tarefaId = Number(form.get('tarefaId'))
  await prisma.apontamento.updateMany({
    where: { tarefaId, encerradoEm: null },
    data: { encerradoEm: new Date(), encerradoPor: 'usuario' },
  })
  const t = await prisma.tarefa.update({
    where: { id: tarefaId },
    data: { status: 'feita', concluidaEm: new Date() },
  })
  await registrarMovimento(t.frenteId, 'tarefa-feita', t.titulo)
  revalidatePath('/painel')
  revalidatePath('/frentes')
}

export async function salvarConfig(form: FormData) {
  const valores: Partial<Record<keyof ConfigMostrador, number>> = {}
  for (const [k, v] of form.entries()) {
    if (typeof v !== 'string') continue
    const n = Number(v)
    if (Number.isFinite(n)) (valores as Record<string, number>)[k] = n
  }
  await gravarConfig(valores)
  revalidatePath('/config')
  revalidatePath('/painel')
}

export async function restaurarPadrao() {
  await voltarAoPadrao()
  revalidatePath('/config')
  revalidatePath('/painel')
}

export async function salvarEstrategia(form: FormData) {
  const horizonte = String(form.get('horizonte') ?? 'ano') as 'cinco_anos' | 'dois_anos' | 'ano' | 'mes'
  const periodo = String(form.get('periodo') ?? '')
  const dados = {
    horizonte,
    periodo,
    diagnostico: String(form.get('diagnostico') ?? ''),
    politicaNorteadora: String(form.get('politicaNorteadora') ?? ''),
    acoes: String(form.get('acoes') ?? ''),
  }
  const existente = await prisma.estrategia.findFirst({ where: { horizonte } })
  if (existente) await prisma.estrategia.update({ where: { id: existente.id }, data: dados })
  else await prisma.estrategia.create({ data: dados })
  revalidatePath('/estrategia')
  revalidatePath('/painel')
}

export async function salvarObjetivo(form: FormData) {
  const descricao = String(form.get('descricao') ?? '').trim()
  if (!descricao) return
  await prisma.objetivo.create({
    data: {
      descricao,
      horizonte: String(form.get('horizonte') ?? 'mes') as 'cinco_anos' | 'dois_anos' | 'ano' | 'mes',
      periodo: String(form.get('periodo') ?? ''),
      metrica: String(form.get('metrica') ?? '') || null,
      alvo: form.get('alvo') ? Number(form.get('alvo')) : null,
      areaId: form.get('areaId') ? Number(form.get('areaId')) : null,
    },
  })
  revalidatePath('/estrategia')
  revalidatePath('/painel')
}

export async function medirObjetivo(form: FormData) {
  const objetivoId = Number(form.get('objetivoId'))
  const valor = Number(form.get('valor'))
  if (!Number.isFinite(valor)) return
  await prisma.medicao.create({ data: { objetivoId, valor, observacao: String(form.get('observacao') ?? '') || null } })
  revalidatePath('/estrategia')
  revalidatePath('/painel')
}

/**
 * Apaga a carga de exemplo. Fica na tela, ao lado do aviso, porque o Lucian
 * não roda comando: trava com botao de liberar do lado, na mesma tela.
 */
export async function limparExemplo() {
  const MARCA = '[exemplo]'
  const frentes = await prisma.frente.findMany({ where: { titulo: { contains: MARCA } } })
  const ids = frentes.map((f) => f.id)
  await prisma.apontamento.deleteMany({ where: { tarefa: { frenteId: { in: ids } } } })
  await prisma.tarefa.deleteMany({ where: { frenteId: { in: ids } } })
  await prisma.movimento.deleteMany({ where: { frenteId: { in: ids } } })
  await prisma.bloqueio.deleteMany({
    where: { OR: [{ frenteBloqueadoraId: { in: ids } }, { frenteBloqueadaId: { in: ids } }] },
  })
  await prisma.item.deleteMany({ where: { conteudo: { contains: MARCA } } })
  await prisma.frente.deleteMany({ where: { id: { in: ids } } })
  await prisma.medicao.deleteMany({ where: { objetivo: { descricao: { contains: MARCA } } } })
  await prisma.objetivo.deleteMany({ where: { descricao: { contains: MARCA } } })
  await prisma.estrategia.deleteMany({ where: { diagnostico: { contains: MARCA } } })
  revalidatePath('/painel')
  revalidatePath('/frentes')
  revalidatePath('/estrategia')
}

/** A conversa. O modelo le o estado do painel antes de responder. */
export async function falarComJarvis(historico: Fala[]): Promise<string> {
  return responder(historico)
}

/**
 * Cria o projeto e desdobra a WBS padrão nos quatro setores.
 * Os pacotes nascem PLANEJADOS: a WBS é o plano, o quadro é o agora.
 */
export async function criarProjetoComWbs(form: FormData) {
  const nome = String(form.get('nome') ?? '').trim()
  if (!nome) return
  const fase = String(form.get('fase') ?? 'desenvolvimento') as FaseWbs
  const cliente = String(form.get('cliente') ?? '').trim() || null
  const valor = form.get('valorEstimado') ? Number(form.get('valorEstimado')) : null

  const areas = await prisma.area.findMany()
  const porChave = new Map(areas.map((a) => [a.chave, a]))
  const areaPadrao = areas[0]
  if (!areaPadrao) return

  const projeto = await prisma.projeto.create({
    data: {
      nome,
      cliente,
      valorEstimado: valor,
      prazoRecebimentoDias: form.get('prazoRecebimentoDias') ? Number(form.get('prazoRecebimentoDias')) : null,
      probabilidade: form.get('probabilidade') ? Number(form.get('probabilidade')) : 50,
      fase,
      areaId: (porChave.get('comercial') ?? areaPadrao).id,
    },
  })

  let ordem = 0
  for (const p of pacotesDaFase(fase)) {
    const area = porChave.get(p.area) ?? areaPadrao
    const frente = await prisma.frente.create({
      data: {
        titulo: p.pacote,
        pacote: p.pacote,
        areaId: area.id,
        projetoId: projeto.id,
        status: 'planejada',
        ordem: ordem++,
      },
    })
    for (const t of p.tarefas) await prisma.tarefa.create({ data: { frenteId: frente.id, titulo: t } })
  }

  revalidatePath('/projetos')
  revalidatePath('/frentes')
}

/** Ativar um pacote da WBS. Passa pelo limite de WIP como qualquer frente. */
export async function ativarPacote(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  const forcar = form.get('forcar') === '1'
  const f = await prisma.frente.findUnique({ where: { id: frenteId }, include: { area: true } })
  if (!f) return
  const abertas = await prisma.frente.count({ where: { areaId: f.areaId, status: 'aberta' } })
  if (abertas >= f.area.limiteWip && !forcar) {
    redirect(`/projetos?wip=${f.id}`)
  }
  await prisma.frente.update({
    where: { id: frenteId },
    data: { status: 'aberta', abertaEm: new Date(), ultimoMovimentoEm: new Date() },
  })
  await prisma.movimento.create({ data: { frenteId, tipo: 'ativacao' } })
  revalidatePath('/projetos')
  revalidatePath('/frentes')
  revalidatePath('/painel')
}

export async function mudarFaseProjeto(form: FormData) {
  const id = Number(form.get('projetoId'))
  const fase = String(form.get('fase')) as FaseWbs
  const projeto = await prisma.projeto.update({ where: { id }, data: { fase } })

  // Ao mudar de fase, os pacotes da fase nova que ainda não existem são criados.
  const existentes = new Set((await prisma.frente.findMany({ where: { projetoId: id } })).map((f) => f.pacote))
  const areas = new Map((await prisma.area.findMany()).map((a) => [a.chave, a]))
  let ordem = 100
  for (const p of pacotesDaFase(fase)) {
    if (existentes.has(p.pacote)) continue
    const area = areas.get(p.area)
    if (!area) continue
    const frente = await prisma.frente.create({
      data: { titulo: p.pacote, pacote: p.pacote, areaId: area.id, projetoId: projeto.id, status: 'planejada', ordem: ordem++ },
    })
    for (const t of p.tarefas) await prisma.tarefa.create({ data: { frenteId: frente.id, titulo: t } })
  }
  revalidatePath('/projetos')
}

/** "Jarvis, estou fazendo X" - fala vira cronômetro rodando. */
export async function comandoDeVoz(texto: string): Promise<ResultadoComando> {
  const r = await executarComando(texto)
  revalidatePath('/painel')
  revalidatePath('/frentes')
  return r
}

export async function rodarCheckin() {
  await fazerCheckin()
  revalidatePath('/semana')
}

export async function rodarCheckout() {
  await fazerCheckout()
  revalidatePath('/semana')
}

/** SPIN do projeto. Nada obrigatório: guarda o que já se sabe. */
export async function salvarSpin(form: FormData) {
  const id = Number(form.get('projetoId'))
  await prisma.projeto.update({
    where: { id },
    data: {
      situacao: String(form.get('situacao') ?? '') || null,
      problema: String(form.get('problema') ?? '') || null,
      implicacao: String(form.get('implicacao') ?? '') || null,
      necessidade: String(form.get('necessidade') ?? '') || null,
    },
  })
  revalidatePath('/projetos')
}

/**
 * Registrar proposta enviada. A trava do SPIN mora aqui - e o botao de liberar
 * fica ao lado dela, na mesma tela.
 */
export async function marcarPropostaEnviada(form: FormData) {
  const id = Number(form.get('projetoId'))
  const forcar = form.get('forcar') === '1'
  const p = await prisma.projeto.findUnique({ where: { id } })
  if (!p) return
  const v = podeMandarProposta(p)
  if (!v.liberado && !forcar) redirect(`/projetos?spin=${id}`)
  await prisma.projeto.update({ where: { id }, data: { propostaEnviadaEm: new Date() } })
  revalidatePath('/projetos')
  revalidatePath('/painel')
}

/** O decisor, com o que dói para ELE. Carnegie aplicado. */
export async function salvarDecisor(form: FormData) {
  const projetoId = Number(form.get('projetoId'))
  const nome = String(form.get('nome') ?? '').trim()
  if (!nome) return
  await prisma.decisor.create({
    data: {
      projetoId,
      nome,
      cargo: String(form.get('cargo') ?? '') || null,
      oQueDoiParaEle: String(form.get('oQueDoiParaEle') ?? '') || null,
      interesses: String(form.get('interesses') ?? '') || null,
    },
  })
  revalidatePath('/projetos')
}

export async function salvarConhecimento(form: FormData) {
  const titulo = String(form.get('titulo') ?? '').trim()
  const conteudo = String(form.get('conteudo') ?? '').trim()
  if (!titulo || !conteudo) return
  const id = form.get('id') ? Number(form.get('id')) : null
  const dados = {
    titulo,
    conteudo,
    categoria: String(form.get('categoria') ?? 'tecnico'),
    tags: String(form.get('tags') ?? '') || null,
  }
  if (id) await prisma.conhecimento.update({ where: { id }, data: dados })
  else await prisma.conhecimento.create({ data: dados })
  revalidatePath('/playbook')
}

export async function apagarConhecimento(form: FormData) {
  await prisma.conhecimento.delete({ where: { id: Number(form.get('id')) } })
  revalidatePath('/playbook')
}

/** Os números do caixa. Uma linha só, id 1. */
export async function salvarCaixa(form: FormData) {
  const n = (k: string) => {
    const v = Number(form.get(k))
    return Number.isFinite(v) ? v : 0
  }
  const dados = {
    saldo: n('saldo'),
    custoFixoMensal: n('custoFixoMensal'),
    parcelaEmprestimo: n('parcelaEmprestimo'),
    margemBruta: Math.max(0.01, Math.min(1, n('margemBruta') / 100)),
    limiteBaixoTicket: n('limiteBaixoTicket'),
    tetoHoraBaixoTicket: Math.max(0, Math.min(1, n('tetoHoraBaixoTicket') / 100)),
  }
  await prisma.caixa.upsert({ where: { id: 1 }, create: { id: 1, ...dados }, update: dados })
  revalidatePath('/caixa')
  revalidatePath('/painel')
}

/**
 * Marcar compromisso. A hora vem como "14:30" e a data como "2026-09-10";
 * junto as duas no fuso de Sao Paulo, senao a Vercel (que roda em UTC) marca
 * a reunião três horas fora do lugar.
 */
export async function criarCompromisso(form: FormData) {
  const titulo = String(form.get('titulo') ?? '').trim()
  const data = String(form.get('data') ?? '')
  const hIni = String(form.get('inicio') ?? '')
  const hFim = String(form.get('fim') ?? '')
  if (!titulo || !data || !hIni || !hFim) return

  const inicio = new Date(`${data}T${hIni}:00-03:00`)
  const fim = new Date(`${data}T${hFim}:00-03:00`)
  if (!(fim > inicio)) return

  await prisma.compromisso.create({
    data: { titulo, inicio, fim, local: String(form.get('local') ?? '') || null },
  })
  revalidatePath('/painel')
}

export async function apagarCompromisso(form: FormData) {
  await prisma.compromisso.delete({ where: { id: Number(form.get('id')) } })
  revalidatePath('/painel')
  revalidatePath('/agenda')
}

/** Mais um bloco na mesma tarefa: reinicia o bloco sem parar o cronômetro. */
export async function continuarBloco(form: FormData) {
  const id = Number(form.get('apontamentoId'))
  await prisma.apontamento.update({
    where: { id },
    data: { blocoDesde: new Date(), blocosFeitos: { increment: 1 } },
  })
  revalidatePath('/painel')
}

/**
 * Descansar. O cronômetro PARA - descanso não e trabalho e não pode entrar na
 * conta de horas. A tarefa fica guardada para o sistema saber para onde voltar.
 */
export async function comecarDescanso(form: FormData) {
  const minutos = Number(form.get('minutos')) || 5
  const tarefaId = form.get('tarefaId') ? Number(form.get('tarefaId')) : null
  const agora = new Date()

  const abertos = await prisma.apontamento.findMany({ where: { encerradoEm: null }, include: { tarefa: true } })
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null },
    data: { encerradoEm: agora, encerradoPor: 'usuario' },
  })
  for (const a of abertos) {
    await prisma.movimento.create({
      data: { frenteId: a.tarefa.frenteId, tipo: 'bloco-fechado', descricao: a.tarefa.titulo },
    })
  }

  await prisma.descanso.updateMany({ where: { fim: null }, data: { fim: agora } })
  await prisma.descanso.create({ data: { minutos, tarefaId, inicio: agora } })
  revalidatePath('/painel')
}

/** Voltar do descanso, retomando a mesma tarefa se houver. */
export async function encerrarDescanso() {
  const agora = new Date()
  const atual = await prisma.descanso.findFirst({ where: { fim: null }, orderBy: { inicio: 'desc' } })
  await prisma.descanso.updateMany({ where: { fim: null }, data: { fim: agora } })

  if (atual?.tarefaId) {
    const t = await prisma.tarefa.findUnique({ where: { id: atual.tarefaId } })
    if (t && t.status === 'aberta') {
      await prisma.apontamento.updateMany({
        where: { encerradoEm: null },
        data: { encerradoEm: agora, encerradoPor: 'troca' },
      })
      await prisma.apontamento.create({
        data: { tarefaId: atual.tarefaId, iniciadoEm: agora, blocoDesde: agora },
      })
      await garantirFrenteAberta(t.frenteId)
      await prisma.movimento.create({ data: { frenteId: t.frenteId, tipo: 'cronometro', descricao: t.titulo } })
    }
  }
  revalidatePath('/painel')
}

/**
 * LANCAMENTO RETROATIVO - consertar o que ficou sem registro.
 *
 * Existe porque o buraco do dia não e ociosidade por definicao: pode ser
 * trabalho que ele esqueceu de apontar. Sem este botao, erro de lancamento
 * virava prejuizo no fechamento da semana, e o número perdia a autoridade.
 *
 * O apontamento nasce JA FECHADO e marcado como revisar - fica claro no
 * histórico que aquilo foi lembrado depois, não cronometrado na hora.
 */
export async function lancarRetroativo(form: FormData) {
  const tarefaId = Number(form.get('tarefaId'))
  const data = String(form.get('data') ?? '')
  const hIni = String(form.get('inicio') ?? '')
  const hFim = String(form.get('fim') ?? '')
  if (!tarefaId || !data || !hIni || !hFim) return

  const inicio = new Date(`${data}T${hIni}:00-03:00`)
  const fim = new Date(`${data}T${hFim}:00-03:00`)
  if (!(fim > inicio)) return

  const t = await prisma.tarefa.findUnique({ where: { id: tarefaId } })
  if (!t) return

  await prisma.apontamento.create({
    data: {
      tarefaId,
      iniciadoEm: inicio,
      encerradoEm: fim,
      encerradoPor: 'usuario',
      blocoDesde: inicio,
      revisar: true,
    },
  })
  await garantirFrenteAberta(t.frenteId)
  await registrarMovimento(t.frenteId, 'lancamento-retroativo', t.titulo)
  revalidatePath('/painel')
  revalidatePath('/frentes')
}

/**
 * A data em que o projeto começou de VERDADE.
 *
 * Existe porque o script que criou a carteira não sabia essa data e usou hoje
 * para todos. Enquanto ela estiver errada, todas as previsões do cronograma
 * estão erradas junto - e é uma correção que só o Lucian pode fazer.
 */
export async function definirInicioDoProjeto(form: FormData) {
  const id = Number(form.get('projetoId'))
  const texto = String(form.get('inicio') ?? '').trim()
  if (!id || !texto) return

  // O campo de data devolve "2026-09-10". Sem hora, o navegador assume UTC e a
  // data pode voltar um dia em São Paulo; o meio-dia evita isso.
  const inicio = new Date(`${texto}T12:00:00`)
  if (Number.isNaN(inicio.getTime())) return

  await prisma.projeto.update({ where: { id }, data: { inicioEm: inicio } })
  revalidatePath(`/projetos/${id}`)
  revalidatePath('/projetos')
  revalidatePath('/painel')
}

/** A prioridade que ELE mandou. Campo vazio devolve a decisão ao sistema. */
export async function definirPrioridadeDoProjeto(form: FormData) {
  const id = Number(form.get('projetoId'))
  const bruto = String(form.get('prioridade') ?? '').trim()
  if (!id) return

  const n = Number(bruto)
  // Vazio é "volte a calcular", e não "prioridade zero". A diferença importa.
  const prioridade = bruto === '' || !Number.isFinite(n) ? null : Math.max(0, Math.min(100, Math.round(n)))

  await prisma.projeto.update({ where: { id }, data: { prioridade } })
  revalidatePath('/prioridades')
  revalidatePath('/projetos')
  revalidatePath('/painel')
}

/** Os pesos da régua de prioridade. Mesma tabela config do mostrador. */
export async function salvarPesosPrioridade(form: FormData) {
  for (const campo of CAMPOS_PRIORIDADE) {
    const n = Number(form.get(campo.chave))
    if (!Number.isFinite(n)) continue
    const valor = String(Math.max(0, Math.min(100, Math.round(n))))
    await prisma.config.upsert({
      where: { chave: campo.chave },
      create: { chave: campo.chave, valor },
      update: { valor },
    })
  }
  revalidatePath('/prioridades')
  revalidatePath('/projetos')
  revalidatePath('/painel')
}

/**
 * Editar o projeto na mão.
 *
 * O Lucian em 10/09/2026: "o nome dos projetos eu posso mudar, entendeu?".
 * Podia não - todo projeto nascia do script ou do ditado e ficava congelado.
 *
 * Valor e prazo de recebimento entram na mesma tela de propósito: são os dois
 * números que faltam para a régua de prioridade parar de empatar todo mundo.
 *
 * A REGRA QUE PROTEGE O QUE JÁ ANDOU: trocar o tipo ou as condições refaz a
 * WBS inteira, e refazer apaga pacote fechado. Então isso só acontece quando
 * NADA foi fechado ainda. Com trabalho concluído, o resto é salvo e a troca é
 * recusada com o motivo - melhor recusar do que apagar história em silêncio.
 */
export async function editarProjeto(form: FormData) {
  const id = Number(form.get('projetoId'))
  if (!id) return

  const projeto = await prisma.projeto.findUnique({ where: { id }, include: { frentes: true } })
  if (!projeto) return

  const texto = (c: string) => {
    const v = String(form.get(c) ?? '').trim()
    return v === '' ? null : v
  }
  const numero = (c: string) => {
    const v = String(form.get(c) ?? '').trim()
    if (v === '') return null
    const n = Number(v.replace(/\./g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  const nome = texto('nome')
  const tipoNovo = String(form.get('tipo') ?? projeto.tipo) as TipoProjeto
  const materiaPrimaNossa = form.get('materiaPrimaNossa') === 'on'
  const temRevestimento = form.get('temRevestimento') === 'on'

  const correnteMudou =
    tipoNovo !== projeto.tipo ||
    materiaPrimaNossa !== projeto.materiaPrimaNossa ||
    temRevestimento !== projeto.temRevestimento

  const temFechado = projeto.frentes.some((f) => f.status === 'fechada')

  await prisma.projeto.update({
    where: { id },
    data: {
      nome: nome ?? projeto.nome,
      cliente: texto('cliente'),
      valorEstimado: numero('valorEstimado'),
      prazoRecebimentoDias: numero('prazoRecebimentoDias'),
      probabilidade: numero('probabilidade'),
      // A corrente só muda quando não há nada fechado para perder.
      ...(correnteMudou && !temFechado
        ? { tipo: tipoNovo, materiaPrimaNossa, temRevestimento }
        : {}),
    },
  })

  if (correnteMudou && !temFechado) {
    await prisma.frente.deleteMany({ where: { projetoId: id } })
    const areas = new Map((await prisma.area.findMany()).map((a) => [a.chave, a]))
    for (const p of correnteDoProjeto(tipoNovo, { materiaPrimaNossa, temRevestimento })) {
      const area = areas.get(p.area)
      if (!area) continue
      await prisma.frente.create({
        data: {
          titulo: p.pacote,
          areaId: area.id,
          projetoId: id,
          status: 'planejada',
          ordem: p.ordem,
          pacote: p.pacote,
          etapa: p.etapa,
          diasEstimados: p.dias,
          aguardandoQuem: p.quemSegura,
          tarefas: { create: p.tarefas.map((t) => ({ titulo: t })) },
        },
      })
    }
  }

  revalidatePath(`/projetos/${id}`)
  revalidatePath('/projetos')
  revalidatePath('/prioridades')
  revalidatePath('/painel')

  if (correnteMudou && temFechado) {
    redirect(`/projetos/${id}?corrente=travada`)
  }
}

/**
 * Quanto deste pacote já andou.
 *
 * O tique põe 100 e fecha; digitar 100 faz a mesma coisa. São dois caminhos
 * para o mesmo lugar, e não dois estados diferentes - se fossem, existiria
 * pacote "100% mas aberto", que ninguém saberia explicar.
 *
 * Fechar carimba a data REAL, que é o que permite comparar com a linha de
 * base depois. Sem isso a acuracidade nunca teria o que medir.
 */
export async function marcarPacote(form: FormData) {
  const frenteId = Number(form.get('frenteId'))
  if (!frenteId) return

  const frente = await prisma.frente.findUnique({ where: { id: frenteId } })
  if (!frente) return

  const tique = form.get('tique') === '1'
  const bruto = String(form.get('percentual') ?? '').trim()
  const digitado = Number(bruto)

  let pct: number
  if (tique) {
    // O tique alterna: pacote fechado volta a zero, para corrigir engano.
    pct = frente.status === 'fechada' ? 0 : 100
  } else {
    pct = Number.isFinite(digitado) ? Math.max(0, Math.min(100, Math.round(digitado))) : frente.percentual
  }

  const fechou = pct >= 100
  const agora = new Date()

  await prisma.frente.update({
    where: { id: frenteId },
    data: {
      percentual: pct,
      status: fechou ? 'fechada' : frente.status === 'fechada' ? 'planejada' : frente.status,
      fechadaEm: fechou ? (frente.fechadaEm ?? agora) : null,
      // A data real: começou quando saiu do zero, terminou quando chegou a 100.
      realInicioEm: pct > 0 ? (frente.realInicioEm ?? agora) : null,
      realFimEm: fechou ? (frente.realFimEm ?? agora) : null,
      ultimoMovimentoEm: agora,
    },
  })

  if (frente.projetoId) revalidatePath(`/projetos/${frente.projetoId}`)
  revalidatePath('/projetos')
  revalidatePath('/painel')
  revalidatePath('/producao')
}

/**
 * Marcar um compromisso.
 *
 * O caso que o Lucian descreveu é curto e tem que ser rápido: ele acertou a
 * reunião pelo WhatsApp e precisa lançar antes de esquecer. Por isso o
 * formulário tem seis campos e nenhum obrigatório além do essencial.
 *
 * Hora local: o campo devolve "09:00" sem fuso, e o servidor da Vercel roda em
 * UTC. Montar a data com o texto cru marcaria três horas cedo.
 */
export async function marcarCompromisso(form: FormData) {
  const titulo = String(form.get('titulo') ?? '').trim()
  const dia = String(form.get('dia') ?? '').trim()
  const hora = String(form.get('hora') ?? '09:00').trim()
  if (!titulo || !dia) return

  const minutos = Number(form.get('minutos')) || 60
  const projetoId = Number(form.get('projetoId')) || null
  const local = String(form.get('local') ?? '').trim() || null

  // -03:00 explícito: São Paulo não tem mais horário de verão desde 2019.
  const inicio = new Date(`${dia}T${hora}:00-03:00`)
  if (Number.isNaN(inicio.getTime())) return
  const fim = new Date(inicio.getTime() + minutos * 60000)

  await prisma.compromisso.create({
    data: { titulo, inicio, fim, local, projetoId },
  })

  revalidatePath('/agenda')
  revalidatePath('/painel')
}

/**
 * Colar a transcrição de uma reunião e deixar o Jarvis extrair a qualificação.
 *
 * Três coisas acontecem, e a ordem importa:
 *
 * 1. A TRANSCRIÇÃO CRUA É GUARDADA primeiro, no banco de conhecimento. Se a
 *    extração falhar, o material não se perde - foi ele quem decidiu que a
 *    base de conhecimento mora aqui e não no Obsidian.
 * 2. A IA extrai, COPIANDO trecho do cliente. Ver src/lib/transcricao.ts.
 * 3. Campo que já tinha conteúdo NÃO é sobrescrito. O que ele escreveu à mão
 *    vale mais do que o que a máquina achou, e perder isso silenciosamente
 *    seria a pior forma de ajudar.
 */
export async function lerTranscricao(form: FormData) {
  const projetoId = Number(form.get('projetoId'))
  const texto = String(form.get('transcricao') ?? '').trim()
  if (!projetoId || texto.length < 80) return

  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } })
  if (!projeto) return

  const quando = new Date().toLocaleDateString('pt-BR')
  await prisma.conhecimento.create({
    data: {
      titulo: `Reunião ${projeto.nome} - ${quando}`,
      categoria: 'reuniao',
      conteudo: texto,
      tags: projeto.cliente ?? null,
    },
  })

  const spin = await extrairSpin(texto)
  if (!spin) {
    redirect(`/projetos/${projetoId}?transcricao=sem-chave`)
  }

  await prisma.projeto.update({
    where: { id: projetoId },
    data: {
      // `??` e não sobrescrita: o que ele escreveu à mão manda.
      situacao: projeto.situacao?.trim() ? projeto.situacao : spin.situacao,
      problema: projeto.problema?.trim() ? projeto.problema : spin.problema,
      implicacao: projeto.implicacao?.trim() ? projeto.implicacao : spin.implicacao,
      necessidade: projeto.necessidade?.trim() ? projeto.necessidade : spin.necessidade,
    },
  })

  // Decisor novo entra; decisor que já existe fica como está.
  const jaTem = new Set(
    (await prisma.decisor.findMany({ where: { projetoId } })).map((d) => d.nome.toLowerCase()),
  )
  for (const d of spin.decisores) {
    if (!d.nome?.trim() || jaTem.has(d.nome.trim().toLowerCase())) continue
    await prisma.decisor.create({
      data: {
        projetoId,
        nome: d.nome.trim(),
        cargo: d.cargo ?? null,
        oQueDoiParaEle: d.oQueDoiParaEle ?? null,
      },
    })
  }

  if (spin.resumo.trim()) {
    await prisma.conhecimento.create({
      data: {
        titulo: `Resumo da reunião ${projeto.nome} - ${quando}`,
        categoria: 'resumo',
        conteudo:
          spin.resumo +
          (spin.perguntasQueFaltam.length
            ? `\n\nO que ficou sem resposta:\n- ${spin.perguntasQueFaltam.join('\n- ')}`
            : ''),
        tags: projeto.cliente ?? null,
      },
    })
  }

  revalidatePath(`/projetos/${projetoId}`)
  revalidatePath('/playbook')
  redirect(`/projetos/${projetoId}?transcricao=ok`)
}

/**
 * Montar o plano de amanhã.
 *
 * Custa em torno de US$ 0,13 por vez, e por isso fica gravado: `sintese`
 * guarda o texto, e a tela lê de lá quantas vezes quiser. Gerar de novo é uma
 * decisão dele, e não um efeito colateral de abrir a página.
 */
export async function gerarPlanoDoDia(form: FormData) {
  const foco = String(form.get('foco') ?? '').trim()
  await fazerPlanoDoDia(foco || undefined)
  revalidatePath('/agenda')
}
