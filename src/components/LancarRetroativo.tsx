// Lancar o que ficou sem registro. Fica ao lado do buraco do dia, porque toda
// trava neste sistema tem o botao de liberar do lado, na mesma tela - e aqui a
// "trava" e o proprio numero acusando um buraco que pode nao ser verdade.

import { lancarRetroativo } from '@/app/acoes'

type Opcao = { id: number; titulo: string; frente: string }

export function LancarRetroativo({ tarefas, hoje }: { tarefas: Opcao[]; hoje: string }) {
  if (tarefas.length === 0) return null

  return (
    <details className="mt-3">
      <summary className="text-xs fraco cursor-pointer select-none">
        faltou apontar? lance aqui
      </summary>
      <form action={lancarRetroativo} className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mt-2">
        <input type="hidden" name="data" value={hoje} />
        <select name="tarefaId" className="campo text-sm col-span-2 sm:col-span-1" style={{ minHeight: 38 }}>
          {tarefas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo} · {t.frente}
            </option>
          ))}
        </select>
        <input name="inicio" type="time" defaultValue="09:00" className="campo text-sm" style={{ minHeight: 38 }} />
        <input name="fim" type="time" defaultValue="10:00" className="campo text-sm" style={{ minHeight: 38 }} />
        <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
          Lancar
        </button>
      </form>
      <p className="text-[11px] fraco mt-1.5">
        Entra marcado como lembrado depois, nao cronometrado na hora - o historico continua honesto.
      </p>
    </details>
  )
}
