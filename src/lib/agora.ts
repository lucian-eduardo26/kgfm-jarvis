// FACA AGORA - a faixa de cima do painel.
//
// Regra de Goldratt, deterministica: aponta para o que DESTRAVA FLUXO, nao para
// o mais atrasado. Item atrasado que nao bloqueia nada perde para item no prazo
// que trava tres frentes. Toda recomendacao carrega o argumento.
//
// Nao usa IA de proposito: recomendacao gerada por LLM na hora do request
// deixaria o painel abrindo girando (risco tecnico 3), e uma regra que o Lucian
// consegue conferir vale mais do que um palpite que ele nao consegue.

import type { DadosDoPainel } from './painel'

export type FacaAgora = {
  titulo: string
  porque: string
  area: string | null
  frenteId: number | null
} | null

export function decidirAgora(d: DadosDoPainel): FacaAgora {
  if (!d.temEstrategia) {
    return {
      titulo: 'Carregar a estrategia',
      porque:
        'Sem diagnostico, politica norteadora e objetivos, o painel mede atividade em vez de progresso - e o filtro de oportunidade nao filtra nada.',
      area: null,
      frenteId: null,
    }
  }

  if (d.cronometro) {
    return {
      titulo: d.cronometro.tarefaTitulo,
      porque: `Cronometro rodando em ${d.cronometro.areaNome}. Um de cada vez: terminar isto antes de abrir outra coisa.`,
      area: d.cronometro.areaNome,
      frenteId: d.cronometro.frenteId,
    }
  }

  // 1. O que trava mais gente.
  const bloqueador = d.criticosGerais.find((c) => c.bloqueia > 0)
  if (bloqueador) {
    return {
      titulo: bloqueador.titulo,
      porque: `Trava ${bloqueador.bloqueia} ${bloqueador.bloqueia === 1 ? 'outra frente' : 'outras frentes'} e esta ${bloqueador.texto}. Destravar isto libera mais fluxo do que qualquer outra coisa hoje.`,
      area: null,
      frenteId: bloqueador.frenteId,
    }
  }

  // 2. Nada bloqueando: a area mais doente, e dentro dela o critico mais velho.
  const doentes = d.areas.filter((a) => a.zona !== 'cinza').sort((x, y) => x.indice - y.indice)
  const pior = doentes[0]
  if (pior && pior.criticos.length > 0) {
    const c = [...pior.criticos].sort((a, b) => b.dias - a.dias)[0]
    return {
      titulo: c.titulo,
      porque:
        c.motivo === 'cobrar'
          ? `${pior.nome} esta em ${pior.indice}. A bola voltou para voce ha ${c.dias} dias uteis: e cobrar, nao esperar.`
          : `${pior.nome} e a area mais doente do painel (${pior.indice} de 100) e esta e a frente ${c.texto}.`,
      area: pior.nome,
      frenteId: c.frenteId,
    }
  }

  // 3. Sem critico nenhum: fila vazia e sinal de saude, nao de tela quebrada.
  if (pior && pior.frentesAbertas === 0) {
    return {
      titulo: `Abrir frente em ${pior.nome}`,
      porque: `${pior.nome} tem objetivo do mes e nenhuma frente aberta. Objetivo sem frente e desejo.`,
      area: pior.nome,
      frenteId: null,
    }
  }

  if (d.itensSemClassificar > 0) {
    return {
      titulo: `Revisar ${d.itensSemClassificar} ${d.itensSemClassificar === 1 ? 'captura' : 'capturas'}`,
      porque: 'Nenhum critico aberto. E a hora de reconciliar a caixa de entrada, antes que ela vire cemiterio.',
      area: null,
      frenteId: null,
    }
  }

  return {
    titulo: 'Nada critico',
    porque: 'Nenhuma frente estourou prazo e a caixa esta limpa. Escolha o bloco profundo do dia pela estrategia, nao pela pressao.',
    area: null,
    frenteId: null,
  }
}
