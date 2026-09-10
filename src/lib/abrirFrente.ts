import { prisma } from './prisma'

/**
 * COMECAR A TRABALHAR E ABRIR A FRENTE.
 *
 * Bug encontrado em 10/09/2026: dava para ligar o cronometro numa tarefa de um
 * pacote de WBS ainda PLANEJADO. O tempo era contado, mas o painel mostrava
 * "0 frentes abertas" - o sistema contando hora e negando que houvesse trabalho
 * na mesma tela.
 *
 * A regra e simples: se voce esta trabalhando nisso, isso esta aberto. O
 * limite de WIP nao bloqueia aqui de proposito - travar alguem que JA comecou
 * e chegar tarde demais. A frente abre, e o estouro do limite aparece na tela
 * de Frentes, que e onde a decisao de fechar alguma coisa e tomada.
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
      descricao: 'aberta automaticamente ao comecar o cronometro',
    },
  })
}
