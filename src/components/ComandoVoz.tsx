'use client'

// "Jarvis, estou fazendo o detalhamento do transportador."
// Fala -> tarefa identificada -> relogio rodando -> veredito sobre prioridade.
// O reconhecimento de fala e do navegador: zero custo, Android e Chrome no PC.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ResultadoComando } from '@/lib/comando'

type Reconhecimento = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
}

export function ComandoVoz({ acao }: { acao: (texto: string) => Promise<ResultadoComando> }) {
  const [texto, setTexto] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [r, setR] = useState<ResultadoComando | null>(null)
  const [temVoz, setTemVoz] = useState(false)
  const rec = useRef<Reconhecimento | null>(null)
  const router = useRouter()

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => Reconhecimento
      webkitSpeechRecognition?: new () => Reconhecimento
    }
    const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Classe) return
    setTemVoz(true)
    const rr = new Classe()
    rr.lang = 'pt-BR'
    rr.continuous = false
    rr.interimResults = true
    rr.onresult = (e) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      setTexto(t)
    }
    rr.onend = () => {
      setOuvindo(false)
      // Parou de falar: manda sozinho. Um toque a menos e um toque que importa.
      setTimeout(() => enviarRef.current?.(), 250)
    }
    rec.current = rr
  }, [])

  const enviarRef = useRef<(() => void) | null>(null)

  async function enviar() {
    const t = texto.trim()
    if (!t || processando) return
    setProcessando(true)
    setR(null)
    try {
      const resultado = await acao(t)
      setR(resultado)
      setTexto('')
      if (typeof window !== 'undefined' && window.speechSynthesis && resultado.resposta) {
        const f = new SpeechSynthesisUtterance(resultado.resposta)
        f.lang = 'pt-BR'
        window.speechSynthesis.speak(f)
      }
      router.refresh()
    } catch {
      setR({
        ok: false,
        acao: 'nada',
        tarefa: null,
        frente: null,
        area: null,
        resposta: 'Deu erro na chamada. Confira a chave da API em Configuracao.',
        alinhamento: 'sem prioridade definida',
        recomendado: null,
      })
    } finally {
      setProcessando(false)
    }
  }
  enviarRef.current = enviar

  const corDoVeredito =
    r?.alinhamento === 'e a prioridade'
      ? 'var(--verde)'
      : r?.alinhamento === 'nao e a prioridade'
        ? 'var(--ambar)'
        : 'var(--fraco)'

  return (
    <section className="cartao p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="rotulo">o que voce esta fazendo</p>
        {processando && <span className="text-xs fraco font-mono">PENSANDO...</span>}
      </div>

      <div className="flex gap-2 items-center mt-2">
        {temVoz && (
          <button
            type="button"
            aria-label={ouvindo ? 'Parar de ouvir' : 'Falar'}
            onClick={() => {
              if (ouvindo) {
                rec.current?.stop()
                setOuvindo(false)
              } else {
                setTexto('')
                setOuvindo(true)
                rec.current?.start()
              }
            }}
            className="shrink-0 w-14 h-14 rounded-full grid place-items-center border-2 transition"
            style={{
              borderColor: ouvindo ? 'var(--laranja)' : 'var(--borda)',
              color: ouvindo ? 'var(--laranja)' : 'var(--texto)',
              boxShadow: ouvindo ? '0 0 26px rgba(255,61,0,.45)' : 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-3.06A9 9 0 0 0 21 11h-2Z" />
            </svg>
          </button>
        )}

        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void enviar()
            }
          }}
          placeholder={ouvindo ? 'Ouvindo...' : 'Estou fazendo o detalhamento do transportador'}
          className="campo flex-1"
        />
        <button type="button" onClick={() => void enviar()} disabled={!texto.trim() || processando} className="botao shrink-0">
          Iniciar
        </button>
      </div>

      {r && (
        <div className="mt-3 pt-3 border-t border-[var(--borda)]">
          <p className="text-sm">{r.resposta}</p>

          {r.acao === 'iniciar' && r.ok && (
            <p className="text-xs fraco mt-2 font-mono">
              RODANDO: {r.tarefa} · {r.frente} · {r.area}
            </p>
          )}

          {r.alinhamento !== 'sem prioridade definida' && (
            <p className="text-xs mt-2" style={{ color: corDoVeredito }}>
              {r.alinhamento === 'e a prioridade'
                ? 'Isto e o que o painel apontaria agora.'
                : `O painel apontaria outra coisa: ${r.recomendado}. Voce decide - mas decide sabendo.`}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
