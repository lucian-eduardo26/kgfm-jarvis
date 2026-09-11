'use client'

// O TEMPO PASSANDO.
//
// O Lucian em 10/09/2026: "eu quero na tela inicial tempo rolando, segundos.
// A partir daquele horário de Brasília, eu não estou com uma tarefa tocando,
// um projeto acontecendo, é o horário que está passando, o tempo está
// passando, a vida está passando".
//
// Então este relógio não é enfeite nem conveniência - é uma cobrança. Ele tem
// duas leituras na mesma linha, e a segunda é a que importa:
//
//   ESQUERDA   a hora de Brasília, com segundos, andando.
//   DIREITA    há quanto tempo isso está sendo medido, ou não está.
//
// Com cronômetro rodando, o número da direita é verde e conta o bloco atual:
// o tempo está passando E virando registro. Sem cronômetro, ele fica cinza e
// conta desde o último apontamento do dia - o tempo passou e não virou nada.
//
// A diferença entre os dois números é o dia inteiro resumido.

import { useEffect, useState } from 'react'

function doisDigitos(n: number) {
  return String(n).padStart(2, '0')
}

function duracao(desdeMs: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - desdeMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  if (h > 0) return `${h}:${doisDigitos(m)}:${doisDigitos(seg)}`
  return `${m}:${doisDigitos(seg)}`
}

export function Relogio({
  rodandoDesde,
  oQue,
  semRegistroDesde,
}: {
  /** ISO do início do cronômetro, quando há um rodando. */
  rodandoDesde: string | null
  /** O que está sendo cronometrado. */
  oQue: string | null
  /** ISO do fim do último apontamento do dia, ou do começo do expediente. */
  semRegistroDesde: string | null
}) {
  // `null` no primeiro render de propósito: a hora do servidor e a do
  // navegador não batem, e renderizar as duas diferentes quebra a hidratação.
  const [agora, setAgora] = useState<number | null>(null)

  useEffect(() => {
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const hora =
    agora === null
      ? '--:--:--'
      : new Date(agora).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Sao_Paulo',
        })

  const medindo = Boolean(rodandoDesde)
  const referencia = rodandoDesde ?? semRegistroDesde
  const contador =
    agora === null || !referencia ? '--:--' : duracao(new Date(referencia).getTime(), agora)

  return (
    <section className="cartao relogio" aria-live="off">
      <div className="relogio-hora">
        <span className="numero">{hora}</span>
        <span className="relogio-fuso">Brasília</span>
      </div>

      <div className="relogio-lado">
        <span
          className="numero relogio-contador"
          style={{ color: medindo ? 'var(--verde)' : 'var(--fraco)' }}
        >
          {contador}
        </span>
        <span className="relogio-legenda">
          {medindo ? oQue ?? 'medindo' : 'sem nada medido'}
        </span>
      </div>
    </section>
  )
}
