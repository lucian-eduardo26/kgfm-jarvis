'use client'

// O interruptor do som da abertura, na Configuração.
//
// Existe porque som sem botão de desligar é armadilha: no dia em que ele
// estiver numa reunião e o tom sair alto, a solução não pode ser me chamar.
//
// Fica no navegador e não no banco: é escolha DESTE aparelho. O telefone pode
// querer som e o computador não, e isso é legítimo.

import { useEffect, useState } from 'react'
import { CHAVE_DO_SOM, somLigado } from './SomDaAbertura'
import { tocarTomDaMarca } from '@/lib/tomDaMarca'

export function LigarSom() {
  // Começa `null` porque o valor mora no navegador: renderizar "ligado" no
  // servidor e "desligado" no cliente quebra a hidratação.
  const [ligado, setLigado] = useState<boolean | null>(null)

  useEffect(() => setLigado(somLigado()), [])

  function alternar() {
    const novo = !ligado
    setLigado(novo)
    try {
      localStorage.setItem(CHAVE_DO_SOM, novo ? 'sim' : 'nao')
    } catch {
      // Navegador com armazenamento bloqueado: a escolha vale só nesta sessão.
    }
    // Ligou, ouve na hora. O clique é o gesto que o Safari exige, então este é
    // o único lugar do sistema onde o som toca sem depender da abertura.
    if (novo) tocarTomDaMarca()
  }

  return (
    <section className="cartao p-4 mt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="rotulo">o som da abertura</p>
          <p className="fraco text-sm mt-1">
            Um tom curto quando você encosta na tela durante a assinatura da KGFM. Se não encostar,
            a abertura roda calada - o iPhone não deixa nenhuma página tocar som sozinha.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => tocarTomDaMarca()} className="botao-fantasma text-sm">
            Ouvir
          </button>
          <button
            type="button"
            onClick={alternar}
            className="botao-fantasma text-sm"
            style={
              ligado
                ? { borderColor: 'var(--verde)', color: 'var(--verde)' }
                : undefined
            }
            aria-pressed={ligado === true}
          >
            {ligado === null ? '...' : ligado ? 'Ligado' : 'Desligado'}
          </button>
        </div>
      </div>
    </section>
  )
}
