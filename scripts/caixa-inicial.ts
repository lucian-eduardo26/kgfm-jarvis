// Carrega o unico numero de caixa que o Lucian informou em 10/09/2026:
// custo fixo de R$ 35.000/mes. Saldo e parcela do emprestimo ficam em branco
// de proposito - runway em cima de numero inventado e pior do que sem runway.
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const existente = await prisma.caixa.findUnique({ where: { id: 1 } })
  if (existente) {
    console.log('caixa ja existe, nao sobrescrevi')
    return
  }
  await prisma.caixa.create({
    data: { id: 1, saldo: 0, custoFixoMensal: 35000, parcelaEmprestimo: 0, margemBruta: 0.28 },
  })
  console.log('caixa criado: custo fixo R$ 35.000/mes, margem 28%')
  console.log('FALTA: saldo de hoje e a parcela do emprestimo, na tela /caixa')
}
main().finally(() => prisma.$disconnect())
