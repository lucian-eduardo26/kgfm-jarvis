// A DEFINICAO DO MOSTRADOR VIVE SO AQUI.
// No CRM ja aconteceu de cada tela contar diferente com o mesmo nome; a
// correcao foi centralizar em um arquivo. Aqui ja nasce centralizado.
// Justificativa de cada numero em docs/mostrador.md.

import { diasUteisEntre, diasUteisDoMes } from './datas'

export type ConfigMostrador = {
  pesoMovimento: number
  pesoCriticos: number
  pesoAderencia: number
  descontoCritico: number
  multiplicadorBloqueio: number
  diasAguardandoTerceiro: number
  diasCompromissoProximo: number
  autoEncerrarHoras: number
}

// Os padroes da especificacao. A pagina de configuracao sobrescreve, e grava a
// data - se o mostrador mudar de cor, tem que dar para saber se foi o mundo ou
// se foi o peso.
export const CONFIG_PADRAO: ConfigMostrador = {
  pesoMovimento: 40,
  pesoCriticos: 40,
  pesoAderencia: 20,
  descontoCritico: 34,
  multiplicadorBloqueio: 2,
  diasAguardandoTerceiro: 5,
  diasCompromissoProximo: 2,
  autoEncerrarHoras: 3,
}

// Os quatro setores. Proposta parada e receita nao realizada, e prospeccao mora
// dentro de Comercial - por isso o limiar mais curto e o dele.
export const DIAS_PARA_CRITICO_PADRAO: Record<string, number> = {
  comercial: 3,
  adm: 4,
  producao: 5,
  engenharia: 7,
}

export type Zona = 'verde' | 'ambar' | 'vermelho' | 'cinza'

export function zonaDoIndice(indice: number): Zona {
  if (indice >= 70) return 'verde'
  if (indice >= 40) return 'ambar'
  return 'vermelho'
}

export const COR_DA_ZONA: Record<Zona, string> = {
  verde: '#22C55E',
  ambar: '#F59E0B',
  vermelho: '#F43F5E',
  cinza: '#6B7280',
}

// ---------- movimento ----------

/** Nota de uma frente pelo tempo parada, em dias uteis. */
export function notaMovimento(diasUteisParada: number): number {
  if (diasUteisParada <= 3) return 1
  if (diasUteisParada <= 7) return 0.6
  if (diasUteisParada <= 14) return 0.3
  return 0
}

// ---------- criticos ----------

export type MotivoCritico = 'parada' | 'cobrar' | 'compromisso'

export type Critico = {
  frenteId: number
  titulo: string
  motivo: MotivoCritico
  dias: number
  bloqueia: number
  texto: string
}

export type FrenteParaCalculo = {
  id: number
  titulo: string
  ultimoMovimentoEm: Date
  aguardandoQuem: 'eu' | 'cliente' | 'terceiro'
  aguardandoDesde: Date | null
  bloqueiaQuantas: number
  proximoCompromissoEm: Date | null
}

/**
 * Criticos de uma frente. Sempre fato com data, nunca julgamento da IA:
 * se a IA decidir o que e critico, o numero muda sozinho e o sistema perde a
 * confianca - que e a unica coisa que o GTD diz importar.
 */
export function criticosDaFrente(
  f: FrenteParaCalculo,
  diasParaCritico: number,
  cfg: ConfigMostrador = CONFIG_PADRAO,
  agora: Date = new Date(),
): Critico[] {
  const achados: Critico[] = []
  const base = { frenteId: f.id, titulo: f.titulo, bloqueia: f.bloqueiaQuantas }

  if (f.aguardandoQuem !== 'eu' && f.aguardandoDesde) {
    // Regra de Goldratt: enquanto a bola esta com o outro, a frente NAO consome
    // a capacidade da restricao e nao desconta. So vira critico quando passa a
    // janela de cobranca - e ai o critico e a acao dele, nao o silencio alheio.
    const dias = diasUteisEntre(f.aguardandoDesde, agora)
    if (dias >= cfg.diasAguardandoTerceiro) {
      achados.push({
        ...base,
        motivo: 'cobrar',
        dias,
        texto: `sem retorno ha ${dias} dias uteis - cobrar`,
      })
    }
  } else {
    const dias = diasUteisEntre(f.ultimoMovimentoEm, agora)
    if (dias >= diasParaCritico) {
      achados.push({
        ...base,
        motivo: 'parada',
        dias,
        texto: `parada ha ${dias} dias uteis`,
      })
    }
  }

  if (f.proximoCompromissoEm) {
    const faltam = diasUteisEntre(agora, f.proximoCompromissoEm)
    const paradaHa = diasUteisEntre(f.ultimoMovimentoEm, agora)
    if (faltam <= cfg.diasCompromissoProximo && paradaHa >= cfg.diasCompromissoProximo) {
      achados.push({
        ...base,
        motivo: 'compromisso',
        dias: faltam,
        texto: faltam <= 0 ? 'compromisso hoje e frente parada' : `compromisso em ${faltam} dias uteis e frente parada`,
      })
    }
  }

  return achados
}

