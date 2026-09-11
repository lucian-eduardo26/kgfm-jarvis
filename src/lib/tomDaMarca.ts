// O TOM DA ABERTURA, sintetizado na hora.
//
// O Lucian em 11/09/2026: "pode montar um tom curto, eu não tenho áudio".
//
// Então não existe arquivo: o som é DESENHADO aqui, em ondas, e sai do próprio
// navegador. Vantagem que não é pequena - zero byte para baixar, nada para
// hospedar, e nenhum chiado de MP3 comprimido num telefone.
//
// O DESENHO. A KGFM é automação intralogística, e o som segue a marca: dois
// tons limpos subindo uma quinta justa (lá 440 para mi 659), com um terceiro
// bem baixinho uma oitava acima para dar o brilho metálico da peça usinada.
// Onda triangular e não quadrada: quadrada é alarme de eletrodoméstico.
//
// Ataque suave e queda longa, oito décimos no total. O volume é deliberadamente
// baixo - som de abertura que assusta é som que a pessoa desliga no dia
// seguinte, e aí não existe mais.
//
// POR QUE ISTO PRECISA DE UM TOQUE DELE: o Safari não deixa nenhuma página
// emitir som sem um gesto do usuário naquela página. Abrir o aplicativo pelo
// ícone da tela inicial é gesto no iOS, não na página. Então o contexto de
// áudio nasce DENTRO do `pointerdown` - é a única janela em que o iPhone
// libera - e, se ele não encostar na tela, a abertura roda em silêncio.

/** Toca o tom. Precisa ser chamado de dentro de um gesto do usuário. */
export function tocarTomDaMarca(): void {
  type JanelaComAudio = Window & { webkitAudioContext?: typeof AudioContext }
  const Contexto =
    typeof window === 'undefined'
      ? undefined
      : window.AudioContext ?? (window as JanelaComAudio).webkitAudioContext
  if (!Contexto) return

  let ctx: AudioContext
  try {
    ctx = new Contexto()
  } catch {
    return
  }
  // No iOS o contexto pode nascer suspenso mesmo dentro do gesto.
  void ctx.resume?.()

  const t0 = ctx.currentTime + 0.01

  const mestre = ctx.createGain()
  mestre.gain.value = 0.085
  mestre.connect(ctx.destination)

  function nota(freq: number, atraso: number, duracao: number, forca: number) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t0 + atraso)

    // Rampa exponencial nunca pode tocar o zero, por isso o 0.0001: com zero
    // o método não faz nada e a nota entra com um estalo.
    g.gain.setValueAtTime(0.0001, t0 + atraso)
    g.gain.exponentialRampToValueAtTime(forca, t0 + atraso + 0.035)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + atraso + duracao)

    osc.connect(g)
    g.connect(mestre)
    osc.start(t0 + atraso)
    osc.stop(t0 + atraso + duracao + 0.05)
  }

  // Lá 440: a fundamental, que entra com a assinatura.
  nota(440, 0, 0.55, 1)
  // Mi 659, uma quinta acima, entrando quando o fio laranja corre.
  nota(659.25, 0.16, 0.62, 0.85)
  // Lá 880 quase inaudível: é ele que dá o brilho, não a melodia.
  nota(880, 0.16, 0.45, 0.22)

  // Fecha o contexto sozinho. Contexto de áudio aberto segura recurso de som
  // do telefone, e o Jarvis não tem nada mais para tocar depois disto.
  window.setTimeout(() => void ctx.close?.(), 1600)
}
