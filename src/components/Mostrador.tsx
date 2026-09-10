// O mostrador. Anel de HUD, nao ponteiro de turbina: traco fino, marcas de
// escala, brilho na cor da zona e o numero no meio.
//
// A cor continua sendo a unica portadora de significado - verde/ambar/vermelho/
// cinza. O acabamento futurista e so densidade e luz, nunca cor nova.

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
}

// Arco de 240 graus: comeca em 210 (baixo-esquerda) e acaba em -30 (baixo-direita).
const DE = 210
const ATE = -30
const CX = 60
const CY = 58
const R = 42

function ponto(anguloGraus: number, raio: number) {
  const rad = (Math.PI * anguloGraus) / 180
  return { x: CX + raio * Math.cos(rad), y: CY - raio * Math.sin(rad) }
}

function anguloDoValor(v: number) {
  return DE - (Math.max(0, Math.min(100, v)) * (DE - ATE)) / 100
}

function arco(deGraus: number, ateGraus: number, raio: number) {
  const a = ponto(deGraus, raio)
  const b = ponto(ateGraus, raio)
  const grande = Math.abs(deGraus - ateGraus) > 180 ? 1 : 0
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${raio} ${raio} 0 ${grande} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

export function Mostrador({ nome, indice, zona, legenda, frentes, minutosHoje, href }: Props) {
  const cor = COR_DA_ZONA[zona]
  const vazio = zona === 'cinza'
  const anguloAtual = anguloDoValor(vazio ? 0 : indice)
  const marcador = ponto(anguloAtual, R)

  return (
    <Link href={href} className="cartao bloco-mostrador block p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="rotulo">{nome}</span>
        <span className="text-[10px] dado">{String(frentes).padStart(2, '0')} FR</span>
      </div>

      <svg viewBox="0 0 120 96" className="w-full max-w-[188px] mx-auto" role="img" aria-label={`${nome}: ${indice} de 100`}>
        {/* trilho */}
        <path d={arco(DE, ATE, R)} stroke="rgba(34,211,238,.13)" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* escala: 11 marcas, e as tres da zona um pouco mais longas */}
        {Array.from({ length: 11 }, (_, i) => {
          const v = i * 10
          const a = anguloDoValor(v)
          const limite = v === 40 || v === 70
          const de = ponto(a, R + (limite ? 4 : 3))
          const ate = ponto(a, R + (limite ? 8 : 6))
          // So os dois limites de zona sao coloridos. O resto e escala seca:
          // dez marcas coloridas viram confete e param de significar.
          const corMarca = limite ? (v === 40 ? COR_DA_ZONA.ambar : COR_DA_ZONA.verde) : "var(--ciano)"
          return (
            <line
              key={v}
              x1={de.x}
              y1={de.y}
              x2={ate.x}
              y2={ate.y}
              stroke={corMarca}
              strokeWidth={limite ? 1.4 : 0.9}
              opacity={limite ? 0.9 : 0.3}
              strokeLinecap="round"
            />
          )
        })}

        {/* o valor */}
        {!vazio && (
          <>
            <path
              d={arco(DE, anguloAtual, R)}
              stroke={cor}
              style={{ color: cor }}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="arco-vivo"
            />
            <circle cx={marcador.x} cy={marcador.y} r="3" fill={cor} style={{ color: cor }} className="arco-vivo" />
          </>
        )}

        {/* anel externo pontilhado - o detalhe de cabine */}
        <circle
          cx={CX}
          cy={CY}
          r={R + 13}
          fill="none"
          stroke="rgba(34,211,238,.22)"
          strokeWidth="0.6"
          strokeDasharray="1.5 5"
          className="anel"
        />

        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          fontSize="26"
          fontWeight="300"
          fill={vazio ? 'var(--cinza)' : cor}
          className="numero"
        >
          {vazio ? '--' : indice}
        </text>
        <text x={CX} y={CY + 20} textAnchor="middle" fontSize="6.5" fill="var(--ciano)" opacity="0.7" letterSpacing="2">
          INDICE
        </text>
      </svg>

      <p
        className="text-[11px] leading-snug min-h-[2.2em]"
        style={{ color: zona === 'vermelho' ? 'var(--vermelho)' : 'var(--fraco)' }}
      >
        {legenda}
      </p>
      {minutosHoje != null && (
        <p className="text-[10px] dado mt-1" style={{ opacity: minutosHoje > 0 ? 1 : 0.45 }}>
          {minutosHoje > 0 ? `${Math.round(minutosHoje)} MIN HOJE` : 'SEM REGISTRO HOJE'}
        </p>
      )}
    </Link>
  )
}
