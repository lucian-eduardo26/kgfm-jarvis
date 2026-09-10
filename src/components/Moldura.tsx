// A casca do hub: trilho de icones a esquerda (desktop), cabecalho com a marca
// e os tres pontinhos.
//
// No celular o trilho some e a navegacao continua sendo os tres pontinhos - e
// o que cabe na mao, e o mockup do telefone tambem mostra so o menu.

import Link from 'next/link'
import { Menu } from './Menu'

const ATALHOS = [
  { href: '/painel', nome: 'Painel', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { href: '/projetos', nome: 'Projetos', d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/frentes', nome: 'Frentes', d: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/semana', nome: 'A semana', d: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4' },
  { href: '/conversa', nome: 'Conversa', d: 'M4 5h16v11H9l-5 4z' },
  { href: '/config', nome: 'Configuracao', d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 12h2M18 12h2M12 4v2M12 18v2' },
]

function Icone({ d, preenchido }: { d: string; preenchido: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={preenchido ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function Moldura({
  titulo,
  children,
  acao,
  atalhoAtivo,
}: {
  titulo: string
  children: React.ReactNode
  acao?: React.ReactNode
  atalhoAtivo?: string
}) {
  return (
    <>
      <nav className="trilho" aria-label="Atalhos">
        {ATALHOS.map((a) => (
          <Link key={a.href} href={a.href} title={a.nome} aria-label={a.nome} data-ativo={atalhoAtivo === a.href ? '1' : '0'}>
            <Icone d={a.d} preenchido={a.href === '/painel'} />
          </Link>
        ))}
      </nav>

      <div className="com-trilho">
        <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5 pb-28">
          <header className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/painel" className="flex items-center gap-2.5 shrink-0">
                {/* A marca: o ponto laranja e o nome, como no mockup. */}
                <span
                  className="w-6 h-6 rounded-full grid place-items-center shrink-0"
                  style={{ border: '1px solid var(--moldura-forte)', boxShadow: '0 0 14px -3px var(--brilho)' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--laranja)' }} />
                </span>
                <span className="text-base font-bold tracking-[0.14em]">JARVIS</span>
              </Link>
              <span className="fraco hidden sm:inline">|</span>
              <h1 className="text-[11px] uppercase tracking-[0.14em] fraco truncate">{titulo}</h1>
            </div>
            <div className="flex items-center gap-2">
              {acao}
              <span className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.12em]" style={{ color: 'var(--laranja-luz)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--laranja)' }} />
                KGFM
              </span>
              <Menu />
            </div>
          </header>
          {children}
        </div>
      </div>
    </>
  )
}

/** Cabecalho de painel no estilo do hub. */
export function Cabeca({ titulo, direita }: { titulo: string; direita?: React.ReactNode }) {
  return (
    <div className="painel-cabeca">
      <span className="rotulo">{titulo}</span>
      <span className="flex items-center gap-2">
        {direita}
        <span className="pontos-painel" aria-hidden>
          <i />
          <i />
          <i />
        </span>
      </span>
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
