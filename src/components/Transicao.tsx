'use client'

// A TRANSIÇÃO ENTRE TELAS.
//
// O Lucian em 10/09/2026: "eu estou mexendo na tela, às vezes mudou e eu não
// percebi, porque não tem uma transição".
//
// O problema é real e não é frescura: navegação por deslize troca o conteúdo
// sem mover nada, então o olho não tem pista de que houve mudança. Um quarto
// de segundo de deslocamento resolve - o suficiente para o olho registrar,
// curto o bastante para não atrasar quem já sabe para onde vai.
//
// A chave é o caminho: mudou a rota, o elemento é remontado e a animação
// roda de novo. Sem isso o React reaproveita o nó e nada acontece.
//
// Quem pediu menos movimento no sistema operacional não recebe movimento -
// a regra está no globals.css.

import { usePathname } from 'next/navigation'

export function Transicao({ children }: { children: React.ReactNode }) {
  const caminho = usePathname()
  return (
    <div key={caminho} className="tela-entrando">
      {children}
    </div>
  )
}
