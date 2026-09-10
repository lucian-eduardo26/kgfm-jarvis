'use client'

// O CICLO DE TRABALHO.
//
// Pomodoro, mas sem a tirania do Pomodoro. O sistema SUGERE - avisa que o bloco
// encheu e oferece três saidas: continuar, descansar, ou trocar de tarefa.
// Bloco imposto vira alarme ignorado em duas semanas; bloco sugerido vira
// habito.
//
// Tres decisões que fazem diferenca:
//
// 1. DESCANSO NÃO E APONTAMENTO. Se o descanso entrasse como hora trabalhada,
//    o painel diria que ele produziu enquanto tomava cafe. Fica em tabela
//    própria e não entra na conta de horas.
//
// 2. PARAR SEMPRE PERGUNTA "E AGORA?". Antes, parar o cronômetro jogava o
//    tempo direto no buraco do dia sem dizer nada - o Lucian parava e o sistema
//    comecava a contar ocioso calado. Agora parar abre a escolha.
//
// 3. DURANTE COMPROMISSO, SILENCIO. O sistema conhece a agenda: se ele está em
//    reunião, o bloco não apita. Alarme tocando no meio de uma visita a cliente
//    e o jeito mais rapido de o sistema ser desinstalado.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  cronometro: {
    apontamentoId: number
    tarefaId: number
    tarefaTitulo: string
    frenteTitulo: string
    areaNome: string
    iniciadoEm: string
    blocoDesde: string
    blocosFeitos: number
  } | null
  descanso: { id: number; inicio: string; minutos: number; tarefaTitulo: string | null } | null
  emCompromisso: boolean
  ciclo: {
    minutosBloco: number
    minutosDescanso: number
    minutosDescansoLongo: number
    blocosAteDescansoLongo: number
  }
  acoes: {
    continuarBloco: (fd: FormData) => Promise<void>
    comecarDescanso: (fd: FormData) => Promise<void>
    encerrarDescanso: () => Promise<void>
    pararCronometro: () => Promise<void>
  }
}

function mmss(seg: number): string {
  const s = Math.max(0, Math.floor(seg))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Um sino curto, gerado no navegador. Sem arquivo, sem rede, funciona offline. */
function tocar(grave = false) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const agora = ctx.currentTime
    for (const [i, f] of (grave ? [440, 330] : [880, 1320]).entries()) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, agora + i * 0.18)
      g.gain.exponentialRampToValueAtTime(0.22, agora + i * 0.18 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, agora + i * 0.18 + 0.45)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(agora + i * 0.18)
      o.stop(agora + i * 0.18 + 0.5)
    }
    setTimeout(() => ctx.close(), 1500)
  } catch {
    // sem áudio disponível: o aviso visual continua valendo
  }
}

