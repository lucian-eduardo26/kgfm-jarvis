import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { mesSP, anoSP, diasUteisDoMes } from '@/lib/datas'
import { pontuacaoAderencia } from '@/lib/mostrador'
import { Moldura } from '@/components/Moldura'
import { salvarEstrategia, salvarObjetivo, medirObjetivo } from '../acoes'

export const dynamic = 'force-dynamic'

const HORIZONTES = [
  { chave: 'cinco_anos', nome: '5 anos', ajuda: 'Onde a KGFM precisa estar: posição de mercado, porte de projeto, capacidade.' },
  { chave: 'dois_anos', nome: '2 anos', ajuda: 'As apostas estruturais que tornam o horizonte de 5 anos possível.' },
  { chave: 'ano', nome: 'Ano corrente', ajuda: 'Objetivos do ano, com números.' },
] as const

export default async function Estrategia() {
  await exigirSessao()
  const [estrategias, objetivos, areas] = await Promise.all([
    prisma.estrategia.findMany(),
    prisma.objetivo.findMany({ include: { medicoes: true, area: true }, orderBy: { criadoEm: 'desc' } }),
    prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
  ])
  const porHorizonte = new Map(estrategias.map((e) => [e.horizonte, e]))
  const mes = mesSP()
  const ano = anoSP()
  const { total, decorridos } = diasUteisDoMes()

  return (
    <Moldura titulo="Estrategia">
      <p className="fraco text-sm mb-4 max-w-2xl">
        Rumelt: estratégia é diagnóstico, política norteadora e ações coerentes - não lista de metas.
        Guardada estruturada nesses tres campos, ela vira filtro: da para dizer &quot;essa
        oportunidade e otima e nao e nossa&quot;.
      </p>

      <div className="grid lg:grid-cols-3 gap-3">
        {HORIZONTES.map((h) => {
          const e = porHorizonte.get(h.chave)
          return (
            <form key={h.chave} action={salvarEstrategia} className="cartao p-4">
              <input type="hidden" name="horizonte" value={h.chave} />
              <input type="hidden" name="periodo" value={h.chave === 'ano' ? ano : h.nome} />
              <h2 className="text-sm font-semibold uppercase tracking-wide">{h.nome}</h2>
              <p className="fraco text-xs mt-1 mb-3">{h.ajuda}</p>
              <label className="text-xs fraco">Diagnostico - qual e o problema real</label>
              <textarea name="diagnostico" defaultValue={e?.diagnostico ?? ''} rows={3} className="campo mb-2 mt-1" />
              <label className="text-xs fraco">Politica norteadora - a abordagem escolhida</label>
              <textarea name="politicaNorteadora" defaultValue={e?.politicaNorteadora ?? ''} rows={3} className="campo mb-2 mt-1" />
              <label className="text-xs fraco">Ações coerentes - movimentos que se reforcam</label>
              <textarea name="acoes" defaultValue={e?.acoes ?? ''} rows={3} className="campo mb-3 mt-1" />
              <button className="botao w-full">Salvar</button>
            </form>
          )
        })}
      </div>

      <section className="cartao p-4 mt-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Objetivo do mes ({mes})</h2>
        <p className="fraco text-xs mt-1 mb-3">
          Objetivo COM número, por área - e o que liga a aderência no mostrador. Objetivo sem número
          nao mede nada, e area sem objetivo do mes aparece marcada no painel. Dia util {decorridos}{' '}
          de {total}.
        </p>

        <form action={salvarObjetivo} className="flex flex-wrap gap-2 items-end">
          <input type="hidden" name="horizonte" value="mes" />
          <input type="hidden" name="periodo" value={mes} />
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs fraco block mb-1">O que</label>
            <input name="descricao" placeholder="Ex.: propostas enviadas" className="campo" />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Área</label>
            <select name="areaId" className="campo">
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-xs fraco block mb-1">Alvo</label>
            <input name="alvo" type="number" step="any" className="campo" />
          </div>
          <button className="botao">Criar</button>
        </form>

        <ul className="mt-4 space-y-2">
          {objetivos
            .filter((o) => o.horizonte === 'mes' && o.periodo === mes)
            .map((o) => {
              const realizado = o.medicoes.reduce((s, m) => s + m.valor, 0)
              const ader = pontuacaoAderencia({ alvo: o.alvo, realizado })
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex-1 min-w-[180px]">
                    {o.descricao} <span className="fraco">· {o.area?.nome ?? 'sem area'}</span>
                  </span>
                  <span className="fraco">
                    {realizado} de {o.alvo ?? '-'}
                    {ader != null && ` · aderência ${Math.round(ader)}%`}
                  </span>
                  <form action={medirObjetivo} className="flex gap-1">
                    <input type="hidden" name="objetivoId" value={o.id} />
                    <input name="valor" type="number" step="any" placeholder="+" className="campo w-20 text-sm" style={{ minHeight: 38 }} />
                    <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
                      Medir
                    </button>
                  </form>
                </li>
              )
            })}
        </ul>
      </section>
    </Moldura>
  )
}
