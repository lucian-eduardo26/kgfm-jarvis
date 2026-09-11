'use client'

// O RODAPÉ FIXO, e o deslize com o dedão.
//
// Os pontinhos morreram em 10/09/2026, e o Lucian estava certo: "ficam
// sobrepostos, passa o botão embaixo deles, e estão muito pequenos - eu não
// sei onde estou". Ponto de 6px não é gestão visual, é decoração. E dois
// elementos flutuando na mesma faixa do rodapé disputavam o mesmo dedo.
//
// No lugar entrou o que ele pediu: um rodapé fixo, irmão do cabeçalho fixo.
// Ícone para cada tela, e a tela atual ganha TRÊS sinais ao mesmo tempo - a
// cor da seção, o nome escrito, e um traço em cima. Redundância de propósito:
// um sinal só falha em tela pequena, com sol na tela, com pressa.
//
// O deslize continua. O rodapé não substitui o gesto - mostra onde ele levou.
//
// SÃO SETE TELAS, e não oito: num telefone de 375px, oito alvos ficam com
// 44px cada e encostam um no outro. Estratégia saiu do rodapé e continua nos
// três pontinhos, porque é a que ele abre menos vezes por dia.
//
// TRÊS CUIDADOS QUE FAZEM A DIFERENÇA ENTRE ÚTIL E IRRITANTE:
// 1. Nunca cancelar o gesto do navegador: os eventos são passivos.
// 2. O gesto tem que ser CLARAMENTE horizontal - 55px de lado e mais da
//    metade a mais que o movimento vertical.
// 3. Nada de deslizar dentro de campo de texto ou de algo que rola de lado.

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

/** A ordem das telas. É a mesma do trilho de ícones no computador, para o
    modelo mental ser um só: o que está à direita lá está à direita aqui. */
export const ORDEM_DAS_TELAS = [
  { href: '/painel', nome: 'Painel', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { href: '/projetos', nome: 'Projetos', d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/agenda', nome: 'Agenda', d: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4' },
  { href: '/frentes', nome: 'Frentes', d: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/prioridades', nome: 'Prioridade', d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { href: '/semana', nome: 'Semana', d: 'M3 12h4l3-8 4 16 3-8h4' },
  { href: '/conversa', nome: 'Conversa', d: 'M4 5h16v11H9l-5 4z' },
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

  const atual = ORDEM_DAS_TELAS.findIndex((t) => caminho.startsWith(t.href))

  useEffect(() => {
    // Só no celular: no computador existe o trilho, e arrastar o mouse para
    // trocar de página não é gesto que ninguém espera.
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
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.6) return

      const destino = dx < 0 ? atual + 1 : atual - 1
      if (destino < 0 || destino >= ORDEM_DAS_TELAS.length) return
      router.push(ORDEM_DAS_TELAS[destino].href)
    }

    document.addEventListener('touchstart', comecou, { passive: true })
    document.addEventListener('touchend', terminou, { passive: true })
    return () => {
      document.removeEventListener('touchstart', comecou)
      document.removeEventListener('touchend', terminou)
    }
  }, [atual, router])

  // Tela fora da lista (config, caixa, playbook) não acende nada no rodapé,
  // mas o rodapé continua lá: sumir com a navegação em algumas telas é o tipo
  // de coisa que faz a pessoa achar que o aplicativo travou.
  return (
    <nav className="rodape" aria-label="Telas">
      {ORDEM_DAS_TELAS.map((t, i) => {
        const aqui = i === atual
        return (
          <Link
            key={t.href}
            href={t.href}
            className={aqui ? 'rodape-item rodape-aqui' : 'rodape-item'}
            aria-current={aqui ? 'page' : undefined}
            aria-label={t.nome}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={t.d} />
            </svg>
            {/* O nome só na tela atual: sete nomes lado a lado não cabem num
                telefone, e o nome de onde você NÃO está não ajuda ninguém. */}
            {aqui && <span className="rodape-nome">{t.nome}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
