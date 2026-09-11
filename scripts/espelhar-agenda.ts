// A AGENDA DO GOOGLE ESPELHADA NO JARVIS.
//
// O Lucian em 11/09/2026: "quando eu trago uma reunião e eu travo uma reunião
// na agenda, é via agenda e acabou. Então o Jarvis só lê a minha agenda. O que
// eu quero é que ele coloque o que ele leu lá da agenda na do Jarvis, só pra
// meio que espelhar o que já está no Google."
//
// ESPELHO, E NÃO CÓPIA EDITÁVEL. Quem manda é o Google: o que vem de lá entra
// marcado, e uma nova sincronização substitui. Se alguém editasse o espelho
// aqui, na sincronização seguinte a edição sumiria - e sumir em silêncio é o
// pior defeito que um sistema de agenda pode ter.
//
// POR QUE UM SCRIPT E NÃO O APLICATIVO: o app na Vercel não tem credencial do
// Google, e conseguir uma exige autorização que só ele pode dar. Este script
// roda daqui, onde a conexão já existe e ele já autorizou. É a ponte enquanto
// a ponte definitiva não existe.

import { prisma } from '../src/lib/prisma'

export type EventoDoGoogle = {
  id: string
  titulo: string
  inicio: string
  fim: string
  local?: string | null
}

/** O que veio do Google carrega a marca na frente, para nunca ser confundido
    com o que ele marcou aqui dentro. */
const MARCA = '[Google]'

export async function espelhar(eventos: EventoDoGoogle[]) {
  if (eventos.length === 0) {
    console.log('nenhum evento para espelhar')
    return
  }

  const datas = eventos.map((e) => new Date(e.inicio).getTime())
  const de = new Date(Math.min(...datas))
  de.setHours(0, 0, 0, 0)
  const ate = new Date(Math.max(...datas))
  ate.setHours(23, 59, 59, 999)

  // Limpa só o espelho da faixa que está sendo sincronizada. Compromisso que
  // ele marcou no Jarvis não tem a marca e sobrevive.
  const apagados = await prisma.compromisso.deleteMany({
    where: { inicio: { gte: de, lte: ate }, titulo: { startsWith: MARCA } },
  })

  for (const e of eventos) {
    await prisma.compromisso.create({
      data: {
        titulo: `${MARCA} ${e.titulo}`,
        inicio: new Date(e.inicio),
        fim: new Date(e.fim),
        local: e.local ?? null,
      },
    })
  }

  console.log(`${apagados.count} espelhos antigos removidos`)
  console.log(`${eventos.length} eventos espelhados, de ${de.toLocaleDateString('pt-BR')} a ${ate.toLocaleDateString('pt-BR')}`)
}

