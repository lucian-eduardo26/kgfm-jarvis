// A voz do Jarvis - Pressfield aplicado, nao Pressfield citado.
//
// As frases abaixo sao ESCRITAS AQUI, no espirito de "A Guerra da Arte" e
// "Turning Pro". Nao sao citacoes do livro: reproduzir trecho de obra protegida
// dentro do produto seria copia. A ideia e do Pressfield; as palavras sao nossas.
//
// Regra de ouro: a frase e ESCOLHIDA PELO ESTADO, nunca sorteada. Frase
// aleatoria e decoracao, e decoracao ensina a nao ler. Cada linha aqui existe
// para dizer uma coisa que o dado ja provou.
//
// E nada de elogio nem gamificacao: o Lucian pediu explicitamente para nao ser
// poupado. Quando esta bom, o texto reconhece o fato e sobe a barra.

export type Voz = { titulo: string; frase: string }

export type EstadoParaVoz = {
  percentualNoEscuro: number
  minutosExpediente: number
  temCronometro: boolean
  criticos: number
  bloqueadores: number
  piorIndice: number
  temEstrategia: boolean
  diaParadoMaisVelho: number
}

export function vozDoDia(e: EstadoParaVoz): Voz {
  if (!e.temEstrategia) {
    return {
      titulo: 'Sem eixo, tudo parece urgente',
      frase:
        'Enquanto nao existe politica norteadora escrita, toda oportunidade parece boa e voce diz sim para todas. Escolher o que nao fazer e a parte da estrategia que da trabalho.',
    }
  }

  if (e.bloqueadores > 0) {
    return {
      titulo: 'A fila inteira espera uma coisa so',
      frase:
        'Existe trabalho travado atras de uma unica decisao sua. Enquanto ela nao sai, todo esforco nas outras frentes so aumenta estoque parado.',
    }
  }

  if (e.minutosExpediente > 60 && e.percentualNoEscuro >= 70) {
    return {
      titulo: 'A Resistencia nao se anuncia',
      frase:
        'Ela nao chega como preguica. Chega como uma tarefa urgente que nao e a sua, como uma pesquisa que podia esperar, como infraestrutura que parece produtiva. Hoje ela ficou com a maior parte do seu expediente.',
    }
  }

  if (e.diaParadoMaisVelho >= 10) {
    return {
      titulo: 'Adiar tem preco, e ele ja esta correndo',
      frase:
        `Tem frente parada ha ${e.diaParadoMaisVelho} dias uteis. Nao e prazo, e inercia - e cada dia parado numa proposta e receita que nao entrou, nao custo que nao saiu.`,
    }
  }

  if (e.criticos > 0 && !e.temCronometro && e.minutosExpediente > 0) {
    return {
      titulo: 'Amador espera a hora certa',
      frase:
        'Existe critico aberto e nenhum cronometro rodando. Profissional nao espera vontade: senta, aperta o relogio e comeca mal se for preciso.',
    }
  }

  if (e.temCronometro) {
    return {
      titulo: 'Uma coisa de cada vez',
      frase:
        'O relogio esta correndo em uma frente so. Isso e o trabalho profundo acontecendo - a troca de contexto custa mais do que parece, e o resto do painel pode esperar.',
    }
  }

  if (e.criticos === 0 && e.piorIndice >= 70) {
    return {
      titulo: 'Nenhum incendio - e a hora mais perigosa',
      frase:
        'Com tudo em dia, a escolha do que fazer volta a ser sua, e nao da urgencia. Use o dia pela estrategia: o que aproxima o horizonte de dois anos nunca grita.',
    }
  }

  return {
    titulo: 'Aparecer e metade',
    frase:
      'O painel nao cobra genialidade, cobra presenca: frente que anda, tempo que aparece, decisao que sai. O resto e consequencia.',
  }
}
