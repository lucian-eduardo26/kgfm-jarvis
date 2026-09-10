// O Jarvis e um projeto da KGFM, com centro de custo de tempo como qualquer
// outro. Decisao do Lucian em 10/09/2026: "se eu estou aqui trocando ideia com
// voce, isso e projeto Jarvis, ele vai entrar".
//
// Sem isso, as horas construindo o sistema desaparecem - e some justamente a
// hora que o proprio briefing chama de armadilha operador/arquiteto.
//
//   npm run jarvis
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const adm = await prisma.area.findUnique({ where: { chave: 'adm' } })
  if (!adm) {
    console.log('rode npm run semear antes')
    return
  }

  const existente = await prisma.projeto.findFirst({ where: { nome: 'Jarvis KGFM' } })
  const projeto =
    existente ??
    (await prisma.projeto.create({
      data: {
        nome: 'Jarvis KGFM',
        cliente: 'KGFM (interno)',
        areaId: adm.id,
        fase: 'fechado',
        valorEstimado: null,
      },
    }))
  console.log(existente ? 'projeto ja existia' : 'projeto Jarvis KGFM criado')

  const frenteExistente = await prisma.frente.findFirst({
    where: { titulo: 'Construcao do Jarvis', status: { in: ['aberta', 'planejada'] } },
  })
  if (!frenteExistente) {
    const f = await prisma.frente.create({
      data: { titulo: 'Construcao do Jarvis', areaId: adm.id, projetoId: projeto.id, status: 'aberta' },
    })
    for (const titulo of [
      'Trocar ideia e decidir o que o sistema faz',
      'Testar o que foi entregue',
      'Corrigir o que aparecer no teste',
    ]) {
      await prisma.tarefa.create({ data: { frenteId: f.id, titulo } })
    }
    console.log('frente "Construcao do Jarvis" criada com 3 tarefas')
  } else {
    console.log('frente ja existia')
  }

  console.log('')
  console.log('Agora, quando estiver comigo, diga: "estou trocando ideia com o Jarvis"')
  console.log('e o cronometro entra no centro de custo certo.')
}

main().finally(() => prisma.$disconnect())
