// CASAR A FALA COM A FRENTE, SEM CHAMAR A IA.
//
// Erro de projeto que este arquivo conserta: o comando de voz chamava um modelo
// grande TODA VEZ. A US$ 0,012 por comando e 20 comandos por dia, o Lucian
// pagaria umas US$ 7 por mes so para dizer "estou fazendo tal coisa" - com a
// espera de alguns segundos junto.
//
// Mas ligar o cronometro nao e um problema de raciocinio: e um problema de
// PARECIDO COM. "Estou levantando os precos da cotacao" tem que casar com a
// frente "Cotacao de pecas pequenas". Isso e comparacao de palavras, e roda
// aqui em milissegundos, de graca e sem internet.
//
// A IA fica para quando a comparacao NAO tem certeza - e para conversar, que e
// onde ela realmente pensa.
//
// O veredito de prioridade continua vindo do codigo, como sempre veio. Ele
// nunca dependeu da IA.

const RUIDO = new Set([
  'a','o','as','os','um','uma','de','da','do','das','dos','e','em','no','na','nos','nas',
  'para','pra','por','com','sem','ao','aos','que','se','me','eu','estou','to','tou','vou',
  'agora','ja','aqui','fazendo','fazer','comecar','comecando','mexer','mexendo','trabalhar',
  'trabalhando','continuar','continuando','jarvis','ta','tá','the','of',
])

/** minusculas, sem acento, sem pontuacao. */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function palavras(s: string): string[] {
  return normalizar(s)
    .split(' ')
    .filter((p) => p.length >= 3 && !RUIDO.has(p))
}

/**
 * Quanto o texto falado combina com um alvo, de 0 a 1.
 * Palavra inteira vale 1; comeco de palavra com 4+ letras vale 0,6 - assim
 * "cotacao" casa com "cotacoes" e "preco" com "precos".
 */
export function parecenca(falado: string[], alvo: string): number {
  const alvoP = palavras(alvo)
  if (alvoP.length === 0 || falado.length === 0) return 0

  let pontos = 0
  for (const p of alvoP) {
    if (falado.includes(p)) {
      pontos += 1
      continue
    }
    if (p.length >= 4 && falado.some((f) => f.length >= 4 && (f.startsWith(p.slice(0, 4)) || p.startsWith(f.slice(0, 4))))) {
      pontos += 0.6
    }
  }
  // Dividido pelo tamanho do alvo: titulo curto que casa inteiro vence titulo
  // longo que casa por acaso em duas palavras.
  return pontos / alvoP.length
}

export type Intencao = 'iniciar' | 'parar' | 'concluir' | 'perguntar'

const PARAR = /\b(parei|parar|pausa|pausar|pausei|parou|chega|encerrei|encerrar)\b/
const CONCLUIR = /\b(acabei|terminei|conclui|concluido|finalizei|fechei|pronto|feito|resolvido)\b/
const PERGUNTA = /\?|^\s*(o que|qual|quais|quanto|quando|quem|por que|porque|como|me diga|me fala|explica)\b/

export function lerIntencao(texto: string): Intencao {
  const t = normalizar(texto)
  if (PARAR.test(t)) return 'parar'
  if (CONCLUIR.test(t)) return 'concluir'
  if (PERGUNTA.test(texto.toLowerCase().trim())) return 'perguntar'
  return 'iniciar'
}

export type AlvoPossivel = {
  frenteId: number
  frenteTitulo: string
  projeto: string | null
  area: string
  tarefas: { id: number; titulo: string }[]
}

export type Casamento = {
  confiante: boolean
  frenteId: number | null
  tarefaId: number | null
  tituloDaTarefaNova: string
  nota: number
  segunda: number
}

/** Limpa o titulo da tarefa nova a partir do que foi falado. */
export function tituloDoFalado(texto: string): string {
  const limpo = texto
    .replace(/^\s*(jarvis[,\s]*)?/i, '')
    .replace(/^\s*(estou|to|tou|vou|vamos)\s+/i, '')
    .replace(/^\s*(fazendo|fazer|comecar|começar|comecando|começando|mexer|mexendo|trabalhando|trabalhar)\s+(em|no|na|com)?\s*/i, '')
    .trim()
  const curto = limpo.charAt(0).toUpperCase() + limpo.slice(1)
  return curto.length > 80 ? curto.slice(0, 80) : curto
}

/**
 * Acha a frente e a tarefa mais provaveis. Confiante quando a melhor nota passa
 * de 0,5 E abre pelo menos 0,2 sobre a segunda colocada - sem essa folga, duas
 * frentes parecidas fariam o cronometro cair na errada calado, que e pior do
 * que perguntar.
 */
export function casar(texto: string, alvos: AlvoPossivel[]): Casamento {
  const falado = palavras(texto)
  const tituloNovo = tituloDoFalado(texto)

  if (alvos.length === 0 || falado.length === 0) {
    return { confiante: false, frenteId: null, tarefaId: null, tituloDaTarefaNova: tituloNovo, nota: 0, segunda: 0 }
  }

  const notas = alvos.map((a) => {
    // A frente pontua pelo titulo, pelo projeto e pelas tarefas dela.
    const nFrente = parecenca(falado, a.frenteTitulo)
    const nProjeto = a.projeto ? parecenca(falado, a.projeto) * 0.8 : 0
    let melhorTarefa = 0
    let tarefaId: number | null = null
    for (const t of a.tarefas) {
      const n = parecenca(falado, t.titulo)
      if (n > melhorTarefa) {
        melhorTarefa = n
        tarefaId = t.id
      }
    }
    return {
      frenteId: a.frenteId,
      tarefaId: melhorTarefa >= 0.5 ? tarefaId : null,
      nota: Math.max(nFrente, nProjeto, melhorTarefa),
    }
  })

  notas.sort((x, y) => y.nota - x.nota)
  const melhor = notas[0]
  const segunda = notas[1]?.nota ?? 0

  return {
    confiante: melhor.nota >= 0.5 && melhor.nota - segunda >= 0.2,
    frenteId: melhor.frenteId,
    tarefaId: melhor.tarefaId,
    tituloDaTarefaNova: tituloNovo,
    nota: Number(melhor.nota.toFixed(2)),
    segunda: Number(segunda.toFixed(2)),
  }
}
