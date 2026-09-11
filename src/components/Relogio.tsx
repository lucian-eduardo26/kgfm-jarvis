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
import { Conferir, type OpcaoDeFrente } from './Conferir'

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
  opcoes,
  apontamentoId,
  blocoDesde,
}: {
  /** ISO do início do cronômetro, quando há um rodando. */
  rodandoDesde: string | null
  /** O que está sendo cronometrado. */
  oQue: string | null
  /** ISO do fim do último apontamento do dia, ou do começo do expediente. */
  semRegistroDesde: string | null
  /** As frentes abertas, para a folha de conferência não pedir digitação. */
  opcoes: OpcaoDeFrente[]
  apontamentoId: number | null
  /** ISO do último "estou aqui". É dele que sai o "faz X que você não confirma". */
  blocoDesde: string | null
}) {
  // `null` no primeiro render de propósito: a hora do servidor e a do
  // navegador não batem, e renderizar as duas diferentes quebra a hidratação.
  const [agora, setAgora] = useState<number | null>(null)
  const [conferindo, setConferindo] = useState(false)

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

  // A COBRANÇA, que ele pediu com estas palavras: "olha, não tem nada
  // acontecendo, você não está trabalhando?" e "já faz muito tempo que você
  // está nessa tarefa, ainda está aí?".
  //
  // Aparece no cartão e não como aviso do telefone de propósito: notificação
  // de sistema exige permissão, servidor que empurra e um trabalhador rodando
  // no navegador - e ele já olha este relógio. Cobrança no lugar onde o olho
  // já está custa zero e não vira mais uma coisa para desligar.
  //
  // Os limites: meia hora sem nada medido, ou uma hora e meia sem confirmar
  // que ainda está na mesma tarefa. Menos que isso vira chateação; ele foi
  // explícito - "não pode ser uma hora chata".
  const cobranca = (() => {
    if (agora === null) return null
    const hora = Number(
      new Date(agora).toLocaleString('pt-BR', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }),
    )
    // Fora do expediente o silêncio é esperado, e cobrar às onze da noite é
    // ruído: o sistema estaria errado, não ele.
    if (hora < 7 || hora >= 20) return null

    if (!medindo && semRegistroDesde) {
      const min = (agora - new Date(semRegistroDesde).getTime()) / 60000
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
      className="cartao relogio"
      aria-live="off"
      style={cobranca ? { borderColor: 'var(--ambar)' } : undefined}
    >
      <div className="relogio-hora">
        <span className="numero">{hora}</span>
        <span className="relogio-fuso">Brasília</span>
      </div>

      {/* O NÚMERO VIROU BOTÃO. Pedido dele em 11/09/2026: "quando eu clico nas
          duas e cinquenta sem nada medido, eu quero abrir a janela e ter fácil
          para colocar: não, está sendo medido, olha". Número que acusa e não
          deixa responder é cobrança sem saída. */}
      <button
        type="button"
        onClick={() => setConferindo(true)}
        className="relogio-toque"
        aria-label={medindo ? 'Conferir o que está sendo medido' : 'Lançar o tempo sem registro'}
      >
        <span className="relogio-lado">
          <span
            className="numero relogio-contador"
            style={{ color: medindo ? 'var(--verde)' : 'var(--fraco)' }}
          >
            {contador}
          </span>
          <span className="relogio-legenda">{medindo ? oQue ?? 'medindo' : 'sem nada medido'}</span>
        </span>
        <svg className="seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {cobranca && (
        <button
          type="button"
          onClick={() => setConferindo(true)}
          className="relogio-cobranca"
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
          rodandoDesde && oQue
            ? { tarefa: oQue, desde: rodandoDesde, blocoDesde: blocoDesde ?? rodandoDesde }
            : null
        }
        vazioDesde={semRegistroDesde}
      />
    </section>
  )
}
