// A PRIORIZAÇÃO DOS PROJETOS.
//
// Pedido do Lucian em 10/09/2026: "uma página em que a gente vai dar pesos
// pros projetos e calcular prioridades, e o Jarvis vai usar esses pesos. Eu
// quero poder editar, mas quero que ele pense e escolha a melhor prioridade
// pra cada projeto, que é o que traz dinheiro pro caixa."
//
// A tela mostra as duas respostas lado a lado - a do sistema e a dele - de
// propósito. Quando elas divergem muito, ou o peso está errado ou falta dado,
// e ver a diferença é o que ensina qual dos dois.

import Link from 'next/link'
import { exigirSessao } from '@/lib/guarda'
import { Moldura, Cabeca } from '@/components/Moldura'
import { carteiraDeProjetos } from '@/lib/projetos'
import { lerPesosPrioridade, CAMPOS_PRIORIDADE, PESOS_PADRAO } from '@/lib/prioridade'
import { salvarPesosPrioridade, definirPrioridadeDoProjeto } from '../acoes'

export const dynamic = 'force-dynamic'

export default async function Prioridades() {
  await exigirSessao()
  const carteira = await carteiraDeProjetos()
  const pesos = await lerPesosPrioridade()
  const soma = CAMPOS_PRIORIDADE.reduce((s, c) => s + pesos[c.chave], 0)

  const semDado = carteira.filter((p) => p.prioridade.faltando.length > 0).length

  return (
    <Moldura titulo="Prioridade dos projetos" atalhoAtivo="/prioridades">
      <section className="cartao p-4 mb-3">
        <p className="text-sm fraco">
          A régua é dinheiro: quanto há em jogo, e quando ele entra. O sistema calcula, você corrige
          quando souber de algo que o banco não sabe. Quando os dois números divergem muito, ou o
          peso está errado ou falta dado.
        </p>
        {semDado > 0 && (
          <p className="text-sm mt-2" style={{ color: 'var(--ambar)' }}>
            {semDado} {semDado === 1 ? 'projeto está' : 'projetos estão'} com a conta incompleta. O
            número que falta aparece embaixo de cada um.
          </p>
        )}
      </section>

      <section className="cartao mb-3">
        <Cabeca
          titulo="a ordem de hoje"
          direita={<span className="text-[10px] dado">{carteira.length} PROJETOS</span>}
        />
        <div className="painel-corpo">
          <ol className="space-y-2.5">
            {carteira.map((p, i) => (
              <li key={p.id} className="flex items-start gap-3">
                <span className="numero text-sm shrink-0 w-5 text-right fraco">{i + 1}</span>

                <div className="min-w-0 flex-1">
                  {/* Onde o projeto aparece, o projeto abre. Regra do Lucian em
                      10/09/2026, e ela vale para o sistema inteiro: nome de
                      projeto que não leva ao projeto é um beco. */}
                  <Link href={`/projetos/${p.id}`} className="font-medium truncate block hover:underline">
                    {p.nome}
                  </Link>
                  <p className="text-xs fraco">
                    {p.cliente ?? 'sem cliente'} · {p.tipoNome}
                  </p>

                  {p.prioridade.porque.length > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--verde)' }}>
                      {p.prioridade.porque.join(' · ')}
                    </p>
                  )}
                  {p.prioridade.faltando.length > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--ambar)' }}>
                      falta {p.prioridade.faltando.join(' e ')} - por isso a nota é baixa
                    </p>
                  )}
                </div>

                <form action={definirPrioridadeDoProjeto} className="flex items-center gap-1.5 shrink-0">
                  <input type="hidden" name="projetoId" value={p.id} />
                  <span className="text-right">
                    <span className="numero text-lg block leading-none">{p.prioridade.efetiva}</span>
                    <span className="text-[9px] fraco font-mono">
                      {p.prioridade.manual != null ? 'SEU' : 'CALCULADO'}
                    </span>
                  </span>
                  <input
                    name="prioridade"
                    type="number"
                    min={0}
                    max={100}
                    placeholder={String(p.prioridade.calculada)}
                    defaultValue={p.prioridade.manual ?? ''}
                    className="campo text-center"
                    style={{ width: 64, flex: '0 0 64px', minHeight: 38, padding: '0.3rem' }}
                  />
                  <button className="botao-fantasma text-xs px-2">ok</button>
                </form>
              </li>
            ))}
          </ol>
          <p className="text-[11px] fraco mt-3">
            Deixe o campo vazio para o sistema voltar a decidir. Vazio quer dizer &quot;use o que
            você calculou&quot;, e não prioridade zero.
          </p>
        </div>
      </section>

      <form action={salvarPesosPrioridade} className="cartao p-4">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <p className="rotulo">os pesos da régua</p>
          <span className="text-[11px] numero" style={{ color: soma === 100 ? 'var(--verde)' : 'var(--ambar)' }}>
            somam {soma}
          </span>
        </div>

        <div className="space-y-3">
          {CAMPOS_PRIORIDADE.map((c) => (
            <div key={c.chave}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={c.chave} className="text-sm">
                  {c.rotulo}
                </label>
                <input
                  id={c.chave}
                  name={c.chave}
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={pesos[c.chave]}
                  className="campo text-center"
                  style={{ width: 80, flex: '0 0 80px', minHeight: 38, padding: '0.3rem' }}
                />
              </div>
              <p className="text-[11px] fraco mt-0.5 max-w-xl">{c.explicacao}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button className="botao">Guardar os pesos</button>
        </div>
        <p className="text-[11px] fraco mt-2">
          O padrão é {PESOS_PADRAO.pesoValor} de valor e {PESOS_PADRAO.pesoCaixa} de velocidade do
          dinheiro - dois terços da régua são caixa, de propósito.
        </p>
      </form>
    </Moldura>
  )
}
