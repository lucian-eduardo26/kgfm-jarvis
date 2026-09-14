'use client'

// A FITA DO TEMPO: o que está rodando, colado no topo, enquanto ele rola.
//
// O Lucian em 14/09/2026: "o que estiver fazendo fique contando em cima
// enquanto rolar a tela; se abaixar ele volta pro lugar, ou não - pode
// escolher".
//
// ESCOLHI QUE VOLTA. Ao voltar ao topo a fita some, porque lá em cima o cartão
// inteiro já está na tela dizendo a mesma coisa com mais detalhe. Duas cópias
// do mesmo número na mesma dobra é ruído, não reforço.
//
// ONDE ELA MORA, e isto resolve um problema de sozinha: DENTRO do cabeçalho.
// O cabeçalho já é `sticky top: 0`, então uma segunda linha dentro dele fica
// presa no topo de graça - sem medir altura de cabeçalho, sem `z-index`
// brigando com a folha de conferência, sem recalcular nada quando a marca
// muda de tamanho.
//
// E ela existe em TODA tela, não só no painel: o cronômetro é o estado mais
// importante do sistema, e ele passa o dia em Projetos e Agenda.

import { useEffect, useState } from 'react'
import { Conferir, type OpcaoDeFrente } from './Conferir'
import type { CronometroAtivo } from '@/lib/cronometro'

/** Quanto ele precisa rolar para a fita aparecer. */
const GATILHO = 150

function contar(desdeMs: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - desdeMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const dd = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dd(m)}:${dd(s % 60)}` : `${m}:${dd(s % 60)}`
}

export function FitaDoTempo({
  cronometro,
  opcoes,
}: {
  cronometro: CronometroAtivo
  opcoes: OpcaoDeFrente[]
}) {
  const [agora, setAgora] = useState<number | null>(null)
  const [rolou, setRolou] = useState(false)
  const [conferindo, setConferindo] = useState(false)

  useEffect(() => {
    if (!cronometro) return
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [cronometro])

  useEffect(() => {
    if (!cronometro) return
    // `passive` porque este ouvinte não cancela nada: rolagem que espera
    // javascript decidir é rolagem que trava no celular.
    const olhar = () => setRolou(window.scrollY > GATILHO)
    olhar()
    window.addEventListener('scroll', olhar, { passive: true })
    return () => window.removeEventListener('scroll', olhar)
  }, [cronometro])

  if (!cronometro) return null

  return (
    <>
      <div className="fita" data-aberta={rolou ? '1' : '0'} aria-hidden={!rolou}>
        <button
          type="button"
          onClick={() => setConferindo(true)}
          className="fita-botao"
          tabIndex={rolou ? 0 : -1}
          aria-label={`Conferir: ${cronometro.tarefaTitulo}`}
        >
          <span className="ponto-rodando shrink-0" aria-hidden />
          <span className="numero fita-numero">
            {agora === null ? '--:--' : contar(new Date(cronometro.iniciadoEm).getTime(), agora)}
          </span>
          <span className="fita-nome">{cronometro.tarefaTitulo}</span>
        </button>
      </div>

      <Conferir
        aberto={conferindo}
        fechar={() => setConferindo(false)}
        opcoes={opcoes}
        apontamentoId={cronometro.apontamentoId}
        medindo={{
          tarefa: cronometro.tarefaTitulo,
          desde: cronometro.iniciadoEm,
          blocoDesde: cronometro.blocoDesde,
        }}
        vazioDesde={null}
      />
    </>
  )
}
