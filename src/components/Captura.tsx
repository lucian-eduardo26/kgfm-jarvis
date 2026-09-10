'use client'

// Captura em menos de 10 segundos, ou esta errado por definicao.
// Uma caixa, zero campo obrigatorio, nenhuma escolha de pasta ou categoria.
// No celular o microfone usa a Web Speech API - Android, custo zero.

import { useEffect, useRef, useState } from 'react'
import { capturar } from '@/app/acoes'

type Reconhecimento = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
}

export function Captura({ flutuante = false }: { flutuante?: boolean }) {
  const [texto, setTexto] = useState('')
  const [ouvindo, setOuvindo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [temVoz, setTemVoz] = useState(false)
  const rec = useRef<Reconhecimento | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento }
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

  // Atalho de teclado no desktop: a captura tem que estar sempre a um toque.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        campo.current?.focus()
      }
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [])

  async function enviar(origem: 'texto' | 'voz') {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return
    setEnviando(true)
    const form = new FormData()
    form.set('conteudo', conteudo)
    form.set('origem', origem)
    setTexto('')
    try {
      await capturar(form)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={flutuante ? 'fixed bottom-0 left-0 right-0 z-40 bg-[var(--fundo)]/95 backdrop-blur px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 border-t border-[var(--linha)]' : ''}>
      <div className="mx-auto w-full max-w-[1400px] flex gap-2 items-end">
        <textarea
          ref={campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void enviar('texto')
            }
          }}
          rows={1}
          placeholder={ouvindo ? 'Ouvindo...' : 'Capturar (Ctrl+K)'}
          className="campo resize-none flex-1"
          style={{ minHeight: 48, maxHeight: 120 }}
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
        <button
          type="button"
          disabled={!texto.trim() || enviando}
          onClick={() => void enviar(ouvindo ? 'voz' : 'texto')}
          className="botao shrink-0 px-4"
        >
          {enviando ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
