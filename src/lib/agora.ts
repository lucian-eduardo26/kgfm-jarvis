// FAÇA AGORA - a faixa de cima do painel.
//
// Regra de Goldratt, deterministica: aponta para o que DESTRAVA FLUXO, não para
// o mais atrasado. Item atrasado que não bloqueia nada perde para item no prazo
// que trava três frentes. Toda recomendacao carrega o argumento.
//
// Não usa IA de propósito: recomendacao gerada por LLM na hora do request
// deixaria o painel abrindo girando (risco tecnico 3), e uma regra que o Lucian
// consegue conferir vale mais do que um palpite que ele não consegue.

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
      titulo: 'Carregar a estratégia',
      porque:
        'Sem diagnostico, política norteadora e objetivos, o painel mede atividade em vez de progresso - e o filtro de oportunidade não filtra nada.',
      area: null,
      frenteId: null,
    }
  }

  if (d.cronometro) {
    return {
      titulo: d.cronometro.tarefaTitulo,
      porque: `Cronômetro rodando em ${d.cronometro.areaNome}. Um de cada vez: terminar isto antes de abrir outra coisa.`,
      area: d.cronometro.areaNome,
      frenteId: d.cronometro.frenteId,
    }
  }

  // 1. O que trava mais gente.
  const bloqueador = d.criticosGerais.find((c) => c.bloqueia > 0)
  if (bloqueador) {
    return {
      titulo: bloqueador.titulo,
      porque: `Trava ${bloqueador.bloqueia} ${bloqueador.bloqueia === 1 ? 'outra frente' : 'outras frentes'} e está ${bloqueador.texto}. Destravar isto libera mais fluxo do que qualquer outra coisa hoje.`,
      area: null,
      frenteId: bloqueador.frenteId,
    }
  }

  // 2. Nada bloqueando: a área mais doente, e dentro dela o crítico mais velho.
  const doentes = d.areas.filter((a) => a.zona !== 'cinza').sort((x, y) => x.indice - y.indice)
  const pior = doentes[0]
  if (pior && pior.criticos.length > 0) {
    const c = [...pior.criticos].sort((a, b) => b.dias - a.dias)[0]
    return {
      titulo: c.titulo,
      porque:
        c.motivo === 'cobrar'
          ? `${pior.nome} está em ${pior.indice}. A bola voltou para você há ${c.dias} dias úteis: e cobrar, não esperar.`
          : `${pior.nome} e a área mais doente do painel (${pior.indice} de 100) e está e a frente ${c.texto}.`,
      area: pior.nome,
      frenteId: c.frenteId,
    }
  }

  // 3. Sem crítico nenhum: fila vazia é sinal de saúde, não de tela quebrada.
  if (pior && pior.frentesAbertas === 0) {
    return {
      titulo: `Abrir frente em ${pior.nome}`,
      porque: `${pior.nome} tem objetivo do mês e nenhuma frente aberta. Objetivo sem frente é desejo.`,
      area: pior.nome,
      frenteId: null,
    }
  }

  if (d.itensSemClassificar > 0) {
    return {
      titulo: `Revisar ${d.itensSemClassificar} ${d.itensSemClassificar === 1 ? 'captura' : 'capturas'}`,
      porque: 'Nenhum crítico aberto. E a hora de reconciliar a caixa de entrada, antes que ela vire cemiterio.',
      area: null,
      frenteId: null,
    }
  }

  return {
    titulo: 'Nada crítico',
    porque: 'Nenhuma frente estourou prazo e a caixa está limpa. Escolha o bloco profundo do dia pela estratégia, não pela pressão.',
    area: null,
    frenteId: null,
  }
}
