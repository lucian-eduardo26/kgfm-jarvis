// A agenda de hoje, e as janelas que sobram nela.

import { relogio, type Agenda } from '@/lib/agenda'
import { formatarHoras } from '@/lib/datas'
import { criarCompromisso, apagarCompromisso } from '@/app/acoes'

export function AgendaDoDia({ a, hoje }: { a: Agenda; hoje: string }) {
  return (
    <section className="cartao p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="rotulo">agenda de hoje</h2>
        <span className="text-[11px] dado">
          {a.minutosComprometidos > 0 ? `${formatarHoras(a.minutosComprometidos)} comprometidos` : 'livre'}
        </span>
      </div>

      {a.compromissos.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {a.compromissos.map((c) => (
            <li key={c.id} className="flex items-baseline gap-3 text-sm group">
              <span className="dado shrink-0 text-[12px]">
                {c.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
              </span>
              <span className="flex-1 min-w-0">
                {c.titulo}
                {c.local && <span className="fraco"> · {c.local}</span>}
              </span>
              <form action={apagarCompromisso}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-[11px] fraco opacity-0 group-hover:opacity-100 transition">remover</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* As janelas. E aqui que cabe (ou nao cabe) trabalho profundo. */}
      {a.janelas.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-3">
          {a.janelas.map((j) => (
            <li
              key={j.inicioMin}
              className="text-[11px] dado px-2 py-1 rounded-md"
              style={{
                background: 'var(--superficie-alta)',
                border: '1px solid var(--linha)',
                color: j.minutos >= 90 ? 'var(--verde)' : 'var(--fraco)',
              }}
            >
              {relogio(j.inicioMin)}–{relogio(j.fimMin)} · {formatarHoras(j.minutos)}
            </li>
          ))}
        </ul>
      )}

      <p
        className="text-sm leading-snug"
        style={{ color: a.fragmentado ? 'var(--ambar)' : 'var(--fraco)' }}
      >
        {a.frase}
      </p>

      <form action={criarCompromisso} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mt-3 items-center">
        <input type="hidden" name="data" value={hoje} />
        <input name="titulo" placeholder="Reuniao com..." className="campo text-sm" style={{ minHeight: 38 }} />
        <input name="inicio" type="time" defaultValue="09:00" className="campo text-sm" style={{ minHeight: 38, width: 108 }} />
        <input name="fim" type="time" defaultValue="10:00" className="campo text-sm" style={{ minHeight: 38, width: 108 }} />
        <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
          Marcar
        </button>
      </form>
    </section>
  )
}
