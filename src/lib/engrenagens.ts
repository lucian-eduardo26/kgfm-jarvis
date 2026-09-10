// AS ENGRENAGENS - o que gira sem consumir a hora dele.
//
// O raciocinio veio do Lucian em 10/09/2026, e ele muda o sistema:
//
//   "O relogio do Jarvis, do Lucian, da KGFM nao para. E dinheiro na mesa ou
//    dinheiro no lixo. Se eu estou aqui com voce e nao tem tarefa ao mesmo
//    tempo, isso custa caro. Mas nao e binario: se eu estou no Jarvis, tem
//    coisa acontecendo, tem projeto rolando. Quanto mais coisas simultaneas
//    rodando, sao engrenagens girando."
//
// Ate aqui o sistema media UMA coisa: a hora dele, exclusiva, um cronometro por
// vez. Isso e metade da verdade. A outra metade e o que avanca SEM ele:
//
//   - o lote na galvanica, que leva tres dias e nao pede nada;
//   - a peca sendo cortada no fornecedor;
//   - a proposta na mao do cliente;
//   - o PJ montando em campo.
//
// Isso e Goldratt lido ate o fim. A restricao e a atencao dele - e o trabalho
// da restricao nao e produzir o dia todo, e MANTER O RESTO DO SISTEMA
// ALIMENTADO. Uma hora dele que deixa seis engrenagens girando vale mais que
// tres horas dele com o resto parado. Maquina parada nao custa; FLUXO parado
// custa.
//
// Por isso a conta do dia passa a ter duas colunas, e nenhuma substitui a
// outra: HORA DELE (medida, exclusiva) e ENGRENAGENS (contadas, paralelas).

import { diasUteisEntre } from './datas'

export type FrenteParaEngrenagem = {
  id: number
  titulo: string
  area: string
  projeto: string | null
  aguardandoQuem: 'eu' | 'cliente' | 'terceiro'
  aguardandoDesde: Date | null
  ultimoMovimentoEm: Date
  diasParaCritico: number
}

export type Engrenagem = {
  id: number
  titulo: string
  area: string
  projeto: string | null
  /** ha quantos dias uteis esta girando fora */
  dias: number
  quem: 'cliente' | 'terceiro'
}

export type NaMinhaMao = {
  id: number
  titulo: string
  area: string
  projeto: string | null
  diasParada: number
  critica: boolean
}

export type Engrenagens = {
  girando: Engrenagem[]
  naMinhaMao: NaMinhaMao[]
  paradasNaMinhaMao: number
  frase: string
  /** true quando a hora dele esta sendo gasta e quase nada gira em paralelo */
  poucasGirando: boolean
}

export function montarEngrenagens(
  frentes: FrenteParaEngrenagem[],
  temCronometroRodando: boolean,
  agora: Date = new Date(),
): Engrenagens {
  const girando: Engrenagem[] = []
  const naMinhaMao: NaMinhaMao[] = []

  for (const f of frentes) {
    if (f.aguardandoQuem !== 'eu') {
      girando.push({
        id: f.id,
        titulo: f.titulo,
        area: f.area,
        projeto: f.projeto,
        dias: f.aguardandoDesde ? diasUteisEntre(f.aguardandoDesde, agora) : 0,
        quem: f.aguardandoQuem,
      })
    } else {
      const parada = diasUteisEntre(f.ultimoMovimentoEm, agora)
      naMinhaMao.push({
        id: f.id,
        titulo: f.titulo,
        area: f.area,
        projeto: f.projeto,
        diasParada: parada,
        critica: parada >= f.diasParaCritico,
      })
    }
  }

  girando.sort((a, b) => b.dias - a.dias)
  naMinhaMao.sort((a, b) => b.diasParada - a.diasParada)

  const paradasNaMinhaMao = naMinhaMao.filter((x) => x.critica).length

  // Poucas engrenagens girando E a hora dele correndo: e a combinacao cara.
  // Ele esta produzindo sozinho enquanto o resto do sistema nao avanca.
  const poucasGirando = girando.length <= 1 && temCronometroRodando

  let frase: string
  if (frentes.length === 0) {
    frase = 'Nada aberto. Nenhuma engrenagem girando e nenhuma na sua mao - o sistema nao tem o que medir.'
  } else if (girando.length === 0) {
    frase = temCronometroRodando
      ? `Nada girando em paralelo: tudo o que existe depende de voce. A sua hora atual e a unica coisa que a KGFM esta produzindo agora.`
      : 'Nada girando em paralelo, e nenhum cronometro rodando. Neste minuto a empresa esta parada inteira.'
  } else if (poucasGirando) {
    frase = `So ${girando.length} engrenagem girando enquanto a sua hora corre. Antes de mergulhar, veja o que da para empurrar para o lado de fora - fornecedor, cliente, terceiro - e deixar rodando enquanto voce trabalha.`
  } else {
    const maisVelha = girando[0]
    frase =
      `${girando.length} engrenagens girando sem consumir a sua hora` +
      (maisVelha.dias > 0 ? `, a mais antiga ha ${maisVelha.dias} dias uteis (${maisVelha.titulo}).` : '.') +
      (paradasNaMinhaMao > 0
        ? ` E ${paradasNaMinhaMao} na sua mao ja estourou o prazo - essas nao giram sozinhas.`
        : '')
  }

  return { girando, naMinhaMao, paradasNaMinhaMao, frase, poucasGirando }
}
