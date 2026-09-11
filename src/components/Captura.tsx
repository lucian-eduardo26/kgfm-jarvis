'use client'

// A captura: qualquer coisa, em menos de dez segundos, sem escolher nada.
//
// O microfone daqui estava INOPERANTE (achado em 10/09/2026): o `onend` so
// apagava a luz, o texto reconhecido ficava no campo e nunca ia para lugar
// nenhum. Agora usa o mesmo motor de escuta do comando de voz, que escuta
// contínuo e devolve o texto de verdade.

import { useEffect, useRef, useState } from 'react'
import { capturar } from '@/app/acoes'
import { useEscuta } from '@/lib/useEscuta'
import { Gravando } from './Gravando'

export function Captura({ flutuante = false }: { flutuante?: boolean }) {
  const [enviando, setEnviando] = useState(false)
  const campo = useRef<HTMLTextAreaElement>(null)
  const barra = useRef<HTMLDivElement>(null)
  const escuta = useEscuta()

  // A barra é fixa no rodapé, então o fim da página precisa terminar acima
  // dela. A altura não é constante - o campo vira duas linhas ao ditar - então
  // quem mede é o próprio elemento, e o padding do conteúdo acompanha.
  useEffect(() => {
    const alvo = barra.current
    if (!alvo || !flutuante) return
    // `offsetHeight` e não `contentRect`: a barra tem padding e borda, e o
    // contentRect deixa os dois de fora - o conteúdo terminava 25px por baixo.
    const olho = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--altura-captura', `${alvo.offsetHeight}px`)
    })
    olho.observe(alvo)
    return () => {
      olho.disconnect()
      // Página sem barra flutuante não deve herdar o espaço dela.
      document.documentElement.style.setProperty('--altura-captura', '0px')
    }
  }, [flutuante])

  const noCampo = escuta.parcial ? `${escuta.texto} ${escuta.parcial}`.trim() : escuta.texto

  // Atalho no desktop: a captura tem que estar sempre a um toque.
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

  async function enviar() {
    const conteudo = noCampo.trim()
    if (!conteudo || enviando) return
    escuta.parar()
    setEnviando(true)
    const form = new FormData()
    form.set('conteudo', conteudo)
    form.set('origem', escuta.texto ? 'voz' : 'texto')
    escuta.limpar()
    try {
      await capturar(form)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      ref={barra}
      className={
        flutuante
          ? 'captura-flutuante fixed bottom-0 left-0 right-0 z-40 bg-[var(--fundo)]/95 backdrop-blur px-3 pb-3 pt-3 border-t border-[var(--linha)]'
          : ''
      }
    >
      <div className="mx-auto w-full max-w-[1500px]">
        {escuta.ouvindo && (
          <div className="mb-1.5">
            <Gravando segundos={escuta.segundos} mudo={escuta.mudo} />
          </div>
        )}
        {escuta.erro && (
          <p className="text-[11px] mb-1.5" style={{ color: 'var(--ambar)' }}>
            {escuta.erro}
          </p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={campo}
            value={noCampo}
            onChange={(e) => escuta.definir(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
            rows={escuta.ouvindo || noCampo.length > 70 ? 2 : 1}
            placeholder={escuta.ouvindo ? 'Ouvindo - toque no microfone para encerrar' : 'Capturar (Ctrl+K)'}
            className="campo resize-none flex-1"
            style={{ maxHeight: 140 }}
          />
          {escuta.disponivel && (
            <button
              type="button"
              aria-label={escuta.ouvindo ? 'Parar de ouvir' : 'Falar'}
              onClick={escuta.alternar}
              className="botao-fantasma w-12 shrink-0 grid place-items-center"
              style={
                escuta.ouvindo
                  ? { borderColor: 'var(--laranja)', color: 'var(--laranja)', boxShadow: '0 0 0 4px rgba(255,61,0,.13)' }
                  : undefined
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-3.06A9 9 0 0 0 21 11h-2Z" />
              </svg>
            </button>
          )}
          <button type="button" disabled={!noCampo.trim() || enviando} onClick={() => void enviar()} className="botao shrink-0 px-4">
            {enviando ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
