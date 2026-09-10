// DITADO: quando o Lucian nao esta dizendo "estou fazendo X", e sim DITANDO
// TRABALHO NOVO.
//
// O caso que revelou a falta (10/09/2026), na voz dele:
//
//   "o motoboy tem que buscar as pecas na usinagem do Dennis. Depois eu analiso
//    a qualidade e mando pro banho na Soriel, da Jaqueline. Quando ficar pronto
//    eu coleto, valido, embalo, e marco uma visita na Riachuelo para entregar -
//    que ja e visita comercial. E tem pecas em Santo Andre na Draco Laser."
//
// A comparacao por palavras (casar.ts) nao tinha o que casar: nenhuma dessas
// frentes existia. Ela respondeu "nao tenho certeza de qual frente e", que e o
// pior tipo de resposta - tecnicamente correta e completamente inutil.
//
// Aqui a IA GANHA O DIREITO DE CRIAR: area, frente, projeto, tarefas em ordem,
// e prazo. E o unico lugar do sistema onde ela escreve estrutura, e e onde vale
// pagar por isso - ditar uma cadeia de logistica a mao levaria dez minutos.
//
// O QUE ELA CONTINUA NAO PODENDO FAZER:
// - inventar cliente, valor ou data que nao foram ditos;
// - mexer em frente que ja existe sem ser mandada;
// - decidir prioridade - isso e conta, e a conta e feita em agora.ts.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { hojeSP } from './datas'

const MODELO = 'claude-sonnet-5'
const PRECO = { entrada: 3, saida: 15 }

export type PlanoDitado = {
  entendi: string
  frentes: {
    titulo: string
    area: string
    projeto?: string | null
    cliente?: string | null
    tarefas: { titulo: string; venceEm?: string | null; feita?: boolean; minutos?: number | null }[]
  }[]
  compromissos: { titulo: string; data: string; inicio: string; fim: string; local?: string | null }[]
  comecarAgora?: string | null
  /** id de tarefa que ja existe e que ele quer comecar agora */
  tarefaExistenteId?: number | null
}

const INSTRUCAO = `Voce organiza o trabalho ditado pelo Lucian, dono da KGFM - integradora de automacao intralogistica em Guarulhos. Ele fala rapido, misturando varias coisas na mesma frase, e voce transforma isso em estrutura.

Responda SO com JSON, sem texto em volta:

{
  "entendi": "uma frase curta dizendo o que voce entendeu",
  "frentes": [
    {
      "titulo": "nome curto do assunto",
      "area": "comercial|engenharia|producao|adm",
      "projeto": "nome do projeto, se ele citou" ou null,
      "cliente": "nome do cliente, se ele citou" ou null,
      "tarefas": [ { "titulo": "acao concreta", "venceEm": "AAAA-MM-DD" ou null, "feita": true se ele disse que JA foi feita, "minutos": quanto durou se ele disse, ou null } ]
    }
  ],
  "compromissos": [ { "titulo": "", "data": "AAAA-MM-DD", "inicio": "HH:MM", "fim": "HH:MM", "local": "" ou null } ],
  "comecarAgora": "titulo exato de uma tarefa que ele ja esta fazendo agora" ou null,
  "tarefaExistenteId": numero da tarefa que JA EXISTE e que ele esta comecando agora, ou null
}

COMO DECIDIR A AREA:
- producao: buscar, coletar, transportar, usinagem, tratamento, banho, galvanica, fabricacao, montagem, conferencia de qualidade, embalagem, motoboy, fornecedor de peca.
- engenharia: projeto, detalhamento, layout, dimensionamento, lista de materiais, desenho.
- comercial: prospeccao, visita a cliente, proposta, negociacao, cotacao, relacionamento.
- adm: nota fiscal, cobranca, contrato, financeiro, cadastro, documento.

REGRAS QUE NAO SE QUEBRAM:
- TODO trabalho de producao e engenharia PERTENCE A UM PROJETO. Se ele citar o
  nome ("batoque do Lojimate", "trava do Clinker"), use como projeto. Se falar de
  peca, usinagem, banho ou entrega sem dizer o projeto, use o projeto que ja
  existe com essa peca; se nao existir nenhum, crie com o nome da peca. Projeto e
  a espinha: e por ele que as horas se somam no fim.
- Uma frente por ASSUNTO, nao uma por tarefa. Uma sequencia de logistica do
  mesmo lote e UMA frente com varias tarefas em ordem.
- REAPROVEITAR FRENTE EXISTENTE E EXCECAO, nao regra: so quando for literalmente
  o mesmo assunto, com as mesmas pessoas ou o mesmo lote. Assunto novo pede
  frente nova. Encaixar tarefa nova num pacote generico que ja existe faz o
  trabalho sumir de vista.
- SE ELE ESTA COMECANDO ALGO QUE JA EXISTE, nao crie de novo: devolva o numero
  em "tarefaExistenteId". Ele nao vai repetir o titulo exato - vai dizer "estou
  fazendo a logistica das pecas pra trazer da usinagem" e a tarefa se chama
  "Logistica de retorno da usinagem". E a mesma coisa. Case pelo sentido.
- SE ELE DISSE QUE ALGO JA FOI FEITO ("ja foi conferido", "ja busquei", "isso
  ja esta ok"), a tarefa entra com "feita": true. Se ele nao disser quanto
  durou, use 30 minutos - o registro aproximado vale mais que registro nenhum.
- As tarefas ficam na ORDEM em que acontecem.
- Se uma acao serve a dois fins (entregar peca e visitar o cliente), ela vira
  UMA tarefa e voce escreve os dois fins no titulo.
- NAO invente cliente, valor, endereco nem data que ele nao disse.
- "hoje a tarde", "amanha", "semana passada" viram data real a partir de hoje.
- Titulo de tarefa e acao curta: comeca com verbo. Nomes de pessoa e empresa que
  ele citar entram no titulo - e assim que ele reconhece depois.`

