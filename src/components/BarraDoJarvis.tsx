'use client'

// A BARRA ÚNICA. Uma caixa de texto no sistema inteiro, e não duas.
//
// O QUE ACONTECEU EM 11/09/2026, e é o motivo desta barra existir:
//
//   "Eu mandei na caixa de mensagem que acordei e tô fazendo Jarvis e CRM
//    simultâneo. Ele simplesmente recebeu e apagou a mensagem. Quero contador
//    iniciado se tô fazendo alguma coisa."
//
// A culpa não foi dele. Havia DUAS caixas de texto na mesma tela: o cartão "o
// que você está fazendo", que iniciava o cronômetro, e a barra de captura no
// rodapé, que só arquivava. Nada diferenciava as duas, e a do rodapé é a que
// fica sempre visível - é a que a mão alcança. Ele usou a certa pela lógica e
// a errada pelo sistema.
//
// Duas caixas com comportamentos diferentes e aparência igual é armadilha, não
// funcionalidade. Agora é uma só, e ELA decide:
//
//   "estou fazendo X"   inicia o cronômetro
//   "parei" / "acabei"  encerra
//   qualquer outra coisa  vai para a caixa de entrada
//
// E DIZ O QUE FEZ, sempre. Sistema que adivinha em silêncio é pior do que
// sistema que pergunta - ele responde "comecei a contar X" ou "guardei", e
// se errou, desfazer é um toque.
//
// COM CRONÔMETRO RODANDO A BARRA MUDA DE CARA: vira o relógio do que está
// rodando, com trocar e parar. O estado mais importante do sistema não pode
// depender de ele lembrar de olhar outra tela.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEscuta } from '@/lib/useEscuta'
import { Gravando } from './Gravando'
import type { ResultadoComando } from '@/lib/comando'

export type CronometroAtivo = {
  tarefaTitulo: string
  frenteTitulo: string | null
  areaNome: string
  iniciadoEm: string
} | null