/** 100 menos o desconto de cada critico. Tres criticos zeram a area. */
export function pontuacaoCriticos(criticos: Critico[], cfg: ConfigMostrador = CONFIG_PADRAO): number {
  let p = 100
  for (const c of criticos) {
    p -= c.bloqueia > 0 ? cfg.descontoCritico * cfg.multiplicadorBloqueio : cfg.descontoCritico
  }
  return Math.max(0, p)
}

// ---------- aderencia ----------

export type ObjetivoDoMes = { alvo: number | null; realizado: number }

/** Pro-rata linear por dia util decorrido. Objetivo sem numero nao mede nada. */
export function pontuacaoAderencia(o: ObjetivoDoMes | null, agora: Date = new Date()): number | null {
  if (!o || o.alvo == null || o.alvo <= 0) return null
  const { total, decorridos } = diasUteisDoMes(agora)
  const esperado = o.alvo * (decorridos / total)
  if (esperado <= 0) return 100
  return Math.max(0, Math.min(100, (o.realizado / esperado) * 100))
}

// ---------- o indice ----------

export type ResultadoArea = {
  areaId: number
  chave: string
  nome: string
  indice: number
  zona: Zona
  movimento: number
  criticosPontos: number
  aderencia: number | null
  frentesAbertas: number
  criticos: Critico[]
  legenda: string
  temObjetivoDoMes: boolean
}

export type EntradaArea = {
  areaId: number
  chave: string
  nome: string
  diasParaCritico: number
  frentes: FrenteParaCalculo[]
  objetivoDoMes: ObjetivoDoMes | null
}

export function calcularArea(
  e: EntradaArea,
  cfg: ConfigMostrador = CONFIG_PADRAO,
  agora: Date = new Date(),
): ResultadoArea {
  const criticos = e.frentes.flatMap((f) => criticosDaFrente(f, e.diasParaCritico, cfg, agora))
  const aderencia = pontuacaoAderencia(e.objetivoDoMes, agora)
  const temObjetivo = aderencia !== null
  const base = {
    areaId: e.areaId,
    chave: e.chave,
    nome: e.nome,
    criticos,
    frentesAbertas: e.frentes.length,
    temObjetivoDoMes: temObjetivo,
  }

  // Area sem frente aberta. Nunca verde por vazio: verde por vazio e como o
  // painel aprende a mentir.
  if (e.frentes.length === 0) {
    if (temObjetivo) {
      return {
        ...base,
        indice: 0,
        zona: 'vermelho',
        movimento: 0,
        criticosPontos: 100,
        aderencia,
        legenda: 'nenhuma frente aberta',
      }
    }
    return {
      ...base,
      indice: 0,
      zona: 'cinza',
      movimento: 0,
      criticosPontos: 100,
      aderencia: null,
      legenda: 'fora do foco este mes',
    }
  }

  const movimento =
    (e.frentes.reduce((s, f) => s + notaMovimento(diasUteisEntre(f.ultimoMovimentoEm, agora)), 0) /
      e.frentes.length) *
    100
  const criticosPontos = pontuacaoCriticos(criticos, cfg)

  let indice: number
  if (temObjetivo) {
    const soma = cfg.pesoMovimento + cfg.pesoCriticos + cfg.pesoAderencia
    indice = (movimento * cfg.pesoMovimento + criticosPontos * cfg.pesoCriticos + (aderencia as number) * cfg.pesoAderencia) / soma
  } else {
    // Sem objetivo do mes a aderencia sai e o peso e redistribuido.
    const soma = cfg.pesoMovimento + cfg.pesoCriticos
    indice = (movimento * cfg.pesoMovimento + criticosPontos * cfg.pesoCriticos) / soma
  }
  indice = Math.round(Math.max(0, Math.min(100, indice)))

  return {
    ...base,
    indice,
    zona: zonaDoIndice(indice),
    movimento: Math.round(movimento),
    criticosPontos,
    aderencia: aderencia === null ? null : Math.round(aderencia),
    legenda: legendaDaArea(criticos, e.frentes, temObjetivo, agora),
  }
}

function legendaDaArea(
  criticos: Critico[],
  frentes: FrenteParaCalculo[],
  temObjetivo: boolean,
  agora: Date,
): string {
  if (criticos.length > 0) {
    const pior = [...criticos].sort((a, b) => b.dias - a.dias)[0]
    return `${pior.titulo}: ${pior.texto}`
  }
  const maisParada = [...frentes].sort(
    (a, b) => a.ultimoMovimentoEm.getTime() - b.ultimoMovimentoEm.getTime(),
  )[0]
  const dias = diasUteisEntre(maisParada.ultimoMovimentoEm, agora)
  if (!temObjetivo) return 'sem objetivo do mes'
  if (dias === 0) return 'tudo movido hoje'
  return `mais parada ha ${dias} dias uteis`
}
