// A SEMANA EM ARQUIVO DE CALENDÁRIO.
//
// O Lucian em 10/09/2026: "ele já tem de ter botão pra gerar a semana no
// Google Calendar".
//
// A ligação direta com o Google depende de uma autorização que só ele pode
// dar, e eu não invento credencial. Mas existe um caminho que funciona HOJE e
// não depende de ninguém: o formato iCalendar, que o Google Calendar importa,
// e o iPhone e o Outlook também. Um arquivo, um toque, os compromissos entram.
//
// É pior que a ligação direta em uma coisa só: não sincroniza de volta. Mudou
// no Google, o Jarvis não fica sabendo. Para o uso dele - marcar aqui e ver
// lá - isso resolve, e resolve sem esperar.
//
// TRÊS DETALHES QUE FAZEM O ARQUIVO SER ACEITO:
// 1. As linhas terminam em CRLF. O padrão exige, e o Google recusa em silêncio
//    quando não tem - é o erro mais comum de quem gera .ics à mão.
// 2. Data em UTC com Z no fim. São Paulo não tem horário de verão desde 2019,
//    mas quem lê o arquivo pode estar em outro fuso.
// 3. UID estável por compromisso, para reimportar ATUALIZAR em vez de duplicar.

import { prisma } from '@/lib/prisma'
import { temSessao } from '@/lib/sessao'
import { FUSO } from '@/lib/datas'

export const dynamic = 'force-dynamic'

function utc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Vírgula, ponto e vírgula e quebra de linha têm significado no formato. */
function escapar(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Nenhuma linha pode passar de 75 octetos; o resto continua com um espaço. */
function dobrar(linha: string): string {
  if (linha.length <= 73) return linha
  const partes: string[] = [linha.slice(0, 73)]
  let resto = linha.slice(73)
  while (resto.length > 72) {
    partes.push(' ' + resto.slice(0, 72))
    resto = resto.slice(72)
  }
  partes.push(' ' + resto)
  return partes.join('\r\n')
}

export async function GET(request: Request) {
  if (!(await temSessao())) {
    return new Response('Entre no Jarvis antes.', { status: 401 })
  }

  // Duas semanas: a corrente e a seguinte. Importar só a semana atual obriga
  // a repetir a operação na segunda-feira, e ninguém lembra.
  const agora = new Date()
  const hojeTexto = agora.toLocaleDateString('en-CA', { timeZone: FUSO })
  const hoje = new Date(`${hojeTexto}T00:00:00`)
  const diaDaSemana = (hoje.getDay() + 6) % 7
  const segunda = new Date(hoje)
  segunda.setDate(segunda.getDate() - diaDaSemana)
  const fim = new Date(segunda)
  fim.setDate(fim.getDate() + 14)

  const compromissos = await prisma.compromisso.findMany({
    where: { inicio: { gte: segunda, lt: fim } },
    orderBy: { inicio: 'asc' },
  })

  // O nome do projeto vem numa consulta à parte: `Compromisso` guarda o id mas
  // não declara a relação no schema, então `include` não existe aqui. São oito
  // projetos - buscar todos e casar na memória é mais barato que uma consulta
  // por compromisso.
  const projetos = new Map(
    (await prisma.projeto.findMany({ select: { id: true, nome: true, cliente: true } })).map((p) => [
      p.id,
      `Projeto: ${p.nome}${p.cliente ? ` - ${p.cliente}` : ''}`,
    ]),
  )

  const linhas: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KGFM//Jarvis//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jarvis KGFM',
  ]

  for (const c of compromissos) {
    const descricao = [
      c.projetoId ? projetos.get(c.projetoId) ?? null : null,
      'Lançado pelo Jarvis KGFM.',
    ]
      .filter(Boolean)
      .join('\n')

    linhas.push(
      'BEGIN:VEVENT',
      `UID:jarvis-${c.id}@kgfm`,
      `DTSTAMP:${utc(new Date())}`,
      `DTSTART:${utc(c.inicio)}`,
      `DTEND:${utc(c.fim)}`,
      dobrar(`SUMMARY:${escapar(c.titulo)}`),
      dobrar(`DESCRIPTION:${escapar(descricao)}`),
      ...(c.local ? [dobrar(`LOCATION:${escapar(c.local)}`)] : []),
      'END:VEVENT',
    )
  }

  linhas.push('END:VCALENDAR')

  return new Response(linhas.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="jarvis-kgfm.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