// A semana real dele, lida da agenda pessoal em 11/09/2026.
const EVENTOS: EventoDoGoogle[] = [
  { id: 'g1', titulo: 'Cross Training', inicio: '2026-09-11T06:30:00-03:00', fim: '2026-09-11T08:35:00-03:00', local: 'CT Felipe Vella' },
  { id: 'g2', titulo: 'Sapo do dia', inicio: '2026-09-11T08:30:00-03:00', fim: '2026-09-11T09:30:00-03:00' },
  { id: 'g3', titulo: 'Focus time', inicio: '2026-09-11T09:30:00-03:00', fim: '2026-09-11T12:00:00-03:00' },
  { id: 'g4', titulo: 'Almoço', inicio: '2026-09-11T12:00:00-03:00', fim: '2026-09-11T13:00:00-03:00' },
  { id: 'g5', titulo: 'Almoço', inicio: '2026-09-11T13:30:00-03:00', fim: '2026-09-11T14:00:00-03:00' },
  { id: 'g6', titulo: 'Focus time', inicio: '2026-09-11T14:00:00-03:00', fim: '2026-09-11T15:30:00-03:00' },
  { id: 'g7', titulo: 'Check-in com o Jarvis', inicio: '2026-09-11T16:00:00-03:00', fim: '2026-09-11T16:30:00-03:00' },

  { id: 'g8', titulo: 'Almoço', inicio: '2026-09-12T13:30:00-03:00', fim: '2026-09-12T14:00:00-03:00' },
  { id: 'g9', titulo: 'Almoço', inicio: '2026-09-13T13:30:00-03:00', fim: '2026-09-13T14:00:00-03:00' },

  { id: 'g10', titulo: 'Cross Training', inicio: '2026-09-14T06:30:00-03:00', fim: '2026-09-14T08:35:00-03:00', local: 'CT Felipe Vella' },
  { id: 'g11', titulo: 'Sapo do dia', inicio: '2026-09-14T08:30:00-03:00', fim: '2026-09-14T09:30:00-03:00' },
  { id: 'g12', titulo: 'Almoço', inicio: '2026-09-14T12:00:00-03:00', fim: '2026-09-14T13:00:00-03:00' },
  { id: 'g13', titulo: 'Almoço', inicio: '2026-09-14T13:30:00-03:00', fim: '2026-09-14T14:00:00-03:00' },
  { id: 'g14', titulo: 'Focus time', inicio: '2026-09-14T14:00:00-03:00', fim: '2026-09-14T18:00:00-03:00' },
  { id: 'g15', titulo: 'Tempo com a família', inicio: '2026-09-14T21:00:00-03:00', fim: '2026-09-14T21:15:00-03:00' },

  { id: 'g16', titulo: 'Sapo do dia', inicio: '2026-09-15T08:30:00-03:00', fim: '2026-09-15T09:30:00-03:00' },
  { id: 'g17', titulo: 'Focus time', inicio: '2026-09-15T09:30:00-03:00', fim: '2026-09-15T12:00:00-03:00' },
  { id: 'g18', titulo: 'Almoço', inicio: '2026-09-15T12:00:00-03:00', fim: '2026-09-15T13:00:00-03:00' },
  { id: 'g19', titulo: 'Almoço', inicio: '2026-09-15T13:30:00-03:00', fim: '2026-09-15T14:00:00-03:00' },
  { id: 'g20', titulo: 'Bloco Visionário - processo e equipe', inicio: '2026-09-15T14:00:00-03:00', fim: '2026-09-15T16:00:00-03:00' },
  { id: 'g21', titulo: 'Focus time', inicio: '2026-09-15T16:00:00-03:00', fim: '2026-09-15T17:30:00-03:00' },
  { id: 'g22', titulo: 'Tempo com a família', inicio: '2026-09-15T21:00:00-03:00', fim: '2026-09-15T21:15:00-03:00' },

  { id: 'g23', titulo: 'Cross Training', inicio: '2026-09-16T06:30:00-03:00', fim: '2026-09-16T08:35:00-03:00', local: 'CT Felipe Vella' },
  { id: 'g24', titulo: 'Sapo do dia', inicio: '2026-09-16T08:30:00-03:00', fim: '2026-09-16T09:30:00-03:00' },
  { id: 'g25', titulo: 'Almoço', inicio: '2026-09-16T12:00:00-03:00', fim: '2026-09-16T13:00:00-03:00' },
  { id: 'g26', titulo: 'Almoço', inicio: '2026-09-16T13:30:00-03:00', fim: '2026-09-16T14:00:00-03:00' },
  { id: 'g27', titulo: 'Focus time', inicio: '2026-09-16T14:00:00-03:00', fim: '2026-09-16T18:00:00-03:00' },
  { id: 'g28', titulo: 'Sessão terapia', inicio: '2026-09-16T18:00:00-03:00', fim: '2026-09-16T19:30:00-03:00' },
  { id: 'g29', titulo: 'Tempo com a família', inicio: '2026-09-16T21:00:00-03:00', fim: '2026-09-16T21:15:00-03:00' },

  { id: 'g30', titulo: 'Sapo do dia', inicio: '2026-09-17T08:30:00-03:00', fim: '2026-09-17T09:30:00-03:00' },
]

espelhar(EVENTOS)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
