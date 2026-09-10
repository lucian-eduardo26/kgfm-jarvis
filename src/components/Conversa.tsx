'use client'

// Falar com o Jarvis. Escutar e ler em voz alta acontecem no navegador e custam
// zero; o que se paga sao os tokens da resposta.

import { useEffect, useRef, useState } from 'react'
import type { Fala } from '@/lib/conversa'
import { falar as falarVoz } from '@/lib/vozNavegador'

type Reconhecimento = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
}

export function Conversa({ responderAcao }: { responderAcao: (h: Fala[]) => Promise<string> }) {
  const [falas, setFalas] = useState<Fala[]>([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [lerEmVoz, setLerEmVoz] = useState(false)
  const [temVoz, setTemVoz] = useState(false)
  const rec = useRef<Reconhecimento | null>(null)
  const fim = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Reconhecimento
      webkitSpeechRecognition?: new () => Reconhecimento
    }
    const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Classe) return
    setTemVoz(true)
    const r = new Classe()
    r.lang = 'pt-BR'
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      setTexto(t)
    }
    r.onend = () => setOuvindo(false)
    rec.current = r
  }, [])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth' })
  }, [falas, pensando])

  function falar(t: string) {
    if (lerEmVoz) falarVoz(t)
  }

  async function mandar() {
    const t = texto.trim()
    if (!t || pensando) return
    const novo: Fala[] = [...falas, { quem: 'lucian', texto: t }]
    setFalas(novo)
    setTexto('')
    setPensando(true)
    try {
      const resposta = await responderAcao(novo)
      setFalas([...novo, { quem: 'jarvis', texto: resposta }])
      falar(resposta)
    } catch {
      setFalas([...novo, { quem: 'jarvis', texto: 'Deu erro na chamada. Confira a chave da API em Configuração.' }])
    } finally {
      setPensando(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 180px)' }}>
      <div className="flex-1 space-y-3 mb-3">
        {falas.length === 0 && !pensando && (
          <div className="cartao p-5">
            <p className="rotulo">jarvis em escuta</p>
            <p className="text-sm mt-2 max-w-2xl">
              Eu leio o painel inteiro antes de responder: mostradores, críticos, frentes, o
              cronômetro e a estratégia carregada. Pergunte o que quiser sobre o estado da empresa -
              e conte comigo para discordar quando o dado disser outra coisa.
            </p>
            <p className="fraco text-xs mt-3">
              Ainda não mexo no sistema pela conversa: não abro frente nem aponto hora. Para isso,
              as telas.
            </p>
          </div>
        )}

        {falas.map((f, i) => (
          <div
            key={i}
            className={f.quem === 'lucian' ? 'flex justify-end' : ''}
          >
            <div
              className={
                f.quem === 'lucian'
                  ? 'cartao p-3 max-w-[85%] sm:max-w-[70%] text-sm'
                  : 'cartao p-4 max-w-[95%] sm:max-w-[80%]'
              }
              style={f.quem === 'jarvis' ? { borderColor: 'rgba(255,61,0,.35)' } : undefined}
            >
              {f.quem === 'jarvis' && <p className="rotulo mb-1.5">jarvis</p>}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{f.texto}</p>
            </div>
          </div>
        ))}

        {pensando && (
          <div className="cartao p-4 max-w-[80%]">
            <p className="rotulo">jarvis</p>
            <p className="fraco text-sm mt-1">lendo o painel...</p>
          </div>
        )}
        <div ref={fim} />
      </div>

      <div className="sticky bottom-0 bg-[var(--fundo)]/95 backdrop-blur pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 items-end">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void mandar()
              }
            }}
            rows={1}
            placeholder={ouvindo ? 'Ouvindo...' : 'Falar com o Jarvis'}
            className="campo resize-none flex-1"
            style={{ minHeight: 48, maxHeight: 140 }}
          />
          {temVoz && (
            <button
              type="button"
              aria-label="Falar"
              onClick={() => {
                if (ouvindo) {
                  rec.current?.stop()
                  setOuvindo(false)
                } else {
                  setOuvindo(true)
                  rec.current?.start()
                }
              }}
              className="botao-fantasma w-12 shrink-0 grid place-items-center"
              style={ouvindo ? { borderColor: 'var(--laranja)', color: 'var(--laranja)' } : undefined}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-3.06A9 9 0 0 0 21 11h-2Z" />
              </svg>
            </button>
          )}
          <button type="button" onClick={() => void mandar()} disabled={!texto.trim() || pensando} className="botao px-4 shrink-0">
            {pensando ? '...' : 'Enviar'}
          </button>
        </div>

        <label className="flex items-center gap-2 mt-2 text-xs fraco cursor-pointer">
          <input type="checkbox" checked={lerEmVoz} onChange={(e) => setLerEmVoz(e.target.checked)} />
          Ler a resposta em voz alta (voz do navegador, custo zero)
        </label>
      </div>
    </div>
  )
}
