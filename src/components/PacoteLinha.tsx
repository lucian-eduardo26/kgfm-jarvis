'use client'

// UMA LINHA DA WBS, editável na hora.
//
// Pedido do Lucian em 10/09/2026: "coloque as linhas da WBS sempre editáveis.
// O tique pra dizer que está concluído, e o campo de porcentagem eu clico e
// digito quantos por cento está."
//
// Por que o percentual existe e não só o tique: pacote de cinco dias passa
// muito tempo em "não feito", e nesse tempo a barra do projeto mente. Com
// percentual, fabricação a meio caminho aparece a meio caminho.
//
// O tique põe 100 e fecha o pacote. Digitar 100 no campo faz a mesma coisa -
// são dois caminhos para o mesmo lugar, e não dois estados diferentes.
//
// Grava sozinho ao mudar: um botão "salvar" por linha em catorze linhas é
// catorze cliques a mais para o mesmo resultado.

import { useRef } from 'react'

export function PacoteLinha({
  frenteId,
  percentual,
  fechado,
  acao,
}: {
  frenteId: number
  percentual: number
  fechado: boolean
  acao: (form: FormData) => Promise<void>
}) {
  const form = useRef<HTMLFormElement>(null)

  return (
    <form ref={form} action={acao} className="flex items-center gap-1.5 shrink-0">
      <input type="hidden" name="frenteId" value={frenteId} />

      <input
        name="percentual"
        inputMode="numeric"
        defaultValue={fechado ? 100 : percentual}
        aria-label="Percentual concluído"
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => form.current?.requestSubmit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        className="campo text-center"
        // LARGURA NO ESTILO E NÃO NA CLASSE, e isto é um bug caro de achar:
        // `.campo` tem `width: 100%`, e ela ganha da classe utilitária porque
        // vem depois na folha. Dentro deste formulário, que não encolhe, o
        // campo esticava e espremia o nome do pacote até UMA LETRA POR LINHA -
        // o texto saía escrito na vertical. Estilo em linha ganha de tudo.
        style={{ width: 56, flex: '0 0 56px', minHeight: 34, padding: '0.2rem', fontSize: 14 }}
      />
      <span className="text-[11px] fraco">%</span>

      <button
        type="submit"
        name="tique"
        value="1"
        aria-label={fechado ? 'Reabrir o pacote' : 'Marcar como concluído'}
        title={fechado ? 'Reabrir' : 'Concluir'}
        className="w-9 h-9 grid place-items-center rounded-lg border shrink-0"
        style={{
          borderColor: fechado ? 'var(--verde)' : 'var(--linha)',
          color: fechado ? 'var(--verde)' : 'var(--fraco)',
          background: fechado ? 'rgba(52,211,153,.12)' : 'transparent',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </button>
    </form>
  )
}
