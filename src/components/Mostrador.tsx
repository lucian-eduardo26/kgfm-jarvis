// O mostrador - anel de percentual.
//
// Terceira versao, e a direcao veio dos mockups que o Lucian mandou em
// 10/09/2026: anel fechado com o numero grande no meio, no lugar do arco
// aberto. E o instrumento que aparece nos dois - no painel do desktop e no
// telefone.
//
// A REGRA DE COR, que os mockups nao tinham e sem a qual isto vira enfeite:
// a MOLDURA e laranja (marca), mas o PREENCHIMENTO DO ANEL e estado -
// verde, ambar ou vermelho. Se o anel tambem fosse laranja, os quatro
// mostradores ficariam identicos e o painel pararia de comunicar em dois
// segundos, que e a unica coisa que ele precisa fazer.

import Link from 'next/link'
import { COR_DA_ZONA, type Zona } from '@/lib/mostrador'

type Props = {
  nome: string
  indice: number
  zona: Zona
  legenda: string
  frentes: number
  minutosHoje?: number
  href: string
  compacto?: boolean
}

const R = 42
const C = 2 * Math.PI * R

export function Mostrador({ nome, indice, zona, legenda, frentes, minutosHoje, href, compacto }: Props) {
  const cor = COR_DA_ZONA[zona]
  const vazio = zona === 'cinza'
  const preenchido = vazio ? 0 : Math.max(0, Math.min(100, indice))

  return (
    <Link href={href} className="cartao bloco-mostrador block">
      <div className="painel-cabeca">
        <span className="rotulo text-[10px]">{nome}</span>
        <span className="text-[10px] dado">{frentes} FR</span>
      </div>

      <div className={compacto ? 'p-2' : 'p-3'}>
        <svg
          viewBox="0 0 100 100"
          className={`w-full mx-auto ${compacto ? 'max-w-[92px]' : 'max-w-[124px]'}`}
          role="img"
          aria-label={`${nome}: ${indice} de 100`}
        >
          {/* trilho */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />

          {/* o valor, comecando do topo e girando no sentido do relogio */}
          {!vazio && preenchido > 0 && (
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={cor}
              style={{ color: cor }}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(preenchido / 100) * C} ${C}`}
              transform="rotate(-90 50 50)"
              className="arco-vivo"
            />
          )}

          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={compacto ? 24 : 26}
            fontWeight="500"
            fill={vazio ? 'var(--cinza)' : 'var(--texto)'}
            className="numero"
          >
            {vazio ? '--' : `${indice}%`}
          </text>
        </svg>

        {!compacto && (
          <>
            <p
              className="text-[11px] leading-snug mt-2 min-h-[2.4em]"
              style={{ color: zona === 'vermelho' ? 'var(--vermelho)' : 'var(--fraco)' }}
            >
              {legenda}
            </p>
            {minutosHoje != null && (
              <p className="text-[10px] dado mt-1" style={{ opacity: minutosHoje > 0 ? 1 : 0.5 }}>
                {minutosHoje > 0 ? `${Math.round(minutosHoje)} min hoje` : 'sem registro hoje'}
              </p>
            )}
          </>
        )}
      </div>
    </Link>
  )
}
