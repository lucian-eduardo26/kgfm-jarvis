'use client'

import { useEffect, useState } from 'react'
import { vozesDisponiveis, aoCarregarVozes, vozEscolhida, escolherVoz, falar } from '@/lib/vozNavegador'

const FRASE = 'Cotacao de peças pequenas está parada há doze dias úteis e trava outra frente. E o que eu faria agora.'

export function EscolherVoz() {
  const [vozes, setVozes] = useState<{ nome: string; lang: string; boa: boolean }[]>([])
  const [atual, setAtual] = useState<string>('')

  useEffect(() => {
    const atualizar = () => {
      const lista = vozesDisponiveis()
      setVozes(
        lista.map((v) => ({
          nome: v.name,
          lang: v.lang,
          boa: /natural|neural|online|google/i.test(v.name),
        })),
      )
      setAtual(vozEscolhida() ?? lista[0]?.name ?? '')
    }
    return aoCarregarVozes(atualizar)
  }, [])

  const temBoa = vozes.some((v) => v.boa)

  return (
    <section className="cartao p-4 mt-3">
      <p className="rotulo mb-2">a voz do jarvis</p>

      {vozes.length === 0 ? (
        <p className="fraco text-sm">Este navegador não oferece vozes em portugues.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={atual}
              onChange={(e) => {
                setAtual(e.target.value)
                escolherVoz(e.target.value)
                falar(FRASE)
              }}
              className="campo text-sm flex-1 min-w-[240px]"
              style={{ minHeight: 40 }}
            >
              {vozes.map((v) => (
                <option key={v.nome} value={v.nome}>
                  {v.boa ? '★ ' : ''}
                  {v.nome} ({v.lang})
                </option>
              ))}
            </select>
            <button type="button" onClick={() => falar(FRASE)} className="botao-fantasma text-sm" style={{ minHeight: 40 }}>
              Ouvir
            </button>
          </div>
          <p className="fraco text-xs mt-2">
            {vozes.length} {vozes.length === 1 ? 'voz disponivel' : 'vozes disponiveis'}. As marcadas com ★ sao
            as boas.
          </p>
        </>
      )}

      {!temBoa && (
        <div className="mt-3 pt-3 border-t border-[var(--linha)]">
          <p className="text-sm" style={{ color: 'var(--ambar)' }}>
            Só existem as vozes antigas do Windows nesta máquina - por isso soa como robo.
          </p>
          <p className="fraco text-sm mt-1">
            Duas formas de resolver, as duas de graca e sem mensalidade:
          </p>
          <ol className="fraco text-sm mt-1 space-y-1 list-decimal pl-5">
            <li>
              <strong>Abrir o Jarvis no Microsoft Edge.</strong> O Edge traz dezenas de vozes naturais
              sem instalar nada - e o caminho mais rapido.
            </li>
            <li>
              <strong>Instalar as vozes naturais no Windows:</strong> Configuracoes → Hora e idioma →
              Fala → Adicionar vozes → portugues (Brasil). Depois feche e abra o navegador.
            </li>
          </ol>
        </div>
      )}
    </section>
  )
}
