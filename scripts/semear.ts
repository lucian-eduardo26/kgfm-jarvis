// As quatro areas. Roda quantas vezes quiser: nao duplica.
import { PrismaClient } from '@prisma/client'
import { DIAS_PARA_CRITICO_PADRAO } from '../src/lib/mostrador'

const prisma = new PrismaClient()

const AREAS = [
  { chave: 'comercial', nome: 'Comercial', ordem: 1, metaHorasSemana: 10 },
  { chave: 'engenharia', nome: 'Engenharia', ordem: 2, metaHorasSemana: 16 },
  { chave: 'prospeccao', nome: 'Prospeccao', ordem: 3, metaHorasSemana: 6 },
  { chave: 'entregas', nome: 'Entregas', ordem: 4, metaHorasSemana: 8 },
]

async function main() {
  for (const a of AREAS) {
    await prisma.area.upsert({
      where: { chave: a.chave },
      create: { ...a, diasParaCritico: DIAS_PARA_CRITICO_PADRAO[a.chave] ?? 5 },
      update: { nome: a.nome, ordem: a.ordem },
    })
    console.log('area', a.chave, 'ok')
  }
}

main().finally(() => prisma.$disconnect())
