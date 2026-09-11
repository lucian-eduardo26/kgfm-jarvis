// A casca do hub: trilho de ícones à esquerda (desktop) e um cabeçalho fixo
// no topo com a marca da KGFM, o nome do produto e os três pontinhos.
//
// Por que o cabeçalho é fixo (10/09/2026): antes a marca rolava junto com o
// conteúdo e o botão de menu acabava por cima dos cartões no celular. Faixa
// fixa resolve as duas coisas - a identidade fica sempre visível e o menu tem
// lugar próprio, que ninguém disputa.
//
// A ordem da marca tem intenção: KGFM primeiro, divisória, Jarvis depois. A
// empresa é a dona; o Jarvis é uma ferramenta dela.
//
// No celular o trilho some e a navegação continua sendo os três pontinhos - é
// o que cabe na mão, e o mockup do telefone também mostra só o menu.

import Image from 'next/image'
import Link from 'next/link'
import { Menu } from './Menu'
import { Deslizar } from './Deslizar'
import { Transicao } from './Transicao'

const ATALHOS = [
  { href: '/painel', nome: 'Painel', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { href: '/projetos', nome: 'Projetos', d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/frentes', nome: 'Frentes', d: 'M4 6h16M4 12h16M4 18h10' },
  { href: '/agenda', nome: 'Agenda', d: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4' },
  { href: '/semana', nome: 'A semana', d: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4' },
  { href: '/prioridades', nome: 'Prioridade', d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { href: '/estrategia', nome: 'Estratégia', d: 'M12 2 4 7v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V7z' },
  { href: '/conversa', nome: 'Conversa', d: 'M4 5h16v11H9l-5 4z' },
  { href: '/config', nome: 'Configuração', d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M4 12h2M18 12h2M12 4v2M12 18v2' },
]

/**
 * A COR DE CADA SEÇÃO. Só moldura: fio do cabeçalho, título, ponto ativo.
 *
 * Verde, âmbar e vermelho continuam sendo ESTADO dentro dos instrumentos, e
 * por isso nenhuma seção usa os três. Se a cor da tela vazasse para dentro do
 * dado, o painel perderia a única coisa que o faz funcionar.
 */
const COR_DA_SECAO: Record<string, string> = {
  '/painel': '#ff3d00',
  '/projetos': '#38bdf8',
  '/producao': '#22d3ee',
  '/frentes': '#a78bfa',
  '/agenda': '#818cf8',
  '/semana': '#2dd4bf',
  '/prioridades': '#f59e0b',
  '/estrategia': '#f472b6',
  '/conversa': '#60a5fa',
  '/config': '#94a3b8',
}

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

      <div className="com-trilho" style={{ ['--secao' as string]: COR_DA_SECAO[atalhoAtivo ?? '/painel'] ?? 'var(--laranja)' }}>
        <header className="cabecalho">
          <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5">
            <div className="cabecalho-linha">
              {/* O logotipo oficial, versão clara: aqui o fundo é escuro e o
                  laranja fica reservado para estado, não para enfeite. */}
              <Link href="/painel" aria-label="KGFM, ir para o painel" className="shrink-0">
                <Image src="/marca/kgfm-claro.png" alt="KGFM" width={600} height={83} priority className="marca-kgfm" />
              </Link>

              <span className="marca-divisa" aria-hidden />

              <Link href="/painel" className="flex items-center gap-2 shrink-0">
                <span className="marca-ponto" aria-hidden />
                <span className="marca-jarvis">JARVIS</span>
              </Link>

              <h1 className="cabecalho-titulo">{titulo}</h1>

              <div className="cabecalho-acoes">
                {acao}
                <Menu />
              </div>
            </div>
          </div>
        </header>

        {/* O respiro entre o cabeçalho e o primeiro cartão. Estava em 12px e ele
            reclamou com razão: o cartão encostava na faixa da marca e a tela
            parecia desalinhada. */}
        <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-5 pt-5 sm:pt-6 com-captura"><Transicao>{children}</Transicao></div>
      </div>

      {/* FORA do cabeçalho de propósito: ele usa `backdrop-filter`, e isso faz
          dele o ponto de referência de qualquer filho `fixed` - os pontinhos
          ficariam presos dentro da faixa do topo em vez de colar no rodapé. */}
      <Deslizar />
    </>
  )
}

/** Cabeçalho de painel no estilo do hub. */
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
  // Nada de tela vazia: estado sem dado explica o que fazer para preenchê-lo.
  return (
    <div className="cartao p-6 text-center">
      <p className="font-semibold">{titulo}</p>
      <p className="fraco text-sm mt-1 max-w-md mx-auto">{texto}</p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
