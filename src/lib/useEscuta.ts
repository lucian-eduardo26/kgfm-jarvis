'use client'

// O MOTOR DE ESCUTA. Um só, usado pelo comando de voz e pela captura.
//
// POR QUE O MICROFONE CORTAVA (10/09/2026):
// os dois estavam com `continuous = false`. Nesse modo o navegador encerra o
// reconhecimento no primeiro silêncio - e quem está ditando uma sequência
// respira no meio da frase. Pior ainda: o comando mandava sozinho no `onend`,
// então a frase ia pela metade e o sistema respondia sobre metade do assunto.
//
// A correção tem três partes, e as três importam:
//
// 1. `continuous = true` - nao encerra no silencio.
// 2. Religar no `onend` - o Android encerra sozinho MESMO em modo contínuo,
//    por limite de tempo. Enquanto o botao estiver aceso, o motor volta.
// 3. NUNCA enviar sozinho. Quem decide que a frase acabou é a pessoa.
//
// A captura estava pior: o `onend` só apagava a luz, e o texto ficava no campo
// sem nunca ir para lugar nenhum.
//
// POR QUE ELE PEDIA PERMISSÃO TODA VEZ (10/09/2026):
// o reconhecimento de fala do navegador NÃO guarda autorização. Ele abre o
// microfone por conta própria a cada `start()`, e como o motor religa sozinho
// no `onend` (item 2 acima), cada religada podia mostrar o pedido de novo.
//
// O microfone comum (`getUserMedia`) guarda: quando a pessoa autoriza uma vez
// num endereço https, fica autorizado para sempre naquele endereço. Então a
// ordem virou: primeiro abrir o microfone por essa via, SEGURAR o áudio aberto
// enquanto o botão estiver aceso, e só então reconhecer a fala. Com o
// microfone já aberto, as religadas não perguntam mais nada.
//
// Uma ressalva honesta: se a pessoa escolher "permitir desta vez" em vez de
// "permitir", o navegador esquece de propósito e vai perguntar de novo. Por
// isso o aviso de erro aqui diz qual das duas escolher.

import { useCallback, useEffect, useRef, useState } from 'react'

type Reconhecimento = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult:
    | ((e: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>>
      }) => void)
    | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

export type Escuta = {
  /** o navegador oferece reconhecimento de fala? */
  disponivel: boolean
  ouvindo: boolean
  /** o que já foi reconhecido em definitivo */
  texto: string
  /** o pedaco que ainda está sendo reconhecido, para a pessoa ver que funciona */
  parcial: string
  erro: string | null
  /** segundos gravados, para a tela contar igual gravador de áudio */
  segundos: number
  /** há mais de 4 segundos sem reconhecer nada - fala baixa ou parou */
  mudo: boolean
  comecar: () => void
  parar: () => void
  alternar: () => void
  definir: (t: string) => void
  limpar: () => void
}

