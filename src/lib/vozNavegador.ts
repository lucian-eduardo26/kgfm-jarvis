// A VOZ DO JARVIS - a de graca, que roda no navegador.
//
// O Windows vem com Daniel e Maria, vozes de 2010 que soam como robo de
// secretaria eletronica. Existem vozes MUITO melhores e igualmente gratuitas -
// as "Natural" / "Online (Natural)" da Microsoft - e o navegador as expoe
// automaticamente quando estão instaladas. O Edge expoe uma lista enorme delas
// sem instalar nada.
//
// Por isso este arquivo faz duas coisas: escolhe a melhor voz disponível
// sozinho, e deixa o Lucian trocar se quiser.
//
// Voz de cinema de verdade (ElevenLabs e afins) e assinatura mensal - foi
// recusada de propósito: ele não quer mensalidade, e a diferenca não paga isso.

const CHAVE = 'jarvis.voz'

/** Quanto uma voz vale, só pelo nome. Maior e melhor. */
function qualidade(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase()
  let q = 0
  if (n.includes('natural')) q += 100
  if (n.includes('online')) q += 40
  if (n.includes('neural')) q += 100
  // Google costuma ser bem melhor que a SAPI antiga do Windows.
  if (n.includes('google')) q += 60
  // As duas velhas do Windows: explicitamente no fim da fila.
  if (n.includes('daniel') || n.includes('maria')) q -= 30
  if (v.lang.toLowerCase().startsWith('pt-br')) q += 20
  else if (v.lang.toLowerCase().startsWith('pt')) q += 10
  return q
}

export function vozesDisponiveis(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('pt'))
    .sort((a, b) => qualidade(b) - qualidade(a))
}

/** As vozes chegam em duas etapas no Chrome: a lista começa vazia. */
export function aoCarregarVozes(cb: () => void): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return () => {}
  if (window.speechSynthesis.getVoices().length > 0) cb()
  const h = () => cb()
  window.speechSynthesis.addEventListener('voiceschanged', h)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', h)
}

export function vozEscolhida(): string | null {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

export function escolherVoz(nome: string) {
  try {
    localStorage.setItem(CHAVE, nome)
  } catch {
    // navegador sem armazenamento: segue com a escolha automática
  }
}

export function vozAtual(): SpeechSynthesisVoice | null {
  const lista = vozesDisponiveis()
  if (lista.length === 0) return null
  const salva = vozEscolhida()
  return lista.find((v) => v.name === salva) ?? lista[0]
}

/**
 * Fala. Um pouco mais devagar que o padrão e com tom levemente grave - o
 * padrão do Windows e apressado e agudo, e e metade da sensacao de robo.
 */
export function falar(texto: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !texto.trim()) return
  window.speechSynthesis.cancel()
  const f = new SpeechSynthesisUtterance(texto)
  const v = vozAtual()
  if (v) {
    f.voice = v
    f.lang = v.lang
  } else {
    f.lang = 'pt-BR'
  }
  f.rate = 0.98
  f.pitch = 0.92
  window.speechSynthesis.speak(f)
}

export function calar() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}
