'use client'

// "VOCÊ ESTÁ TRABALHANDO? ONDE? DESDE QUANDO?"
//
// O Lucian em 11/09/2026, olhando "2:50 sem nada medido" enquanto fazia o
// banho da trava e conferia os batoques do Logimat:
//
//   "Por que está sem nada medido? Eu estou dentro do processo desde que
//    cheguei na empresa. Quando eu clico nas duas e cinquenta, eu quero abrir
//    a janela e ter fácil para colocar: não, está sendo medido, olha. Tica,
//    começa isso aqui. Eu posso esquecer, tem que pensar no usuário."
//
// E a regra de interface, que vale para o sistema todo:
//
//   "Coloca coisas para EDITAR, e não para digitar. Lista suspensa de horário,
//    o relógio do iPhone, uma coisa prática. Eu não quero gastar tempo nesses
//    aplicativos - eu quero que ele monitore bem."
//
// Por isso aqui não se digita nada. Escolhe-se:
//   a frente, numa lista;
//   a hora, no relógio nativo do telefone (`input type=time`);
//   e, na maioria das vezes, nem isso - os atalhos de cima resolvem sozinhos,
//   porque o sistema JÁ SABE a que horas o vazio começou.
//
// DUAS PERGUNTAS, e o bloco escolhe qual fazer:
//   PARADO   "você está trabalhando?" - e o botão lança com hora escolhida.
//   RODANDO  "já faz X que você está nisso, ainda está aí?" - continuo,
//            terminei, ou troquei (e a que horas).

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { comecarDesde, continuarBloco, terminarOQueEstaRodando, pararCronometro } from '@/app/acoes'
import { useRouter } from 'next/navigation'

export type OpcaoDeFrente = {
  id: number
  titulo: string
  projeto: string | null
}

