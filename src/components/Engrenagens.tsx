// O painel das engrenagens: o que gira sozinho, e o que so anda com ele.

import Link from 'next/link'
import type { Engrenagens as Dados } from '@/lib/engrenagens'
import { Cabeca } from './Moldura'
import { mudarEspera } from '@/app/acoes'

export function Engrenagens({ e }: { e: Dados }) {
  return (
    <section className="cartao">
      <Cabeca
        titulo="engrenagens"
        direita={
          <span className="text-[11px] dado">
            {e.girando.length} girando · {e.naMinhaMao.length} na sua mao
          </span>
        }
      />

      <div className="painel-corpo">
        <p
          className="text-sm leading-snug"
          style={{ color: e.poucasGirando || e.girando.length === 0 ? 'var(--ambar)' : 'var(--fraco)' }}
        >
          {e.frase}
        </p>

        {e.girando.length > 0 && (
          <>
            <p className="rotulo mt-4 mb-1.5">girando sem voce</p>
            <ul className="space-y-1.5">
              {e.girando.map((g) => (
                <li key={g.id} className="flex items-baseline gap-2 text-sm">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--verde)', boxShadow: '0 0 6px var(--verde)' }}
                  />
                  <span className="flex-1 min-w-0">
                    {g.titulo}
                    <span className="fraco">
                      {' '}
                      · {g.projeto ?? g.area} · com o {g.quem}
                    </span>
                  </span>
                  <span className="text-[11px] dado shrink-0">
                    {g.dias > 0 ? `${g.dias}d` : 'hoje'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {e.naMinhaMao.length > 0 && (
          <>
            <p className="rotulo mt-4 mb-1.5">so anda com voce</p>
            <ul className="space-y-1.5">
              {e.naMinhaMao.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-baseline gap-2 text-sm">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: m.critica ? 'var(--vermelho)' : 'var(--fraco)' }}
                  />
                  <span className="flex-1 min-w-0">
                    {m.titulo}
                    <span className="fraco">
                      {' '}
                      · {m.projeto ?? m.area}
                    </span>
                  </span>
                  <span
                    className="text-[11px] dado shrink-0"
                    style={m.critica ? { color: 'var(--vermelho)' } : undefined}
                  >
                    {m.diasParada > 0 ? `${m.diasParada}d parada` : 'hoje'}
                  </span>
                  {/* Empurrar para fora e o movimento que transforma uma coisa
                      na mao dele numa engrenagem girando. */}
                  <form action={mudarEspera} className="shrink-0">
                    <input type="hidden" name="frenteId" value={m.id} />
                    <input type="hidden" name="quem" value="terceiro" />
                    <button
                      className="text-[11px] fraco px-1.5"
                      title="Passei para outra pessoa - vira engrenagem girando"
                    >
                      passei adiante
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            {e.naMinhaMao.length > 8 && (
              <Link href="/frentes" className="text-[11px] fraco mt-2 inline-block">
                mais {e.naMinhaMao.length - 8} na tela de Frentes
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  )
}
