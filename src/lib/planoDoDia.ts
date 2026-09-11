// O PLANO DE AMANHÃ.
//
// Pedido do Lucian em 10/09/2026: "gerar o planejamento do dia de amanhã com
// tudo que ele sabe, começando às 8h, usando inteligência de consultor de
// administração de tempo e agenda, ponderado pelas nossas prioridades".
//
// O check-in semanal já existia; o dia não. E são coisas diferentes: a semana
// escolhe TEMAS, o dia escolhe HORÁRIOS. Um plano de dia que não diz a hora
// não é plano, é lista de desejos.
//
// TRÊS COISAS QUE ESTE MÓDULO FAZ E O SEMANAL NÃO FAZIA:
//
// 1. CONTA A HORA DELE, e não o prazo do projeto. É a diferença entre
//    `minutosEstimados` e `diasEstimados` - cinco dias de fornecedor não
//    ocupam a agenda dele, meia hora de logística ocupa.
// 2. ORDENA PELA RÉGUA DE PRIORIDADE, que é a régua do caixa. O que entra no
//    dia é o que traz dinheiro mais cedo, e não o que grita mais alto.
// 3. DESCONTA O QUE JÁ ESTÁ MARCADO. Agenda cheia com bloco profundo por cima
//    de compromisso é plano que já nasce furado.

import { prisma } from './prisma'
import { carteiraDeProjetos } from './projetos'
import { FUSO } from './datas'
import { horasCurtas } from './cronograma'

export type DiaSeguinte = {
  data: Date
  rotulo: string
  ehDiaUtil: boolean
  compromissos: { hora: string; titulo: string; local: string | null; minutos: number }[]
  minutosComprometidos: number
}

/** O retrato do dia seguinte, antes de qualquer opinião. */
export async function montarDiaSeguinte(agora: Date = new Date()): Promise<DiaSeguinte> {
  const hojeTexto = agora.toLocaleDateString('en-CA', { timeZone: FUSO })
  const amanha = new Date(`${hojeTexto}T12:00:00`)
  amanha.setDate(amanha.getDate() + 1)

  const inicio = new Date(amanha)
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(amanha)
  fim.setHours(23, 59, 59, 999)

  const compromissos = await prisma.compromisso.findMany({
    where: { inicio: { gte: inicio, lte: fim } },
    orderBy: { inicio: 'asc' },
  })

  const diaDaSemana = amanha.getDay()

  return {
    data: amanha,
    rotulo: amanha.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      timeZone: FUSO,
    }),
    ehDiaUtil: diaDaSemana >= 1 && diaDaSemana <= 5,
    compromissos: compromissos.map((c) => ({
      hora: c.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO }),
      titulo: c.titulo,
      local: c.local,
      minutos: Math.round((c.fim.getTime() - c.inicio.getTime()) / 60000),
    })),
    minutosComprometidos: compromissos.reduce(
      (s, c) => s + (c.fim.getTime() - c.inicio.getTime()) / 60000,
      0,
    ),
  }
}

/**
 * O MATERIAL DO PLANO, em texto, pronto para o modelo ler.
 *
 * Tudo aqui é fato do banco. O modelo escolhe a ordem e o horário; ele não
 * inventa o que existe - essa separação é o que impede o plano de virar
 * ficção bem escrita.
 */
export async function materialDoPlano(agora: Date = new Date()): Promise<string> {
  const dia = await montarDiaSeguinte(agora)
  const carteira = await carteiraDeProjetos()

  const l: string[] = []

  l.push(`AMANHÃ: ${dia.rotulo}${dia.ehDiaUtil ? '' : ' (NÃO é dia útil)'}`)
  l.push(`Começa às 08:00, por decisão dele.`)
  l.push('')

  l.push('JÁ MARCADO NA AGENDA:')
  if (dia.compromissos.length === 0) l.push('- nada. O dia inteiro está livre para blocos.')
  for (const c of dia.compromissos) {
    l.push(`- ${c.hora} (${c.minutos} min) ${c.titulo}${c.local ? ` - ${c.local}` : ''}`)
  }
  l.push('')

  l.push('OS PROJETOS, NA ORDEM DA RÉGUA DE PRIORIDADE (a régua é o caixa):')
  for (const p of carteira) {
    const c = p.cronograma
    const proximo = c.pacotes.find((x) => !x.fechado)
    l.push(
      `- [${p.prioridade.efetiva}] ${p.nome} (${p.cliente ?? 'sem cliente'}, ${p.tipoNome}, ${p.fase}) ` +
        `${p.valorEstimado ? `R$ ${p.valorEstimado.toLocaleString('pt-BR')}` : 'SEM VALOR INFORMADO'}` +
        `${p.prioridade.manual != null ? ' - prioridade definida por ele' : ''}`,
    )
    if (!p.temWbs) {
      l.push('  sem WBS: não há pacote para trabalhar, só existe o nome')
      continue
    }
    l.push(`  progresso ${c.progresso}%, faltam ${horasCurtas(c.minutosRestantes)} de hora DELE na corrente inteira`)
    if (proximo) {
      l.push(
        `  PRÓXIMO PACOTE: ${proximo.pacote} - ${horasCurtas(proximo.minutos)} dele, ` +
          `${proximo.dias} dias de prazo, está com ${proximo.quemSegura.toUpperCase()}`,
      )
    }
    if (c.atrasoMaximo > 0) l.push(`  ATRASADO ${c.atrasoMaximo} dias, e a bola está com ${c.atrasoDe}`)
    if (c.travado) {
      l.push(
        `  TRAVADO: "${c.travado.pacote}" devia ter começado e está parado há ${c.travado.diasParado} dias`,
      )
    }
    if (p.prioridade.faltando.length > 0) {
      l.push(`  falta no cadastro: ${p.prioridade.faltando.join(' e ')}`)
    }
  }

  // Só o que consome a hora DELE entra na conta da agenda. Pacote esperando
  // fornecedor gira sozinho e não disputa horário nenhum.
  const meus = carteira
    .flatMap((p) =>
      p.cronograma.pacotes
        .filter((x) => !x.fechado && x.quemSegura === 'eu' && x.minutos > 0)
        .map((x) => ({ projeto: p.nome, prioridade: p.prioridade.efetiva, pacote: x.pacote, minutos: x.minutos })),
    )
    .sort((a, b) => b.prioridade - a.prioridade)

  l.push('')
  l.push('O QUE DE FATO CONSOME A HORA DELE (pacotes em aberto que dependem DELE):')
  if (meus.length === 0) l.push('- nenhum pacote aberto depende dele. Tudo em aberto está com terceiro ou cliente.')
  for (const m of meus.slice(0, 12)) {
    l.push(`- ${horasCurtas(m.minutos)} · ${m.pacote} · ${m.projeto} [prioridade ${m.prioridade}]`)
  }
  l.push('')
  l.push(
    `SOMA DO QUE DEPENDE DELE NA CARTEIRA INTEIRA: ${horasCurtas(meus.reduce((s, m) => s + m.minutos, 0))}`,
  )

  return l.join('\n')
}
