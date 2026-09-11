// DITADO: quando o Lucian não está dizendo "estou fazendo X", e sim DITANDO
// TRABALHO NOVO.
//
// O caso que revelou a falta (10/09/2026), na voz dele:
//
//   "o motoboy tem que buscar as peças na usinagem do Dennis. Depois eu analiso
//    a qualidade e mando pro banho na Soriel, da Jaqueline. Quando ficar pronto
//    eu coleto, valido, embalo, e marco uma visita na Riachuelo para entregar -
//    que já e visita comercial. E tem peças em Santo Andre na Draco Laser."
//
// A comparacao por palavras (casar.ts) nao tinha o que casar: nenhuma dessas
// frentes existia. Ela respondeu "não tenho certeza de qual frente e", que é o
// pior tipo de resposta - tecnicamente correta e completamente inútil.
//
// Aqui a IA GANHA O DIREITO DE CRIAR: área, frente, projeto, tarefas em ordem,
// e prazo. E o único lugar do sistema onde ela escreve estrutura, e e onde vale
// pagar por isso - ditar uma cadeia de logística a mão levaria dez minutos.
//
// O QUE ELA CONTINUA NÃO PODENDO FAZER:
// - inventar cliente, valor ou data que nao foram ditos;
// - mexer em frente que ja existe sem ser mandada;
// - decidir prioridade - isso é conta, e a conta e feita em agora.ts.

import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'
import { hojeSP } from './datas'
import { textoParaIa } from './etapas'

// MODELO PEQUENO, decidido por medição em 10/09/2026.
//
// Comparados na mesma frase real (Trava Clinker + Batoque do Logimat):
//   sonnet  US$ 0,0098  6,1s
//   haiku   US$ 0,0018  3,1s   <- 5x mais barato, 2x mais rapido
//
// E o pequeno acertou tudo: separou os dois projetos, marcou como JA FEITA a
// conferência da usinagem, deixou as peças do Clinker pendentes. Organizar
// ditado em JSON e extracao estruturada, não raciocinio difícil - o modelo
// grande estava sendo pago para fazer trabalho de modelo pequeno.
//
// Se algum dia a qualidade cair, e só voltar para 'claude-sonnet-5' aqui e
// ajustar PRECO para { entrada: 3, saida: 15 }.
const MODELO = 'claude-haiku-4-5-20251001'
const PRECO = { entrada: 1, saida: 5 }

export type PlanoDitado = {
  entendi: string
  frentes: {
    titulo: string
    area: string
    etapa?: string | null
    projeto?: string | null
    cliente?: string | null
    tarefas: { titulo: string; venceEm?: string | null; feita?: boolean; minutos?: number | null }[]
  }[]
  compromissos: { titulo: string; data: string; inicio: string; fim: string; local?: string | null }[]
  comecarAgora?: string | null
  /** id de tarefa que já existe e que ele quer começar agora */
  tarefaExistenteId?: number | null
}

