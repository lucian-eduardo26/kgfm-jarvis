'use server'

// Todas as acoes de escrita. Server Actions em vez de rotas de API: e menos
// codigo para a mesma coisa, e o sistema tem um usuario so.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { classificar } from '@/lib/classificador'
import { gravarConfig, voltarAoPadrao } from '@/lib/configuracao'
import { senhaConfere, abrirSessao, fecharSessao } from '@/lib/sessao'
import type { ConfigMostrador } from '@/lib/mostrador'
import { responder, type Fala } from '@/lib/conversa'
import { pacotesDaFase, type FaseWbs } from '@/lib/wbs'
import { executarComando, type ResultadoComando } from '@/lib/comando'
import { fazerCheckin, fazerCheckout } from '@/lib/ritual'

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

/** Captura. Zero campo obrigatorio alem do texto. A IA classifica depois. */
export async function capturar(form: FormData) {
  const bruto = String(form.get('conteudo') ?? '').trim()
  if (!bruto) return
  const origem = (String(form.get('origem') ?? 'texto') as 'texto' | 'voz' | 'imagem') ?? 'texto'

  const item = await prisma.item.create({
    data: { conteudo: bruto, conteudoBruto: bruto, origem },
  })

  // Classificar nunca pode segurar a captura. Se a IA falhar ou nao houver
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
    // silencio de proposito: o item ja esta salvo, que e o que importa
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
 * O cronometro. So UM apontamento aberto no sistema inteiro: comecar outra
 * tarefa encerra a anterior com motivo "troca". O limite de WIP deixa de ser
 * aviso e vira fisica.
 */
export async function iniciarCronometro(form: FormData) {
  const tarefaId = Number(form.get('tarefaId'))
  const agora = new Date()
  await prisma.apontamento.updateMany({
    where: { encerradoEm: null },
    data: { encerradoEm: agora, encerradoPor: 'troca' },
  })
  await prisma.apontamento.create({ data: { tarefaId, iniciadoEm: agora } })
  const t = await prisma.tarefa.findUnique({ where: { id: tarefaId } })
  if (t) await registrarMovimento(t.frenteId, 'cronometro', t.titulo)
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
 * nao roda comando: trava com botao de liberar do lado, na mesma tela.
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
 * Cria o projeto e desdobra a WBS padrao nos quatro setores.
 * Os pacotes nascem PLANEJADOS: a WBS e o plano, o quadro e o agora.
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

  // Ao mudar de fase, os pacotes da fase nova que ainda nao existem sao criados.
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

/** "Jarvis, estou fazendo X" - fala vira cronometro rodando. */
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
