// O mostrador.
//
// Refeito em 10/09/2026. Saiu o anel de HUD com escala cheia de marcas, anel
// pontilhado girando e brilho - aquilo era figurino, nao instrumento, e
// competia com o proprio numero.
//
// Ficou um arco fino de 180 graus, o numero grande em peso leve, e duas fendas
// onde a zona muda. A regra: o arco mostra QUANTO, a cor mostra COMO ESTA, e
// nada mais desenha nada. Instrumento bom e o que se le sem esforco no terceiro
// mes de uso, nao o que impressiona no primeiro dia.

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

const CX = 60
const CY = 52
const R = 44

function ponto(grau: number, raio: number) {
  const rad = (Math.PI * grau) / 180
  return { x: CX + raio * Math.cos(rad), y: CY - raio * Math.sin(rad) }
}

const anguloDoValor = (v: number) => 180 - (Math.max(0, Math.min(100, v)) * 180) / 100

function arco(de: number, ate: number, raio: number) {
  const a = ponto(de, raio)
  const b = ponto(ate, raio)
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${raio} ${raio} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

export function Mostrador({ nome, indice, zona, legenda, frentes, minutosHoje, href }: Props) {
  const cor = COR_DA_ZONA[zona]
  const vazio = zona === 'cinza'
  const fim = anguloDoValor(vazio ? 0 : indice)

  return (
    <Link href={href} className="cartao bloco-mostrador block p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="rotulo">{nome}</span>
        <span className="text-[11px] dado">
          {frentes} {frentes === 1 ? 'frente' : 'frentes'}
        </span>
      </div>

      <svg
        viewBox="0 0 120 64"
        className="w-full max-w-[168px] mx-auto mt-3"
        role="img"
        aria-label={`${nome}: ${indice} de 100`}
      >
        <path d={arco(180, 0, R)} stroke="var(--linha-forte)" strokeWidth="3" fill="none" strokeLinecap="round" />

        {!vazio && indice > 0 && (
          <path d={arco(180, fim, R)} stroke={cor} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}

        {/* As duas fronteiras de zona, cortadas na cor da superficie. Elas
            marcam onde a REGRA muda; quem diz o estado e o arco, nao elas. */}
        {[40, 70].map((v) => {
          const a = anguloDoValor(v)
          const de = ponto(a, R - 5)
          const ate = ponto(a, R + 5)
          return (
            <line key={v} x1={de.x} y1={de.y} x2={ate.x} y2={ate.y} stroke="var(--superficie)" strokeWidth="2.5" />
          )
        })}

        <text
          x={CX}
          y={CY + 2}
          textAnchor="middle"
          fontSize="28"
          fontWeight="350"
          fill={vazio ? 'var(--cinza)' : 'var(--texto)'}
          className="numero"
        >
          {vazio ? '--' : indice}
        </text>
      </svg>

      <p
        className="text-[12px] leading-snug mt-1 min-h-[2.4em]"
        style={{ color: zona === 'vermelho' ? 'var(--vermelho)' : 'var(--fraco)' }}
      >
        {legenda}
      </p>

      {minutosHoje != null && (
        <p className="text-[11px] dado mt-1.5" style={{ opacity: minutosHoje > 0 ? 1 : 0.5 }}>
          {minutosHoje > 0 ? `${Math.round(minutosHoje)} min hoje` : 'sem registro hoje'}
        </p>
      )}
    </Link>
  )
}
