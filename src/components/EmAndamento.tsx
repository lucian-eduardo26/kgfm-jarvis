'use client'

// O QUE ESTÁ ACONTECENDO AGORA. Primeiro bloco da tela inicial.
//
// O Lucian em 11/09/2026, e a cobrança é justa:
//
//   "Era pra ter o contador da maldita da tarefa que eu estou executando na
//    frente do aplicativo. Eu quero confronto sobre o que estou fazendo e o
//    que não estou fazendo."
//
// E logo depois, a parte que muda o formato da tela:
//
//   "Pensa que são vários pratos que eu estou erguendo. Ou, na linguagem
//    melhor aplicada a nós da automação, várias engrenagens girando. Quanto
//    mais engrenagens girando ao mesmo tempo de forma autônoma, melhor."
//
// Então o bloco tem TRÊS FAIXAS, e a ordem delas é uma tese sobre a empresa:
//
//   1. MEDINDO AGORA   a hora dele, que é o recurso que não se multiplica.
//   2. GIRANDO SEM VOCÊ  o banho na Soriel, a usinagem no Dennis, o cliente
//      respondendo. Não consome hora nenhuma dele e tem relógio próprio - o
//      que importa é DESDE QUANDO, porque banho de dois dias no quarto dia é
//      a informação mais cara do projeto.
//   3. NA SUA MÃO      aberto, sem relógio, esperando ele. Cada linha com um
//      botão de começar: a distância entre ver e medir tem que ser um toque.
//
// A faixa 2 crescendo enquanto a 3 encolhe é literalmente o objetivo dele
// ("até que a gente estruture a empresa pra ter coisas acontecendo sem
// depender de mim o máximo possível"). O painel passa a mostrar isso.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { comecarNaFrente, marcarPacote } from '@/app/acoes'

export type NaMinhaMao = {
  frenteId: number
  titulo: string
  projeto: string | null
  projetoId: number | null
  dias: number
  minutosHoje: number
}

export type Girando = {
  frenteId: number
  titulo: string
  projeto: string | null
  projetoId: number | null
  quem: 'cliente' | 'terceiro'
  /** ISO de quando a engrenagem começou a girar. */
  desde: string | null
  /** Prazo do pacote, em dias de calendário. */
  prazoDias: number | null
}

export type Medindo = {
  tarefa: string
  frenteId: number
  frenteTitulo: string
  projeto: string | null
  projetoId: number | null
  desde: string
}

function relogio(desdeMs: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - desdeMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const dd = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dd(m)}:${dd(s % 60)}` : `${m}:${dd(s % 60)}`
}

/** Engrenagem se lê em dias e horas: ninguém acompanha um banho em segundos. */
function girandoHa(desdeMs: number, agoraMs: number): string {
  const min = Math.max(0, Math.floor((agoraMs - desdeMs) / 60000))
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${min % 60}min`
  return `${min}min`
}

function Onde({
  projeto,
  projetoId,
  frenteId,
}: {
  projeto: string | null
  projetoId: number | null
  frenteId: number
}) {
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

export function EmAndamento({
  medindo,
  girando,
  naMinhaMao,
}: {
  medindo: Medindo | null
  girando: Girando[]
  naMinhaMao: NaMinhaMao[]
}) {
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
      {/* ---------- 1. A HORA DELE ---------- */}
      <p className="rotulo mb-2.5" style={{ color: medindo ? 'var(--verde)' : 'var(--ambar)' }}>
        {medindo ? 'medindo agora' : 'nada sendo medido'}
      </p>

      {medindo ? (
        <div className="flex items-center gap-3">
          <span className="ponto-rodando shrink-0" aria-hidden />
          <span className="numero text-2xl shrink-0" style={{ color: 'var(--verde)' }}>
            {agora === null ? '--:--' : relogio(new Date(medindo.desde).getTime(), agora)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm truncate">{medindo.tarefa}</span>
            <span className="block text-[11px] fraco truncate">
              {medindo.frenteTitulo} ·{' '}
              <Onde
                projeto={medindo.projeto}
                projetoId={medindo.projetoId}
                frenteId={medindo.frenteId}
              />
            </span>
          </span>
        </div>
      ) : (
        <p className="text-sm fraco">
          {naMinhaMao.length > 0
            ? 'Tem trabalho na sua mão aqui embaixo e nenhum relógio rodando. Um toque resolve.'
            : 'Nenhuma frente aberta. Diga na barra o que você está fazendo.'}
        </p>
      )}

      {/* ---------- 2. AS ENGRENAGENS ---------- */}
      {girando.length > 0 && (
        <>
          <p className="rotulo mt-4 mb-1.5" style={{ color: 'var(--verde)' }}>
            girando sem você · {girando.length}
          </p>
          <ul className="space-y-2">
            {girando.map((g) => {
              const desdeMs = g.desde ? new Date(g.desde).getTime() : null
              // Estourou o prazo? A comparação é em dias de calendário porque
              // fornecedor não para no fim de semana - o banho fica no tanque.
              const estourou =
                desdeMs !== null &&
                agora !== null &&
                g.prazoDias !== null &&
                g.prazoDias > 0 &&
                agora - desdeMs > g.prazoDias * 86400_000

              return (
                <li key={g.frenteId} className="flex items-center gap-2">
                  <span className="engrenagem shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm truncate">{g.titulo}</span>
                    <span className="block text-[11px] fraco truncate">
                      <Onde projeto={g.projeto} projetoId={g.projetoId} frenteId={g.frenteId} />
                      {' · com o '}
                      {g.quem}
                      {desdeMs !== null && (
                        <>
                          {' · há '}
                          <span style={{ color: estourou ? 'var(--ambar)' : 'var(--verde)' }}>
                            {agora === null ? '--' : girandoHa(desdeMs, agora)}
                          </span>
                        </>
                      )}
                      {g.prazoDias && g.prazoDias > 0 ? ` de ${g.prazoDias}d` : ''}
                    </span>
                  </span>
                  {/* CHEGOU: o pacote fecha e a corrente puxa o seguinte. É o
                      mesmo caminho do tique da WBS, para não existirem dois
                      jeitos diferentes de fechar a mesma coisa. */}
                  <form action={marcarPacote} className="shrink-0">
                    <input type="hidden" name="frenteId" value={g.frenteId} />
                    <input type="hidden" name="tique" value="1" />
                    <button
                      className="botao-fantasma text-xs px-2.5"
                      aria-label={`Marcar ${g.titulo} como concluído`}
                    >
                      chegou
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* ---------- 3. O QUE DEPENDE DELE ---------- */}
      {naMinhaMao.length > 0 && (
        <>
          <p className="rotulo mt-4 mb-1.5">na sua mão · {naMinhaMao.length}</p>
          <ul className="space-y-2">
            {naMinhaMao.map((a) => (
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
                  <button
                    className="botao-fantasma text-xs px-2.5"
                    aria-label={`Começar a contar ${a.titulo}`}
                  >
                    começar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
