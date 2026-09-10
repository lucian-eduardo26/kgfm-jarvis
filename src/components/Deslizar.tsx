'use client'

// DESLIZAR ENTRE AS TELAS com o dedão, no celular.
//
// Pedido do Lucian em 10/09/2026: "eu quero algo na palma da mão, se eu girar
// com o dedão a experiência é bem melhor" do que abrir os três pontinhos toda
// vez. Os três pontinhos continuam - isto é um atalho, não a substituição.
//
// Só no celular, de propósito. No computador existe o trilho de ícones à
// esquerda, e arrastar o mouse para trocar de página não é gesto que ninguém
// espera.
//
// TRÊS CUIDADOS QUE FAZEM A DIFERENÇA ENTRE ÚTIL E IRRITANTE:
//
// 1. Nunca cancelar o gesto do navegador. Os eventos são passivos e não
//    chamam preventDefault - rolar a página continua sendo rolar a página.
// 2. O gesto tem que ser CLARAMENTE horizontal: 70px de lado e pelo menos o
//    dobro do movimento vertical. Sem isso, rolar torto trocaria de tela.
// 3. Nada de deslizar dentro de campo de texto, de algo que rola de lado, ou
//    da barra de captura. Ali o arrasto tem outro dono.

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** A ordem das telas. É a mesma do trilho de ícones, para o modelo mental
    ser um só: o que está à direita no trilho está à direita no dedo. */
export const ORDEM_DAS_TELAS = [
  { href: '/painel', nome: 'Painel' },
  { href: '/projetos', nome: 'Projetos' },
  { href: '/frentes', nome: 'Frentes' },
  { href: '/semana', nome: 'A semana' },
  { href: '/estrategia', nome: 'Estratégia' },
  { href: '/conversa', nome: 'Conversa' },
]

function podeDeslizarAqui(alvo: EventTarget | null): boolean {
  let e = alvo as HTMLElement | null
  while (e && e !== document.body) {
    const tag = e.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false
    if (e.dataset?.semDeslize !== undefined) return false
    // Algo que rola de lado tem dono para o arrasto horizontal.
    if (e.scrollWidth > e.clientWidth + 4) {
      const ov = getComputedStyle(e).overflowX
      if (ov === 'auto' || ov === 'scroll') return false
    }
    e = e.parentElement
  }
  return true
}

export function Deslizar() {
  const router = useRouter()
  const caminho = usePathname()
  const inicio = useRef<{ x: number; y: number; valido: boolean } | null>(null)
  const [indo, setIndo] = useState<'esquerda' | 'direita' | null>(null)

  const atual = ORDEM_DAS_TELAS.findIndex((t) => caminho.startsWith(t.href))

  useEffect(() => {
    // Só onde faz sentido: telefone e tablet, e onde existe dedo.
    if (window.matchMedia('(min-width: 1024px)').matches) return
    if (atual < 0) return

    function comecou(e: TouchEvent) {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      inicio.current = { x: t.clientX, y: t.clientY, valido: podeDeslizarAqui(e.target) }
    }

    function terminou(e: TouchEvent) {
      const i = inicio.current
      inicio.current = null
      if (!i || !i.valido) return

      const t = e.changedTouches[0]
      const dx = t.clientX - i.x
      const dy = t.clientY - i.y

      // Claramente horizontal, ou nada acontece.
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return

      const destino = dx < 0 ? atual + 1 : atual - 1
      if (destino < 0 || destino >= ORDEM_DAS_TELAS.length) return

      setIndo(dx < 0 ? 'esquerda' : 'direita')
      router.push(ORDEM_DAS_TELAS[destino].href)
    }

    document.addEventListener('touchstart', comecou, { passive: true })
    document.addEventListener('touchend', terminou, { passive: true })
    return () => {
      document.removeEventListener('touchstart', comecou)
      document.removeEventListener('touchend', terminou)
    }
  }, [atual, router])

  // Limpa a marca de movimento quando a página nova chega.
  useEffect(() => setIndo(null), [caminho])

  if (atual < 0) return null

  return (
    <div className="pontos-telas" aria-hidden data-indo={indo ?? ''}>
      {ORDEM_DAS_TELAS.map((t, i) => (
        <span key={t.href} className={i === atual ? 'ponto-tela ponto-tela-aqui' : 'ponto-tela'} />
      ))}
    </div>
  )
}
