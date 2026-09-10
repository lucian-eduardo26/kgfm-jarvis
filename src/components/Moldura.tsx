// Cabecalho comum das telas internas: marca, titulo e os tres pontinhos.
// Aqui dentro o laranja e so marca - la fora, vermelho e que significa critico.

import Link from 'next/link'
import { Menu } from './Menu'

export function Moldura({
  titulo,
  children,
  acao,
}: {
  titulo: string
  children: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-5 pb-24">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <Link href="/painel" className="text-lg font-black tracking-tight shrink-0">
            <span style={{ color: 'var(--laranja)' }}>J</span>ARVIS
          </Link>
          <h1 className="text-sm fraco truncate">{titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          {acao}
          <Menu />
        </div>
      </header>
      {children}
    </div>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: React.ReactNode }) {
  // Nada de tela vazia: estado sem dado explica o que fazer para preenche-lo.
  return (
    <div className="cartao p-6 text-center">
      <p className="font-semibold">{titulo}</p>
      <p className="fraco text-sm mt-1 max-w-md mx-auto">{texto}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
