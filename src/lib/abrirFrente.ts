import { prisma } from './prisma'

/**
 * COMECAR A TRABALHAR E ABRIR A FRENTE.
 *
 * Bug encontrado em 10/09/2026: dava para ligar o cronômetro numa tarefa de um
 * pacote de WBS ainda PLANEJADO. O tempo era contado, mas o painel mostrava
 * "0 frentes abertas" - o sistema contando hora e negando que houvesse trabalho
 * na mesma tela.
 *
 * A regra e simples: se você está trabalhando nisso, isso está aberto. O
 * limite de WIP não bloqueia aqui de propósito - travar alguém que JA começou
 * e chegar tarde demais. A frente abre, e o estouro do limite aparece na tela
 * de Frentes, que é onde a decisão de fechar alguma coisa e tomada.
 */
export async function garantirFrenteAberta(frenteId: number): Promise<void> {
  const f = await prisma.frente.findUnique({ where: { id: frenteId } })
  if (!f || f.status === 'aberta') return

  await prisma.frente.update({
    where: { id: frenteId },
    data: { status: 'aberta', abertaEm: f.abertaEm ?? new Date(), ultimoMovimentoEm: new Date() },
  })
  await prisma.movimento.create({
    data: {
      frenteId,
      tipo: 'ativacao',
      descricao: 'aberta automaticamente ao começar o cronômetro',
    },
  })
}
