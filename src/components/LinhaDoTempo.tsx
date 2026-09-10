// A linha do tempo do projeto: o que ja aconteceu e o que ainda vai.

import type { ResumoProjeto, EventoProjeto } from '@/lib/linhaDoTempo'
import { formatarHoras } from '@/lib/datas'

const COR: Record<EventoProjeto['tipo'], string> = {
  abertura: 'var(--texto-medio)',
  feita: 'var(--verde)',
  trabalho: 'var(--texto-medio)',
  sinal: 'var(--fraco)',
  prazo: 'var(--ambar)',
  fechamento: 'var(--verde)',
}

function dia(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' })
}

export function LinhaDoTempo({ r, limite = 14 }: { r: ResumoProjeto; limite?: number }) {
  if (r.eventos.length === 0) {
    return (
      <p className="fraco text-xs mt-3">
        Sem historico ainda. Ele se escreve sozinho conforme voce aponta hora e mexe nas frentes -
        nao ha nada para preencher a mao.
      </p>
    )
  }

  const futuros = r.eventos.filter((e) => e.futuro).reverse()
  const passados = r.eventos.filter((e) => !e.futuro).slice(0, limite)

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] dado mb-3">
        <span>{formatarHoras(r.minutosTotais)} no projeto</span>
        <span>
          {r.tarefasFeitas} feitas · {r.tarefasAbertas} abertas
        </span>
        {r.primeiroMovimento && <span>desde {dia(r.primeiroMovimento)}</span>}
        {r.proximoPrazo && (
          <span style={{ color: 'var(--ambar)' }}>proximo prazo {dia(r.proximoPrazo)}</span>
        )}
      </div>

      <ol className="relative pl-4">
        {/* o fio da linha do tempo */}
        <span
          className="absolute left-[3px] top-1 bottom-1 w-px"
          style={{ background: 'var(--linha)' }}
          aria-hidden
        />

        {futuros.map((e, i) => (
          <li key={`f${i}`} className="relative pb-2.5">
            <span
              className="absolute -left-4 top-1.5 w-[7px] h-[7px] rounded-full"
              style={{ background: 'var(--fundo)', border: `1px solid ${COR[e.tipo]}` }}
              aria-hidden
            />
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-[11px] dado shrink-0 w-14">{dia(e.em)}</span>
              <span className="flex-1 min-w-0" style={{ color: 'var(--ambar)' }}>
                {e.titulo}
              </span>
            </div>
          </li>
        ))}

        {futuros.length > 0 && passados.length > 0 && (
          <li className="relative pb-2.5">
            <span className="text-[10px] rotulo">hoje</span>
          </li>
        )}

        {passados.map((e, i) => (
          <li key={`p${i}`} className="relative pb-2.5">
            <span
              className="absolute -left-4 top-1.5 w-[7px] h-[7px] rounded-full"
              style={{ background: COR[e.tipo] }}
              aria-hidden
            />
            <div className="flex items-baseline gap-2 text-sm">
              <span className="text-[11px] dado shrink-0 w-14">{dia(e.em)}</span>
              <span className="flex-1 min-w-0">
                <span style={e.tipo === 'feita' ? { color: 'var(--verde)' } : undefined}>
                  {e.tipo === 'feita' && '✓ '}
                  {e.titulo}
                </span>
                {e.minutos ? <span className="fraco"> · {formatarHoras(e.minutos)}</span> : null}
                {e.detalhe && e.tipo === 'sinal' && <span className="fraco"> · {e.detalhe}</span>}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {r.eventos.filter((e) => !e.futuro).length > limite && (
        <p className="text-[11px] fraco mt-1">
          mais {r.eventos.filter((e) => !e.futuro).length - limite} eventos antes disso
        </p>
      )}
    </div>
  )
}