function decorrido(desdeMs: number, agoraMs: number): string {
  const s = Math.max(0, Math.floor((agoraMs - desdeMs) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  const dd = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dd(m)}:${dd(seg)}` : `${m}:${dd(seg)}`
}

export function BarraDoJarvis({
  cronometro,
  acao,
  parar,
  terminar,
}: {
  cronometro: CronometroAtivo
  acao: (texto: string) => Promise<ResultadoComando>
  parar: () => Promise<void>
  /**
   * TERMINEI, e não é o mesmo que PARAR.
   *
   * Ele em 11/09/2026: "esse botão de finalizar o que foi iniciado tem que
   * estar em fácil acesso". Parar é sair de um trabalho que continua aberto;
   * terminar é dizer que aquilo acabou - e acabar a última tarefa de um pacote
   * fecha o pacote, o que faz o próximo da corrente começar sozinho.
   */
  terminar: () => Promise<ResultadoComando>
}) {
  const [enviando, setEnviando] = useState(false)
  const [resposta, setResposta] = useState<ResultadoComando | null>(null)
  const [trocando, setTrocando] = useState(false)
  const [agora, setAgora] = useState<number | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const barra = useRef<HTMLDivElement>(null)
  const escuta = useEscuta()
  const router = useRouter()

  const noCampo = escuta.parcial ? `${escuta.texto} ${escuta.parcial}`.trim() : escuta.texto
  const rodando = Boolean(cronometro)

  // O relógio do cronômetro. `null` no primeiro render porque a hora do
  // servidor e a do navegador não batem, e isso quebra a hidratação.
  useEffect(() => {
    if (!cronometro) return
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [cronometro])

  // A altura da barra vira variável, para o conteúdo terminar acima dela.
  useEffect(() => {
    const alvo = barra.current
    if (!alvo) return
    const olho = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--altura-captura', `${alvo.offsetHeight}px`)
    })
    olho.observe(alvo)
    return () => olho.disconnect()
  }, [])

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setTrocando(true)
        setTimeout(() => campo.current?.focus(), 30)
      }
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [])

  async function mandar() {
    const t = noCampo.trim()
    if (!t || enviando) return
    escuta.parar()
    setEnviando(true)
    try {
      const r = await acao(t)
      setResposta(r)
      escuta.limpar()
      setTrocando(false)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  async function encerrar() {
    setEnviando(true)
    try {
      await parar()
      setResposta(null)
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  async function concluir() {
    setEnviando(true)
    try {
      // A resposta FICA NA TELA: aqui o sistema não só parou o relógio, ele
      // fechou um pacote e possivelmente ligou o seguinte com outro dono.
      // Isso ele precisa ler - é a engrenagem começando a girar.
      setResposta(await terminar())
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  const mostraCampo = !rodando || trocando

  return (
    <div ref={barra} className="captura-flutuante fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto w-full max-w-[1500px] px-3 py-2.5">
        {/* O QUE ACABOU DE ACONTECER. Sempre visível depois de uma ação: o
            sistema nunca age em silêncio. */}
        {resposta && (
          <div className="flex items-start gap-2 mb-2">
            <p className="text-[12px] flex-1 min-w-0" style={{ color: resposta.ok ? 'var(--verde)' : 'var(--ambar)' }}>
              {resposta.resposta}
            </p>
            <button
              type="button"
              onClick={() => setResposta(null)}
              className="text-[11px] fraco shrink-0"
              aria-label="Fechar aviso"
            >
              ok
            </button>
          </div>
        )}

        {escuta.ouvindo && (
          <div className="mb-1.5">
            <Gravando segundos={escuta.segundos} mudo={escuta.mudo} />
          </div>
        )}

        {escuta.erro && (
          <p className="text-[11px] mb-1.5" style={{ color: 'var(--ambar)' }}>
            {escuta.erro}
          </p>
        )}

        {/* COM CRONÔMETRO RODANDO: o relógio ocupa a barra. É o estado mais
            importante do sistema, e ele não pode depender de outra tela. */}
        {rodando && !trocando && (
          <div className="flex items-center gap-2.5">
            <span className="ponto-rodando" aria-hidden />
            <span className="numero text-lg shrink-0" style={{ color: 'var(--verde)' }}>
              {agora === null ? '--:--' : decorrido(new Date(cronometro!.iniciadoEm).getTime(), agora)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm truncate">{cronometro!.tarefaTitulo}</span>
              <span className="block text-[11px] fraco truncate">
                {cronometro!.frenteTitulo ?? cronometro!.areaNome}
              </span>
            </span>
            <button type="button" onClick={() => setTrocando(true)} className="botao-fantasma text-xs px-2.5 shrink-0">
              trocar
            </button>
            <button type="button" onClick={() => void encerrar()} disabled={enviando} className="botao-fantasma text-xs px-2.5 shrink-0">
              parar
            </button>
            {/* TERMINEI ganha o botão cheio, e "parar" virou fantasma: das duas
                saídas, a que faz a corrente andar é esta. */}
            <button
              type="button"
              onClick={() => void concluir()}
              disabled={enviando}
              className="botao text-xs px-3 shrink-0"
              style={{ background: 'var(--verde)', borderColor: 'var(--verde)', color: '#07120b' }}
            >
              terminei
            </button>
          </div>
        )}

        {mostraCampo && (
          <div className="flex gap-2 items-end">
            {escuta.disponivel && (
              <button
                type="button"
                aria-label={escuta.ouvindo ? 'Parar de ouvir' : 'Falar'}
                onClick={escuta.alternar}
                className="botao-fantasma w-12 shrink-0 grid place-items-center"
                style={
                  escuta.ouvindo
                    ? { borderColor: 'var(--laranja)', color: 'var(--laranja)', boxShadow: '0 0 0 4px rgba(255,61,0,.13)' }
                    : undefined
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-3.06A9 9 0 0 0 21 11h-2Z" />
                </svg>
              </button>
            )}

            <textarea
              ref={campo}
              value={noCampo}
              onChange={(e) => escuta.definir(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void mandar()
                }
              }}
              rows={escuta.ouvindo || noCampo.length > 70 ? 2 : 1}
              // O TEXTO DE DENTRO PRECISA CABER EM UMA LINHA. Num telefone de
              // 375px sobram uns 200px depois do microfone e do botão, e "O que
              // você está fazendo?" quebrava em duas linhas com a segunda
              // cortada pela metade - campo com texto decepado parece defeito,
              // e neste caso era. A frase inteira continua logo abaixo.
              placeholder={rodando ? 'Agora estou...' : 'O que está fazendo?'}
              className="campo resize-none flex-1"
              style={{ minHeight: 46, maxHeight: 140 }}
            />

            <button
              type="button"
              disabled={!noCampo.trim() || enviando}
              onClick={() => void mandar()}
              className="botao shrink-0 px-4"
            >
              {enviando ? '...' : rodando ? 'trocar' : 'começar'}
            </button>

            {trocando && (
              <button type="button" onClick={() => setTrocando(false)} className="botao-fantasma shrink-0 px-3">
                voltar
              </button>
            )}
          </div>
        )}

        {!rodando && !resposta && (
          <p className="text-[10px] fraco mt-1.5">
            Diga o que está fazendo e o contador começa. Qualquer outra coisa vai para a caixa.
          </p>
        )}
      </div>
    </div>
  )
}
