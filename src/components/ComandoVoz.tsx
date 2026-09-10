'use client'

// "Jarvis, o motoboy tem que buscar as peças na usinagem do Dennis..."
//
// Duas coisas mudaram em 10/09/2026, e as duas vieram de reclamacao com razão:
//
// 1. O MICROFONE CORTAVA no meio da fala. Agora usa o motor único
//    (src/lib/useEscuta.ts): escuta continua, religa sozinho, e SO ENVIA
//    QUANDO VOCÊ MANDA. Quem decide que a frase acabou e você.
//
// 2. QUANDO NÃO CASAVA, MORRIA. Dizia "não tenho certeza de qual frente e" -
//    correto e inútil. Agora, se e assunto novo, o sistema organiza: cria a
//    frente na área certa, as tarefas na ordem, os prazos. O que ele criou
//    aparece listado aqui embaixo, para você conferir na hora.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ResultadoComando } from '@/lib/comando'
import { falar } from '@/lib/vozNavegador'
import { useEscuta } from '@/lib/useEscuta'
import { Gravando } from './Gravando'

export function ComandoVoz({ acao }: { acao: (texto: string) => Promise<ResultadoComando> }) {
  const [processando, setProcessando] = useState(false)
  const [r, setR] = useState<ResultadoComando | null>(null)
  const escuta = useEscuta()
  const router = useRouter()

  const noCampo = escuta.parcial ? `${escuta.texto} ${escuta.parcial}`.trim() : escuta.texto

  async function enviar() {
    const t = noCampo.trim()
    if (!t || processando) return
    escuta.parar()
    setProcessando(true)
    setR(null)
    try {
      const resultado = await acao(t)
      setR(resultado)
      escuta.limpar()
      falar(resultado.resposta)
      router.refresh()
    } catch {
      setR({
        ok: false,
        acao: 'nada',
        tarefa: null,
        frente: null,
        area: null,
        resposta: 'Deu erro na chamada. Confira a chave da API em Configuração.',
        alinhamento: 'sem prioridade definida',
        recomendado: null,
        usouIa: false,
        criou: null,
      })
    } finally {
      setProcessando(false)
    }
  }

  const corDoVeredito =
    r?.alinhamento === 'e a prioridade'
      ? 'var(--verde)'
      : r?.alinhamento === 'não e a prioridade'
        ? 'var(--ambar)'
        : 'var(--fraco)'

  return (
    <section className="cartao">
      <div className="painel-cabeca">
        <span className="rotulo">o que você está fazendo</span>
        <span className="flex items-center gap-2">
          {escuta.ouvindo && <Gravando segundos={escuta.segundos} mudo={escuta.mudo} />}
          {processando && <span className="text-[10px] dado">ORGANIZANDO</span>}
          {r?.usouIa && (
            <span className="text-[10px] dado" title="está resposta gastou credito da API">
              via IA
            </span>
          )}
        </span>
      </div>

      <div className="painel-corpo">
        <div className="flex gap-2 items-start">
          {escuta.disponivel && (
            <button
              type="button"
              aria-label={escuta.ouvindo ? 'Parar de ouvir' : 'Falar'}
              onClick={escuta.alternar}
              className="shrink-0 w-12 h-12 rounded-full grid place-items-center border transition"
              style={{
                borderColor: escuta.ouvindo ? 'var(--laranja)' : 'var(--linha)',
                color: escuta.ouvindo ? 'var(--laranja)' : 'var(--texto)',
                boxShadow: escuta.ouvindo ? '0 0 0 5px rgba(255,61,0,.13)' : 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V23h2v-3.06A9 9 0 0 0 21 11h-2Z" />
              </svg>
            </button>
          )}

          <textarea
            value={noCampo}
            onChange={(e) => escuta.definir(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
            rows={escuta.ouvindo || noCampo.length > 70 ? 3 : 1}
            // Marca-d'água curta de propósito: no celular o campo tem uns 190px
            // e frase comprida quebra em duas linhas dentro de uma caixa de uma,
            // que corta o texto no meio. O cabeçalho do cartão já diz o resto.
            placeholder={escuta.ouvindo ? 'Pode falar. Toque para encerrar.' : 'Diga o que está fazendo'}
            className="campo resize-none flex-1"
            style={{ minHeight: 48, maxHeight: 180 }}
          />

          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!noCampo.trim() || processando}
            className="botao shrink-0"
          >
            {processando ? '...' : 'Enviar'}
          </button>
        </div>

        {escuta.ouvindo && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--laranja-luz)' }}>
            Escutando sem cortar - pode pensar no meio da frase. Toque no microfone para encerrar.
          </p>
        )}

        {escuta.erro && (
          <p className="text-[12px] mt-2" style={{ color: 'var(--ambar)' }}>
            {escuta.erro}
          </p>
        )}

        {r && (
          <div className="mt-3 pt-3 border-t border-[var(--linha)]">
            <p className="text-sm whitespace-pre-wrap">{r.resposta}</p>

            {r.criou && r.criou.length > 0 && (
              <ul className="mt-2 space-y-1">
                {r.criou.map((c, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span style={{ color: 'var(--verde)' }}>+</span>
                    <span className="fraco">{c}</span>
                  </li>
                ))}
              </ul>
            )}

            {r.acao === 'iniciar' && r.ok && r.tarefa && (
              <p className="text-xs dado mt-2">
                RODANDO: {r.tarefa} · {r.frente} · {r.area}
              </p>
            )}

            {r.alinhamento !== 'sem prioridade definida' && (
              <p className="text-xs mt-2" style={{ color: corDoVeredito }}>
                {r.alinhamento === 'e a prioridade'
                  ? 'Isto é o que o painel apontaria agora.'
                  : `O painel apontaria outra coisa: ${r.recomendado}. Você decide - mas decide sabendo.`}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