export function Ciclo({ cronometro, descanso, emCompromisso, ciclo, acoes }: Props) {
  // O relógio só começa DEPOIS de montar no navegador.
  // Se o primeiro render já calculasse a hora, o servidor produziria um texto
  // e o navegador outro, e o React reclamaria de hidratacao - foi o que
  // aconteceu em 10/09/2026. Até montar, a tela mostra tracos.
  const [agora, setAgora] = useState<number | null>(null)
  const jaTocou = useRef(false)
  const router = useRouter()

  useEffect(() => {
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (agora === null) {
    return (
      <section className="cartao p-4">
        <p className="rotulo">{descanso ? 'descansando' : 'trabalhando'}</p>
        <p className="font-medium mt-0.5 truncate">
          {descanso ? (descanso.tarefaTitulo ?? 'pausa') : (cronometro?.tarefaTitulo ?? '')}
        </p>
        <p className="número text-3xl mt-1 fraco">--:--</p>
      </section>
    )
  }

  // ---------- descanso rodando ----------
  if (descanso) {
    const restam = descanso.minutos * 60 - (agora - new Date(descanso.inicio).getTime()) / 1000
    const acabou = restam <= 0

    if (acabou && !jaTocou.current) {
      jaTocou.current = true
      if (!emCompromisso) tocar(false)
    }

    return (
      <section className="cartao p-4" style={{ borderColor: acabou ? 'var(--laranja)' : 'var(--verde)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="rotulo" style={{ color: acabou ? 'var(--laranja)' : 'var(--verde)' }}>
              {acabou ? 'descanso terminou' : 'descansando'}
            </p>
            <p className="text-sm mt-0.5 fraco">
              {acabou
                ? descanso.tarefaTitulo
                  ? `Volta para: ${descanso.tarefaTitulo}`
                  : 'Hora de voltar.'
                : 'Este tempo não conta como trabalho - e para não contar mesmo.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="numero text-3xl" style={{ color: acabou ? 'var(--laranja)' : 'var(--verde)' }}>
              {mmss(restam)}
            </span>
            <form action={acoes.encerrarDescanso}>
              <button className={acabou ? 'botao' : 'botao-fantasma'}>
                {acabou ? 'Voltar ao trabalho' : 'Encerrar antes'}
              </button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  // ---------- nada rodando ----------
  if (!cronometro) return null

  // ---------- trabalho rodando ----------
  const inicioBloco = new Date(cronometro.blocoDesde).getTime()
  const decorridoBloco = (agora - inicioBloco) / 1000
  const alvo = ciclo.minutosBloco * 60
  const restaBloco = alvo - decorridoBloco
  const blocoCheio = restaBloco <= 0
  const totalSeg = (agora - new Date(cronometro.iniciadoEm).getTime()) / 1000

  const proximosBlocos = cronometro.blocosFeitos + 1
  const ehLongo = proximosBlocos % ciclo.blocosAteDescansoLongo === 0
  const minutosDescanso = ehLongo ? ciclo.minutosDescansoLongo : ciclo.minutosDescanso

  if (blocoCheio && !jaTocou.current) {
    jaTocou.current = true
    if (!emCompromisso) tocar(true)
  }
  if (!blocoCheio) jaTocou.current = false

  const pct = Math.min(100, (decorridoBloco / alvo) * 100)

  return (
    <section
      className="cartao p-4"
      style={{ borderColor: blocoCheio ? 'var(--laranja)' : 'var(--linha)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rotulo" style={blocoCheio ? { color: 'var(--laranja)' } : undefined}>
            {blocoCheio ? `bloco cheio${emCompromisso ? ' · em compromisso, sem alarme' : ''}` : 'trabalhando'}
          </p>
          <p className="font-medium truncate mt-0.5">{cronometro.tarefaTitulo}</p>
          <p className="text-xs fraco truncate">
            {cronometro.frenteTitulo} · {cronometro.areaNome}
          </p>
        </div>
        <div className="text-right">
          <p className="numero text-3xl" style={blocoCheio ? { color: 'var(--laranja)' } : undefined}>
            {blocoCheio ? `+${mmss(-restaBloco)}` : mmss(restaBloco)}
          </p>
          <p className="text-[11px] dado">
            {mmss(totalSeg)} na tarefa
            {cronometro.blocosFeitos > 0 && ` · ${cronometro.blocosFeitos} bloco${cronometro.blocosFeitos > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* A barra do bloco. Enche e passa a piscar de leve quando estoura. */}
      <div className="h-1.5 rounded-full bg-[var(--superficie-alta)] overflow-hidden mt-3">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: blocoCheio ? 'var(--laranja)' : 'var(--texto-medio)' }}
        />
      </div>

      {blocoCheio ? (
        <>
          <p className="text-sm mt-3">
            {ciclo.minutosBloco} minutos cheios. Continuar tambem e resposta - so escolha, em vez de
            deixar correr.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <form action={acoes.comecarDescanso}>
              <input type="hidden" name="minutos" value={minutosDescanso} />
              <input type="hidden" name="tarefaId" value={cronometro.tarefaId} />
              <button className="botao">
                Descansar {minutosDescanso} min{ehLongo ? ' (longo)' : ''}
              </button>
            </form>
            <form action={acoes.continuarBloco}>
              <input type="hidden" name="apontamentoId" value={cronometro.apontamentoId} />
              <button className="botao-fantasma">Mais um bloco</button>
            </form>
            <form action={acoes.pararCronometro}>
              <button className="botao-fantasma">Parar e escolher outra</button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2 mt-3">
          <form action={acoes.pararCronometro}>
            <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
              Parar
            </button>
          </form>
          <form action={acoes.comecarDescanso}>
            <input type="hidden" name="minutos" value={ciclo.minutosDescanso} />
            <input type="hidden" name="tarefaId" value={cronometro.tarefaId} />
            <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
              Pausar agora
            </button>
          </form>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-xs fraco px-2"
            style={{ minHeight: 38 }}
          >
            atualizar
          </button>
        </div>
      )}
    </section>
  )
}
