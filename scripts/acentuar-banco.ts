// Acentuar o que já está GRAVADO. A varredura do código não alcança o banco,
// e o nome do projeto aparece na tela do mesmo jeito que qualquer texto fixo.
//
// Só troca quando a versão sem acento existe. Rodar de novo não faz mal.

import { prisma } from '../src/lib/prisma'

const TROCAS: [string, string][] = [
  ['Construcao do Jarvis', 'Construção do Jarvis'],
  ['Construcao', 'Construção'],
  ['Producao', 'Produção'],
  ['Engenharia', 'Engenharia'],
  ['Comercial', 'Comercial'],
  ['Prospeccao', 'Prospecção'],
  ['Pos-venda', 'Pós-venda'],
  ['Financeiro', 'Financeiro'],
  ['Manutencao', 'Manutenção'],
  ['Instalacao', 'Instalação'],
  ['Detalhamento', 'Detalhamento'],
  ['Especificacao', 'Especificação'],
  ['Automacao', 'Automação'],
  ['Logimat', 'Logimat'],
]

function acentuar(texto: string | null): string | null {
  if (!texto) return texto
  let t = texto
  for (const [sem, com] of TROCAS) t = t.split(sem).join(com)
  return t
}

async function main() {
  let mexidos = 0

  const projetos = await prisma.projeto.findMany()
  for (const p of projetos) {
    const nome = acentuar(p.nome)!
    if (nome !== p.nome) {
      await prisma.projeto.update({ where: { id: p.id }, data: { nome } })
      console.log(`projeto: ${p.nome} -> ${nome}`)
      mexidos++
    }
  }

  const frentes = await prisma.frente.findMany()
  for (const f of frentes) {
    const titulo = acentuar(f.titulo)!
    const pacote = acentuar(f.pacote)
    if (titulo !== f.titulo || pacote !== f.pacote) {
      await prisma.frente.update({ where: { id: f.id }, data: { titulo, pacote } })
      console.log(`frente: ${f.titulo} -> ${titulo}`)
      mexidos++
    }
  }

  const tarefas = await prisma.tarefa.findMany()
  for (const t of tarefas) {
    const titulo = acentuar(t.titulo)!
    if (titulo !== t.titulo) {
      await prisma.tarefa.update({ where: { id: t.id }, data: { titulo } })
      console.log(`tarefa: ${t.titulo} -> ${titulo}`)
      mexidos++
    }
  }

  console.log(mexidos === 0 ? 'nada a acentuar no banco' : `${mexidos} registros acentuados`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
