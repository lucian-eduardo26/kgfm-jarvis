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
import { Conferir, type OpcaoDeFrente } from './Conferir'

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
  vazioDesde,
  apontamentoId,
  blocoDesde,
  opcoes,
}: {
  medindo: Medindo | null
  girando: Girando[]
  naMinhaMao: NaMinhaMao[]
  /** ISO do fim do último apontamento. É daqui que sai o tamanho do buraco. */
  vazioDesde: string | null
  apontamentoId: number | null
  /** ISO do último "estou aqui". */
  blocoDesde: string | null
  opcoes: OpcaoDeFrente[]
}) {
  // `null` no primeiro render: a hora do servidor e a do navegador não batem,
  // e renderizar as duas diferentes quebra a hidratação.
  const [agora, setAgora] = useState<number | null>(null)
  const [conferindo, setConferindo] = useState(false)

  useEffect(() => {
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // A COBRANÇA, que ele pediu com estas palavras: "olha, não tem nada
  // acontecendo, você não está trabalhando?" e "já faz muito tempo que você
  // está nessa tarefa, ainda está aí?".
  //
  // Morava no cartão do relógio de Brasília. O relógio saiu em 14/09/2026 - ele
  // pediu, e estava certo: a hora do dia ele já tem no topo do telefone. A
  // cobrança não saiu junto porque ela não é hora, é confronto, e o confronto
  // era o pedido original.
  //
  // Meia hora parado, ou uma hora e meia sem confirmar, e só entre 7h e 20h.
  // Ele foi explícito: "não pode ser uma hora chata".
  const cobranca = (() => {
    if (agora === null) return null
    const hora = Number(
      new Date(agora).toLocaleString('pt-BR', {
        hour: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo',
      }),
    )
    if (hora < 7 || hora >= 20) return null

    if (!medindo && vazioDesde) {
      const min = (agora - new Date(vazioDesde).getTime()) / 60000
      if (min >= 30) return 'Você não está trabalhando? Diga onde, que eu conto desde a hora certa.'
      return null
    }
    if (medindo && blocoDesde) {
      const min = (agora - new Date(blocoDesde).getTime()) / 60000
      if (min >= 90) return 'Já faz um tempo aqui. Você ainda está nisso?'
    }
    return null
  })()

  return (
    <section
      className="cartao p-4 mb-3"
      style={{ borderColor: medindo ? 'var(--verde)' : 'var(--ambar)' }}
    >
      {/* ---------- 1. A HORA DELE ----------
          O rótulo virou botão: ele pediu "quando eu clico nas duas e cinquenta
          sem nada medido, eu quero abrir a janela e ter fácil para colocar:
          não, está sendo medido, olha". */}
      <button
        type="button"
        onClick={() => setConferindo(true)}
        className="em-andamento-topo"
        style={{ color: medindo ? 'var(--verde)' : 'var(--ambar)' }}
        aria-label={medindo ? 'Conferir o que está sendo medido' : 'Lançar o tempo sem registro'}
      >
        <span className="rotulo">{medindo ? 'medindo agora' : 'nada sendo medido'}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

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
      ) : opcoes.length > 0 ? (
        /* A PORTA DE ENTRADA QUE FALTAVA.
           A folha do Conferir sempre fez exatamente o que ele pediu - escolher
           a frente e a hora de início, e o tempo decorrido entra sozinho. Só
           que ela só abria pelo rótulo pequeno lá em cima, e ele nunca achou.
           Em 15/09/2026, na voz dele: "a dinâmica da vida e essa - você começa
           a fazer a tarefa e aí depois você se dá conta. O que você está
           fazendo? A que hora começou? Acabou, ele adianta o tempo que passou."
           O recurso existia; o que faltava era uma porta do tamanho do
           problema. */
        <button
          type="button"
          onClick={() => setConferindo(true)}
          className="botao w-full"
          style={{ background: 'var(--ambar)', color: '#140c00' }}
        >
          Já comecei - contar desde que horas
        </button>
      ) : (
        <p className="text-sm fraco">
          Nenhuma frente aberta. Diga na barra o que você está fazendo.
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

      {/* ---------- 4. O CONFRONTO ---------- */}
      {cobranca && (
        <button
          type="button"
          onClick={() => setConferindo(true)}
          className="em-andamento-cobranca"
          style={{ color: 'var(--ambar)' }}
        >
          {cobranca} <span className="sublinha">responder</span>
        </button>
      )}

      <Conferir
        aberto={conferindo}
        fechar={() => setConferindo(false)}
        opcoes={opcoes}
        apontamentoId={apontamentoId}
        medindo={
          medindo
            ? {
                tarefa: medindo.tarefa,
                desde: medindo.desde,
                blocoDesde: blocoDesde ?? medindo.desde,
              }
            : null
        }
        vazioDesde={vazioDesde}
      />
    </section>
  )
}
