'use client'

// Tres pontinhos. E a UNICA navegação do sistema - nada de menu em arvore.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PAGINAS = [
  { href: '/painel', nome: 'Painel' },
  { href: '/conversa', nome: 'Conversa' },
  { href: '/caixa', nome: 'Caixa e runway' },
  { href: '/semana', nome: 'A semana' },
  { href: '/projetos', nome: 'Projetos' },
  { href: '/prioridades', nome: 'Prioridade dos projetos' },
  { href: '/frentes', nome: 'Frentes' },
  { href: '/playbook', nome: 'Playbook' },
  { href: '/estrategia', nome: 'Estratégia' },
  { href: '/capturas', nome: 'Capturas' },
  { href: '/config', nome: 'Configuração' },
]

export function Menu() {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)
  const caminho = usePathname()

  useEffect(() => setAberto(false), [caminho])

  useEffect(() => {
    // `pointerdown` e não `mousedown`: no celular o toque fora precisa fechar
    // na hora, sem esperar o mouse emulado que nem sempre vem.
    function fora(e: PointerEvent) {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false)
    }
    function escapou(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', escapou)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', escapou)
    }
  }, [])

  return (
    <div className="relative" ref={caixa}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Menu"
        aria-expanded={aberto}
        className="w-11 h-11 grid place-items-center rounded-xl border border-[var(--linha)]"
      >
        <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor">
          <circle cx="2" cy="2" r="2" />
          <circle cx="2" cy="9" r="2" />
          <circle cx="2" cy="16" r="2" />
        </svg>
      </button>

      {aberto && (
        <nav className="folha-menu absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] cartao p-1 z-50 shadow-2xl">
          {PAGINAS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`block px-3 py-3 rounded-lg text-sm ${
                caminho.startsWith(p.href) ? 'bg-[var(--superficie-alta)] font-semibold' : ''
              }`}
            >
              {p.nome}
            </Link>
          ))}
          <form action="/api/sair" method="post">
            <button className="w-full text-left px-3 py-3 rounded-lg text-sm fraco">Sair</button>
          </form>
        </nav>
      )}
    </div>
  )
}