export async function interpretarDitado(texto: string): Promise<{ plano: PlanoDitado | null; usouIa: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return { plano: null, usouIa: false }

  const [areas, frentes, projetos] = await Promise.all([
    prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.frente.findMany({
      where: { status: { in: ['aberta', 'planejada'] } },
      select: { titulo: true, tarefas: { where: { status: 'aberta' }, select: { id: true, titulo: true } } },
    }),
    prisma.projeto.findMany({ where: { ativo: true }, select: { nome: true, cliente: true } }),
  ])

  const contexto = [
    `Hoje e ${hojeSP()}.`,
    `Areas: ${areas.map((a) => a.chave).join(', ')}.`,
    frentes.length
      ? [
          'Frentes que ja existem (so reuse se for LITERALMENTE o mesmo assunto; na duvida, crie nova):',
          ...frentes.map(
            (f) =>
              `- ${f.titulo}` +
              (f.tarefas.length
                ? `\n    tarefas abertas: ${f.tarefas.map((x) => `#${x.id} ${x.titulo}`).join(' | ')}`
                : ''),
          ),
        ].join('\n')
      : 'Nenhuma frente existe ainda.',
    projetos.length ? `Projetos: ${projetos.map((p) => `${p.nome}${p.cliente ? ` (${p.cliente})` : ''}`).join(' | ')}` : '',
  ].join('\n')

  const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const r = await cliente.messages.create({
    model: MODELO,
    // 1200 cortava o JSON no meio numa cadeia de logistica com varias tarefas,
    // e o parse falhava sem dizer por que. Plano longo precisa de espaco.
    max_tokens: 4000,
    system: `${INSTRUCAO}\n\n${contexto}`,
    messages: [{ role: 'user', content: texto }],
  })

  await prisma.chamadaIa
    .create({
      data: {
        modelo: MODELO,
        finalidade: 'ditado',
        tokensEntrada: r.usage.input_tokens,
        tokensSaida: r.usage.output_tokens,
        custoEstimado: (r.usage.input_tokens / 1e6) * PRECO.entrada + (r.usage.output_tokens / 1e6) * PRECO.saida,
      },
    })
    .catch(() => {})

  const bruto = r.content.find((c) => c.type === 'text')?.text ?? ''
  const achado = bruto.match(/\{[\s\S]*\}/)
  if (!achado) return { plano: null, usouIa: true }

  try {
    return { plano: JSON.parse(achado[0]) as PlanoDitado, usouIa: true }
  } catch {
    return { plano: null, usouIa: true }
  }
}

