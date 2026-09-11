// O painel das engrenagens: o que gira sozinho, e o que só anda com ele.

import Link from 'next/link'
import type { Engrenagens as Dados } from '@/lib/engrenagens'
import { Cabeca } from './Moldura'
import { mudarEspera } from '@/app/acoes'


/**
 * O nome do projeto, clicavel quando existe projeto.
 *
 * Regra do Lucian em 10/09/2026: onde o projeto aparece, o projeto abre.
 * Frente sem projeto mostra a area, e area nao e lugar para onde ir daqui.
 */
function NomeDoProjeto({ nome, id, area }: { nome: string | null; id: number | null; area: string }) {
  if (!nome || !id) return <>{area}</>
  return (
    <Link href={`/projetos/${id}`} className="hover:underline">
      {nome}
    </Link>
  )
}

export function Engrenagens({ e }: { e: Dados }) {
  return (
    <section className="cartao">
      <Cabeca
        titulo="engrenagens"
        direita={
          <span className="text-[11px] dado">
            {e.girando.length} girando · {e.naMinhaMao.length} na sua mão
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
            <p className="rotulo mt-4 mb-1.5">girando sem você</p>
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
                      · <NomeDoProjeto nome={g.projeto} id={g.projetoId} area={g.area} /> · com o {g.quem}
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
            <p className="rotulo mt-4 mb-1.5">só anda com você</p>
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
                      · <NomeDoProjeto nome={m.projeto} id={m.projetoId} area={m.area} />
                    </span>
                  </span>
                  <span
                    className="text-[11px] dado shrink-0"
                    style={m.critica ? { color: 'var(--vermelho)' } : undefined}
                  >
                    {m.diasParada > 0 ? `${m.diasParada}d parada` : 'hoje'}
                  </span>
                  {/* Empurrar para fora é o movimento que transforma uma coisa
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
