'use client'

// O SOM DA ABERTURA, e a janela em que ele pode existir.
//
// Regra do Safari que decide todo o desenho deste componente: nenhuma página
// emite som sem um gesto do usuário NAQUELA página. Abrir o aplicativo pelo
// ícone da tela inicial é gesto no iOS, não na página - então som automático
// na abertura não existe no iPhone, e nenhum código muda isso.
//
// O que existe é isto: durante os 2,4 segundos da cortina, o primeiro toque na
// tela toca o tom. Encostou, ouviu. Não encostou, a abertura roda em silêncio
// como sempre rodou. Nunca falha, nunca atrapalha, e não custa um toque a mais
// no dia - porque é o mesmo toque de quem já estava indo mexer no aplicativo.
//
// O ouvinte morre junto com a cortina. Som de abertura que toca no meio do
// expediente não é som de abertura, é susto.

import { useEffect } from 'react'
import { tocarTomDaMarca } from '@/lib/tomDaMarca'

/** Mesma duração da animação `.abertura` no globals.css. */
const DURACAO_DA_CORTINA = 2400

export const CHAVE_DO_SOM = 'jarvis-som-abertura'

export function somLigado(): boolean {
  try {
    // Nasce ligado: quem não quiser desliga na Configuração, e aí a escolha
    // fica gravada. Ausência de chave é "nunca mexeu", não "desligado".
    return localStorage.getItem(CHAVE_DO_SOM) !== 'nao'
  } catch {
    return true
  }
}

export function SomDaAbertura() {
  useEffect(() => {
    if (!somLigado()) return

    let jaTocou = false
    const tocar = () => {
      if (jaTocou) return
      jaTocou = true
      tocarTomDaMarca()
      limpar()
    }

    // `pointerdown` e não `click`: o som tem que sair no momento em que o dedo
    // encosta, junto com o fio laranja - e não quando ele levanta.
    const limpar = () => {
      document.removeEventListener('pointerdown', tocar)
      document.removeEventListener('touchstart', tocar)
      document.removeEventListener('keydown', tocar)
    }

    document.addEventListener('pointerdown', tocar, { passive: true })
    document.addEventListener('touchstart', tocar, { passive: true })
    document.addEventListener('keydown', tocar)

    const relogio = window.setTimeout(limpar, DURACAO_DA_CORTINA)
    return () => {
      window.clearTimeout(relogio)
      limpar()
    }
  }, [])

  return null
}
