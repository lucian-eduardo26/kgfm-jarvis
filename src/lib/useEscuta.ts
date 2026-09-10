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

  const rec = useRef<Reconhecimento | null>(null)
  const querOuvir = useRef(false)
  const acumulado = useRef('')

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
    }

    rr.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setErro('O navegador não liberou o microfone. Toque no cadeado ao lado do endereco e permita.')
        querOuvir.current = false
        setOuvindo(false)
      } else if (e.error === 'audio-capture') {
        setErro('Nenhum microfone encontrado. Por acesso remoto ele quase nunca passa - teste no celular.')
        querOuvir.current = false
        setOuvindo(false)
      }
      // 'no-speech' e 'aborted' não são erro: o onend religa
    }

    rr.onend = () => {
      if (!querOuvir.current) {
        setOuvindo(false)
        setParcial('')
        return
      }
      try {
        rr.start()
      } catch {
        querOuvir.current = false
        setOuvindo(false)
      }
    }

    rec.current = rr
    return () => {
      querOuvir.current = false
      try {
        rr.abort()
      } catch {
        // já estava parado
      }
    }
  }, [])

  const comecar = useCallback(() => {
    setErro(null)
    querOuvir.current = true
    setOuvindo(true)
    try {
      rec.current?.start()
    } catch {
      // já estava escutando
    }
  }, [])

  const parar = useCallback(() => {
    querOuvir.current = false
    setOuvindo(false)
    setParcial('')
    try {
      rec.current?.stop()
    } catch {
      // já estava parado
    }
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

  return { disponivel, ouvindo, texto, parcial, erro, comecar, parar, alternar, definir, limpar }
}