export type Criado = { linhas: string[]; tarefaParaComecar: number | null }

/** Grava o plano. Reusa frente que ja existe com o mesmo titulo, nunca duplica. */
export async function gravarDitado(plano: PlanoDitado): Promise<Criado> {
  const linhas: string[] = []
  let tarefaParaComecar: number | null = null

  const areas = await prisma.area.findMany()
  const porChave = new Map(areas.map((a) => [a.chave, a]))
  const padrao = areas[0]

  for (const f of plano.frentes ?? []) {
    const area = porChave.get(f.area) ?? padrao
    if (!area) continue

    let projetoId: number | null = null
    if (f.projeto) {
      const existente = await prisma.projeto.findFirst({ where: { nome: f.projeto, ativo: true } })
      projetoId =
        existente?.id ??
        (await prisma.projeto.create({ data: { nome: f.projeto, cliente: f.cliente ?? null, areaId: area.id } })).id
      if (!existente) linhas.push(`projeto: ${f.projeto}`)
    }

    let frente = await prisma.frente.findFirst({
      where: { titulo: f.titulo, status: { in: ['aberta', 'planejada'] } },
    })
    if (!frente) {
      frente = await prisma.frente.create({
        data: { titulo: f.titulo, areaId: area.id, projetoId, status: 'aberta' },
      })
      await prisma.movimento.create({ data: { frenteId: frente.id, tipo: 'abertura', descricao: 'ditada por voz' } })
      linhas.push(`frente: ${f.titulo} [${area.nome}]`)
    } else if (frente.status !== 'aberta') {
      await prisma.frente.update({ where: { id: frente.id }, data: { status: 'aberta' } })
    }

    let ordem = 0
    for (const t of f.tarefas ?? []) {
      const jaTem = await prisma.tarefa.findFirst({
        where: { frenteId: frente.id, titulo: t.titulo, status: 'aberta' },
      })
      if (jaTem) continue

      const nova = await prisma.tarefa.create({
        data: {
          frenteId: frente.id,
          titulo: t.titulo,
          estimativaMin: t.minutos ?? null,
          status: t.feita ? 'feita' : 'aberta',
          concluidaEm: t.feita ? new Date() : null,
        },
      })

      if (t.feita) {
        // Tarefa que ele DISSE que ja foi feita entra com o tempo lancado, e
        // marcada como revisar: e registro aproximado, lembrado depois - nao
        // cronometrado na hora. Sem isso o projeto nasce sem historico e as
        // horas totais nunca fecham com a realidade.
        const minutos = t.minutos && t.minutos > 0 ? t.minutos : 30
        const fim = new Date()
        await prisma.apontamento.create({
          data: {
            tarefaId: nova.id,
            iniciadoEm: new Date(fim.getTime() - minutos * 60000),
            encerradoEm: fim,
            encerradoPor: 'usuario',
            revisar: true,
          },
        })
        await prisma.movimento.create({
          data: { frenteId: frente.id, tipo: 'tarefa-feita', descricao: t.titulo },
        })
        linhas.push(`feita: ${t.titulo} (${minutos} min)`)
      } else {
        linhas.push(`tarefa: ${t.titulo}`)
      }
      ordem++

      if (plano.comecarAgora && t.titulo === plano.comecarAgora) tarefaParaComecar = nova.id
    }

    await prisma.frente.update({ where: { id: frente.id }, data: { ultimoMovimentoEm: new Date() } })
  }

  for (const c of plano.compromissos ?? []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.data) || !/^\d{2}:\d{2}$/.test(c.inicio)) continue
    const inicio = new Date(`${c.data}T${c.inicio}:00-03:00`)
    const fim = new Date(`${c.data}T${(c.fim && /^\d{2}:\d{2}$/.test(c.fim) ? c.fim : c.inicio)}:00-03:00`)
    await prisma.compromisso.create({
      data: {
        titulo: c.titulo,
        inicio,
        fim: fim > inicio ? fim : new Date(inicio.getTime() + 3600_000),
        local: c.local ?? null,
      },
    })
    linhas.push(`compromisso: ${c.titulo} em ${new Date(inicio).toLocaleDateString('pt-BR')}`)
  }

  return { linhas, tarefaParaComecar }
}
