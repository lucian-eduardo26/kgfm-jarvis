// A LINHA DO TEMPO DO PROJETO.
//
// Pedido do Lucian em 10/09/2026: "eu quero a linha do tempo, as tarefas, os
// entregaveis de cada projeto. Gerir assim e melhor do que inventar a roda e
// fazer igual ao Project, que fica pesado."
//
// Por isso aqui NAO existe diagrama de Gantt, dependencia entre tarefas nem
// caminho critico. Existe o que ele precisa para saber onde o projeto esta:
// o que ja aconteceu, com data, e o que falta acontecer.
//
// A materia-prima ja estava toda no banco e nunca tinha sido lida junta:
//   - `movimentos`: cada toque numa frente, com data (foi para isso que a
//     tabela existe - a revisao trimestral pede dado, nao memoria)
//   - `tarefas`: o que falta, e o que foi concluido e quando
//   - `apontamentos`: quanto tempo custou
//   - `itens` tipo compromisso: os prazos ditos
//
// Isso significa que a linha do tempo nao pede NENHUM trabalho novo dele. Ela e
// subproduto de apontar hora e mexer nas frentes - que ele ja faz.

export type EventoProjeto = {
  em: Date
  tipo: 'abertura' | 'feita' | 'trabalho' | 'prazo' | 'sinal' | 'fechamento'
  titulo: string
  detalhe: string | null
  frente: string
  minutos?: number
  /** no futuro: ainda vai acontecer */
  futuro: boolean
}

export type ResumoProjeto = {
  minutosTotais: number
  tarefasFeitas: number
  tarefasAbertas: number
  primeiroMovimento: Date | null
  ultimoMovimento: Date | null
  proximoPrazo: Date | null
  eventos: EventoProjeto[]
}

type EntradaProjeto = {
  frentes: {
    titulo: string
    abertaEm: Date
    fechadaEm: Date | null
    movimentos: { tipo: string; descricao: string | null; em: Date }[]
    tarefas: {
      titulo: string
      status: string
      concluidaEm: Date | null
      apontamentos: { iniciadoEm: Date; encerradoEm: Date | null }[]
    }[]
    itens: { conteudo: string; venceEm: Date | null }[]
  }[]
}

const ROTULO: Record<string, EventoProjeto['tipo']> = {
  abertura: 'abertura',
  ativacao: 'abertura',
  'tarefa-feita': 'feita',
  cronometro: 'trabalho',
  'cronometro-parado': 'trabalho',
  'bloco-fechado': 'trabalho',
  'lancamento-retroativo': 'trabalho',
  fechamento: 'fechamento',
}

export function montarLinhaDoTempo(p: EntradaProjeto, agora: Date = new Date()): ResumoProjeto {
  const eventos: EventoProjeto[] = []
  let minutosTotais = 0
  let feitas = 0
  let abertas = 0

  for (const f of p.frentes) {
    eventos.push({
      em: f.abertaEm,
      tipo: 'abertura',
      titulo: `Frente aberta: ${f.titulo}`,
      detalhe: null,
      frente: f.titulo,
      futuro: false,
    })

    // Os movimentos de trabalho viram UM evento por dia, e nao um por toque -
    // senao a linha do tempo vira log de sistema e ninguem le.
    const trabalhoPorDia = new Map<string, Date>()
    for (const m of f.movimentos) {
      const tipo = ROTULO[m.tipo]
      if (!tipo || tipo === 'abertura') continue
      if (tipo === 'trabalho') {
        const dia = m.em.toISOString().slice(0, 10)
        if (!trabalhoPorDia.has(dia)) trabalhoPorDia.set(dia, m.em)
        continue
      }
      eventos.push({
        em: m.em,
        tipo,
        titulo: m.descricao ?? f.titulo,
        detalhe: null,
        frente: f.titulo,
        futuro: false,
      })
    }

    for (const t of f.tarefas) {
      const min = t.apontamentos.reduce(
        (s, a) => s + Math.max(0, ((a.encerradoEm ?? agora).getTime() - a.iniciadoEm.getTime()) / 60000),
        0,
      )
      minutosTotais += min

      if (t.status === 'feita') {
        feitas++
        if (t.concluidaEm) {
          eventos.push({
            em: t.concluidaEm,
            tipo: 'feita',
            titulo: t.titulo,
            detalhe: null,
            frente: f.titulo,
            minutos: Math.round(min),
            futuro: false,
          })
        }
      } else if (t.status === 'aberta') {
        abertas++
      }
    }

    for (const i of f.itens) {
      if (!i.venceEm) continue
      eventos.push({
        em: i.venceEm,
        tipo: 'prazo',
        titulo: i.conteudo,
        detalhe: 'prazo',
        frente: f.titulo,
        futuro: i.venceEm > agora,
      })
    }

    if (f.fechadaEm) {
      eventos.push({
        em: f.fechadaEm,
        tipo: 'fechamento',
        titulo: `Frente fechada: ${f.titulo}`,
        detalhe: null,
        frente: f.titulo,
        futuro: false,
      })
    }

    for (const [, quando] of trabalhoPorDia) {
      eventos.push({
        em: quando,
        tipo: 'sinal',
        titulo: 'Trabalho neste dia',
        detalhe: f.titulo,
        frente: f.titulo,
        futuro: false,
      })
    }
  }

  eventos.sort((a, b) => b.em.getTime() - a.em.getTime())

  const passados = eventos.filter((e) => !e.futuro)
  const futuros = eventos.filter((e) => e.futuro)

  return {
    minutosTotais: Math.round(minutosTotais),
    tarefasFeitas: feitas,
    tarefasAbertas: abertas,
    primeiroMovimento: passados.length ? passados[passados.length - 1].em : null,
    ultimoMovimento: passados.length ? passados[0].em : null,
    proximoPrazo: futuros.length ? futuros[futuros.length - 1].em : null,
    eventos,
  }
}
