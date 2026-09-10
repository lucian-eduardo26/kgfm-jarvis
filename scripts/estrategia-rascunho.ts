// Rascunho de estrategia, montado com o que ja esta escrito no briefing e nas
// conversas de 09 e 10/09/2026. NAO e decisao do Lucian: e ponto de partida
// para ele corrigir na tela /estrategia.
//
// Por que existe: o proprio briefing diz que sem estrategia carregada o painel
// mede atividade em vez de progresso, e que "estrategia generica" e o risco 5.
// Tela em branco as 6 da manha nao ajuda ninguem a fugir do risco 5 - texto
// errado que da raiva ajuda, porque provoca a correcao.
//
//   npm run rascunho
//
// Os numeros dos objetivos sao chute honesto, marcados com (rascunho). Trocar
// e digitar por cima na tela.

import { PrismaClient } from '@prisma/client'
import { mesSP, anoSP } from '../src/lib/datas'

const prisma = new PrismaClient()

const ESTRATEGIAS = [
  {
    horizonte: 'cinco_anos' as const,
    periodo: '2031',
    diagnostico:
      'RASCUNHO - corrija. A KGFM entrega automacao intralogistica de qualidade, mas depende inteiramente de uma pessoa: capacidade, memoria e relacionamento estao todos no fundador. Isso limita o porte de projeto que a empresa pode aceitar sem risco.',
    politicaNorteadora:
      'RASCUNHO - corrija. Subir o porte medio de projeto em vez de subir a quantidade, e transferir para processo e para gente o que hoje so existe na cabeca do fundador.',
    acoes:
      'RASCUNHO - corrija. Padronizar solucoes que ja se repetem; construir um segundo par de maos tecnico; escolher dois ou tres setores onde a KGFM quer ser a referencia, e recusar o resto.',
  },
  {
    horizonte: 'dois_anos' as const,
    periodo: '2028',
    diagnostico:
      'RASCUNHO - corrija. Hoje o funil e irregular: a prospeccao so anda quando vira frente exclusiva, e nesses periodos a engenharia para. O resultado e receita em serra, nao em rampa.',
    politicaNorteadora:
      'RASCUNHO - corrija. Cadencia acima de intensidade: prospeccao que nunca zera, mesmo devagar, vale mais do que arranque de quatro dias seguido de tres semanas de silencio.',
    acoes:
      'RASCUNHO - corrija. Carteira de contas-alvo definida e revisada por trimestre; proposta padronizada para reduzir o tempo entre pedido e envio; um bloco fixo de prospeccao por semana que nao e negociavel.',
  },
  {
    horizonte: 'ano' as const,
    periodo: anoSP(),
    diagnostico:
      'RASCUNHO - corrija. O gargalo da KGFM e a atencao do Lucian, e ela e disputada por quatro setores ao mesmo tempo. Proposta parada por inercia e nota fiscal atrasada sao os dois vazamentos com preco em dinheiro.',
    politicaNorteadora:
      'RASCUNHO - corrija. Nenhuma proposta dorme mais de tres dias uteis, e nenhuma nota fiscal atrasa. O que sobrar de atencao vai para engenharia de projeto fechado - nunca para construir infraestrutura.',
    acoes:
      'RASCUNHO - corrija. Duas frentes abertas por setor, no maximo; um cronometro por vez; check-in de semana no domingo e check-out na sexta; toda oportunidade nova confrontada com esta politica antes de virar frente.',
  },
]

const OBJETIVOS = [
  { descricao: '(rascunho) Propostas enviadas', metrica: 'propostas', alvo: 6, area: 'comercial' },
  { descricao: '(rascunho) Conversas novas iniciadas', metrica: 'contatos', alvo: 40, area: 'comercial' },
  { descricao: '(rascunho) Pacotes de engenharia concluidos', metrica: 'pacotes', alvo: 4, area: 'engenharia' },
  { descricao: '(rascunho) Notas fiscais emitidas sem atraso', metrica: 'notas', alvo: 4, area: 'adm' },
]

async function main() {
  for (const e of ESTRATEGIAS) {
    const existente = await prisma.estrategia.findFirst({ where: { horizonte: e.horizonte } })
    if (existente) {
      console.log('ja existe estrategia de', e.horizonte, '- nao sobrescrevi')
      continue
    }
    await prisma.estrategia.create({ data: e })
    console.log('estrategia', e.horizonte, 'criada')
  }

  const areas = Object.fromEntries((await prisma.area.findMany()).map((a) => [a.chave, a]))
  const periodo = mesSP()
  for (const o of OBJETIVOS) {
    const existente = await prisma.objetivo.findFirst({ where: { descricao: o.descricao, periodo } })
    if (existente) {
      console.log('ja existe objetivo:', o.descricao)
      continue
    }
    await prisma.objetivo.create({
      data: {
        horizonte: 'mes',
        periodo,
        descricao: o.descricao,
        metrica: o.metrica,
        alvo: o.alvo,
        areaId: areas[o.area]?.id ?? null,
      },
    })
    console.log('objetivo criado:', o.descricao, '- alvo', o.alvo)
  }

  console.log('')
  console.log('Tudo aqui e RASCUNHO. Corrija em /estrategia - e a correcao e o exercicio.')
}

main().finally(() => prisma.$disconnect())
