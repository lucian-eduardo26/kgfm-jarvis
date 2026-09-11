'use client'

// O QUE ESTÁ ACONTECENDO AGORA. Primeiro bloco da tela inicial.
//
// O Lucian em 11/09/2026, e a cobrança é justa:
//
//   "Era pra ter o contador da maldita da tarefa que eu estou executando na
//    frente do aplicativo. De que adianta ter um sistema com um milhão de
//    quadros sendo que o que importa é: eu estou fazendo coisas, eu quero
//    confronto sobre o que estou fazendo e o que não estou fazendo."
//
// Este bloco é esse confronto, e ele cabe em duas linhas:
//
//   EM CIMA   o que está sendo MEDIDO neste segundo, com o relógio andando.
//             Verde, com o nome da tarefa, e o nome abre o projeto.
//   EMBAIXO   o que está EM ANDAMENTO e não está sendo medido. Cada linha tem
//             um botão de começar, porque a distância entre ver e medir tem
//             que ser um toque - não uma frase ditada.
//
// A diferença entre as duas metades é o buraco do dia. Quando a de cima está
// vazia e a de baixo tem seis linhas, o sistema não precisa dizer mais nada.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { comecarNaFrente } from '@/app/acoes'

export type Andando = {
  frenteId: number
  titulo: string
  projeto: string | null
  projetoId: number | null
  area: string
  /** Dias úteis desde o último movimento. */
  dias: number
  /** Minutos já medidos hoje nesta frente. */
  minutosHoje: number
}

export type Medindo = {
  tarefa: string
  frenteId: number
  frenteTitulo: string
  projeto: string | null
  projetoId: number | null
  desde: string
}

function contar(desdeMs: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - desdeMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const dd = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dd(m)}:${dd(s % 60)}` : `${m}:${dd(s % 60)}`
}

function Onde({ projeto, projetoId, frenteId }: { projeto: string | null; projetoId: number | null; frenteId: number }) {
  // Onde o projeto aparece, o projeto abre - regra dele de 10/09/2026. Sem
  // projeto, o destino é a frente, que sempre existe. Nenhum nome é beco.
  if (projeto && projetoId) {
    return (
      <Link href={`/projetos/${projetoId}`} className="hover:underline">
        {projeto}
      </Link>
    )
  }
  return (
    <Link href={`/frentes#f${frenteId}`} className="hover:underline">
      abrir a frente
    </Link>
  )
}

export function EmAndamento({ medindo, andando }: { medindo: Medindo | null; andando: Andando[] }) {
  // `null` no primeiro render: a hora do servidor e a do navegador não batem,
  // e renderizar as duas diferentes quebra a hidratação.
  const [agora, setAgora] = useState<number | null>(null)

  useEffect(() => {
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <section
      className="cartao p-4 mb-3"
      style={{ borderColor: medindo ? 'var(--verde)' : 'var(--ambar)' }}
    >
      <p className="rotulo mb-2.5" style={{ color: medindo ? 'var(--verde)' : 'var(--ambar)' }}>
        {medindo ? 'medindo agora' : 'nada sendo medido'}
      </p>

      {medindo ? (
        <div className="flex items-center gap-3">
          <span className="ponto-rodando shrink-0" aria-hidden />
          <span className="numero text-2xl shrink-0" style={{ color: 'var(--verde)' }}>
            {agora === null ? '--:--' : contar(new Date(medindo.desde).getTime(), agora)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm truncate">{medindo.tarefa}</span>
            <span className="block text-[11px] fraco truncate">
              {medindo.frenteTitulo} ·{' '}
              <Onde projeto={medindo.projeto} projetoId={medindo.projetoId} frenteId={medindo.frenteId} />
            </span>
          </span>
        </div>
      ) : (
        <p className="text-sm fraco">
          {andando.length > 0
            ? 'Tem trabalho aberto aqui embaixo e nenhum relógio rodando. Um toque resolve.'
            : 'Nenhuma frente aberta. Diga na barra o que você está fazendo.'}
        </p>
      )}

      {/* O QUE ESTÁ ABERTO E PARADO. A frente que já está sendo medida sai da
          lista: ver o mesmo nome em cima e embaixo confunde em vez de cobrar. */}
      {andando.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-[var(--linha)] space-y-2">
          {andando.map((a) => (
            <li key={a.frenteId} className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: a.minutosHoje > 0 ? 'var(--verde)' : 'var(--fraco)' }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm truncate">{a.titulo}</span>
                <span className="block text-[11px] fraco truncate">
                  <Onde projeto={a.projeto} projetoId={a.projetoId} frenteId={a.frenteId} />
                  {' · '}
                  {a.minutosHoje > 0
                    ? `${a.minutosHoje} min hoje`
                    : a.dias === 0
                      ? 'sem medição hoje'
                      : `parada há ${a.dias} ${a.dias === 1 ? 'dia útil' : 'dias úteis'}`}
                </span>
              </span>
              <form action={comecarNaFrente} className="shrink-0">
                <input type="hidden" name="frenteId" value={a.frenteId} />
                <button className="botao-fantasma text-xs px-2.5" aria-label={`Começar a contar ${a.titulo}`}>
                  começar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
