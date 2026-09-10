// A voz do Jarvis - Pressfield aplicado, não Pressfield citado.
//
// As frases abaixo são ESCRITAS AQUI, no espirito de "A Guerra da Arte" e
// "Turning Pro". Não são citacoes do livro: reproduzir trecho de obra protegida
// dentro do produto seria copia. A ideia e do Pressfield; as palavras sao nossas.
//
// Regra de ouro: a frase e ESCOLHIDA PELO ESTADO, nunca sorteada. Frase
// aleatoria e decoracao, e decoracao ensina a não ler. Cada linha aqui existe
// para dizer uma coisa que o dado já provou.
//
// E nada de elogio nem gamificacao: o Lucian pediu explicitamente para não ser
// poupado. Quando está bom, o texto reconhece o fato e sobe a barra.

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
        'Enquanto não existe política norteadora escrita, toda oportunidade parece boa e você diz sim para todas. Escolher o que não fazer é a parte da estratégia que dá trabalho.',
    }
  }

  if (e.bloqueadores > 0) {
    return {
      titulo: 'A fila inteira espera uma coisa só',
      frase:
        'Existe trabalho travado atrás de uma única decisão sua. Enquanto ela não sai, todo esforço nas outras frentes só aumenta estoque parado.',
    }
  }

  if (e.minutosExpediente > 60 && e.percentualNoEscuro >= 70) {
    return {
      titulo: 'A Resistência não se anuncia',
      frase:
        'Ela não chega como preguiça. Chega como uma tarefa urgente que não e a sua, como uma pesquisa que podia esperar, como infraestrutura que parece produtiva. Hoje ela ficou com a maior parte do seu expediente.',
    }
  }

  if (e.diaParadoMaisVelho >= 10) {
    return {
      titulo: 'Adiar tem preço, e ele já está correndo',
      frase:
        `Tem frente parada há ${e.diaParadoMaisVelho} dias úteis. Não e prazo, e inércia - e cada dia parado numa proposta e receita que não entrou, não custo que não saiu.`,
    }
  }

  if (e.criticos > 0 && !e.temCronometro && e.minutosExpediente > 0) {
    return {
      titulo: 'Amador espera a hora certa',
      frase:
        'Existe crítico aberto e nenhum cronômetro rodando. Profissional não espera vontade: senta, aperta o relógio e começa mal se for preciso.',
    }
  }

  if (e.temCronometro) {
    return {
      titulo: 'Uma coisa de cada vez',
      frase:
        'O relógio está correndo em uma frente só. Isso é o trabalho profundo acontecendo - a troca de contexto custa mais do que parece, e o resto do painel pode esperar.',
    }
  }

  if (e.criticos === 0 && e.piorIndice >= 70) {
    return {
      titulo: 'Nenhum incendio - e a hora mais perigosa',
      frase:
        'Com tudo em dia, a escolha do que fazer volta a ser sua, e não da urgência. Use o dia pela estratégia: o que aproxima o horizonte de dois anos nunca grita.',
    }
  }

  return {
    titulo: 'Aparecer e metade',
    frase:
      'O painel não cobra genialidade, cobra presenca: frente que anda, tempo que aparece, decisão que sai. O resto e consequência.',
  }
}