export function useEscuta(): Escuta {
  const [disponivel, setDisponivel] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [texto, setTexto] = useState('')
  const [parcial, setParcial] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  /** Segundos gravados, para a tela contar igual gravador de áudio. */
  const [segundos, setSegundos] = useState(0)
  /** Quando chegou o último pedaço de fala. Serve para dizer "ainda te ouço". */
  const [ultimoSinal, setUltimoSinal] = useState(0)

  const rec = useRef<Reconhecimento | null>(null)
  const querOuvir = useRef(false)
  const acumulado = useRef('')
  /** O áudio segurado aberto enquanto escuta. É ele que cala o pedido repetido. */
  const trilha = useRef<MediaStream | null>(null)
  /** Já sabemos que este endereço tem permissão? Evita perguntar de novo. */
  const jaAutorizado = useRef(false)
  /** Religadas seguidas que falharam. Três e a escuta assume que parou. */
  const tentativas = useRef(0)
  const religar = useRef<ReturnType<typeof setTimeout> | null>(null)
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null)

  // Ao abrir a tela, pergunta ao navegador se o microfone JÁ está autorizado.
  // Se estiver, o botão começa a escutar na hora, sem pedir nada.
  useEffect(() => {
    const p = navigator.permissions as
      | { query: (d: { name: string }) => Promise<{ state: string }> }
      | undefined
    if (!p?.query) return
    // Nem todo navegador conhece o nome 'microphone'; o catch cobre isso.
    p.query({ name: 'microphone' })
      .then((r) => {
        if (r.state === 'granted') jaAutorizado.current = true
      })
      .catch(() => {})
  }, [])

  // O relógio da gravação. Existe por pedido do Lucian: sem ver o tempo
  // correndo não dá para saber se ainda está gravando ou se travou calado.
  useEffect(() => {
    if (!ouvindo) return
    relogio.current = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => {
      if (relogio.current) clearInterval(relogio.current)
      relogio.current = null
    }
  }, [ouvindo])

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Reconhecimento
      webkitSpeechRecognition?: new () => Reconhecimento
    }
    const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Classe) return
    setDisponivel(true)

    const rr = new Classe()
    rr.lang = 'pt-BR'
    rr.continuous = true
    rr.interimResults = true
    rr.maxAlternatives = 1

    rr.onresult = (e) => {
      let novoFinal = ''
      let emAndamento = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const trecho = e.results[i][0].transcript
        if (e.results[i].isFinal) novoFinal += trecho
        else emAndamento += trecho
      }
      if (novoFinal) {
        acumulado.current = `${acumulado.current} ${novoFinal}`.trim()
        setTexto(acumulado.current)
      }
      setParcial(emAndamento)
      // Qualquer pedaço reconhecido conta como sinal de vida.
      if (novoFinal || emAndamento) setUltimoSinal(Date.now())
    }

    rr.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setErro(
          'O navegador não liberou o microfone. Toque no cadeado ao lado do endereço e escolha PERMITIR - "permitir desta vez" faz ele perguntar de novo na próxima.',
        )
        querOuvir.current = false
        setOuvindo(false)
        jaAutorizado.current = false
        trilha.current?.getTracks().forEach((t) => t.stop())
        trilha.current = null
      } else if (e.error === 'audio-capture') {
        setErro('Nenhum microfone encontrado. Por acesso remoto ele quase nunca passa - teste no celular.')
        querOuvir.current = false
        setOuvindo(false)
      }
      // 'no-speech' e 'aborted' não são erro: o onend religa
    }

    // POR QUE A GRAVACAO TRAVAVA NO MEIO (10/09/2026):
    // aqui religava com `rr.start()` na hora, e o Android RECUSA quando a
    // religada vem rapido demais depois do fim - lanca erro de estado. O
    // `catch` antigo desistia de vez, entao o microfone ficava aceso na tela
    // sem nada ser transcrito. Era exatamente o "passa um pouquinho e trava".
    //
    // Agora espera um respiro e insiste. Tres tentativas seguidas sem
    // conseguir e que valem como desistencia - e ai o motivo aparece na tela,
    // em vez de morrer calado.
    rr.onend = () => {
      if (!querOuvir.current) {
        setOuvindo(false)
        setParcial('')
        return
      }
      const tentar = () => {
        if (!querOuvir.current) return
        try {
          rr.start()
          tentativas.current = 0
        } catch {
          tentativas.current += 1
          if (tentativas.current <= 3) {
            religar.current = setTimeout(tentar, 350 * tentativas.current)
          } else {
            tentativas.current = 0
            querOuvir.current = false
            setOuvindo(false)
            setErro('A escuta parou sozinha. Toque no microfone de novo - o que já foi reconhecido está guardado no campo.')
          }
        }
      }
      religar.current = setTimeout(tentar, 250)
    }

    rec.current = rr
    return () => {
      querOuvir.current = false
      try {
        rr.abort()
      } catch {
        // já estava parado
      }
      if (religar.current) clearTimeout(religar.current)
      // Sair da tela com o microfone aberto deixa a luzinha acesa no aparelho.
      trilha.current?.getTracks().forEach((t) => t.stop())
      trilha.current = null
    }
  }, [])

  /** Liga o reconhecimento de fala. Só é chamado com o microfone já aberto. */
  const ligarMotor = useCallback(() => {
    try {
      rec.current?.start()
    } catch {
      // já estava escutando
    }
  }, [])

  /**
   * Abre o microfone pela via que o navegador MEMORIZA, e segura aberto.
   * Da segunda vez em diante isto não pergunta nada.
   */
  const abrirMicrofone = useCallback(async () => {
    if (trilha.current) return true
    try {
      trilha.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      jaAutorizado.current = true
      return true
    } catch {
      setErro(
        'O microfone não foi liberado. Toque no cadeado ao lado do endereço e escolha PERMITIR - se escolher "permitir desta vez", o navegador esquece e pergunta de novo.',
      )
      querOuvir.current = false
      setOuvindo(false)
      return false
    }
  }, [])

  const comecar = useCallback(() => {
    setErro(null)
    querOuvir.current = true
    tentativas.current = 0
    setSegundos(0)
    setUltimoSinal(Date.now())
    setOuvindo(true)

    // Com permissão já dada, começa AGORA, dentro do toque. Esperar aqui faria
    // o Safari perder o gesto da pessoa e recusar o microfone.
    if (jaAutorizado.current && trilha.current) {
      ligarMotor()
      return
    }
    void abrirMicrofone().then((ok) => {
      if (ok && querOuvir.current) ligarMotor()
    })
  }, [abrirMicrofone, ligarMotor])

  const parar = useCallback(() => {
    querOuvir.current = false
    tentativas.current = 0
    if (religar.current) clearTimeout(religar.current)
    religar.current = null
    setOuvindo(false)
    setParcial('')
    try {
      rec.current?.stop()
    } catch {
      // já estava parado
    }
    // Solta o microfone para a luzinha do aparelho apagar. A AUTORIZAÇÃO fica:
    // quem guarda é o navegador, por endereço, e não este código.
    trilha.current?.getTracks().forEach((t) => t.stop())
    trilha.current = null
  }, [])

  const alternar = useCallback(() => {
    if (querOuvir.current) parar()
    else comecar()
  }, [comecar, parar])

  const definir = useCallback((t: string) => {
    acumulado.current = t
    setTexto(t)
  }, [])

  const limpar = useCallback(() => {
    acumulado.current = ''
    setTexto('')
    setParcial('')
  }, [])

  // `segundos` avança de um em um, então esta conta refaz a cada segundo e
  // não precisa de relógio próprio.
  const mudo = ouvindo && segundos > 0 && Date.now() - ultimoSinal > 4000

  return { disponivel, ouvindo, texto, parcial, erro, segundos, mudo, comecar, parar, alternar, definir, limpar }
}