/** HH:MM em Brasília, arredondado para baixo no minuto. */
function horaDe(d: Date): string {
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function duracaoCurta(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(min / 60)
  return h > 0 ? `${h}h${String(min % 60).padStart(2, '0')}` : `${min} min`
}

export function Conferir({
  aberto,
  fechar,
  opcoes,
  medindo,
  vazioDesde,
  apontamentoId,
}: {
  aberto: boolean
  fechar: () => void
  opcoes: OpcaoDeFrente[]
  /** O que está sendo medido, se algo estiver. */
  medindo: { tarefa: string; desde: string; blocoDesde: string } | null
  /** ISO de quando o vazio começou - o fim do último apontamento. */
  vazioDesde: string | null
  apontamentoId: number | null
}) {
  const router = useRouter()
  const [frenteId, setFrenteId] = useState<string>('')
  const [hora, setHora] = useState<string>('')
  const [trocando, setTrocando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // A hora só nasce no navegador: a do servidor é UTC e renderizar as duas
  // diferentes quebra a hidratação.
  useEffect(() => {
    if (!aberto) return
    setHora(horaDe(new Date()))
    setTrocando(false)
    if (!frenteId && opcoes.length > 0) setFrenteId(String(opcoes[0].id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, opcoes.length])

  // OS ATALHOS SÃO O PONTO. Digitar hora é o que ele não quer fazer, e na
  // maioria das vezes a resposta certa é uma destas quatro.
  const atalhos = useMemo(() => {
    const agora = Date.now()
    const lista: { rotulo: string; valor: string }[] = [{ rotulo: 'agora', valor: horaDe(new Date(agora)) }]
    for (const min of [15, 30, 60, 120]) {
      lista.push({ rotulo: `-${min < 60 ? `${min}min` : `${min / 60}h`}`, valor: horaDe(new Date(agora - min * 60000)) })
    }
    if (vazioDesde) {
      const d = new Date(vazioDesde)
      // Só oferece se for de hoje e antes de agora: "desde as 08:00" de ontem
      // lançaria um bloco de dezesseis horas sem ninguém perceber.
      if (agora - d.getTime() > 0 && agora - d.getTime() < 14 * 3600_000) {
        lista.push({ rotulo: `desde ${horaDe(d)}`, valor: horaDe(d) })
      }
    }
    return lista
  }, [vazioDesde, aberto])

  if (!aberto) return null

  async function comChamada(f: () => Promise<unknown>) {
    setEnviando(true)
    try {
      await f()
      router.refresh()
      fechar()
    } finally {
      setEnviando(false)
    }
  }

  const agoraMs = Date.now()
  const haQuantoNoBloco = medindo ? agoraMs - new Date(medindo.blocoDesde).getTime() : 0

  // PRESA NO `body`, e não onde ela nasce. O relógio vive dentro da div que faz
  // a transição de entrada da tela, e qualquer contexto de empilhamento no
  // caminho prende a folha abaixo da barra do Jarvis e do rodapé - que é
  // exatamente o que aconteceu na primeira versão: a folha abria ATRÁS deles.
  // `z-index` não atravessa contexto de empilhamento; portal atravessa.
  return createPortal(
    <div className="folha-fundo" onClick={fechar} role="presentation">
      <div
        className="folha"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Conferir o que está sendo medido"
      >
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <p className="rotulo" style={{ color: medindo ? 'var(--verde)' : 'var(--ambar)' }}>
            {medindo ? 'você ainda está aí?' : 'você está trabalhando?'}
          </p>
          <button type="button" onClick={fechar} className="text-[11px] fraco">
            fechar
          </button>
        </div>

        {/* ---------- RODANDO: continuo, terminei, ou troquei ---------- */}
        {medindo && !trocando && (
          <>
            <p className="text-sm">
              <strong>{medindo.tarefa}</strong>
            </p>
            <p className="fraco text-[12px] mt-1">
              Começou às {horaDe(new Date(medindo.desde))}, e faz {duracaoCurta(haQuantoNoBloco)} sem
              você confirmar.
            </p>

            <div className="grid gap-2 mt-4">
              <button
                type="button"
                disabled={enviando}
                onClick={() =>
                  void comChamada(async () => {
                    const f = new FormData()
                    f.set('apontamentoId', String(apontamentoId))
                    await continuarBloco(f)
                  })
                }
                className="botao"
                style={{ background: 'var(--verde)', color: '#07120b' }}
              >
                Estou aqui, continua contando
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={() => void comChamada(() => terminarOQueEstaRodando())}
                className="botao-fantasma"
              >
                Terminei isso
              </button>

              <button type="button" onClick={() => setTrocando(true)} className="botao-fantasma">
                Comecei outra coisa
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={() => void comChamada(() => pararCronometro())}
                className="text-[12px] fraco mt-1"
              >
                parei de trabalhar
              </button>
            </div>
          </>
        )}

        {/* ---------- PARADO, ou trocando: escolher onde e desde quando ---------- */}
        {(!medindo || trocando) && (
          <>
            {!medindo && vazioDesde && (
              <p className="fraco text-[12px] mb-3">
                O último registro acabou às {horaDe(new Date(vazioDesde))}. Se você estava
                trabalhando nesse tempo, diga onde - a hora some do buraco do dia.
              </p>
            )}

            {opcoes.length === 0 ? (
              <p className="fraco text-sm">
                Não há frente aberta para apontar. Diga na barra o que você está fazendo e o Jarvis
                abre uma.
              </p>
            ) : (
              <>
                <label className="text-xs fraco block mb-1">Onde</label>
                <select
                  value={frenteId}
                  onChange={(e) => setFrenteId(e.target.value)}
                  className="campo"
                >
                  {opcoes.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titulo}
                      {o.projeto ? ` · ${o.projeto}` : ''}
                    </option>
                  ))}
                </select>

                <label className="text-xs fraco block mb-1 mt-3">Desde que horas</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {atalhos.map((a) => (
                    <button
                      key={a.rotulo}
                      type="button"
                      onClick={() => setHora(a.valor)}
                      className="atalho-hora"
                      data-escolhido={hora === a.valor ? '1' : '0'}
                    >
                      {a.rotulo}
                    </button>
                  ))}
                </div>

                {/* O relógio nativo do telefone: no iPhone abre a roda, no
                    Android o mostrador. Nada de digitar dois pontos. */}
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  step={60}
                  className="campo"
                  aria-label="Hora de início"
                />

                <button
                  type="button"
                  disabled={enviando || !frenteId || !hora}
                  onClick={() =>
                    void comChamada(async () => {
                      const f = new FormData()
                      f.set('frenteId', frenteId)
                      f.set('hora', hora)
                      await comecarDesde(f)
                    })
                  }
                  className="botao w-full mt-3"
                >
                  {enviando ? '...' : `Contar desde ${hora || '--:--'}`}
                </button>

                {trocando && (
                  <button
                    type="button"
                    onClick={() => setTrocando(false)}
                    className="botao-fantasma w-full mt-2"
                  >
                    Voltar
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