const INSTRUCAO = `Voce organiza o trabalho ditado pelo Lucian, dono da KGFM - integradora de automacao intralogistica em Guarulhos. Ele fala rapido, misturando varias coisas na mesma frase, e voce transforma isso em estrutura.

Responda SÓ com JSON, sem texto em volta:

{
  "entendi": "uma frase curta dizendo o que você entendeu",
  "frentes": [
    {
      "titulo": "nome curto do assunto",
      "area": "comercial|engenharia|producao|adm",
      "etapa": "a etapa dentro da área, da lista abaixo",
      "projeto": "nome do projeto, se ele citou" ou null,
      "cliente": "nome do cliente, se ele citou" ou null,
      "tarefas": [ { "titulo": "acao concreta", "venceEm": "AAAA-MM-DD" ou null, "feita": true se ele disse que JA foi feita, "minutos": quanto durou se ele disse, ou null } ]
    }
  ],
  "compromissos": [ { "titulo": "", "data": "AAAA-MM-DD", "inicio": "HH:MM", "fim": "HH:MM", "local": "" ou null } ],
  "comecarAgora": "titulo exato de uma tarefa que ele já está fazendo agora" ou null,
  "tarefaExistenteId": número da tarefa que JA EXISTE e que ele está começando agora, ou null
}

ETAPAS DENTRO DE CADA AREA (escolha uma, sempre):
{{ETAPAS}}

COMO DECIDIR A ÁREA:
- produção: buscar, coletar, transportar, usinagem, tratamento, banho, galvânica, fabricação, montagem, conferência de qualidade, embalagem, motoboy, fornecedor de peça.
- engenharia: projeto, detalhamento, layout, dimensionamento, lista de materiais, desenho.
- comercial: prospecção, visita a cliente, proposta, negociação, cotacao, relacionamento.
- adm: nota fiscal, cobranca, contrato, financeiro, cadastro, documento.

REGRAS QUE NÃO SE QUEBRAM:
- TODO trabalho de produção e engenharia PERTENCE A UM PROJETO. Se ele citar o
  nome ("batoque do Logimat", "trava do Clinker"), use como projeto. Se falar de
  peça, usinagem, banho ou entrega sem dizer o projeto, use o projeto que já
  existe com essa peca; se nao existir nenhum, crie com o nome da peca. Projeto e
  a espinha: e por ele que as horas se somam no fim.
- Uma frente por ASSUNTO, não uma por tarefa. Uma sequência de logística do
  mesmo lote e UMA frente com varias tarefas em ordem.
- REAPROVEITAR FRENTE EXISTENTE E EXCECAO, não regra: só quando for literalmente
  o mesmo assunto, com as mesmas pessoas ou o mesmo lote. Assunto novo pede
  frente nova. Encaixar tarefa nova num pacote generico que já existe faz o
  trabalho sumir de vista.
- SE ELE ESTA COMECANDO ALGO QUE JA EXISTE, não crie de novo: devolva o número
  em "tarefaExistenteId". Ele não vai repetir o titulo exato - vai dizer "estou
  fazendo a logística das peças pra trazer da usinagem" e a tarefa se chama
  "Logística de retorno da usinagem". E a mesma coisa. Case pelo sentido.
- SE ELE DISSE QUE ALGO JA FOI FEITO ("já foi conferido", "ja busquei", "isso
  ja esta ok"), a tarefa entra com "feita": true. Se ele nao disser quanto
  durou, use 30 minutos - o registro aproximado vale mais que registro nenhum.
- As tarefas ficam na ORDEM em que acontecem.
- Se uma acao serve a dois fins (entregar peca e visitar o cliente), ela vira
  UMA tarefa e você escreve os dois fins no titulo.
- NÃO invente cliente, valor, endereco nem data que ele não disse.
- "hoje a tarde", "amanha", "semana passada" viram data real a partir de hoje.
- Título de tarefa é ação curta: começa com verbo. Nomes de pessoa e empresa que
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
    `Áreas: ${areas.map((a) => a.chave).join(', ')}.`,
    frentes.length
      ? [
          'Frentes que já existem (só reuse se for LITERALMENTE o mesmo assunto; na duvida, crie nova):',
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
    // 1200 cortava o JSON no meio numa cadeia de logística com varias tarefas,
    // e o parse falhava sem dizer por que. Plano longo precisa de espaço.
    max_tokens: 4000,
    system: `${INSTRUCAO.replace('{{ETAPAS}}', textoParaIa())}\n\n${contexto}`,
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

export type Criado = {
  linhas: string[]
  tarefaParaComecar: number | null
  /**
   * A PRIMEIRA TAREFA ABERTA DO PLANO, para o relogio ter onde cair.
   *
   * O modelo so preenche `comecarAgora` quando ele diz o titulo com todas as
   * letras, e quase nunca diz. Em 11/09/2026 isso deixou o dia inteiro sem
   * medicao: duas frentes criadas, zero apontamento. Quando ele avisa que esta
   * FAZENDO, alguma coisa tem que estar rodando - e a primeira da fila e o
   * palpite honesto, com trocar a um toque na barra.
   */
  primeiraAberta: number | null
}

/** Grava o plano. Reusa frente que já existe com o mesmo titulo, nunca duplica. */
export async function gravarDitado(plano: PlanoDitado): Promise<Criado> {
  const linhas: string[] = []
  let tarefaParaComecar: number | null = null
  let primeiraAberta: number | null = null

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
        data: { titulo: f.titulo, areaId: area.id, projetoId, status: 'aberta', etapa: f.etapa ?? null },
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
      if (jaTem) {
        // Repetida não vira tarefa nova, mas continua servindo de alvo para o
        // relógio: ele pode estar recomeçando o que já existia.
        primeiraAberta ??= jaTem.id
        continue
      }

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
        // Tarefa que ele DISSE que já foi feita entra com o tempo lancado, e
        // marcada como revisar: e registro aproximado, lembrado depois - não
        // cronometrado na hora. Sem isso o projeto nasce sem histórico e as
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
        primeiraAberta ??= nova.id
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

  return { linhas, tarefaParaComecar, primeiraAberta }
}
